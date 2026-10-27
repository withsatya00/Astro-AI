"""
Mandir Seva & E-Chadawa API for Astro Jyotish.
Allows devotees to book authentic temple offerings, live aartis, and gotra sankalp poojas
with video proof and doorstep prasad delivery across India's famous holy shrines.
"""
import calendar
import json
from datetime import date, timedelta
from pathlib import Path

from fastapi import APIRouter, HTTPException, Depends, UploadFile, File, Request, Response
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime, timezone
import random

from packages.database.session import get_db
from packages.database.models import (
    User, BirthChart, Temple, TempleOffering, ChadawaBooking, Priest, SevaPackage, Reminder, Coupon, StatusEvent,
    generate_uuid, utc_now
)
from website.backend.app.api.auth import get_current_user_optional, get_current_user_required
from website.backend.app.services.certificates import seva_certificate_pdf
from packages.core.identity import Owner, optional_owner
from packages.core.wallet_pay import charge_wallet, refund_wallet
from packages.core.notify import notify, record_event
from packages.core.pricing import (
    EARN_PER_RUPEES, active_membership, apply_totals, award_points, compute_totals, maybe_reward_referral, refund_points
)
from website.backend.app import catalog_i18n
from packages.core.remedies import WEEKDAY_SEVA, remedy_for_sign, normalize_sign, tithi_special

router = APIRouter(prefix="/mandir", tags=["Mandir Seva & E-Chadawa"])

