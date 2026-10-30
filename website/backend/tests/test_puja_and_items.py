"""Per-temple chadhava items (₹5 flower, matchbox ...) and puja packages sold through dated events."""
import uuid
from datetime import datetime, timedelta, timezone
import pytest
from fastapi.testclient import TestClient
from packages.database.session import init_db, SessionLocal
from packages.database.models import User, Temple, TempleOffering
from packages.core.security import create_access_token
from website.backend.app.main import app
from website.backend.app.temple_items import seed_temple_items, items_for

BASE = '/api/v1/mandir/chadhava'


@pytest.fixture(scope='module')
def setup():
    init_db()
    users = []
    with SessionLocal() as db:
        for role in ['client', 'admin']:
            u = User(email=uuid.uuid4().hex + '@puja.test', hashed_password='x', role=role, wallet_balance=100000)
            db.add(u); db.flush()
            users.append({'id': u.id, 'h': {'Authorization': 'Bearer ' + create_access_token({'sub': u.id})}})
        db.commit()
    with TestClient(app) as client:
        yield client, users


def event_data(temple_id, **over):
    now = datetime.now(timezone.utc)
    data = dict(temple_id=temple_id, title='Temple event', description='Offered by the temple team on the date',
                starts_at=(now + timedelta(days=3)).isoformat(), deadline=(now + timedelta(days=2)).isoformat(),
                cancellation_deadline=(now + timedelta(days=1)).isoformat(), capacity=50, offering_ids=[],
                video_hours=48, unknown_gotra_allowed=True, partner_confirmed=True, published=True)
    data.update(over)
    return data


def temple_with_catalog():
    with SessionLocal() as db:
        t = Temple(name='Catalog Mandir', slug='cat-' + uuid.uuid4().hex[:10], deity='Ram', city='Ayodhya', state='UP', description='Test partner temple')
        db.add(t); db.commit()
        seed_temple_items(db)
        tid = t.id
        rows = db.query(TempleOffering).filter_by(temple_id=tid).all()
        return tid, {r.title_en: r for r in rows}, [r for r in rows if r.category == 'puja_tier']


def test_ayodhya_leads_with_diya_and_five_rupee_items(setup):
    c, _ = setup
    temple = c.get('/api/v1/mandir/temples/ram-janmabhoomi-ayodhya?lang=en').json()
    items = {i['title']: i for i in temple['items']}
    assert items['Clay diya']['popular'] and items['Tulsi leaves']['popular']
    assert temple['items'][0]['popular']
    assert items['Flowers']['price'] == 5 and items['Matchbox']['price'] == 5
    assert 'Saffron flag (dhwaja)' in items
    assert all(o['category'] not in ('item', 'puja_tier') for o in temple['offerings'])
    # a different deity gets different items
    kashi = c.get('/api/v1/mandir/temples/kashi-vishwanath-varanasi?lang=en').json()['items']
    assert kashi[0]['title'] == 'Bilva leaves'
    assert items_for('ram-janmabhoomi-ayodhya')[0][3] == 'Clay diya'


def test_seeding_is_idempotent_and_keeps_admin_prices(setup):
    tid, items, _ = temple_with_catalog()
    with SessionLocal() as db:
        db.query(TempleOffering).filter_by(id=items['Flowers'].id).update({'price': 7})
        db.commit()
        assert seed_temple_items(db) == 0
        assert db.get(TempleOffering, items['Flowers'].id).price == 7


