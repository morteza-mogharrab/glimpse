import os, json
from PIL import Image
SRC='/home/claude/raw'; OUT='/home/claude/glimpse/public/media'
IDS=[185,236,341,104,372,20,336,387,365,170,238,127,215,142,364,155,241,308,222,120,369,143,223,219,13,92,129,347,322,335,270,117,164,315,319,198,88,25,
9,35,58,141,212,216,378,303,133,90,139,381,350,40,34,57,134,76,131,234,330,356,287,392,64,66,82,203,258,268,184,188,226,174,178,180,186,107,172,96,83,213,50,
2,262,352,98,38,345,334,136,253,182,78,108,211,324,377,181,6,39,154,63,289,290,284,106,128,89,56,14,97,295,296,355,111,99,201,346,121,30,
109,261,332,243,249,105,237,312,159,193,240,166,152,85,49,333,272,292,246,394,160,81,21,36,41,63,118,328]
os.makedirs(f'{OUT}/p',exist_ok=True); os.makedirs(f'{OUT}/t',exist_ok=True)
man={}
for i in dict.fromkeys(IDS):
    im=Image.open(f'{SRC}/image-{i}.jpg').convert('RGB'); w,h=im.size
    if h>w*1.1:
        th=int(w*5/4); y=max(0,int((h-th)*0.4)); im=im.crop((0,y,w,y+th)); asp='4:5'
    else:
        s=min(w,h); x=(w-s)//2; y=(h-s)//2; im=im.crop((x,y,x+s,y+s)); asp='1:1'
    W=820 if asp=='1:1' else 700
    im.resize((W,int(W*im.size[1]/im.size[0])),Image.LANCZOS).save(f'{OUT}/p/{i}.jpg',quality=72,optimize=True,progressive=True)
    tw=360; im.resize((tw,int(tw*im.size[1]/im.size[0])),Image.LANCZOS).save(f'{OUT}/t/{i}.jpg',quality=72,optimize=True)
    man[i]=asp
json.dump(man,open('/home/claude/tools/manifest.json','w'))
print(len(man))