# ----------------- Seed Data with 11 Famous Holy Temples -----------------
INITIAL_TEMPLES = [
    {
        "name": "श्री महाकालेश्वर ज्योतिर्लिंग, उज्जैन",
        "slug": "mahakaleshwar-ujjain",
        "deity": "भगवान शिव (महाकाल)",
        "city": "उज्जैन",
        "state": "मध्य प्रदेश",
        "description": "द्वादश ज्योतिर्लिंगों में एकमात्र दक्षिणमुखी ज्योतिर्लिंग। काल के अधिपति महाकाल के दर्शन और भस्म आरती से अकाल मृत्यु का भय समाप्त होता है।",
        "history_significance": "अवन्तिका पुरी में स्थित यह पावन धाम तंत्र, योग और मोक्ष का सर्वोच्च केंद्र माना गया है।",
        "image_url": "/assets/img/temples/mahakaleshwar-ujjain.jpg",
        "banner_url": "/assets/img/temples/mahakaleshwar-ujjain.jpg",
        "live_status": "बुकिंग उपलब्ध",
        "offerings": [
            {
                "title": "पुष्प, बिल्वपत्र एवं दीप अर्पण",
                "description": "महाकाल को ताजे बिल्वपत्र, सुगंधित पुष्प एवं अखंड घी का दीप अर्पण।",
                "category": "chadawa",
                "price": 51.0,
                "has_prasad_delivery": False,
                "delivery_fee": 0.0,
                "includes_video_proof": True,
            },
            {
                "title": "पंचामृत अभिषेक एवं भस्म अर्पण संकल्प",
                "description": "दूध, दही, मधु, शर्करा और घृत से अभिषेक एवं पवित्र भस्म अर्पण।",
                "category": "abhishek",
                "price": 251.0,
                "has_prasad_delivery": True,
                "delivery_fee": 99.0,
                "includes_video_proof": True,
            },
            {
                "title": "विशेष महामृत्युंजय शांति अनुष्ठान",
                "description": "यजमान के नाम व गोत्र से 11 ब्राह्मणों द्वारा महामृत्युंजय मंत्रोच्चार व रक्षा संकल्प।",
                "category": "sankalp_pooja",
                "price": 1100.0,
                "has_prasad_delivery": True,
                "delivery_fee": 99.0,
                "includes_video_proof": True,
            }
        ]
    },
    {
        "name": "श्री काशी विश्वनाथ धाम, वाराणसी",
        "slug": "kashi-vishwanath-varanasi",
        "deity": "भगवान शिव (विश्वेश्वर)",
        "city": "वाराणसी",
        "state": "उत्तर प्रदेश",
        "description": "मोक्षदायिनी काशी के अधिपति देवाधिदेव महादेव। यहां गंगाजल और रुद्राभिषेक से सभी पापों और ग्रह दोषों का शमन होता है।",
        "history_significance": "स्कंद पुराण के काशी खंड में वर्णित सर्वोपरि तीर्थ, जहां स्वयं शिव तारक मंत्र देकर मुक्ति प्रदान करते हैं।",
        "image_url": "/assets/img/temples/kashi-vishwanath-varanasi.jpg",
        "banner_url": "/assets/img/temples/kashi-vishwanath-varanasi.jpg",
        "live_status": "बुकिंग उपलब्ध",
        "offerings": [
            {
                "title": "गंगाजल व बेलपत्र अर्पण",
                "description": "पवित्र उत्तरवाहिनी गंगाजल व 108 बेलपत्र बाबा विश्वनाथ को अर्पण।",
                "category": "chadawa",
                "price": 101.0,
                "has_prasad_delivery": False,
                "delivery_fee": 0.0,
                "includes_video_proof": True,
            },
            {
                "title": "द्वादश ज्योतिर्लिंग रुद्राभिषेक संकल्प",
                "description": "यजमान के नाम से संपूर्ण रुद्राष्टाध्यायी पाठ व दुग्धाभिषेक।",
                "category": "abhishek",
                "price": 501.0,
                "has_prasad_delivery": True,
                "delivery_fee": 99.0,
                "includes_video_proof": True,
            },
            {
                "title": "अन्नपूर्णा व विश्वनाथ सुख-समृद्धि महापूजा",
                "description": "व्यापार वृद्धि एवं गृह शांति हेतु विशेष षोडशोपचार पूजन व रक्षासूत्र।",
                "category": "sankalp_pooja",
                "price": 1500.0,
                "has_prasad_delivery": True,
                "delivery_fee": 99.0,
                "includes_video_proof": True,
            }
        ]
    },
    {
        "name": "श्री सोमनाथ ज्योतिर्लिंग धाम, गुजरात",
        "slug": "somnath-jyotirlinga-gujarat",
        "deity": "भगवान सोमनाथ (चंद्रमौली शिव)",
        "city": "प्रभास पाटन / वेरावल",
        "state": "गुजरात",
        "description": "द्वादश ज्योतिर्लिंगों में प्रथम व अनादि तीर्थ। चंद्र देव को क्षय रोग से मुक्ति दिलाने वाला पावन धाम। मानसिक शांति व चंद्र दोष निवारण हेतु सर्वोपरि।",
        "history_significance": "ऋग्वेद में वर्णित पावन प्रभास क्षेत्र, जहां त्रिवेणी संगम (हिरण, कपिला, सरस्वती) स्थित है।",
        "image_url": "/assets/img/temples/somnath-jyotirlinga-gujarat.jpg",
        "banner_url": "/assets/img/temples/somnath-jyotirlinga-gujarat.jpg",
        "live_status": "बुकिंग उपलब्ध",
        "offerings": [
            {
                "title": "सोमेश्वर दुग्धाभिषेक व बेलपत्र अर्पण",
                "description": "सोमनाथ शिवलिंग पर गाय के शुद्ध दुग्ध से अभिषेक एवं बिल्वपत्र अर्पण।",
                "category": "chadawa",
                "price": 101.0,
                "has_prasad_delivery": False,
                "delivery_fee": 0.0,
                "includes_video_proof": True,
            },
            {
                "title": "चंद्र दोष निवारण व मानसिक शांति संकल्प",
                "description": "कुंडली में चंद्रमा की मजबूती व मानसिक स्थिरता हेतु विशेष अनुष्ठान।",
                "category": "abhishek",
                "price": 551.0,
                "has_prasad_delivery": True,
                "delivery_fee": 99.0,
                "includes_video_proof": True,
            }
        ]
    },
    {
        "name": "श्री केदारनाथ धाम, हिमालय",
        "slug": "kedarnath-dham-uttarakhand",
        "deity": "भगवान केदारनाथ (सदाशिव)",
        "city": "रुद्रप्रयाग",
        "state": "उत्तराखंड",
        "description": "हिमालय की गोद में मंदाकिनी तट पर स्थित पंच केदारों में प्रधान। मोक्ष प्रदाता केदारनाथ के दर्शन से जन्म-मरण के चक्र से मुक्ति मिलती है।",
        "history_significance": "पांडवों द्वारा महाभारत युद्ध के पश्चात पश्चाताप हेतु स्थापित दिव्य शिला स्वरूप।",
        "image_url": "/assets/img/temples/kedarnath-dham-uttarakhand.jpg",
        "banner_url": "/assets/img/temples/kedarnath-dham-uttarakhand.jpg",
        "live_status": "बुकिंग उपलब्ध",
        "offerings": [
            {
                "title": "हिमालयी पुष्प एवं अखंड घृत दीप अर्पण",
                "description": "केदारनाथ गर्भगृह में यजमान के नाम से अखंड ज्योति व पुष्प अर्पण।",
                "category": "chadawa",
                "price": 151.0,
                "has_prasad_delivery": False,
                "delivery_fee": 0.0,
                "includes_video_proof": True,
            },
            {
                "title": "महाभिषेक एवं केदार प्रसाद संकल्प",
                "description": "तीर्थ पुरोहितों द्वारा वैदिक मंत्रोच्चार सहित महाभिषेक व पवित्र भस्म प्रेषण।",
                "category": "abhishek",
                "price": 751.0,
                "has_prasad_delivery": True,
                "delivery_fee": 99.0,
                "includes_video_proof": True,
            }
        ]
    },
    {
        "name": "श्री तिरुपति बालाजी (वेंकटेश्वर स्वामी), तिरुमला",
        "slug": "tirupati-balaji-andhra",
        "deity": "भगवान श्री वेंकटेश्वर (विष्णु)",
        "city": "तिरुमला / तिरुपति",
        "state": "आंध्र प्रदेश",
        "description": "कलयुग के प्रत्यक्ष वैकुंठ धाम। धन-वैभव, ऋण मुक्ति, व्यापार में अप्रत्याशित सफलता और परिवार की सुरक्षा के सर्वोच्च दाता।",
        "history_significance": "सप्तगिरि पर्वतों पर स्थित विश्व का सर्वाधिक आस्थावान एवं वैभवशाली तीर्थ।",
        "image_url": "/assets/img/temples/tirupati-balaji-andhra.jpg",
        "banner_url": "/assets/img/temples/tirupati-balaji-andhra.jpg",
        "live_status": "बुकिंग उपलब्ध",
        "offerings": [
            {
                "title": "तुलसी माला एवं दीप अर्पण",
                "description": "स्वामी वेंकटेश्वर के चरणों में पवित्र तुलसी पत्र व अखंड दीप अर्पण।",
                "category": "chadawa",
                "price": 101.0,
                "has_prasad_delivery": False,
                "delivery_fee": 0.0,
                "includes_video_proof": True,
            },
            {
                "title": "अष्टलक्ष्मी धनवर्षा विशेष अर्चना व लड्डू प्रसाद",
                "description": "यजमान के नाम से सहस्रनाम अर्चना एवं तिरुपति का प्रामाणिक लड्डू प्रसाद घर भिजवाना।",
                "category": "sankalp_pooja",
                "price": 1100.0,
                "has_prasad_delivery": True,
                "delivery_fee": 99.0,
                "includes_video_proof": True,
            }
        ]
    },
    {
        "name": "मां वैष्णो देवी धाम, कटरा",
        "slug": "vaishno-devi-katra",
        "deity": "मां महालक्ष्मी, महाकाली, महासरस्वती (पिंडी स्वरूप)",
        "city": "कटरा",
        "state": "जम्मू और कश्मीर",
        "description": "त्रिकूटा पर्वत की पवित्र गुफा में स्थित सिद्ध शक्तिपीठ। मां के दरबार में हाजिरी लगाने से हर अधूरी मनोकामना पूर्ण होती है।",
        "history_significance": "त्रेतायुग से भक्तों को अभयदान देने वाली तीन स्वयंभू पिंडियों का साक्षात महातीर्थ।",
        "image_url": "/assets/img/temples/vaishno-devi-katra.jpg",
        "banner_url": "/assets/img/temples/vaishno-devi-katra.jpg",
        "live_status": "बुकिंग उपलब्ध",
        "offerings": [
            {
                "title": "लाल चुनरी, नारियल व पुष्प भेंट",
                "description": "मां भगवती की पवित्र पिंडियों पर लाल चुनरी एवं सुहाग पिटारी अर्पण।",
                "category": "chadawa",
                "price": 101.0,
                "has_prasad_delivery": False,
                "delivery_fee": 0.0,
                "includes_video_proof": True,
            },
            {
                "title": "सर्वसंकट निवारक महाहवन व पवित्र मिश्री प्रसाद",
                "description": "यजमान के परिवार की रक्षा हेतु माता के भवन पर विशेष आहुति एवं प्रसाद प्रेषण।",
                "category": "sankalp_pooja",
                "price": 851.0,
                "has_prasad_delivery": True,
                "delivery_fee": 99.0,
                "includes_video_proof": True,
            }
        ]
    },
    {
        "name": "मां कामाख्या शक्तिपीठ, गुवाहाटी",
        "slug": "kamakhya-devi-assam",
        "deity": "मां भगवती कामाख्या",
        "city": "गुवाहाटी",
        "state": "असम",
        "description": "51 शक्तिपीठों में सर्वोच्च तांत्रिक महापीठ। मां कामाख्या के आशीर्वाद से समस्त कामनाओं की पूर्ति और नजर दोष का निवारण होता है।",
        "history_significance": "नीलांचल पर्वत पर स्थित वह दिव्य स्थल जहां सती की योनि मुद्रा गिरी थी।",
        "image_url": "/assets/img/temples/kamakhya-devi-assam.jpg",
        "banner_url": "/assets/img/temples/kamakhya-devi-assam.jpg",
        "live_status": "बुकिंग उपलब्ध",
        "offerings": [
            {
                "title": "पवित्र सिंदूर, चुनरी व लाल पुष्प अर्पण",
                "description": "मां को अखंड सुहाग व संकट मुक्ति हेतु लाल चुनरी, रोली व सिंदूर अर्पण।",
                "category": "chadawa",
                "price": 101.0,
                "has_prasad_delivery": False,
                "delivery_fee": 0.0,
                "includes_video_proof": True,
            },
            {
                "title": "सर्वमनोकामना सिद्धि विशेष अर्चना",
                "description": "यजमान के नाम, गोत्र व मनोकामना का मां के चरणारविंद में संकल्प।",
                "category": "sankalp_pooja",
                "price": 501.0,
                "has_prasad_delivery": True,
                "delivery_fee": 99.0,
                "includes_video_proof": True,
            },
            {
                "title": "तंत्रोक्त कामाख्या रक्षा कवच व सिंदूर प्रेषण",
                "description": "अत्यंत दुर्लभ अभिमंत्रित लाल वस्त्र व कामाख्या सिंदूर घर मंगवाएं।",
                "category": "sankalp_pooja",
                "price": 1100.0,
                "has_prasad_delivery": True,
                "delivery_fee": 99.0,
                "includes_video_proof": True,
            }
        ]
    },
    {
        "name": "श्री सिद्धिविनायक मंदिर, प्रभादेवी",
        "slug": "siddhivinayak-mumbai",
        "deity": "भगवान श्री गणेश",
        "city": "मुंबई",
        "state": "महाराष्ट्र",
        "description": "दाहिनी सूंड़ वाले रिद्धि-सिद्धि दाता सिद्धिविनायक। व्यापार प्रारंभ, गृह प्रवेश व नौकरी में सफलता हेतु लाखों भक्तों की आस्था का धाम।",
        "history_significance": "1801 में स्थापित यह मंदिर मुंबई की आत्मा और विघ्नहर्ता का साक्षात स्वरूप माना जाता है।",
        "image_url": "/assets/img/temples/siddhivinayak-mumbai.jpg",
        "banner_url": "/assets/img/temples/siddhivinayak-mumbai.jpg",
        "live_status": "बुकिंग उपलब्ध",
        "offerings": [
            {
                "title": "मोदक, दूर्वा व लाल अर्क पुष्प अर्पण",
                "description": "गणपति बप्पा को 21 दूर्वा की गांठें व मोदक भोग का अर्पण।",
                "category": "chadawa",
                "price": 51.0,
                "has_prasad_delivery": False,
                "delivery_fee": 0.0,
                "includes_video_proof": True,
            },
            {
                "title": "संकष्टी चतुर्थी व बुधवार विशेष अभिषेक",
                "description": "अथर्वशीर्ष पाठ द्वारा पंचामृत अभिषेक एवं सिंदूर लेपन।",
                "category": "abhishek",
                "price": 251.0,
                "has_prasad_delivery": True,
                "delivery_fee": 99.0,
                "includes_video_proof": True,
            },
            {
                "title": "संपूर्ण कार्य सिद्धि महागणपति पूजन",
                "description": "व्यवसाय, संपत्ति या विवाह में आ रही रुकावटों को दूर करने हेतु।",
                "category": "sankalp_pooja",
                "price": 851.0,
                "has_prasad_delivery": True,
                "delivery_fee": 99.0,
                "includes_video_proof": True,
            }
        ]
    },
    {
        "name": "श्री शनि शिंगणापुर धाम, महाराष्ट्र",
        "slug": "shani-shingnapur",
        "deity": "भगवान शनिदेव",
        "city": "नेवासा / अहमदनगर",
        "state": "महाराष्ट्र",
        "description": "स्वयंभू पाषाण रूप शनिदेव धाम। यहां साढ़ेसाती, ढैय्या एवं शनि जनित कष्टों के निवारण हेतु भक्त श्रद्धा से तैलाभिषेक करते हैं।",
        "history_significance": "बिना छत और दरवाजों वाला अद्वितीय गांव जहां शनिदेव स्वयं रखवाली करते हैं।",
        "image_url": "/assets/img/temples/shani-shingnapur.jpg",
        "banner_url": "/assets/img/temples/shani-shingnapur.jpg",
        "live_status": "बुकिंग उपलब्ध",
        "offerings": [
            {
                "title": "सरसों तेल व काला तिल अर्पण",
                "description": "शनिदेव को शुद्ध सरसों का तेल, काला तिल एवं नीले पुष्प का अर्पण।",
                "category": "chadawa",
                "price": 51.0,
                "has_prasad_delivery": False,
                "delivery_fee": 0.0,
                "includes_video_proof": True,
            },
            {
                "title": "शनि साढ़ेसाती एवं ढैय्या शांति तैलाभिषेक",
                "description": "यजमान के नाम-गोत्र से वैदिक शनि शांति मंत्रों द्वारा अभिषेक।",
                "category": "abhishek",
                "price": 251.0,
                "has_prasad_delivery": True,
                "delivery_fee": 99.0,
                "includes_video_proof": True,
            },
            {
                "title": "शनि पीड़ा निवारण महायज्ञ व रक्षा कवच",
                "description": "शनि दोष शमन हेतु विशेष आहुति, अभिमंत्रित काला धागा एवं प्रसाद प्रेषण।",
                "category": "sankalp_pooja",
                "price": 751.0,
                "has_prasad_delivery": True,
                "delivery_fee": 99.0,
                "includes_video_proof": True,
            }
        ]
    },
    {
        "name": "श्री जगन्नाथ मंदिर, पुरी",
        "slug": "jagannath-temple-puri",
        "deity": "भगवान जगन्नाथ, बलभद्र, सुभद्रा",
        "city": "पुरी",
        "state": "ओडिशा",
        "description": "चार धामों में एक परम पावन धाम। महाप्रभु जगन्नाथ का साक्षात बैकुंठ स्वरूप। दरिद्रता नाशन एवं अक्षय पुण्य प्रदायक।",
        "history_significance": "नीलांचल पर्वत पर स्थापित यह धाम अपने 56 भोग एवं अद्वितीय रथयात्रा हेतु जगप्रसिद्ध है।",
        "image_url": "/assets/img/temples/jagannath-temple-puri.jpg",
        "banner_url": "/assets/img/temples/jagannath-temple-puri.jpg",
        "live_status": "बुकिंग उपलब्ध",
        "offerings": [
            {
                "title": "तुलसी मंजरी व सुगंधित दीप अर्पण",
                "description": "महाप्रभु जगन्नाथ को ताजी तुलसी मंजरी व घी का अखंड दीप अर्पण।",
                "category": "chadawa",
                "price": 101.0,
                "has_prasad_delivery": False,
                "delivery_fee": 0.0,
                "includes_video_proof": True,
            },
            {
                "title": "अन्न ब्रह्म महाप्रसाद व खाजा संकल्प",
                "description": "भगवान जगन्नाथ का प्रामाणिक महाप्रसाद (खाजा व शुष्क प्रसाद) घर मंगवाएं।",
                "category": "sankalp_pooja",
                "price": 651.0,
                "has_prasad_delivery": True,
                "delivery_fee": 99.0,
                "includes_video_proof": True,
            }
        ]
    },
    {
        "name": "श्री राम जन्मभूमि मंदिर, अयोध्या",
        "slug": "ram-janmabhoomi-ayodhya",
        "deity": "भगवान श्री रामलला सरकार",
        "city": "अयोध्या",
        "state": "उत्तर प्रदेश",
        "description": "मर्यादा पुरुषोत्तम प्रभु श्री राम की पावन जन्मस्थली। रामलला के आशीर्वाद से कुल वृद्धि, सत्य, धर्म और सभी कष्टों से रक्षा होती है।",
        "history_significance": "सरयू तट पर स्थित सनातन धर्म की आत्मा एवं 500 वर्षों की तपस्या का भव्य प्रतीक।",
        "image_url": "/assets/img/temples/ram-janmabhoomi-ayodhya.jpg",
        "banner_url": "/assets/img/temples/ram-janmabhoomi-ayodhya.jpg",
        "live_status": "बुकिंग उपलब्ध",
        "offerings": [
            {
                "title": "पीतांबर, पुष्प व तुलसी दल अर्पण",
                "description": "बालक राम को पीला वस्त्र, सुगंधित पुष्प माला व तुलसी दल अर्पण।",
                "category": "chadawa",
                "price": 101.0,
                "has_prasad_delivery": False,
                "delivery_fee": 0.0,
                "includes_video_proof": True,
            },
            {
                "title": "श्री राम रक्षा स्त्रोत पाठ व इलायची दाना प्रसाद",
                "description": "यजमान के नाम व गोत्र से 11 ब्राह्मणों द्वारा रामरक्षा स्तोत्र पाठ व प्रसाद डिलीवरी।",
                "category": "sankalp_pooja",
                "price": 751.0,
                "has_prasad_delivery": True,
                "delivery_fee": 99.0,
                "includes_video_proof": True,
            }
        ]
    }
]


