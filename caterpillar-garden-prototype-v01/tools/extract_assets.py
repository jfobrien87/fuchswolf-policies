"""Extract the supplied sheet without repainting artwork. Usage: python tools/extract_assets.py SOURCE_DIR"""
from pathlib import Path
from collections import deque
import json
import shutil
import sys
from PIL import Image

root = Path(__file__).resolve().parents[1]
source = Path(sys.argv[1])
sheet = Image.open(source / 'shapes_and_sockets_sprite_sheet.png').convert('RGBA')
columns = [(44,234), (249,438), (454,643), (659,848), (866,1055), (1073,1261), (1292,1486)]
rows = [(8,168), (172,320), (327,475), (479,638), (638,808), (815,985)]
shapes = ['circle','square','triangle','rectangle','star','heart']
colours = ['red','blue','yellow','green','purple','orange','socket']
manifest_path = root / 'assets/manifest.json'
manifest = json.loads(manifest_path.read_text()) if manifest_path.exists() else {}
manifest.update({'shapes': {}, 'caterpillar': {'image':'assets/caterpillar/walk.png','metadata':'assets/caterpillar/walk.json'}})
for shape, (top,bottom) in zip(shapes,rows):
    manifest['shapes'][shape] = {}
    for colour,(left,right) in zip(colours,columns):
        crop = sheet.crop((left,top,right,bottom))
        pixels = crop.load()
        w,h = crop.size
        queue = deque([(x,y) for x in range(w) for y in (0,h-1)] + [(x,y) for y in range(h) for x in (0,w-1)])
        visited = set()
        # Only remove neutral, light pixels connected to the sheet's background.
        # Interior paper highlights are preserved.
        while queue:
            x,y = queue.popleft()
            if (x,y) in visited or not (0 <= x < w and 0 <= y < h):
                continue
            visited.add((x,y))
            r,g,b,a = pixels[x,y]
            if min(r,g,b) > 220 and max(r,g,b)-min(r,g,b) < 25:
                pixels[x,y] = (r,g,b,0)
                queue.extend([(x-1,y),(x+1,y),(x,y-1),(x,y+1)])
        bounds = crop.getbbox()
        crop = crop.crop(bounds)
        path = f'assets/shapes/{shape}-{colour}.png'
        crop.save(root / path, optimize=True)
        manifest['shapes'][shape][colour] = path
shutil.copyfile(source / 'caterpillar_walk_sprite_sheet.png', root / 'assets/caterpillar/walk.png')
shutil.copyfile(source / 'caterpillar_walk_sprite_sheet.json', root / 'assets/caterpillar/walk.json')
(root / 'assets/manifest.json').write_text(json.dumps(manifest,indent=2)+'\n')
print('Extracted all 36 pieces and six sockets; copied the authoritative walk sheet and metadata.')
