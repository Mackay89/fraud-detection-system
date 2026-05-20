import sys,os
sys.path.insert(0,os.path.dirname(os.path.abspath(__file__)))
from fraud_model_class import FraudModel
import numpy as np,pickle

def auc_score(yt,ys):
    yt=np.array(yt);ys=np.array(ys)
    d=np.argsort(ys)[::-1];yt=yt[d]
    np2=yt.sum();nn=len(yt)-np2
    if np2==0 or nn==0:return 0.5
    return float(np.trapezoid(np.cumsum(yt)/np2,np.cumsum(1-yt)/nn))

if __name__=="__main__":
    np.random.seed(42)
    N=100000;FR=0.08;nf=int(N*FR);nl=N-nf
    print("[1/4] Generating extended fraud dataset...")
    lp=np.array([.01,.01,.01,.01,.01,.02,.04,.06,.07,.07,.07,.07,.07,.07,.07,.06,.06,.06,.05,.04,.04,.03,.02,.01]);lp/=lp.sum()
    fp=np.array([.08,.09,.10,.09,.08,.07,.05,.04,.04,.04,.04,.04,.04,.04,.04,.04,.03,.03,.03,.03,.03,.03,.03,.03]);fp/=fp.sum()
    # Legit: 12 features
    L=np.column_stack([
        np.random.lognormal(4.5,1.2,nl),
        np.random.choice(24,nl,p=lp),
        np.random.choice(5,nl,p=[.35,.30,.15,.12,.08]),
        np.random.choice(9,nl,p=[.25,.12,.18,.08,.07,.05,.12,.08,.05]),
        np.abs(np.random.normal(8,15,nl)),
        np.random.poisson(2.5,nl).astype(float),
        np.random.lognormal(4.2,0.9,nl),
        np.random.choice(2,nl,p=[.93,.07]).astype(float),
        np.random.choice(2,nl,p=[.97,.03]).astype(float),
        np.zeros(nl),
        np.random.choice(3,nl,p=[.90,.07,.03]).astype(float),
        np.random.choice(4,nl,p=[.70,.15,.10,.05]).astype(float),
        np.zeros(nl)
    ])
    # Fraud: 12 features
    amt=np.where(np.random.random(nf)<0.4,np.random.lognormal(7.5,0.8,nf),np.random.lognormal(3.0,2.0,nf))
    F=np.column_stack([
        amt,
        np.random.choice(24,nf,p=fp),
        np.random.choice(5,nf,p=[.10,.10,.30,.35,.15]),
        np.random.choice(9,nf,p=[.05,.05,.05,.20,.15,.25,.15,.05,.05]),
        np.abs(np.random.normal(400,600,nf)),
        np.random.poisson(8,nf).astype(float),
        np.random.lognormal(3.8,0.8,nf),
        np.random.choice(2,nf,p=[.40,.60]).astype(float),
        np.random.choice(2,nf,p=[.50,.50]).astype(float),
        np.random.choice(2,nf,p=[.30,.70]).astype(float),
        np.random.choice(3,nf,p=[.30,.40,.30]).astype(float),
        np.random.choice(4,nf,p=[.20,.25,.30,.25]).astype(float),
        np.ones(nf)
    ])
    data=np.vstack([L,F]);np.random.shuffle(data)
    X,y=data[:,:-1],data[:,-1]
    print(f"    {len(X):,} rows | fraud={int(y.sum()):,} ({y.mean()*100:.1f}%)")
    sp=int(len(X)*0.8)
    Xtr,Xte,ytr,yte=X[:sp],X[sp:],y[:sp],y[sp:]
    print("[2/4] Training extended model...")
    mdl=FraudModel()
    mdl.fit(Xtr,ytr)
    print("[3/4] Evaluating...")
    pr=mdl.predict_proba(Xte)[:,1]
    pd2=(pr>=0.5).astype(int)
    auc=auc_score(yte,pr)
    tp=((pd2==1)&(yte==1)).sum();fp2=((pd2==1)&(yte==0)).sum()
    tn=((pd2==0)&(yte==0)).sum();fn=((pd2==0)&(yte==1)).sum()
    prec=tp/(tp+fp2+1e-9);rec=tp/(tp+fn+1e-9)
    mdl.auc=auc
    print(f"    AUC={auc:.4f} P={prec:.4f} R={rec:.4f}")
    print(f"    TP={tp} FP={fp2} TN={tn} FN={fn}")
    print("[4/4] Saving...")
    pp=os.path.join(os.path.dirname(os.path.abspath(__file__)),"fraud_model.pkl")
    with open(pp,"wb") as f:pickle.dump(mdl,f)
    print(f"    Saved {pp} ({os.path.getsize(pp)/1024:.1f}KB)")
    lm=pickle.load(open(pp,"rb"))
    print("Sanity check:")
    tests=[
        ([45,14,0,0,2,1,50,0,0,0,0,0],"Normal grocery"),
        ([2400,3,1,6,850,4,300,1,1,0,1,2],"Card-not-present fraud"),
        ([8500,0,2,5,1200,7,200,1,1,1,2,3],"ATM midnight bot"),
        ([500,10,0,0,5,8,100,0,1,1,0,0],"Account takeover"),
        ([1200,14,4,6,2,2,300,0,1,0,2,1],"Synthetic identity"),
        ([300,2,1,6,900,12,80,1,1,1,1,2],"Bot credential stuffing"),
        ([25000,2,3,8,5,2,400,1,0,0,2,3],"Cross-border laundering"),
    ]
    for feat,lbl in tests:
        p=lm.predict_proba([feat])[0][1]
        v="FRAUD" if p>=0.5 else "LEGIT"
        print(f"  {lbl:<35} -> {v} ({p:.1%})")
    print("Done! Restart Flask.")