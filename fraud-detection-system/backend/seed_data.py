
import sys, os, datetime, hashlib, json
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from app import app
from database.models import db, Transaction, Case, Alert, Evidence, ATMIncident

with app.app_context():
    print("Clearing old data...")
    db.session.query(Transaction).delete()
    db.session.query(Case).delete()
    db.session.query(Alert).delete()
    db.session.query(Evidence).delete()
    db.session.query(ATMIncident).delete()
    db.session.commit()

    now = datetime.datetime.utcnow()
    txns = [
        dict(amount=8500,  time_of_day=0,  transaction_type=2, merchant_category=5, distance_from_home=1200, num_transactions_today=7,  avg_amount_last_7d=150, is_foreign=1, new_device=0, is_bot_pattern=0, identity_risk=0, channel_risk=0, fraud_probability=0.98, is_fraud=True,  risk_level="CRITICAL", fraud_category="Payment Fraud",        fraud_detail="ATM fraud midnight 1200km from home",       ip_address="185.220.101.45", hours_ago=33),
        dict(amount=300,   time_of_day=2,  transaction_type=4, merchant_category=6, distance_from_home=900,  num_transactions_today=12, avg_amount_last_7d=80,  is_foreign=1, new_device=1, is_bot_pattern=1, identity_risk=0, channel_risk=1, fraud_probability=0.97, is_fraud=True,  risk_level="CRITICAL", fraud_category="AI-Driven Threat",     fraud_detail="Bot attack credential stuffing 12tx/hr",    ip_address="185.220.101.12", hours_ago=30),
        dict(amount=500,   time_of_day=10, transaction_type=4, merchant_category=6, distance_from_home=5,    num_transactions_today=8,  avg_amount_last_7d=200, is_foreign=0, new_device=1, is_bot_pattern=0, identity_risk=1, channel_risk=2, fraud_probability=0.95, is_fraud=True,  risk_level="CRITICAL", fraud_category="Digital Banking Fraud",fraud_detail="Account takeover new device SIM swap",      ip_address="91.108.4.22",   hours_ago=27),
        dict(amount=25000, time_of_day=2,  transaction_type=3, merchant_category=8, distance_from_home=5,    num_transactions_today=2,  avg_amount_last_7d=500, is_foreign=0, new_device=0, is_bot_pattern=0, identity_risk=0, channel_risk=0, fraud_probability=0.91, is_fraud=True,  risk_level="CRITICAL", fraud_category="Transfer Fraud",       fraud_detail="Cross-border wire transfer laundering",     ip_address="195.206.105.3", hours_ago=24),
        dict(amount=1200,  time_of_day=14, transaction_type=4, merchant_category=6, distance_from_home=2,    num_transactions_today=2,  avg_amount_last_7d=300, is_foreign=0, new_device=1, is_bot_pattern=0, identity_risk=2, channel_risk=0, fraud_probability=0.89, is_fraud=True,  risk_level="HIGH",     fraud_category="Identity Fraud",       fraud_detail="Synthetic identity deepfake indicators",    ip_address="89.234.157.4",  hours_ago=21),
        dict(amount=2400,  time_of_day=3,  transaction_type=4, merchant_category=6, distance_from_home=850,  num_transactions_today=4,  avg_amount_last_7d=100, is_foreign=1, new_device=1, is_bot_pattern=0, identity_risk=0, channel_risk=0, fraud_probability=0.92, is_fraud=True,  risk_level="HIGH",     fraud_category="Payment Fraud",        fraud_detail="Card-not-present cross-border transaction", ip_address="194.165.16.8",  hours_ago=18),
        dict(amount=45,    time_of_day=14, transaction_type=0, merchant_category=0, distance_from_home=2,    num_transactions_today=1,  avg_amount_last_7d=50,  is_foreign=0, new_device=0, is_bot_pattern=0, identity_risk=0, channel_risk=0, fraud_probability=0.04, is_fraud=False, risk_level="LOW",      fraud_category="None",                 fraud_detail="Normal domestic transaction",               ip_address="102.176.45.12", hours_ago=15),
        dict(amount=120,   time_of_day=12, transaction_type=0, merchant_category=2, distance_from_home=5,    num_transactions_today=2,  avg_amount_last_7d=100, is_foreign=0, new_device=0, is_bot_pattern=0, identity_risk=0, channel_risk=0, fraud_probability=0.06, is_fraud=False, risk_level="LOW",      fraud_category="None",                 fraud_detail="Normal restaurant payment",                 ip_address="102.176.45.12", hours_ago=12),
        dict(amount=350,   time_of_day=17, transaction_type=0, merchant_category=3, distance_from_home=8,    num_transactions_today=3,  avg_amount_last_7d=200, is_foreign=0, new_device=0, is_bot_pattern=0, identity_risk=0, channel_risk=0, fraud_probability=0.08, is_fraud=False, risk_level="LOW",      fraud_category="None",                 fraud_detail="Electronics purchase normal range",          ip_address="41.21.34.56",   hours_ago=9),
        dict(amount=85,    time_of_day=9,  transaction_type=0, merchant_category=1, distance_from_home=3,    num_transactions_today=1,  avg_amount_last_7d=90,  is_foreign=0, new_device=0, is_bot_pattern=0, identity_risk=0, channel_risk=0, fraud_probability=0.03, is_fraud=False, risk_level="LOW",      fraud_category="None",                 fraud_detail="Gas station normal amount",                 ip_address="41.21.34.56",   hours_ago=6),
        dict(amount=250,   time_of_day=15, transaction_type=0, merchant_category=7, distance_from_home=12,   num_transactions_today=2,  avg_amount_last_7d=180, is_foreign=0, new_device=0, is_bot_pattern=0, identity_risk=0, channel_risk=0, fraud_probability=0.05, is_fraud=False, risk_level="LOW",      fraud_category="None",                 fraud_detail="Healthcare payment normal",                 ip_address="196.11.45.23",  hours_ago=3),
    ]
    for s in txns:
        h = s.pop("hours_ago")
        t = Transaction(user_id="admin", device_fingerprint=hashlib.md5(s["ip_address"].encode()).hexdigest()[:16], created_at=now-datetime.timedelta(hours=h), **s)
        db.session.add(t)
    db.session.commit()
    print("Transactions seeded:", Transaction.query.count())

    cases = [
        ("CASE-A1B2C3","ATM Fraud Ring - OR Tambo Airport","Payment Fraud","CRITICAL","OPEN",8500,"Card skimmer on ATM-JHB-002. Multiple victims. SAPS case opened."),
        ("CASE-D4E5F6","Bot Attack - Credential Stuffing","AI-Driven Threat","HIGH","OPEN",3600,"Automated bot from Tor exit node. 12 tx/hour."),
        ("CASE-G7H8I9","Account Takeover - SIM Swap","Digital Banking Fraud","CRITICAL","INVESTIGATING",500,"Victim SIM swapped. Account drained via online transfer."),
        ("CASE-J1K2L3","Cross-border Wire Fraud R25000","Transfer Fraud","HIGH","OPEN",25000,"Large wire to offshore account at 2AM. SWIFT recall initiated."),
    ]
    for ref,title,cat,sev,status,amt,desc in cases:
        tl = json.dumps([{"ts":now.isoformat(),"event":"Case opened","user":"admin"}])
        c = Case(case_ref=ref,title=title,category=cat,severity=sev,status=status,amount=amt,description=desc,assigned_to="admin",timeline=tl)
        db.session.add(c)
    db.session.commit()
    print("Cases seeded:", Case.query.count())

    alerts = [
        ("FRAUD_DETECTED","CRITICAL","ATM fraud: R8500 at OR Tambo 1200km from home",8500,"Payment Fraud"),
        ("BOT_ATTACK","CRITICAL","Bot attack: 12 tx/hr from Tor 185.220.101.12",0,"AI-Driven Threat"),
        ("ACCOUNT_TAKEOVER","CRITICAL","SIM swap + new device + MFA bypass detected",500,"Digital Banking Fraud"),
        ("ATM_TAMPER","CRITICAL","Card skimmer on ATM-CPT-002 Cape Town CBD",0,"ATM Forensics"),
        ("WIRE_FRAUD","HIGH","Suspicious wire R25000 at 02:00 AM offshore",25000,"Transfer Fraud"),
        ("SYNTHETIC_ID","HIGH","Deepfake identity indicators on new account",1200,"Identity Fraud"),
    ]
    for type_,sev,msg,amt,cat in alerts:
        a = Alert(type=type_,severity=sev,message=msg,amount=amt,category=cat,source="ML_ENGINE",acknowledged=False)
        db.session.add(a)
    db.session.commit()
    print("Alerts seeded:", Alert.query.count())

    evs = [
        ("EVD-001A2B","CASE-A1B2C3","DEVICE_FINGERPRINT","ATM skimmer device fingerprint from internal sensor"),
        ("EVD-002C3D4","CASE-A1B2C3","CCTV_METADATA","CCTV: suspect at ATM-CPT-002 at 02:14 AM"),
        ("EVD-003E5F6","CASE-D4E5F6","NETWORK_LOG","Tor node 185.220.101.12 - 47 attempts in 4 minutes"),
        ("EVD-004G7H8","CASE-G7H8I9","AUTHENTICATION_LOG","OTP intercepted via SIM swap - Vodacom confirms"),
    ]
    for i,(ref,cid,type_,desc) in enumerate(evs):
        dh = hashlib.sha256(f"{ref}{desc}".encode()).hexdigest()
        ch = hashlib.sha256(f"{i}{dh}".encode()).hexdigest()
        e = Evidence(evidence_ref=ref,case_id=cid,type=type_,description=desc,data_hash=dh,chain_hash=ch,collected_by="admin",verified=True)
        db.session.add(e)
    db.session.commit()
    print("Evidence seeded:", Evidence.query.count())

    for atm_id,loc,type_,sev,desc,score in [
        ("ATM-CPT-002","Cape Town CBD","CARD_SKIMMER","CRITICAL","Skimmer overlay +3.2mm",97),
        ("ATM-JHB-002","OR Tambo Airport","HIDDEN_CAMERA","HIGH","Micro-camera above PIN pad",89),
    ]:
        a = ATMIncident(atm_id=atm_id,location=loc,type=type_,severity=sev,description=desc,threat_score=score,status="OPEN")
        db.session.add(a)
    db.session.commit()
    print("ATM incidents seeded:", ATMIncident.query.count())
    print("DONE! Real data seeded successfully.")
