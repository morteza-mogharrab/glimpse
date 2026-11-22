import sys, os
from PIL import Image, ImageDraw
SRC='/home/claude/raw'
A={2:(.5,.40,.55),38:(.53,.30,.42),98:(.45,.33,.42),136:(.55,.36,.45),193:(.40,.40,.45),240:(.5,.29,.40),
262:(.5,.40,.45),324:(.45,.37,.55),377:(.45,.30,.35),181:(.62,.34,.5),166:(.27,.45,.5),287:(.5,.5,.8),
184:(.5,.45,.7),34:(.5,.5,.9),356:(.5,.5,.9),178:(.5,.5,.9),143:(.55,.4,.7),185:(.5,.5,.9),152:(.46,.33,.42),56:(.5,.5,.8),64:(.5,.5,.8)}
def crop(i):
    im=Image.open(f'{SRC}/image-{i}.jpg').convert('RGB'); w,h=im.size; cx,cy,s=A[i]
    side=int(min(w,h)*s); x=int(cx*w-side/2); y=int(cy*h-side/2)
    x=max(0,min(w-side,x)); y=max(0,min(h-side,y))
    return im.crop((x,y,x+side,y+side)).resize((180,180),Image.LANCZOS)
if __name__=='__main__':
    out=sys.argv[1]
    if out=='sheet':
        ks=list(A); S=Image.new('RGB',(len(ks)*190,200),'white'); d=ImageDraw.Draw(S)
        for k,i in enumerate(ks): S.paste(crop(i),(k*190,0)); d.text((k*190+4,184),str(i),fill='black')
        S.save('/tmp/av.jpg')
    else:
        os.makedirs(out,exist_ok=True)
        for i in A: crop(i).save(f'{out}/{i}.jpg',quality=85)
