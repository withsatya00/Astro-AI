"""Chadhava payment, fulfilment, capacity and privacy contracts."""
import hashlib
import hmac
import json
import uuid
from datetime import datetime, timedelta, timezone
from concurrent.futures import ThreadPoolExecutor
import pytest
from fastapi.testclient import TestClient
from packages.database.session import init_db, SessionLocal
from packages.database.models import User, Temple, TempleOffering, ChadawaBooking, WalletTransaction
from packages.database.chadhava import ChadhavaEvent, ChadhavaOrder
from packages.core.security import create_access_token
from packages.core.config import settings
from website.backend.app.main import app
from website.backend.app.api import chadhava as ch

BASE='/api/v1/mandir/chadhava'


@pytest.fixture(scope='module')
def setup():
    init_db()
    users=[]
    with SessionLocal() as db:
        for role in ['client','client','admin','client']:
            u=User(email=uuid.uuid4().hex+'@chadhava.test',hashed_password='x',role=role,wallet_balance=100000)
            db.add(u);db.flush()
            users.append((u.id,{'Authorization':'Bearer '+create_access_token({'sub':u.id})}))
        temple=Temple(name='Test Mandir',slug='chadhava-'+uuid.uuid4().hex,deity='Shiva',city='Delhi',state='Delhi',description='Test partner')
        db.add(temple);db.flush()
        offerings=[]
        for title,price in [('Flowers',51),('Bhog',101)]:
            o=TempleOffering(temple_id=temple.id,title=title,description=title+' offering',price=price);db.add(o);db.flush();offerings.append(o.id)
        db.commit();temple_id=temple.id
    with TestClient(app) as client:yield client,users,temple_id,offerings


def make_event(setup,capacity=100,**over):
    client,users,temple,offerings=setup
    now=datetime.now(timezone.utc)
    data=dict(temple_id=temple,title='Confirmed temple event',description='Flowers and bhog offered by the temple team',
        starts_at=(now+timedelta(days=3)).isoformat(),deadline=(now+timedelta(days=2)).isoformat(),
        cancellation_deadline=(now+timedelta(days=1)).isoformat(),capacity=capacity,mode='collective',offering_ids=offerings,
        video_hours=48,unknown_gotra_allowed=True,partner_confirmed=True,published=True)
    data.update(over)
    r=client.post(BASE+'/admin/events',headers=users[2][1],json=data)
    assert r.status_code==201,r.text
    return r.json()


def payload(setup,event,**over):
    data=dict(event_id=event['id'],items=[{'offering_id':setup[3][0],'quantity':2},{'offering_id':setup[3][1],'quantity':1}],
        devotee_name='Devotee Test',phone='9876543210',gotra='Kashyap',payment_method='wallet',idempotency_key=uuid.uuid4().hex,expected_amount_paise=20300)
    data.update(over);return data


def balance(uid):
    with SessionLocal() as db:return db.get(User,uid).wallet_balance


def test_publication_requires_real_confirmation_and_scoped_offerings(setup):
    c,users,temple,offerings=setup
    e=make_event(setup,published=False,partner_confirmed=False)
    assert e['id'] not in [e['id'] for e in c.get(BASE+'/events').json()['events']]
    assert c.patch(BASE+'/admin/events/'+e['id'],headers=users[2][1],json={'published':True}).status_code==409
    assert c.post(BASE+'/orders',headers=users[0][1],json=payload(setup,e)).status_code==404
    assert c.post(BASE+'/admin/events',headers=users[0][1],json={}).status_code in (403,422)


