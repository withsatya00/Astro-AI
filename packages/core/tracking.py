"""Order tracking: our own status timeline, plus live courier scans when a courier account is configured.

Set DELHIVERY_TOKEN to enable live Delhivery scans for orders shipped with a Delhivery waybill. Without it the
timeline shows our own steps and links to India Post (SpeedPost) tracking, which is public.
"""
import os
from typing import Any, Dict, List, Optional

import requests
from sqlalchemy.orm import Session

from packages.database.models import MarketplaceOrder, StatusEvent

LABELS = {
    "PLACED": ("Order placed", "ऑर्डर दर्ज"),
    "PAID": ("Payment received", "भुगतान प्राप्त"),
    "ENERGIZING": ("Being energized in your name & gotra", "आपके नाम व गोत्र से अभिमंत्रण जारी"),
    "DISPATCHED": ("Dispatched", "भेजा गया"),
    "DELIVERED": ("Delivered", "पहुँच गया"),
    "CANCELLED": ("Cancelled", "रद्द"),
}
INDIA_POST_URL = "https://www.indiapost.gov.in/_layouts/15/dop.portal.tracking/trackconsignment.aspx"


def _courier_scans(tracking_id: str) -> Optional[List[Dict[str, Any]]]:
    token = os.getenv("DELHIVERY_TOKEN")
    if not (token and tracking_id):
        return None
    try:
        res = requests.get("https://track.delhivery.com/api/v1/packages/json/",
                           params={"waybill": tracking_id, "token": token}, timeout=10)
        if res.status_code != 200:
            return None
        shipments = res.json().get("ShipmentData") or []
        scans = (shipments[0].get("Shipment", {}).get("Scans") if shipments else None) or []
        return [{"status": sc["ScanDetail"].get("Scan", ""), "location": sc["ScanDetail"].get("ScannedLocation", ""),
                 "time": sc["ScanDetail"].get("ScanDateTime", "")} for sc in scans]
    except Exception:
        return None


def order_tracking(db: Session, order: MarketplaceOrder) -> Dict[str, Any]:
    events = (db.query(StatusEvent).filter(StatusEvent.kind == "order", StatusEvent.ref_id == order.id)
              .order_by(StatusEvent.created_at.asc()).all())
    steps = [{"status": e.status, "label_en": LABELS.get(e.status, (e.status, e.status))[0],
              "label_hi": LABELS.get(e.status, (e.status, e.status))[1], "note": e.note,
              "time": e.created_at.isoformat() if e.created_at else None} for e in events]
    courier = _courier_scans(order.tracking_id) if order.tracking_id else None
    return {
        "order_number": order.order_number,
        "status": order.order_status,
        "tracking_id": order.tracking_id,
        "provider": "Delhivery" if courier else ("India Post SpeedPost" if order.tracking_id else None),
        "external_url": INDIA_POST_URL if (order.tracking_id and not courier) else None,
        "steps": steps,
        "courier_scans": courier or [],
    }
