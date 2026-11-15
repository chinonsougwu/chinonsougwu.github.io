"""
Renders the hero desk scene as isometric voxel art (3D blocks) and saves a
2-frame sprite sheet: frame 1 and frame 2 differ only in the hands, so
swapping them looks like typing.

Axes: x runs toward the viewer's lower right, y toward the lower left, z is up.
The character faces +x, so his face is on the right-hand side of his head.
"""
from PIL import Image, ImageDraw
import json, sys

A = 18            # pixels per unit along the iso axes (rendered at 2x display size)
VZ = A * 1.15     # pixels per unit of height

def hexc(h):
    h = h.lstrip("#")
    return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4))

def shade(rgb, f):
    return tuple(max(0, min(255, round(c * f))) for c in rgb)

# ---------- palette ----------
C = {
    "floor":   "#34363C",
    "wallA":   "#2C2E34",   # wall behind, x = 0 plane
    "wallB":   "#2C2E34",   # wall behind, y = 0 plane
    "window":  "#1F3A5F",
    "frame":   "#4A4A47",
    "light":   "#E8B931",
    "chair":   "#D33F49",
    "chairbase": "#26262A",
    "jeans":   "#3E66B0",
    "shoe":    "#E8E6DF",
    "tee":     "#141416",
    "skin":    "#8D5524",
    "eye":     "#120C08",
    "mouth":   "#6E4020",
    "afro":    "#15120F",
    "afro2":   "#2A231D",
    "desk":    "#7A5638",
    "laptop":  "#A9ABB0",
    "keys":    "#55585F",
    "sticker": "#E8B931",
    "mug":     "#E8E6DF",
    "coffee":  "#3B2414",
}

def build(frame):
    vox = {}

    def box(x0, x1, y0, y1, z0, z1, color):
        for x in range(x0, x1):
            for y in range(y0, y1):
                for z in range(z0, z1):
                    vox[(x, y, z)] = C[color]

    def clear(x0, x1, y0, y1, z0, z1):
        for x in range(x0, x1):
            for y in range(y0, y1):
                for z in range(z0, z1):
                    vox.pop((x, y, z), None)

    # Room: floor and two back walls
    box(0, 20, 0, 18, 0, 1, "floor")
    box(0, 1, 0, 18, 1, 22, "wallA")
    box(1, 20, 0, 1, 1, 22, "wallB")

    # Window on the back wall with two lit buildings outside
    box(8, 16, 0, 1, 11, 19, "frame")
    box(9, 15, 0, 1, 12, 18, "window")
    vox[(10, 0, 13)] = C["light"]
    vox[(10, 0, 15)] = C["light"]
    vox[(13, 0, 12)] = C["light"]
    vox[(13, 0, 14)] = C["light"]

    # Red gaming chair: base, post, seat, backrest
    box(3, 6, 7, 11, 1, 2, "chairbase")
    box(4, 5, 8, 10, 2, 6, "chairbase")
    box(2, 7, 6, 12, 6, 7, "chair")
    box(2, 3, 6, 12, 7, 15, "chair")

    # Character -------------------------------------------------
    # Jeans: thighs on the seat, shins down to the floor
    box(3, 11, 7, 11, 7, 9, "jeans")
    box(9, 11, 7, 9, 2, 7, "jeans")
    box(9, 11, 9, 11, 2, 7, "jeans")
    # White sneakers
    box(9, 12, 7, 9, 1, 2, "shoe")
    box(9, 12, 9, 11, 1, 2, "shoe")
    # Black t-shirt
    box(3, 7, 7, 11, 9, 15, "tee")
    # Neck and head
    box(4, 6, 8, 10, 15, 16, "skin")
    box(3, 7, 7, 11, 16, 21, "skin")
    # Face (on the +x side)
    vox[(6, 8, 19)] = C["eye"]
    vox[(6, 10, 19)] = C["eye"]
    vox[(6, 9, 17)] = C["mouth"]
    # Afro: wide rounded top, plus the back and sides of the head.
    # It stops at the face (x = 7) so the forehead and eyes stay visible.
    box(2, 7, 5, 13, 21, 25, "afro")
    box(2, 7, 6, 12, 25, 26, "afro")
    box(2, 5, 6, 12, 18, 21, "afro")    # back of the head, stopping above the neck
    box(5, 6, 6, 7, 19, 21, "afro")     # short sides above the ears
    box(5, 6, 11, 12, 19, 21, "afro")
    # Round it off: trim the corners of each layer
    for (x, y) in [(2, 5), (2, 12), (6, 5), (6, 12)]:
        clear(x, x + 1, y, y + 1, 21, 26)
    for (x, y) in [(2, 6), (2, 11), (6, 6), (6, 11)]:
        clear(x, x + 1, y, y + 1, 25, 26)
    # A few slightly lighter voxels give the hair some texture
    for (x, y, z) in [(3, 6, 24), (5, 9, 25), (4, 11, 23), (6, 8, 24), (3, 12, 22), (6, 10, 22), (2, 8, 23)]:
        if (x, y, z) in vox:
            vox[(x, y, z)] = C["afro2"]

    # Arms: short black sleeves, then skin
    for y in (6, 11):
        box(4, 6, y, y + 1, 13, 15, "tee")
        box(4, 6, y, y + 1, 11, 13, "skin")
        box(6, 11, y, y + 1, 11, 12, "skin")

    # Desk
    box(10, 19, 3, 16, 10, 11, "desk")
    for (x, y) in [(10, 3), (18, 3), (10, 15), (18, 15)]:
        box(x, x + 1, y, y + 1, 1, 10, "desk")

    # Laptop: base with keyboard, lid facing the character, sticker on the back
    box(11, 16, 6, 12, 11, 12, "laptop")
    box(12, 15, 7, 11, 11, 12, "keys")
    box(16, 17, 6, 12, 11, 18, "laptop")
    box(16, 17, 8, 10, 14, 16, "sticker")

    # Hands on the keyboard: one up, one down, swapped between frames
    up_y, down_y = (7, 10) if frame == 0 else (10, 7)
    box(11, 13, down_y, down_y + 1, 12, 13, "skin")
    box(11, 13, up_y, up_y + 1, 13, 14, "skin")

    # Mug of coffee, behind the laptop so it doesn't hide the keyboard
    box(13, 15, 3, 5, 11, 14, "mug")
    box(13, 15, 3, 5, 13, 14, "coffee")
    return vox

