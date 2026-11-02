# measure.py: python measure.py video.mp4
import numpy as np, subprocess, sys, json
W,H=54,96
raw=subprocess.run(['ffmpeg','-v','error','-i',sys.argv[1],'-vf',f'scale={W}:{H}:flags=area','-f','rawvideo','-pix_fmt','rgb24','-'],capture_output=True).stdout
F=np.frombuffer(raw,np.uint8).reshape(-1,H,W,3).astype(np.float32); n=len(F)
Y=F@np.array([.299,.587,.114],np.float32)
d=np.r_[0,np.abs(Y[1:]-Y[:-1]).mean((1,2))]
yy,xx=np.mgrid[0:H,0:W]; c=(abs(xx-W/2)<W/4)&(abs(yy-H/2)<H/4); e=(xx<W*.1)|(xx>W*.9)|(yy<H*.07)|(yy>H*.93)
ev=[];i=1
while i<n:
  if d[i]>=30:
    j=i
    while j+1<n and d[j+1]>=24: j+=1
    ev.append(j-i+1); i=j+2
  else: i+=1
run=m=0
for s in d<1: run=run+1 if s else 0; m=max(m,run)
print(json.dumps(dict(medDiff=float(np.median(d)),staticPct=float((d<1).mean()*100),longestStatic=m,
 hardCuts=sum(e<=2 for e in ev),blurMoves=sum(e>2 for e in ev),vignette=float((Y[:,c].mean(1)-Y[:,e].mean(1)).mean()),
 topMinusBottom=float((Y[:,:H//3].mean((1,2))-Y[:,2*H//3:].mean((1,2))).mean()),
 p95=float(np.percentile(Y.reshape(n,-1),95,1).mean()),contrast=float(Y.reshape(n,-1).std(1).mean())),indent=1))