catalog_i18n.register_temples(INITIAL_TEMPLES)


def seed_temples_if_empty(db: Session):
    """Auto-seeds initial authentic temples if table is empty or missing new temples."""
    try:
        for t_data in INITIAL_TEMPLES:
            t_copy = dict(t_data)
            offerings = t_copy.pop("offerings", [])
            existing = db.query(Temple).filter(Temple.slug == t_copy["slug"]).first()
            if existing:
                # Photos and status text come from the catalog, so keep them current on existing rows.
                for field in ("image_url", "banner_url", "live_status"):
                    if getattr(existing, field) != t_copy.get(field):
                        setattr(existing, field, t_copy.get(field))
            else:
                temple = Temple(**t_copy)
                db.add(temple)
                db.flush()
                for o_data in offerings:
                    offering = TempleOffering(temple_id=temple.id, **o_data)
                    db.add(offering)
        db.commit()
    except Exception as e:
        db.rollback()
        print(f"[Seed Temples Notice] {e}")


# ----------------- Packages & coupons seed -----------------
INITIAL_PACKAGES = [
    {"slug": "kashi-somvar-rudrabhishek", "temple": "kashi-vishwanath-varanasi", "offering_index": 1, "sessions": 4, "cadence": "weekly",
     "weekday": 0, "discount": 10,
     "title": "सोमवार रुद्राभिषेक - 4 सप्ताह", "title_en": "Monday Rudrabhishek - 4 weeks",
     "description": "लगातार 4 सोमवार काशी विश्वनाथ धाम में आपके नाम व गोत्र से रुद्राभिषेक संकल्प।",
     "description_en": "Rudrabhishek sankalp at Kashi Vishwanath on four consecutive Mondays, in your name and gotra."},
    {"slug": "shani-shanivar-shanti", "temple": "shani-shingnapur", "offering_index": 1, "sessions": 8, "cadence": "weekly",
     "weekday": 5, "discount": 15,
     "title": "शनिवार शनि शांति - 8 सप्ताह", "title_en": "Saturday Shani Shanti - 8 weeks",
     "description": "8 शनिवार शनि शिंगणापुर में साढ़ेसाती/ढैय्या शांति तैलाभिषेक।",
     "description_en": "Oil abhishek for Sade Sati / Dhaiya shanti at Shani Shingnapur on eight Saturdays."},
    {"slug": "siddhivinayak-budhvar", "temple": "siddhivinayak-mumbai", "offering_index": 1, "sessions": 4, "cadence": "weekly",
     "weekday": 2, "discount": 10,
     "title": "बुधवार गणपति अभिषेक - 4 सप्ताह", "title_en": "Wednesday Ganpati Abhishek - 4 weeks",
     "description": "4 बुधवार सिद्धिविनायक में अथर्वशीर्ष पाठ सहित अभिषेक।",
     "description_en": "Abhishek with Atharvashirsha recitation at Siddhivinayak on four Wednesdays."},
    {"slug": "mahakal-masik-mahamrityunjaya", "temple": "mahakaleshwar-ujjain", "offering_index": 2, "sessions": 3, "cadence": "monthly",
     "weekday": None, "discount": 10,
     "title": "मासिक महामृत्युंजय अनुष्ठान - 3 माह", "title_en": "Monthly Mahamrityunjaya Anushthan - 3 months",
     "description": "लगातार 3 माह महाकालेश्वर में विशेष महामृत्युंजय शांति अनुष्ठान।",
     "description_en": "Special Mahamrityunjaya Shanti Anushthan at Mahakaleshwar for three consecutive months."},
    {"slug": "jagannath-amavasya-mahaprasad", "temple": "jagannath-temple-puri", "offering_index": 1, "sessions": 3, "cadence": "monthly",
     "weekday": None, "discount": 10,
     "title": "मासिक अन्न ब्रह्म महाप्रसाद - 3 माह", "title_en": "Monthly Anna Brahma Mahaprasad - 3 months",
     "description": "हर माह पुरी का महाप्रसाद आपके नाम से संकल्प सहित घर पर।",
     "description_en": "Jagannath Mahaprasad sankalp in your name every month, delivered to your home."},
    {"slug": "vaishno-navratri-nav-din", "temple": "vaishno-devi-katra", "offering_index": 1, "sessions": 9, "cadence": "daily",
     "weekday": None, "discount": 15,
     "title": "नवरात्रि नौ दिन महाहवन", "title_en": "Navratri nine-day Maha Havan",
     "description": "नवरात्रि के 9 दिन मां वैष्णो देवी भवन में प्रतिदिन संकल्प व आहुति। शुरुआत की तारीख आप चुनें।",
     "description_en": "Daily sankalp and ahuti at Mata Vaishno Devi Bhawan for nine days. You choose the start date (Navratri begins on the Pratipada tithi)."},
]