def test_multi_item_wallet_idempotency_snapshot_and_ownership(setup):
    c,users,_,_=setup;e=make_event(setup);p=payload(setup,e)
    before=balance(users[0][0])
    quote=c.post(BASE+'/quote',json={'event_id':e['id'],'items':p['items']})
    assert quote.status_code==200 and quote.json()['amount_paise']==20300
    r=c.post(BASE+'/orders',headers=users[0][1],json=p)
    assert r.status_code==200,r.text
    order=r.json();assert order['payment_status']=='PAID' and order['service_status']=='CONFIRMED'
    receipt=c.get(BASE+'/orders/'+order['id']+'/receipt',headers=users[0][1])
    assert receipt.status_code==200 and receipt.json()['amount_paise']==20300
    assert c.get(BASE+'/orders/'+order['id']+'/receipt',headers=users[1][1]).status_code==404
    assert len(order['snapshot']['items'])==2 and order['booking_id']
    assert c.post(BASE+'/orders',headers=users[0][1],json=p).json()['id']==order['id']
    assert balance(users[0][0])==before-203
    p['devotee_name']='Changed person'
    assert c.post(BASE+'/orders',headers=users[0][1],json=p).status_code==409
    assert c.get(BASE+'/orders/'+order['id'],headers=users[1][1]).status_code==404
    assert c.get(BASE+'/orders/'+order['id']+'/timeline',headers=users[1][1]).status_code==404
    assert c.post(BASE+'/orders/'+order['id']+'/cancel',headers=users[1][1]).status_code==404
    with SessionLocal() as db:
        db.get(TempleOffering,setup[3][0]).title='Renamed offering';db.commit()
    assert c.get(BASE+'/orders/'+order['id'],headers=users[0][1]).json()['snapshot']['items'][0]['title']=='Flowers'
    with SessionLocal() as db:
        db.get(TempleOffering,setup[3][0]).title='Flowers';db.commit()
    legacy=c.patch('/api/v1/mandir/admin/bookings/'+order['booking_id'],headers=users[2][1],json={'status':'COMPLETED'})
    assert legacy.status_code==409


def test_capacity_atomic_and_pending_holds_expire(setup):
    c,users,_,_=setup;e=make_event(setup,capacity=1)
    def book(user):return c.post(BASE+'/orders',headers=user[1],json=payload(setup,e))
    with ThreadPoolExecutor(max_workers=2) as pool:responses=list(pool.map(book,users[:2]))
    assert sorted(r.status_code for r in responses)==[200,409],[r.text for r in responses]
    winner=next(r.json() for r in responses if r.status_code==200)
    owner=users[0] if winner['id'] in [o['id'] for o in c.get(BASE+'/orders',headers=users[0][1]).json()['orders']] else users[1]
    c.post(BASE+'/orders/'+winner['id']+'/cancel',headers=owner[1])
    with SessionLocal() as db:assert db.get(ChadhavaEvent,e['id']).reserved==0


def test_insufficient_wallet_rollback_and_unknown_gotra(setup):
    c,users,_,_=setup;e=make_event(setup,unknown_gotra_allowed=False)
    assert c.post(BASE+'/orders',headers=users[0][1],json=payload(setup,e,gotra_unknown=True,gotra='')).status_code==422
    assert c.post(BASE+'/orders',headers=users[0][1],json=payload(setup,e,gotra='')).status_code==422
    with SessionLocal() as db:
        poor=User(email=uuid.uuid4().hex+'@poor.test',hashed_password='x',wallet_balance=0);db.add(poor);db.commit();uid=poor.id
    r=c.post(BASE+'/orders',headers={'Authorization':'Bearer '+create_access_token({'sub':uid})},json=payload(setup,e))
    assert r.status_code==402
    with SessionLocal() as db:assert db.get(ChadhavaEvent,e['id']).reserved==0


def test_cancel_refunds_wallet_once_and_legacy_route_cannot_bypass_deadline(setup):
    c,users,_,_=setup;e=make_event(setup);before=balance(users[0][0])
    o=c.post(BASE+'/orders',headers=users[0][1],json=payload(setup,e)).json()
    for _ in range(2):
        r=c.post(BASE+'/orders/'+o['id']+'/cancel',headers=users[0][1]);assert r.status_code==200 and r.json()['payment_status']=='REFUNDED'
    assert balance(users[0][0])==before
    with SessionLocal() as db:assert db.query(WalletTransaction).filter_by(reference_id='RFD_'+o['id']).count()==1
    o=c.post(BASE+'/orders',headers=users[0][1],json=payload(setup,e)).json()
    with SessionLocal() as db:
        row=db.get(ChadhavaOrder,o['id']);s=dict(row.snapshot);s['cancellation_deadline']=(datetime.now(timezone.utc)-timedelta(hours=1)).isoformat();row.snapshot=s;db.commit()
    assert c.post('/api/v1/mandir/chadawa/'+o['booking_id']+'/cancel',headers=users[0][1]).status_code==409