def project(x, y, z):
    return ((x - y) * A, (x + y) * A / 2 - z * VZ)

def render(vox):
    # Light comes from the top right: top faces brightest, left faces darkest
    order = sorted(vox, key=lambda p: (p[0] + p[1] + p[2], p[2]))
    faces = []
    for (x, y, z) in order:
        rgb = hexc(vox[(x, y, z)])
        if (x, y, z + 1) not in vox:
            faces.append(([project(x, y, z + 1), project(x + 1, y, z + 1),
                           project(x + 1, y + 1, z + 1), project(x, y + 1, z + 1)], shade(rgb, 1.22)))
        if (x + 1, y, z) not in vox:
            faces.append(([project(x + 1, y, z), project(x + 1, y + 1, z),
                           project(x + 1, y + 1, z + 1), project(x + 1, y, z + 1)], rgb))
        if (x, y + 1, z) not in vox:
            faces.append(([project(x, y + 1, z), project(x + 1, y + 1, z),
                           project(x + 1, y + 1, z + 1), project(x, y + 1, z + 1)], shade(rgb, 0.72)))
    return faces

def bounds(face_sets):
    xs = [p[0] for faces in face_sets for poly, _ in faces for p in poly]
    ys = [p[1] for faces in face_sets for poly, _ in faces for p in poly]
    return min(xs), min(ys), max(xs), max(ys)

frames = [render(build(0)), render(build(1))]
minx, miny, maxx, maxy = bounds(frames)
pad = 4
w = int(maxx - minx) + pad * 2
h = int(maxy - miny) + pad * 2

sheet = Image.new("RGBA", (w * 2, h), (0, 0, 0, 0))
for i, faces in enumerate(frames):
    img = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    for poly, rgb in faces:
        pts = [(px - minx + pad, py - miny + pad) for px, py in poly]
        d.polygon(pts, fill=rgb + (255,), outline=rgb + (255,))
    sheet.paste(img, (w * i, 0))

out = sys.argv[1] if len(sys.argv) > 1 else "images/desk-setup.png"
sheet.save(out, optimize=True)

# Where the laptop lid sits in the image, as percentages, so notifications can pop above it
lid = [project(16, 6, 18), project(17, 12, 18), project(17, 6, 11)]
lx = [(p[0] - minx + pad) / w * 100 for p in lid]
ly = [(p[1] - miny + pad) / h * 100 for p in lid]
print(json.dumps({"frame_w": w, "frame_h": h, "lid_left_pct": round(min(lx), 1),
                  "lid_right_pct": round(max(lx), 1), "lid_top_pct": round(min(ly), 1)}))