INITIAL_COUPONS = [
    {"code": "WELCOME10", "kind": "percent", "value": 10.0, "min_amount": 299.0, "max_discount": 200.0, "applies_to": "all",
     "first_order_only": True, "per_user_limit": 1, "description": "10% off your first order (up to ₹200)"},
]


def seed_packages_and_coupons(db: Session):
    try:
        for c in INITIAL_COUPONS:
            if not db.query(Coupon).filter(Coupon.code == c["code"]).first():
                db.add(Coupon(**c))
        for p in INITIAL_PACKAGES:
            if db.query(SevaPackage).filter(SevaPackage.slug == p["slug"]).first():
                continue
            temple = db.query(Temple).filter(Temple.slug == p["temple"]).first()
            offerings = sorted(temple.offerings, key=lambda o: o.created_at or utc_now()) if temple else []
            if len(offerings) <= p["offering_index"]:
                continue
            db.add(SevaPackage(slug=p["slug"], offering_id=offerings[p["offering_index"]].id, title=p["title"], title_en=p["title_en"],
                               description=p["description"], description_en=p["description_en"], sessions=p["sessions"],
                               cadence=p["cadence"], weekday=p["weekday"], discount_percent=p["discount"]))
        db.commit()
    except Exception as e:
        db.rollback()
        print(f"[Seed Packages Notice] {e}")


# ----------------- Request Schemas -----------------
BOOKING_FLOW = ["PAID", "SANKALP_SCHEDULED", "VIDEO_UPLOADED", "COMPLETED"]
PRASAD_FEE = 99.0


class ChadawaBookingRequest(BaseModel):
    offering_id: str
    devotee_name: str = Field(..., min_length=2, max_length=100)
    devotee_phone: Optional[str] = Field(None, max_length=20)
    gotra: Optional[str] = Field("कश्यप (Kashyap)", max_length=100)
    rashi: Optional[str] = Field(None, max_length=100)
    nakshatra: Optional[str] = Field(None, max_length=100)
    sankalp_purpose: Optional[str] = Field("स्वास्थ्य, सुख-शांति एवं कार्यसिद्धि", max_length=255)
    family_members: Optional[str] = Field(None, max_length=500)
    include_prasad: bool = False
    delivery_address: Optional[str] = Field(None, max_length=500)
    coupon_code: Optional[str] = Field(None, max_length=30)
    use_points: int = Field(0, ge=0, le=100000)
    priest_id: Optional[str] = None


class QuoteRequest(BaseModel):
    offering_id: str
    include_prasad: bool = False
    coupon_code: Optional[str] = Field(None, max_length=30)
    use_points: int = Field(0, ge=0, le=100000)


class PackageBuyRequest(BaseModel):
    devotee_name: str = Field(..., min_length=2, max_length=100)
    devotee_phone: Optional[str] = Field(None, max_length=20)
    gotra: Optional[str] = Field("कश्यप (Kashyap)", max_length=100)
    sankalp_purpose: Optional[str] = Field(None, max_length=255)
    family_members: Optional[str] = Field(None, max_length=500)
    start_date: str = Field(..., description="YYYY-MM-DD")
    coupon_code: Optional[str] = Field(None, max_length=30)
    use_points: int = Field(0, ge=0, le=100000)


class BookingStatusUpdate(BaseModel):
    status: str
    scheduled_for: Optional[str] = None
    video_proof_url: Optional[str] = Field(None, max_length=1024)
    prasad_tracking_id: Optional[str] = Field(None, max_length=100)
    priest_id: Optional[str] = None


class ReminderRequest(BaseModel):
    person_name: str = Field(..., min_length=2, max_length=150)
    kind: str = Field("birthday")
    month: int = Field(..., ge=1, le=12)
    day: int = Field(..., ge=1, le=31)