def test_staff_sequence_private_video_and_revocation(setup):
    c,users,temple,_=setup;e=make_event(setup)
    o=c.post(BASE+'/orders',headers=users[0][1],json=payload(setup,e)).json();oid=o['id']
    assert c.get(BASE+'/staff/orders',headers=users[3][1]).status_code==403
    assignment={'user_id':users[3][0],'temple_id':temple}
    assert c.put(BASE+'/admin/staff',headers=users[0][1],json=assignment).status_code==403
    assert c.put(BASE+'/admin/staff',headers=users[2][1],json=assignment).status_code==200
    endpoint=BASE+'/staff/orders/'+oid
    assert c.patch(endpoint,headers=users[3][1],json={'status':'COMPLETED'}).status_code==409
    assert c.patch(endpoint,headers=users[3][1],json={'status':'SCHEDULED'}).status_code==200
    assert c.patch(endpoint,headers=users[3][1],json={'status':'PERFORMED'}).status_code==409
    with SessionLocal() as db:
        row=db.get(ChadhavaOrder,oid);s=dict(row.snapshot);s['starts_at']=(datetime.now(timezone.utc)-timedelta(hours=1)).isoformat();row.snapshot=s;db.commit()
    assert c.patch(endpoint,headers=users[3][1],json={'status':'PERFORMED'}).status_code==200
    assert c.patch(endpoint,headers=users[3][1],json={'status':'VIDEO_AVAILABLE'}).status_code==422
    assert c.post(endpoint+'/video',headers=users[3][1],files={'file':('bad.mp4',b'not a video','video/mp4')}).status_code==422
    clip=b'\x00\x00\x00\x18ftypisom'+b'\x00'*20
    r=c.post(endpoint+'/video',headers=users[3][1],files={'file':('evidence.mp4',clip,'video/mp4')});assert r.status_code==200,r.text
    assert c.get(BASE+'/orders/'+oid+'/video',headers=users[0][1]).status_code==404
    assert c.patch(endpoint,headers=users[3][1],json={'status':'VIDEO_AVAILABLE'}).status_code==200
    assert c.get(BASE+'/orders/'+oid+'/video',headers=users[0][1]).content==clip
    assert c.get(BASE+'/orders/'+oid+'/video',headers=users[1][1]).status_code==404
    assert c.patch(endpoint,headers=users[3][1],json={'status':'COMPLETED'}).status_code==200
    assert c.patch(endpoint,headers=users[3][1],json={'status':'SCHEDULED'}).status_code==409
    assert c.get(BASE+'/staff/export.csv?event_id='+e['id'],headers=users[3][1]).status_code==200
    c.request('DELETE',BASE+'/admin/staff',headers=users[2][1],json=assignment)
    assert c.patch(endpoint,headers=users[3][1],json={'status':'COMPLETED'}).status_code==404


@pytest.fixture()
def gateway(monkeypatch):
    monkeypatch.setattr(settings,'RAZORPAY_KEY_ID','rzp_test_fixture')
    monkeypatch.setattr(settings,'RAZORPAY_KEY_SECRET','test-secret')
    monkeypatch.setattr(settings,'RAZORPAY_WEBHOOK_SECRET','webhook-secret')
    state={'payments':{},'refunds':0,'creates':0}
    def provider(method,path,**kwargs):
        if method=='POST' and path=='/orders':
            state['creates']+=1;return {'id':'order_'+uuid.uuid4().hex}
        if method=='POST' and path.endswith('/refund'):
            state['refunds']+=1;pid=path.split('/')[2];state['payments'][pid]['amount_refunded']=kwargs['json']['amount'];return {'id':'rfnd_fixture','status':'processed'}
        if method=='GET' and path.startswith('/payments/'):return state['payments'][path.split('/')[-1]]
        raise AssertionError((method,path))
    monkeypatch.setattr(ch,'_razorpay',provider)
    return state


def payment_payload(order,state,**over):
    pid='pay_'+uuid.uuid4().hex
    state['payments'][pid]={'id':pid,'order_id':order['provider_order_id'],'amount':order['amount_paise'],'currency':'INR','status':'captured',**over}
    signature=hmac.new(b'test-secret',f"{order['provider_order_id']}|{pid}".encode(),hashlib.sha256).hexdigest()
    return {'razorpay_order_id':order['provider_order_id'],'razorpay_payment_id':pid,'razorpay_signature':signature}


