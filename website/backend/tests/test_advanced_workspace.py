"""Ownership boundaries, deterministic exploration and reminder delivery regressions."""
import uuid
from datetime import datetime, timedelta, timezone
from types import SimpleNamespace
import pytest
from fastapi.testclient import TestClient
from packages.core.security import create_access_token
from packages.database.session import init_db, SessionLocal
from packages.database.models import User, BirthChart, Notification, Astrologer, Consultation
from packages.database.advanced import AdvancedRecord, ScheduledReminder
from packages.astrology.advanced import recalculate, dasha_periods
from packages.core.advanced import memory_context, send_due, quiet_now
from website.backend.app.main import app


@pytest.fixture(scope="module")
def clients():
    init_db()
    result = []
    with SessionLocal() as db:
        for role in ("client", "client", "admin", "astrologer"):
            u = User(email=f"{uuid.uuid4().hex}@advanced.test", hashed_password="x", role=role)
            db.add(u); db.flush()
            result.append((u.id, {"Authorization": "Bearer " + create_access_token(data={"sub":u.id,"role":role})}))
        db.commit()
    with TestClient(app) as client:
        yield client, result


@pytest.fixture(scope="module")
def chart_id(clients):
    client, users = clients
    response = client.post('/api/v1/charts/calculate', headers=users[0][1], json={
        "name":"Family test", "date_of_birth":"1992-05-14", "time_of_birth":"00:05:00",
        "latitude":28.6139,"longitude":77.209,"timezone_offset":5.5,"city":"Delhi"})
    assert response.status_code == 200, response.text
    return response.json()['id']


def test_profile_ownership_and_memory_consent(clients, chart_id):
    c, users = clients
    first, second = users[0][1], users[1][1]
    assert c.get('/api/v1/advanced/family').status_code == 401
    for suffix in ('memory/'+chart_id, 'charts/'+chart_id+'/evidence', 'charts/'+chart_id+'/timeline?selected=2026-10-29'):
        assert c.get('/api/v1/advanced/'+suffix,headers=second).status_code == 404
    assert c.put('/api/v1/advanced/family/'+chart_id,headers=first,json={"relationship":"parent","label":"Mother"}).status_code == 200
    assert c.get('/api/v1/advanced/family',headers=first).json()[0]['relationship'] == 'parent'
    path='/api/v1/advanced/memory/'+chart_id
    assert c.put(path,headers=first,json={"enabled":False,"content":"Career concern"}).status_code == 200
    with SessionLocal() as db:
        assert memory_context(db,users[0][0],chart_id) == ''
    c.put(path,headers=first,json={"enabled":True,"content":"Career concern"})
    with SessionLocal() as db:
        assert memory_context(db,users[0][0],chart_id) == 'Career concern'
        assert memory_context(db,users[1][0],chart_id) == ''
    assert c.delete(path,headers=second).status_code == 404
    assert c.delete(path,headers=first).status_code == 200
    assert c.get(path,headers=first).json() == {"enabled":False,"content":""}


def test_timeline_uncertainty_and_evidence(clients,chart_id):
    c, users = clients; auth=users[0][1]
    d=c.get(f'/api/v1/advanced/charts/{chart_id}/timeline?selected=2026-10-29',headers=auth)
    assert d.status_code == 200, d.text
    data=d.json()
    assert data['active'] and len(data['transits']['planets']) >= 9
    assert all(1 <= p['natal_house'] <= 12 for p in data['transits']['planets'])
    for major in data['periods']:
        assert major['antardashas'][0]['start'] == major['start']
        assert abs((datetime.fromisoformat(major['antardashas'][-1]['end']) - datetime.fromisoformat(major['end'])).total_seconds()) < .01
    assert c.get(f'/api/v1/advanced/charts/{chart_id}/timeline?selected=1990-01-01',headers=auth).status_code == 422
    d=c.get(f'/api/v1/advanced/charts/{chart_id}/uncertainty?minutes=30',headers=auth).json()
    assert len(d['samples']) == 5
    assert d['samples'][0]['instant'].startswith('1992-05-13T23:35')
    assert d['samples'][2]['instant'].startswith('1992-05-14T00:05')
    d=c.get(f'/api/v1/advanced/charts/{chart_id}/evidence',headers=auth).json()
    assert len(d['placements']) >= 9 and d['calculation_engine']