def test_chadhava_event_sells_every_item_quantity_and_exact_total(setup):
    c, users = setup
    tid, items, tiers = temple_with_catalog()
    r = c.post(BASE + '/admin/events', headers=users[1]['h'], json=event_data(tid))
    assert r.status_code == 201, r.text
    event = r.json()
    assert event['kind'] == 'chadhava' and event['bookable']
    assert not [o for o in event['offerings'] if o['category'] == 'puja_tier']
    lines = [{'offering_id': items['Flowers'].id, 'quantity': 11}, {'offering_id': items['Matchbox'].id, 'quantity': 2}]
    quote = c.post(BASE + '/quote', json={'event_id': event['id'], 'items': lines}).json()
    assert quote['amount_paise'] == 11 * 500 + 2 * 500
    order = c.post(BASE + '/orders', headers=users[0]['h'], json=dict(event_id=event['id'], items=lines, devotee_name='Ram Bhakt', phone='9876543210',
        gotra='Kashyap', payment_method='wallet', idempotency_key=uuid.uuid4().hex, expected_amount_paise=6500))
    assert order.status_code == 200 and order.json()['payment_status'] == 'PAID'
    assert c.post(BASE + '/quote', json={'event_id': event['id'], 'items': [{'offering_id': tiers[0].id, 'quantity': 1}]}).status_code == 422
    assert c.post(BASE + '/quote', json={'event_id': event['id'], 'items': [{'offering_id': items['Flowers'].id, 'quantity': 100}]}).status_code == 422


def test_puja_needs_one_package_and_limits_names(setup):
    c, users = setup
    tid, items, tiers = temple_with_catalog()
    assert c.post(BASE + '/admin/events', headers=users[1]['h'], json=event_data(tid, kind='puja')).status_code == 422
    single, couple = sorted(tiers, key=lambda t: t.max_members)[:2]
    r = c.post(BASE + '/admin/events', headers=users[1]['h'], json=event_data(
        tid, kind='puja', title='Hanuman Jayanti puja', offering_ids=[t.id for t in tiers], benefits_en=['Removes obstacles'], benefits_hi=['बाधाएं दूर']))
    assert r.status_code == 201, r.text
    event = r.json()
    assert event['kind'] == 'puja' and event['benefits'] == ['Removes obstacles'] and event['bookable']
    quote = lambda items: c.post(BASE + '/quote', json={'event_id': event['id'], 'items': items})
    assert quote([{'offering_id': items['Flowers'].id, 'quantity': 1}]).status_code == 422          # add-ons alone are not a puja
    assert quote([{'offering_id': single.id, 'quantity': 1}, {'offering_id': couple.id, 'quantity': 1}]).status_code == 422
    assert quote([{'offering_id': single.id, 'quantity': 2}]).status_code == 422
    ok = quote([{'offering_id': items['Flowers'].id, 'quantity': 5}, {'offering_id': couple.id, 'quantity': 1}])
    assert ok.status_code == 200
    body = ok.json()
    assert body['items'][0]['category'] == 'puja_tier' and body['members_max'] == 2
    total = body['amount_paise']
    base = dict(event_id=event['id'], items=[{'offering_id': couple.id, 'quantity': 1}, {'offering_id': items['Flowers'].id, 'quantity': 5}],
                devotee_name='Sita Devi', phone='9876543210', gotra='Kashyap', payment_method='wallet', expected_amount_paise=total)
    too_many = c.post(BASE + '/orders', headers=users[0]['h'], json={**base, 'idempotency_key': uuid.uuid4().hex, 'family_members': 'A (Kashyap)\nB (Bharadwaj)'})
    assert too_many.status_code == 422
    booked = c.post(BASE + '/orders', headers=users[0]['h'], json={**base, 'idempotency_key': uuid.uuid4().hex, 'family_members': 'Ram Kumar (Kashyap)'})
    assert booked.status_code == 200 and booked.json()['snapshot']['kind'] == 'puja'
    listed = {e['id']: e for e in c.get(BASE + '/events').json()['events']}
    assert listed[event['id']]['joined'] == 1


def test_items_cannot_be_bought_outside_an_event(setup):
    c, users = setup
    _, items, tiers = temple_with_catalog()
    for offering in (items['Flowers'], tiers[0]):
        assert c.post('/api/v1/mandir/chadawa/book', headers=users[0]['h'], json={'offering_id': offering.id, 'devotee_name': 'Ram Bhakt'}).status_code == 404