def test_gateway_verified_capture_webhook_dedupe_and_refund(setup,gateway):
    c,users,_,_=setup;e=make_event(setup);p=payload(setup,e,payment_method='razorpay')
    order=c.post(BASE+'/orders',headers=users[0][1],json=p).json()
    assert order['payment_status']=='PENDING' and not order['booking_id']
    assert c.post(BASE+'/orders',headers=users[0][1],json=p).json()['id']==order['id'] and gateway['creates']==1
    verify=payment_payload(order,gateway)
    bad={**verify,'razorpay_signature':'0'*64}
    assert c.post(BASE+'/orders/'+order['id']+'/verify',headers=users[0][1],json=bad).status_code==400
    paid=c.post(BASE+'/orders/'+order['id']+'/verify',headers=users[0][1],json=verify)
    assert paid.status_code==200 and paid.json()['booking_id'],paid.text
    r=c.post(BASE+'/orders/'+order['id']+'/verify',headers=users[0][1],json=verify)
    assert r.json()['booking_id']==paid.json()['booking_id']
    raw=json.dumps({'event':'payment.captured','payload':{'payment':{'entity':gateway['payments'][verify['razorpay_payment_id']]}}}).encode()
    headers={'X-Razorpay-Signature':hmac.new(b'webhook-secret',raw,hashlib.sha256).hexdigest(),'X-Razorpay-Event-Id':'evt_'+uuid.uuid4().hex,'Content-Type':'application/json'}
    assert c.post(BASE+'/webhook',headers=headers,content=raw).status_code==200
    assert c.post(BASE+'/webhook',headers=headers,content=raw).json()['status']=='duplicate'
    r=c.post(BASE+'/orders/'+order['id']+'/cancel',headers=users[0][1]);assert r.status_code==200 and r.json()['payment_status']=='REFUNDED',r.text
    c.post(BASE+'/orders/'+order['id']+'/cancel',headers=users[0][1]);assert gateway['refunds']==1


def test_wrong_amount_and_late_payment_never_fulfil(setup,gateway):
    c,users,_,_=setup;e=make_event(setup,capacity=1)
    o=c.post(BASE+'/orders',headers=users[0][1],json=payload(setup,e,payment_method='razorpay')).json()
    verify=payment_payload(o,gateway,amount=o['amount_paise']-1)
    assert c.post(BASE+'/orders/'+o['id']+'/verify',headers=users[0][1],json=verify).status_code==400
    gateway['payments'][verify['razorpay_payment_id']]['amount']=o['amount_paise']
    with SessionLocal() as db:
        db.get(ChadhavaOrder,o['id']).expires_at=datetime.now(timezone.utc)-timedelta(minutes=1);db.commit()
    c.get(BASE+'/events')
    late=c.post(BASE+'/orders/'+o['id']+'/verify',headers=users[0][1],json=verify)
    assert late.status_code==200 and late.json()['service_status']=='PAYMENT_REVIEW' and not late.json()['booking_id'],late.text
    with SessionLocal() as db:assert db.get(ChadhavaEvent,e['id']).reserved==0
    r=c.post(BASE+'/admin/orders/'+o['id']+'/refund',headers=users[2][1],json={'reason':'Payment arrived after checkout expired'})
    assert r.status_code==200 and r.json()['payment_status']=='REFUNDED',r.text


def test_reviewed_total_must_match_and_duplicate_concurrent_checkout_charges_once(setup):
    c,users,_,_=setup;e=make_event(setup)
    wrong=payload(setup,e,expected_amount_paise=20200)
    before=balance(users[0][0])
    assert c.post(BASE+'/orders',headers=users[0][1],json=wrong).status_code==409
    assert balance(users[0][0])==before
    p=payload(setup,e)
    def book(_):return c.post(BASE+'/orders',headers=users[0][1],json=p)
    with ThreadPoolExecutor(max_workers=2) as pool:responses=list(pool.map(book,range(2)))
    assert all(r.status_code==200 for r in responses),[r.text for r in responses]
    assert responses[0].json()['id']==responses[1].json()['id']
    assert balance(users[0][0])==before-203
    with SessionLocal() as db:assert db.get(ChadhavaEvent,e['id']).reserved==1