def test_antardasha_first_balance_is_clipped_not_rescaled():
    profile=SimpleNamespace(date_of_birth='2000-01-01',time_of_birth='12:00:00',chart_data={'planets':[{'name':'Moon','longitude':(360/27)/2}]})
    first=dasha_periods(profile)[0]
    assert first['planet'] == 'Ketu'
    assert first['antardashas'][0]['planet'] != 'Ketu'
    assert first['start'] == '2000-01-01T12:00:00'


def test_muhurat_bounds_and_exclusions(clients,chart_id):
    c,users=clients; path=f'/api/v1/advanced/charts/{chart_id}/muhurat'
    r=c.get(path+'?start=2026-10-29&days=7&event=business',headers=users[0][1])
    assert r.status_code == 200, r.text
    d=r.json(); assert len(d['candidates'])+len(d['excluded']) == 7
    assert all(c['reasons'] for c in d['candidates']+d['excluded'])
    assert c.get(path+'?start=2026-10-29&days=400',headers=users[0][1]).status_code == 422


def test_reminders_preferences_and_exactly_once(clients):
    c,users=clients; uid,auth=users[0]
    assert c.put('/api/v1/advanced/reminder-preferences',headers=auth,json={'timezone':'bad/zone'}).status_code == 422
    assert c.post('/api/v1/advanced/reminders',headers=auth,json={'title':'Bad','due_at':'2020-01-01T12:00:00Z'}).status_code == 422
    future=(datetime.now(timezone.utc)+timedelta(days=1)).isoformat()
    r=c.post('/api/v1/advanced/reminders',headers=auth,json={'title':'Practice','due_at':future,'repeat_days':1})
    assert r.status_code == 201, r.text
    rid=r.json()['id']
    assert c.delete('/api/v1/advanced/reminders/'+rid,headers=users[1][1]).status_code == 404
    c.put('/api/v1/advanced/reminder-preferences',headers=auth,json={'quiet_start':0,'quiet_end':0})
    now=datetime.now(timezone.utc)
    with SessionLocal() as db:
        r=db.get(ScheduledReminder,rid);r.due_at=now-timedelta(days=2);db.commit()
        send_due(db,now);send_due(db,now)
        assert db.query(Notification).filter_by(owner_key='u:'+uid,kind='advanced_reminder').count() == 1
        db.refresh(r)
        assert r.active and r.due_at.replace(tzinfo=timezone.utc)>now
    assert quiet_now(datetime(2026,10,29,20,tzinfo=timezone.utc),{'timezone':'Asia/Kolkata','quiet_start':22,'quiet_end':7})


def test_quality_and_staff_permissions(clients):
    c,users=clients
    assert c.get('/api/v1/advanced/quality',headers=users[0][1]).status_code == 403
    assert c.get('/api/v1/advanced/quality',headers=users[2][1]).status_code == 200
    assert c.get('/api/v1/advanced/workbench',headers=users[0][1]).status_code == 403
    with SessionLocal() as db:
        a=Astrologer(slug='advanced-'+uuid.uuid4().hex,name='Staff test',title='Astrologer');db.add(a);db.flush()
        consultation=Consultation(user_id=users[0][0],owner_key='u:'+users[0][0],astrologer_id=a.id)
        db.add(consultation);db.commit(); aid,cid=a.id,consultation.id
    endpoint=f'/api/v1/advanced/workbench/{cid}'
    assert c.get(endpoint,headers=users[3][1]).status_code == 403
    assert c.put(f'/api/v1/advanced/staff/{users[3][0]}/{aid}',headers=users[2][1]).status_code == 200
    assert c.put(endpoint,headers=users[3][1],json={'private_notes':'private','annotations':'Mars in H1','follow_up':'Discuss next visit'}).status_code == 200
    assert c.get(endpoint,headers=users[3][1]).json()['notes']['private_notes'] == 'private'
    assert c.get(endpoint,headers=users[0][1]).status_code == 403
    c.delete(f'/api/v1/advanced/staff/{users[3][0]}/{aid}',headers=users[2][1])
    assert c.get(endpoint,headers=users[3][1]).status_code == 403


