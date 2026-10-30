"""Isolated chadhava UI fixture. Never opens or changes the application's normal database."""
import os
import sys
import json
import uuid
from pathlib import Path
from datetime import datetime,timedelta,timezone

ROOT=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT))
(ROOT/'scratch').mkdir(exist_ok=True)
os.environ['DATABASE_URL']='sqlite:///'+(ROOT/'scratch'/('chadhava-preview-'+uuid.uuid4().hex+'.db')).as_posix()
os.environ['DEBUG']='false'
os.environ['GEMINI_API_KEY']=''
from packages.database.session import init_db,SessionLocal
from packages.database.models import User,Temple,TempleOffering
from packages.database.chadhava import ChadhavaEvent
from packages.core.security import create_access_token

init_db()
fixture={}
with SessionLocal() as db:
    for name,role in [('devotee','client'),('admin','admin'),('staff','client'),('other','client')]:
        u=User(email=name+'@chadhava-preview.test',full_name=name.title()+' Preview',hashed_password='preview-no-login',role=role,wallet_balance=2000)
        db.add(u);db.flush()
        fixture[name]={'id':u.id,'token':create_access_token({'sub':u.id}),'user':{'id':u.id,'email':u.email,'full_name':u.full_name,'role':u.role}}
    temple=Temple(name='Preview Shiva Mandir · Test event',slug='preview-chadhava-temple',deity='Shiva',city='Delhi',state='Delhi',description='Isolated test temple for the chadhava booking workflow.',image_url='/assets/img/temples/kashi-vishwanath-varanasi.jpg')
    db.add(temple);db.flush();fixture['temple_id']=temple.id
    offerings=[]
    for title,price,description in [('Flower offering',51,'Fresh flowers offered on behalf of the devotee.'),('Bhog offering',101,'Bhog arranged and offered by the temple team.')]:
        o=TempleOffering(temple_id=temple.id,title=title,description=description,price=price);db.add(o);db.flush();offerings.append(o.id)
    now=datetime.now(timezone.utc)
    event=ChadhavaEvent(temple_id=temple.id,title='Chadhava preview · Flowers & Bhog',title_hi='चढ़ावा पूर्वावलोकन · पुष्प और भोग',description='Test event demonstrating offering selection, devotee details and verified booking.',
        starts_at=now+timedelta(days=3),deadline=now+timedelta(days=2),cancellation_deadline=now+timedelta(days=1),
        capacity=100,mode='collective',offering_ids=offerings,video_hours=48,unknown_gotra_allowed=True,partner_confirmed=True,published=True)
    db.add(event);db.commit();fixture['event_id']=event.id
(ROOT/'scratch'/'chadhava-preview.json').write_text(json.dumps(fixture),encoding='utf-8')
if __name__=='__main__':
    import uvicorn
    uvicorn.run('website.backend.app.main:app',host='127.0.0.1',port=8016,log_level='warning')