def _is_hi(lang: Optional[str]) -> bool:
    return (lang or "").lower().startswith("hi")


def _offering_dict(o: TempleOffering, lang: Optional[str] = None) -> Dict[str, Any]:
    en = catalog_i18n.offering_en(o.title) if catalog_i18n.is_en(lang) else None
    return {
        "id": o.id,
        "title": en[0] if en else o.title,
        "description": en[1] if en else o.description,
        "category": o.category,
        "price": o.price,
        "has_prasad_delivery": o.has_prasad_delivery,
        "delivery_fee": o.delivery_fee,
        "includes_video_proof": o.includes_video_proof,
    }


def _temple_fields(t: Temple, lang: Optional[str]) -> Dict[str, Any]:
    """Temple text in the requested language (English where the starter catalog has it, else as stored)."""
    en = catalog_i18n.temple_en(t.slug) if catalog_i18n.is_en(lang) else None
    return {k: (en.get(k) if en else None) or getattr(t, k) for k in ("name", "deity", "city", "state", "description")}


def _priest_dict(p: Priest, lang: Optional[str] = None) -> Dict[str, Any]:
    bio = p.bio_en if (catalog_i18n.is_en(lang) and p.bio_en) else p.bio
    return {"id": p.id, "name": p.name, "photo_url": p.photo_url, "years_experience": p.years_experience or 0,
            "languages": p.languages, "bio": bio, "verified": bool(p.verified), "temple_id": p.temple_id}


def _aarti(t: Temple) -> List[Dict[str, str]]:
    try:
        data = json.loads(t.aarti_timings or "[]")
        return [{"name": str(x.get("name", "")), "time": str(x.get("time", ""))} for x in data if isinstance(x, dict)]
    except ValueError:
        return []


def _booking_dict(b: ChadawaBooking, lang: Optional[str] = None, db: Optional[Session] = None) -> Dict[str, Any]:
    offering = b.offering
    english = catalog_i18n.is_en(lang)
    temple_name = _temple_fields(offering.temple, lang)["name"] if offering and offering.temple else ("Holy shrine" if english else "पावन तीर्थ")
    offering_title = _offering_dict(offering, lang)["title"] if offering else ("Sankalp puja" if english else "संकल्प पूजा")
    priest = None
    if db is not None and b.priest_id:
        row = db.query(Priest).filter(Priest.id == b.priest_id).first()
        priest = _priest_dict(row, lang) if row else None
    return {
        "id": b.id,
        "booking_number": b.booking_number,
        "temple_name": temple_name,
        "temple_slug": offering.temple.slug if offering and offering.temple else None,
        "offering_title": offering_title,
        "devotee_name": b.devotee_name,
        "gotra": b.gotra,
        "sankalp_purpose": (catalog_i18n.PURPOSES_EN.get(b.sankalp_purpose, b.sankalp_purpose) if english else b.sankalp_purpose),
        "family_members": b.family_members,
        "amount_paid": b.amount_paid,
        "discount_amount": b.discount_amount or 0.0,
        "points_used": b.points_used or 0,
        "coupon_code": b.coupon_code,
        "payment_method": b.payment_method,
        "status": b.status,
        "scheduled_for": b.scheduled_for,
        "video_proof_url": b.video_proof_url,
        "prasad_tracking_id": b.prasad_tracking_id,
        "include_prasad": b.include_prasad,
        "priest": priest,
        "package_ref": b.package_ref,
        "certificate_available": b.status == "COMPLETED" and bool(b.certificate_code),
        "certificate_code": b.certificate_code if b.status == "COMPLETED" else None,
        "created_at": str(b.created_at),
    }


def require_admin(user: Optional[User] = Depends(get_current_user_optional)) -> User:
    if not user or user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return user


def _new_certificate_code() -> str:
    return "SV-" + generate_uuid().replace("-", "")[:8].upper()


def _offering_or_404(db: Session, offering_id: str) -> TempleOffering:
    offering = db.query(TempleOffering).filter(TempleOffering.id == offering_id, TempleOffering.is_active == True).first()  # noqa: E712
    if not offering:
        raise HTTPException(status_code=404, detail="Offering not found")
    return offering


def _prasad_fee(offering: TempleOffering) -> float:
    return offering.delivery_fee if offering.delivery_fee is not None else PRASAD_FEE


def _check_priest(db: Session, priest_id: Optional[str], offering: TempleOffering) -> Optional[str]:
    if not priest_id:
        return None
    priest = db.query(Priest).filter(Priest.id == priest_id, Priest.is_active == True).first()  # noqa: E712
    if not priest or (priest.temple_id and priest.temple_id != offering.temple_id):
        raise HTTPException(status_code=404, detail="Priest not found for this temple")
    return priest.id


# ----------------- Catalog -----------------