def test_push_rejects_internal_endpoints(clients):
    c,users=clients
    r=c.post('/api/v1/advanced/push-subscription',headers=users[0][1],json={'endpoint':'https://127.0.0.1/private','keys':{}})
    assert r.status_code == 422


def test_stream_passes_only_enabled_profile_memory_and_records_quality(clients,chart_id,monkeypatch):
    from packages.database.advanced import QualityEvent
    from ai.backend.app.services.llm_service import LLMService
    c,users=clients
    seen=[]
    async def response(**kwargs):
        seen.append(kwargs.get('approved_memory'))
        yield {'type':'delta','text':'Mars is in Aries. Traditional guidance.'}
        yield {'type':'done','calculated_data_used':True,'is_demo_mode':True}
    monkeypatch.setattr(LLMService,'stream_chat_response',response)
    with SessionLocal() as db:
        a=db.query(Astrologer).filter_by(is_ai=True).first()
        assert a
        slug=a.slug
    path='/api/v1/advanced/memory/'+chart_id
    c.put(path,headers=users[0][1],json={'enabled':True,'content':'Career preference'})
    r=c.post(f'/api/v1/consultations/{slug}/stream',headers=users[0][1],json={'message':'Please explain my career using my birth chart','chart_id':chart_id,'force_demo_mode':True})
    assert r.status_code == 200,r.text
    assert seen and seen[-1] == 'Career preference'
    with SessionLocal() as db:
        event=db.query(QualityEvent).filter_by(user_id=users[0][0]).first()
        assert event and event.latency_ms>=0 and event.data['first_token_ms'] is not None
        assert event.data['estimated_cost'] == 0
    c.put(path,headers=users[0][1],json={'enabled':False,'content':'Career preference'})
    r=c.post(f'/api/v1/consultations/{slug}/stream',headers=users[0][1],json={'message':'Please explain my career using my birth chart','chart_id':chart_id,'force_demo_mode':True})
    assert r.status_code == 200 and seen[-1] == ''


def test_quality_pricing_uses_configured_model_rates(monkeypatch):
    from packages.core.advanced import quality_data
    monkeypatch.setenv('AI_MODEL_PRICING_JSON','{"test-model":{"input_per_million":1,"output_per_million":2}}')
    d=quality_data('Guaranteed result',[],True,False,{'model':'test-model','input_tokens':1000,'output_tokens':500})
    assert d['estimated_cost'] == .002
    assert 'Absolute prediction language' in d['review_flags']
    assert quality_data('text',[],False,False)['estimated_cost'] is None


def test_summary_preview_requires_review_and_does_not_enable_memory(clients,chart_id):
    from packages.database.models import ConsultationSummary
    c,users=clients
    with SessionLocal() as db:
        astro=db.query(Astrologer).first()
        consult=Consultation(user_id=users[0][0],owner_key='u:'+users[0][0],astrologer_id=astro.id,chart_id=chart_id)
        db.add(consult);db.flush()
        db.add(ConsultationSummary(consultation_id=consult.id,concern='Career',key_insights=['Discuss Jupiter'],follow_ups=['Review goals']))
        db.commit()
    endpoint=f'/api/v1/advanced/memory/{chart_id}/suggestion'
    assert c.get(endpoint,headers=users[1][1]).status_code == 404
    result=c.get(endpoint,headers=users[0][1])
    assert result.status_code == 200 and 'Review goals' in result.json()['content']
    assert not c.get(f'/api/v1/advanced/memory/{chart_id}',headers=users[0][1]).json()['enabled']
