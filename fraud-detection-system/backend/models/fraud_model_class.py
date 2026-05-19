import numpy as np

class FraudModel:
    def __init__(self):
        self.weights=None;self.bias=0.0;self.mean=None;self.std=None;self.auc=0.0

    def _engineer(self,X):
        X=np.array(X,dtype=float)
        if X.ndim==1:X=X.reshape(1,-1)
        a=X[:,0];t=X[:,1];tt=X[:,2];m=X[:,3];d=X[:,4];v=X[:,5]
        av=X[:,6];fo=X[:,7];dev=X[:,8];bot=X[:,9];id_risk=X[:,10];ch=X[:,11]
        return np.column_stack([
            a,t,tt,m,d,v,av,fo,dev,bot,id_risk,ch,
            a/(av+1),
            ((t>=22)|(t<=5)).astype(float),
            (v>5).astype(float),
            (d>100).astype(float),
            (a>1000).astype(float),
            ((tt==2)|(tt==3)).astype(float),
            np.log1p(a),np.log1p(d),
            (dev*fo).astype(float),
            (bot*v).astype(float),
            (id_risk*(a>500)).astype(float),
        ])

    def _sigmoid(self,z):
        return 1.0/(1.0+np.exp(-np.clip(z,-500,500)))

    def _norm(self,X):
        return (X-self.mean)/(self.std+1e-8)

    def fit(self,X,y,lr=0.05,epochs=200,batch=2048):
        Xe=self._engineer(X);self.mean=Xe.mean(0);self.std=Xe.std(0)
        Xn=self._norm(Xe);n,d=Xn.shape
        self.weights=np.zeros(d);self.bias=0.0
        y=np.array(y,dtype=float)
        pw=(y==0).sum()/((y==1).sum()+1e-9)
        for ep in range(epochs):
            idx=np.random.permutation(n)
            for i in range(0,n,batch):
                b=idx[i:i+batch];Xb,yb=Xn[b],y[b]
                p=self._sigmoid(Xb@self.weights+self.bias)
                e=(p-yb)*np.where(yb==1,pw,1.0)
                self.weights-=lr*(Xb.T@e)/len(b)
                self.bias-=lr*e.mean()
            if ep%50==0:
                pa=self._sigmoid(Xn@self.weights+self.bias)
                loss=-(pw*y*np.log(pa+1e-9)+(1-y)*np.log(1-pa+1e-9)).mean()
                print(f"    Epoch {ep} loss={loss:.4f}")
        return self

    def predict_proba(self,X):
        Xe=self._engineer(X);Xn=self._norm(Xe)
        p=self._sigmoid(Xn@self.weights+self.bias)
        return np.column_stack([1-p,p])

    def predict(self,X):
        return (self.predict_proba(X)[:,1]>=0.5).astype(int)