@router.get("/temples")
def get_temples(
    category: Optional[str] = None,
    city: Optional[str] = None,
    lang: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Returns all sacred temples along with their offering types and live status."""
    seed_temples_if_empty(db)
    query = db.query(Temple).filter(Temple.is_active == True)  # noqa: E712
    if city:
        query = query.filter(Temple.city.ilike(f"%{city}%"))

    results = []
    for t in query.all():
        offerings_data = [_offering_dict(o, lang) for o in t.offerings if o.is_active]
        min_price = min([o["price"] for o in offerings_data]) if offerings_data else 51.0
        fields = _temple_fields(t, lang)
        results.append({
            "id": t.id,
            "name": fields["name"],
            "slug": t.slug,
            "deity": fields["deity"],
            "city": fields["city"],
            "state": fields["state"],
            "description": fields["description"],
            "history_significance": t.history_significance,
            "image_url": t.image_url,
            "banner_url": t.banner_url,
            "live_status": t.live_status,
            "has_live": bool(t.live_url),
            "starting_price": min_price,
            "offerings": offerings_data,
        })
    return {"temples": results, "total": len(results)}


@router.get("/temples/{temple_id_or_slug}")
def get_temple_details(temple_id_or_slug: str, lang: Optional[str] = None, db: Session = Depends(get_db)):
    """Full temple page data: sevas, verified priests, live darshan link, aarti timings and packages."""
    seed_temples_if_empty(db)
    seed_packages_and_coupons(db)
    temple = db.query(Temple).filter(
        (Temple.id == temple_id_or_slug) | (Temple.slug == temple_id_or_slug)
    ).first()
    if not temple:
        raise HTTPException(status_code=404, detail="Temple not found")
    fields = _temple_fields(temple, lang)
    english = catalog_i18n.is_en(lang)
    offering_ids = [o.id for o in temple.offerings]
    packages = db.query(SevaPackage).filter(SevaPackage.offering_id.in_(offering_ids), SevaPackage.is_active == True).all() if offering_ids else []  # noqa: E712
    priests = db.query(Priest).filter(Priest.is_active == True, (Priest.temple_id == temple.id) | (Priest.temple_id == None)).all()  # noqa: E711,E712
    return {
        "id": temple.id,
        "name": fields["name"],
        "slug": temple.slug,
        "deity": fields["deity"],
        "city": fields["city"],
        "state": fields["state"],
        "description": fields["description"],
        "history_significance": temple.history_significance,
        "image_url": temple.image_url,
        "banner_url": temple.banner_url,
        "live_status": temple.live_status,
        "live_url": temple.live_url,
        "aarti_timings": _aarti(temple),
        "priests": [_priest_dict(p, lang) for p in priests],
        "packages": [_package_dict(pk, english) for pk in packages],
        "offerings": [_offering_dict(o, lang) for o in temple.offerings if o.is_active],
    }


def _package_dict(pk: SevaPackage, english: bool) -> Dict[str, Any]:
    o = pk.offering
    base = (o.price if o else 0.0) * pk.sessions
    price = round(base * (100 - (pk.discount_percent or 0)) / 100.0, 2)
    temple = o.temple if o else None
    return {
        "slug": pk.slug,
        "title": pk.title_en if english else pk.title,
        "description": pk.description_en if english else pk.description,
        "sessions": pk.sessions,
        "cadence": pk.cadence,
        "weekday": pk.weekday,
        "discount_percent": pk.discount_percent,
        "price_per_session": o.price if o else None,
        "list_price": round(base, 2),
        "price": price,
        "offering_id": pk.offering_id,
        "temple_slug": temple.slug if temple else None,
        "temple_name": temple.name if temple else None,
        "image_url": temple.image_url if temple else None,
    }


@router.get("/packages")
def list_packages(lang: Optional[str] = None, db: Session = Depends(get_db)):
    seed_temples_if_empty(db)
    seed_packages_and_coupons(db)
    rows = db.query(SevaPackage).filter(SevaPackage.is_active == True).all()  # noqa: E712
    english = catalog_i18n.is_en(lang)
    out = []
    for pk in rows:
        d = _package_dict(pk, english)
        if english and pk.offering and pk.offering.temple:
            d["temple_name"] = _temple_fields(pk.offering.temple, lang)["name"]
        out.append(d)
    return {"packages": out, "total": len(out)}


# ----------------- Booking -----------------

def _quote(db: Session, user: User, offering: TempleOffering, include_prasad: bool, coupon_code: Optional[str], use_points: int) -> Dict[str, Any]:
    if include_prasad and not offering.has_prasad_delivery:
        raise HTTPException(status_code=400, detail="Prasad delivery is not available for this offering")
    fee = _prasad_fee(offering) if include_prasad else 0.0
    totals = compute_totals(db, user, "seva", offering.price, coupon_code, use_points, delivery_fee=fee)
    return totals


def _public_totals(t: Dict[str, Any]) -> Dict[str, Any]:
    return {k: v for k, v in t.items() if k != "coupon"}


@router.post("/chadawa/quote")
def quote_chadawa(req: QuoteRequest, db: Session = Depends(get_db), user: User = Depends(get_current_user_required)):
    """Price preview with coupon, loyalty points and membership benefits applied."""
    offering = _offering_or_404(db, req.offering_id)
    return _public_totals(_quote(db, user, offering, req.include_prasad, req.coupon_code, req.use_points))


@router.post("/chadawa/book")
def book_chadawa(
    req: ChadawaBookingRequest,
    lang: Optional[str] = None,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user_required)
):
    """Books a chadawa / sankalp pooja. Requires sign-in; charges the wallet and saves the booking."""
    offering = _offering_or_404(db, req.offering_id)
    if req.include_prasad and not (req.delivery_address and len(req.delivery_address.strip()) >= 8):
        raise HTTPException(status_code=400, detail="Delivery address is required for prasad delivery")
    priest_id = _check_priest(db, req.priest_id, offering)
    temple = offering.temple
    booking_num = f"SANKALP-{datetime.now(timezone.utc).strftime('%Y%m%d')}-{random.randint(100000, 999999)}"

    try:
        totals = _quote(db, user, offering, req.include_prasad, req.coupon_code, req.use_points)
        method, ref = ("WALLET", f"SEVA_{generate_uuid()[:8].upper()}")
        if totals["total"] > 0:
            method, ref = charge_wallet(db, user.id, totals["total"], f"Mandir Seva: {offering.title} ({temple.name if temple else ''})", "SEVA")
        booking = ChadawaBooking(
            user_id=user.id, owner_key=f"u:{user.id}", offering_id=offering.id, booking_number=booking_num,
            devotee_name=req.devotee_name.strip(), devotee_phone=req.devotee_phone, gotra=(req.gotra or "कश्यप").strip(),
            rashi=req.rashi, nakshatra=req.nakshatra, sankalp_purpose=req.sankalp_purpose,
            family_members=(req.family_members or "").strip() or None, include_prasad=req.include_prasad,
            delivery_address=req.delivery_address if req.include_prasad else None, amount_paid=totals["total"],
            discount_amount=round(totals["member_discount"] + totals["coupon_discount"] + totals["points_value"], 2),
            points_used=totals["points_used"], coupon_code=totals["coupon_code"], payment_method=method, payment_ref=ref,
            status="PAID", priest_id=priest_id, certificate_code=_new_certificate_code(),
        )
        db.add(booking)
        db.flush()
        apply_totals(db, user, totals, booking_num, "seva")
        record_event(db, "booking", booking.id, "PAID", f"Paid ₹{totals['total']:.0f}")
        notify(db, f"u:{user.id}", "booking_confirmed", "/mandir-seva", ref=booking_num, title=offering.title)
        db.commit()
        db.refresh(booking)
    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Booking could not be saved: {e}")

    return {"success": True, "booking": _booking_dict(booking, lang, db), "totals": _public_totals(totals)}


@router.get("/chadawa/my-bookings")
def get_my_chadawa_bookings(
    lang: Optional[str] = None,
    db: Session = Depends(get_db),
    owner: Optional[Owner] = Depends(optional_owner)
):
    """Bookings of the signed-in user (empty list when not signed in)."""
    if owner is None or owner.is_guest:
        return {"bookings": [], "total": 0}
    bookings = (db.query(ChadawaBooking).filter(ChadawaBooking.owner_key == owner.key)
                .order_by(ChadawaBooking.created_at.desc()).limit(100).all())
    results = [_booking_dict(b, lang, db) for b in bookings]
    return {"bookings": results, "total": len(results)}


def _own_booking(db: Session, booking_id: str, user: User) -> ChadawaBooking:
    booking = db.query(ChadawaBooking).filter(ChadawaBooking.id == booking_id, ChadawaBooking.owner_key == f"u:{user.id}").first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    return booking


@router.get("/chadawa/{booking_id}/timeline")
def booking_timeline(booking_id: str, db: Session = Depends(get_db), user: User = Depends(get_current_user_required)):
    booking = _own_booking(db, booking_id, user) if user.role != "admin" else db.query(ChadawaBooking).filter(ChadawaBooking.id == booking_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    rows = (db.query(StatusEvent).filter(StatusEvent.kind == "booking", StatusEvent.ref_id == booking.id)
            .order_by(StatusEvent.created_at.asc()).all())
    return {"events": [{"status": e.status, "note": e.note, "time": e.created_at.isoformat() if e.created_at else None} for e in rows]}


@router.post("/chadawa/{booking_id}/cancel")
def cancel_my_booking(
    booking_id: str,
    lang: Optional[str] = None,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user_required)
):
    """Cancels a booking that has not been scheduled yet; refunds the wallet and any points used."""
    booking = _own_booking(db, booking_id, user)
    if booking.status != "PAID":
        raise HTTPException(status_code=409, detail="Booking can no longer be cancelled")
    booking.status = "CANCELLED"
    if booking.payment_method == "WALLET" and booking.amount_paid:
        refund_wallet(db, booking.user_id, booking.amount_paid, f"Refund {booking.booking_number}")
    refund_points(db, booking.user_id, booking.points_used or 0, booking.booking_number)
    record_event(db, "booking", booking.id, "CANCELLED", "Cancelled by the devotee")
    notify(db, booking.owner_key, "booking_cancelled", "/mandir-seva", ref=booking.booking_number)
    db.commit()
    return {"success": True, "booking": _booking_dict(booking, lang, db)}


# ----------------- Seva certificate -----------------

@router.get("/chadawa/{booking_id}/certificate")
def seva_certificate(
    booking_id: str,
    request: Request,
    lang: Optional[str] = None,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user_required)
):
    """PDF certificate for a completed sankalp (owner or admin)."""
    booking = db.query(ChadawaBooking).filter(ChadawaBooking.id == booking_id).first()
    if not booking or (user.role != "admin" and booking.owner_key != f"u:{user.id}"):
        raise HTTPException(status_code=404, detail="Booking not found")
    if booking.status != "COMPLETED" or not booking.certificate_code:
        raise HTTPException(status_code=409, detail="The certificate is available once the sankalp is completed")
    offering = booking.offering
    temple = offering.temple if offering else None
    hindi = _is_hi(lang)
    when = booking.completed_at or booking.created_at
    date_text = booking.scheduled_for or (when.strftime("%d %B %Y") if when else "")
    tithi = None
    try:
        from packages.astrology.panchang import calculate_panchang
        day = (booking.scheduled_for or when.strftime("%Y-%m-%d"))[:10]
        p = calculate_panchang(dt_str=day)
        t = p.get("tithi") or {}
        raw = f"{t.get('name', '')} ({t.get('paksha', '')})".strip()
        tithi = _pick_script(raw, hindi)
    except Exception:
        tithi = None
    verify_url = f"{str(request.base_url).rstrip('/')}/verify/{booking.certificate_code}"
    pdf = seva_certificate_pdf(
        lang="hi" if hindi else "en", yajman=booking.devotee_name, gotra=booking.gotra or "-", family=booking.family_members,
        temple=_temple_fields(temple, lang)["name"] if temple else "-", seva=_offering_dict(offering, lang)["title"] if offering else "-",
        date_text=date_text, tithi=tithi, booking_number=booking.booking_number, code=booking.certificate_code,
        purpose=(booking.sankalp_purpose if hindi else catalog_i18n.PURPOSES_EN.get(booking.sankalp_purpose, booking.sankalp_purpose)),
        verify_url=verify_url)
    return Response(content=pdf, media_type="application/pdf",
                    headers={"Content-Disposition": f'attachment; filename="{booking.booking_number}-certificate.pdf"'})


def _pick_script(text: str, hindi: bool) -> str:
    """'Dwitiya (द्वितीया) (Krishna Paksha (कृष्ण पक्ष))' -> the Hindi or English part only."""
    import re
    parts = re.findall(r"([^()]+?)\s*\(([^()]*)\)", text)
    if not parts:
        return text
    return " ".join((hi if (hindi and re.search(r"[ऀ-ॿ]", hi)) else en).strip() for en, hi in parts)


# ----------------- Packages -----------------

def _add_months(d: date, n: int) -> date:
    month = d.month - 1 + n
    year = d.year + month // 12
    month = month % 12 + 1
    return date(year, month, min(d.day, calendar.monthrange(year, month)[1]))


def _session_dates(pk: SevaPackage, start: date) -> List[date]:
    if pk.cadence == "daily":
        return [start + timedelta(days=i) for i in range(pk.sessions)]
    if pk.cadence == "monthly":
        return [_add_months(start, i) for i in range(pk.sessions)]
    first = start + timedelta(days=((pk.weekday or 0) - start.weekday()) % 7)
    return [first + timedelta(days=7 * i) for i in range(pk.sessions)]


@router.post("/packages/{slug}/buy")
def buy_package(
    slug: str,
    req: PackageBuyRequest,
    lang: Optional[str] = None,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user_required)
):
    """Buys every session of a package up front; each session becomes a scheduled booking on its date."""
    pk = db.query(SevaPackage).filter(SevaPackage.slug == slug, SevaPackage.is_active == True).first()  # noqa: E712
    if not pk or not pk.offering:
        raise HTTPException(status_code=404, detail="Package not found")
    try:
        start = datetime.strptime(req.start_date, "%Y-%m-%d").date()
    except ValueError:
        raise HTTPException(status_code=400, detail="Start date must be YYYY-MM-DD")
    if start < datetime.now(timezone.utc).date():
        raise HTTPException(status_code=400, detail="Start date cannot be in the past")
    dates = _session_dates(pk, start)
    offering = pk.offering
    pkg_price = round(offering.price * pk.sessions * (100 - (pk.discount_percent or 0)) / 100.0, 2)
    group = f"PKG-{generate_uuid()[:8].upper()}"

    try:
        totals = compute_totals(db, user, "seva", pkg_price, req.coupon_code, req.use_points)
        method, ref = ("WALLET", f"PKG_{generate_uuid()[:8].upper()}")
        if totals["total"] > 0:
            method, ref = charge_wallet(db, user.id, totals["total"], f"Package: {pk.title_en}", "PKG")
        per_session = round(totals["total"] / pk.sessions, 2)
        created = []
        for i, d in enumerate(dates):
            number = f"SANKALP-{datetime.now(timezone.utc).strftime('%Y%m%d')}-{random.randint(100000, 999999)}"
            b = ChadawaBooking(
                user_id=user.id, owner_key=f"u:{user.id}", offering_id=offering.id, booking_number=number,
                devotee_name=req.devotee_name.strip(), devotee_phone=req.devotee_phone, gotra=(req.gotra or "कश्यप").strip(),
                sankalp_purpose=req.sankalp_purpose, family_members=(req.family_members or "").strip() or None,
                amount_paid=per_session if i < pk.sessions - 1 else round(totals["total"] - per_session * (pk.sessions - 1), 2),
                discount_amount=round((pkg_price / pk.sessions) - per_session, 2) if pkg_price else 0.0,
                points_used=totals["points_used"] if i == 0 else 0, coupon_code=totals["coupon_code"] if i == 0 else None,
                payment_method=method, payment_ref=ref, status="SANKALP_SCHEDULED", scheduled_for=d.isoformat(),
                package_ref=group, certificate_code=_new_certificate_code())
            db.add(b)
            db.flush()
            record_event(db, "booking", b.id, "PAID", f"Package {pk.title_en} - session {i + 1}/{pk.sessions}")
            record_event(db, "booking", b.id, "SANKALP_SCHEDULED", d.isoformat())
            created.append(b)
        apply_totals(db, user, totals, group, "seva")
        notify(db, f"u:{user.id}", "booking_confirmed", "/mandir-seva", ref=group, title=offering.title)
        db.commit()
    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Package could not be saved: {e}")
    return {"success": True, "package_ref": group, "bookings": [_booking_dict(b, lang, db) for b in created], "totals": _public_totals(totals)}


# ----------------- Reminders (birthdays / anniversaries) -----------------

@router.get("/reminders")
def list_reminders(db: Session = Depends(get_db), user: User = Depends(get_current_user_required)):
    rows = db.query(Reminder).filter(Reminder.user_id == user.id).order_by(Reminder.month, Reminder.day).all()
    return {"reminders": [{"id": r.id, "person_name": r.person_name, "kind": r.kind, "month": r.month, "day": r.day} for r in rows]}


@router.post("/reminders")
def add_reminder(req: ReminderRequest, db: Session = Depends(get_db), user: User = Depends(get_current_user_required)):
    if req.kind not in ("birthday", "anniversary"):
        raise HTTPException(status_code=400, detail="Kind must be birthday or anniversary")
    try:
        date(2024, req.month, req.day)
    except ValueError:
        raise HTTPException(status_code=400, detail="That date does not exist")
    if db.query(Reminder).filter(Reminder.user_id == user.id).count() >= 30:
        raise HTTPException(status_code=400, detail="You can save up to 30 reminders")
    r = Reminder(user_id=user.id, person_name=req.person_name.strip(), kind=req.kind, month=req.month, day=req.day)
    db.add(r)
    db.commit()
    return {"success": True, "id": r.id}


@router.delete("/reminders/{reminder_id}")
def delete_reminder(reminder_id: str, db: Session = Depends(get_db), user: User = Depends(get_current_user_required)):
    r = db.query(Reminder).filter(Reminder.id == reminder_id, Reminder.user_id == user.id).first()
    if not r:
        raise HTTPException(status_code=404, detail="Reminder not found")
    db.delete(r)
    db.commit()
    return {"success": True}


def send_due_reminders(db: Session, today: Optional[date] = None, window_days: int = 7) -> int:
    """Notifies users about birthdays/anniversaries coming up within `window_days` (once per year per reminder)."""
    today = today or datetime.now(timezone.utc).date()
    sent = 0
    for r in db.query(Reminder).all():
        try:
            nxt = date(today.year, r.month, r.day)
        except ValueError:
            continue
        if nxt < today:
            try:
                nxt = date(today.year + 1, r.month, r.day)
            except ValueError:
                continue
        if (nxt - today).days <= window_days and r.last_notified_year != nxt.year:
            notify(db, f"u:{r.user_id}", "reminder_due", "/mandir-seva", name=r.person_name, occasion=r.kind, when=nxt.strftime("%d %b"))
            r.last_notified_year = nxt.year
            sent += 1
    db.commit()
    return sent


# ----------------- Admin: bookings, proof upload -----------------
UPLOAD_DIR = Path(__file__).resolve().parents[4] / "storage" / "uploads" / "proofs"
ALLOWED_VIDEO_EXT = {".mp4", ".webm", ".mov"}
MAX_VIDEO_BYTES = 50 * 1024 * 1024


def _complete_booking(db: Session, booking: ChadawaBooking) -> None:
    """Loyalty points and referral bonus are earned when the sankalp is completed."""
    booking.completed_at = datetime.now(timezone.utc)
    member = active_membership(db, booking.user_id)
    award_points(db, booking.user_id, int((booking.amount_paid or 0) // EARN_PER_RUPEES) * (2 if member else 1), "seva", booking.booking_number)
    user = db.query(User).filter(User.id == booking.user_id).first() if booking.user_id else None
    if user:
        maybe_reward_referral(db, user, booking.booking_number)


@router.patch("/admin/bookings/{booking_id}")
def admin_update_booking(
    booking_id: str,
    req: BookingStatusUpdate,
    db: Session = Depends(get_db),
    _admin: User = Depends(require_admin)
):
    """Pandit/admin moves a booking through the seva flow and attaches the sankalp video."""
    booking = db.query(ChadawaBooking).filter(ChadawaBooking.id == booking_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    status = req.status.upper()
    if status not in BOOKING_FLOW:
        raise HTTPException(status_code=400, detail=f"Status must be one of {BOOKING_FLOW}")
    if booking.status == "CANCELLED":
        raise HTTPException(status_code=409, detail="Booking is cancelled")
    if status == "VIDEO_UPLOADED" and not (req.video_proof_url or booking.video_proof_url):
        raise HTTPException(status_code=400, detail="video_proof_url is required for VIDEO_UPLOADED")
    was_completed = booking.status == "COMPLETED"
    booking.status = status
    if req.scheduled_for:
        booking.scheduled_for = req.scheduled_for
    if req.video_proof_url:
        booking.video_proof_url = req.video_proof_url
        booking.video_recorded_at = datetime.now(timezone.utc)
    if req.prasad_tracking_id:
        booking.prasad_tracking_id = req.prasad_tracking_id
    if req.priest_id:
        booking.priest_id = _check_priest(db, req.priest_id, booking.offering)
    if not booking.certificate_code:
        booking.certificate_code = _new_certificate_code()
    kinds = {"SANKALP_SCHEDULED": "booking_scheduled", "VIDEO_UPLOADED": "booking_video", "COMPLETED": "booking_completed"}
    if status in kinds:
        notify(db, booking.owner_key, kinds[status], "/mandir-seva", ref=booking.booking_number, when=booking.scheduled_for or "")
    record_event(db, "booking", booking.id, status, booking.scheduled_for or "")
    if status == "COMPLETED" and not was_completed:
        _complete_booking(db, booking)
    db.commit()
    return {"success": True, "booking": _booking_dict(booking, "en", db)}


@router.get("/admin/bookings")
def admin_list_bookings(
    status: Optional[str] = None,
    lang: Optional[str] = None,
    db: Session = Depends(get_db),
    _admin: User = Depends(require_admin)
):
    """All bookings (newest first) with the devotee contact and prasad delivery details."""
    query = db.query(ChadawaBooking)
    if status and status.upper() != "ALL":
        query = query.filter(ChadawaBooking.status == status.upper())
    rows = []
    for b in query.order_by(ChadawaBooking.created_at.desc()).limit(200).all():
        rows.append(dict(_booking_dict(b, lang, db), devotee_phone=b.devotee_phone, rashi=b.rashi,
                         delivery_address=b.delivery_address, payment_ref=b.payment_ref))
    return {"bookings": rows, "total": len(rows)}


@router.post("/admin/upload-video")
async def admin_upload_video(
    file: UploadFile = File(...),
    _admin: User = Depends(require_admin)
):
    """Stores a sankalp video and returns its URL, to be attached via PATCH /admin/bookings/{id}."""
    ext = Path(file.filename or "").suffix.lower()
    if ext not in ALLOWED_VIDEO_EXT or not (file.content_type or "").startswith("video/"):
        raise HTTPException(status_code=400, detail="Upload an mp4, webm or mov video")
    data = await file.read(MAX_VIDEO_BYTES + 1)
    if len(data) > MAX_VIDEO_BYTES:
        raise HTTPException(status_code=413, detail="Video must be 50 MB or smaller")
    UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
    name = f"{generate_uuid()}{ext}"
    (UPLOAD_DIR / name).write_bytes(data)
    return {"url": f"/uploads/proofs/{name}", "size": len(data)}


# ----------------- Today's seva & kundli based suggestions -----------------

def _temple_brief(db: Session, slug: str, lang: Optional[str] = None) -> Optional[Dict[str, Any]]:
    t = db.query(Temple).filter(Temple.slug == slug).first()
    if not t:
        return None
    offers = [o.price for o in t.offerings if o.is_active]
    return {"slug": t.slug, "name": _temple_fields(t, lang)["name"], "image_url": t.image_url,
            "starting_price": min(offers) if offers else None}


@router.get("/today")
def todays_seva(lang: Optional[str] = None, db: Session = Depends(get_db)):
    """Today's weekday deity and, when it is a special tithi, the matching seva (from the live panchang)."""
    seed_temples_if_empty(db)
    from packages.astrology.panchang import calculate_panchang
    english = catalog_i18n.is_en(lang)
    try:
        panchang = calculate_panchang()
    except Exception:
        panchang = {}
    vaar = (panchang.get("vaar") or datetime.now().strftime("%A")).split()[0]
    if vaar not in WEEKDAY_SEVA:
        vaar = datetime.now().strftime("%A")
    deity_hi, deity_en, slug = WEEKDAY_SEVA[vaar]
    tithi = panchang.get("tithi") or {}
    special = tithi_special(tithi.get("name", ""), english)
    return {
        "date": panchang.get("formatted_date"),
        "date_iso": panchang.get("date"),
        "weekday": vaar,
        "weekday_deity": deity_en if english else deity_hi,
        "weekday_temple": _temple_brief(db, slug, lang),
        "tithi": {"name": tithi.get("name"), "paksha": tithi.get("paksha")} if tithi else None,
        "special": dict(special, temple=_temple_brief(db, special["temple"], lang)) if special else None,
    }


@router.get("/suggestions")
def kundli_temple_suggestion(
    lang: Optional[str] = None,
    db: Session = Depends(get_db),
    owner: Optional[Owner] = Depends(optional_owner)
):
    """Temple and deity for the rashi lord of the visitor's saved kundli (traditional guidance)."""
    chart = None
    if owner is not None:
        chart = (db.query(BirthChart).filter(BirthChart.owner_key == owner.key)
                 .order_by(BirthChart.is_default.desc(), BirthChart.created_at.desc()).first())
    sign = normalize_sign((chart.chart_data or {}).get("moon_sign")) if chart else None
    if not sign:
        return {"has_chart": False, "suggestion": None, "temple": None}
    remedy = remedy_for_sign(sign)
    return {"has_chart": True, "chart_name": chart.name, "suggestion": remedy,
            "temple": _temple_brief(db, remedy["temple"], lang)}
