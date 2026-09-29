# contact sheet: python3 bench/harness/sheet.py <glob> <out.png> [cols]
import sys, glob
from PIL import Image
fs = sorted(glob.glob(sys.argv[1])); cols = int(sys.argv[3]) if len(sys.argv) > 3 else 3
ims = [Image.open(f) for f in fs]; w, h = 640, 360
S = Image.new('RGB', (w * cols, h * ((len(ims) + cols - 1) // cols)))
for i, im in enumerate(ims): S.paste(im.convert('RGB').resize((w, h)), ((i % cols) * w, (i // cols) * h))
S.save(sys.argv[2])