def test_ambiguous_refund_is_reconciled_without_second_remote_refund(setup,gateway,monkeypatch):
    from fastapi import HTTPException
    c,users,_,_=setup;e=make_event(setup)
    o=c.post(BASE+'/orders',headers=users[0][1],json=payload(setup,e,payment_method='razorpay')).json()
    verify=payment_payload(o,gateway)
    assert c.post(BASE+'/orders/'+o['id']+'/verify',headers=users[0][1],json=verify).status_code==200
    provider=ch._razorpay
    def ambiguous(method,path,**kwargs):
        result=provider(method,path,**kwargs)
        if method=='POST' and path.endswith('/refund'):
            raise HTTPException(502,'Provider response was lost after refund creation')
        return result
    monkeypatch.setattr(ch,'_razorpay',ambiguous)
    r=c.post(BASE+'/orders/'+o['id']+'/cancel',headers=users[0][1])
    assert r.status_code==200 and r.json()['payment_status']=='REFUND_PENDING'
    r=c.post(BASE+'/admin/orders/'+o['id']+'/refund',headers=users[2][1],json={'reason':'Reconcile the previously requested refund'})
    assert r.status_code==200 and r.json()['payment_status']=='REFUNDED',r.text
    assert gateway['refunds']==1


def test_account_export_and_closure_include_new_order_data(setup,monkeypatch):
    from website.backend.app.api import auth
    c,_,_,_=setup;e=make_event(setup)
    with SessionLocal() as db:
        u=User(email=uuid.uuid4().hex+'@closure.test',hashed_password='x',wallet_balance=500)
        db.add(u);db.commit();uid=u.id
    headers={'Authorization':'Bearer '+create_access_token({'sub':uid})}
    o=c.post(BASE+'/orders',headers=headers,json=payload(setup,e)).json()
    exported=c.get('/api/v1/auth/me/export',headers=headers)
    assert exported.status_code==200 and exported.json()['chadhava_orders'][0]['id']==o['id']
    monkeypatch.setattr(auth,'verify_password',lambda *_:True)
    result=c.post('/api/v1/auth/me/delete',headers=headers,json={'password':'fixture','confirm_forfeit_balance':True})
    assert result.status_code==200,result.text
    with SessionLocal() as db:
        row=db.get(ChadhavaOrder,o['id']);assert row.snapshot['devotee_name']=='Deleted user' and not row.snapshot['phone']
        assert db.get(ChadawaBooking,o['booking_id']).devotee_name=='Deleted user'


def test_puja_interest_is_followed_and_notified_once_booking_opens(setup):
    client,users,temple,_=setup
    uid,headers=users[0]
    starts=datetime.now(timezone.utc)+timedelta(days=9)
    day=(starts+timedelta(hours=5,minutes=30)).date().isoformat()
    cal='festival-'+uuid.uuid4().hex[:8]
    assert client.post(BASE+'/interest',json={'calendar_id':cal,'date':day,'title':'Test Puja'}).status_code in (401,403)
    r=client.post(BASE+'/interest',headers=headers,json={'calendar_id':cal,'date':day,'title':'Test Puja'})
    assert r.status_code==201 and r.json()['following'] is True
    assert client.post(BASE+'/interest',headers=headers,json={'calendar_id':cal,'date':day,'title':'Test Puja'}).status_code==201
    assert client.post(BASE+'/interest',headers=headers,json={'calendar_id':cal,'date':'2026-02-31','title':'Test Puja'}).status_code==422
    assert cal in client.get(BASE+'/interest',headers=headers).json()['calendar_ids']
    with SessionLocal() as db:
        tier=TempleOffering(temple_id=temple,title='Individual puja',description='Puja package',price=1001,category='puja_tier');db.add(tier);db.commit();tier_id=tier.id
    now=datetime.now(timezone.utc)
    event=client.post(BASE+'/admin/events',headers=users[2][1],json=dict(temple_id=temple,title='Interest Puja',description='Puja for followers',
        starts_at=starts.isoformat(),deadline=(starts-timedelta(days=1)).isoformat(),cancellation_deadline=(starts-timedelta(days=2)).isoformat(),
        capacity=50,mode='collective',kind='puja',offering_ids=[tier_id],video_hours=48,unknown_gotra_allowed=True,partner_confirmed=True,published=True))
    assert event.status_code==201,event.text
    notes=client.get('/api/v1/notifications',headers=headers).json()
    items=notes.get('notifications',notes) if isinstance(notes,dict) else notes
    assert any('Puja booking is open' in (n.get('title') or '') for n in items)
    assert cal not in client.get(BASE+'/interest',headers=headers).json()['calendar_ids']
    assert client.delete(BASE+'/interest/'+cal,headers=headers).json()['following'] is False
