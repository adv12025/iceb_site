"""Makes the handout files from private/roster-passwords.csv (run after make-roster.mjs):

  private/cards/<rollNo>.png        one card per student: send each student ONLY their own file, privately
  private/passwords-cards.pdf       all cards, 10 per A4 page, with cut lines
  private/passwords-list.pdf        full list as a table (for the CR only)

Everything stays inside private/ (git-ignored). Run from the ice-b-hub-next folder:  python scripts/make-cards.py
Needs: pillow and pymupdf (pip install pillow pymupdf). Uses the Windows fonts Arial / Consolas. """
import csv, os, sys
import pymupdf
from PIL import Image, ImageDraw, ImageFont

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")
PRIV = os.path.join(ROOT, "private")
SRC = os.path.join(PRIV, "roster-passwords.csv")
OUT = os.path.join(PRIV, "cards")
URL = "https://adv12025.github.io/iceb_site/"
FONTS = r"C:\Windows\Fonts"

if not os.path.exists(SRC):
    sys.exit(f"{SRC} not found. Run: node scripts/make-roster.mjs")
os.makedirs(OUT, exist_ok=True)
rows = [r for r in csv.DictReader(open(SRC, encoding="utf-8")) if r["rollNo"]]

def font(name, size):
    return ImageFont.truetype(os.path.join(FONTS, name), size)

W, H = 1000, 560
F_BRAND, F_NAME, F_LABEL, F_MONO, F_SMALL = font("arialbd.ttf", 44), font("arialbd.ttf", 38), font("arial.ttf", 26), font("consolab.ttf", 58), font("arial.ttf", 25)

def card(r):
    im = Image.new("RGB", (W, H), "#f8fafc")
    d = ImageDraw.Draw(im)
    d.rectangle([0, 0, W, 110], fill="#0369a1")
    d.text((36, 28), "ICE-B Hub  |  Your login", font=F_BRAND, fill="white")
    d.text((36, 135), r["name"].title() if r["name"].isupper() else r["name"], font=F_NAME, fill="#0f172a")
    d.text((36, 200), "Roll number (username)", font=F_LABEL, fill="#475569")
    d.rounded_rectangle([36, 235, W - 36, 305], 14, fill="white", outline="#cbd5e1", width=2)
    d.text((56, 242), r["rollNo"], font=F_MONO, fill="#0f172a")
    d.text((36, 325), "First password", font=F_LABEL, fill="#475569")
    d.rounded_rectangle([36, 360, W - 36, 430], 14, fill="#e0f2fe", outline="#0284c7", width=3)
    d.text((56, 367), r["initialPassword"], font=F_MONO, fill="#0c4a6e")
    d.text((36, 450), "Open: " + URL, font=F_SMALL, fill="#0369a1")
    d.text((36, 488), "You must set your own new password the first time you log in. Do not share this card.", font=F_SMALL, fill="#64748b")
    return im

paths = []
for r in rows:
    p = os.path.join(OUT, r["rollNo"] + ".png")
    card(r).save(p)
    paths.append((r, p))

# ---- cards PDF: 2 columns x 5 rows per A4 page, cut lines ----
doc = pymupdf.open()
cw, ch = 270, 151.2            # points (card is 1000x560)
mx, my = (595 - 2 * cw) / 2, (842 - 5 * ch) / 2
for i, (_, p) in enumerate(paths):
    if i % 10 == 0:
        page = doc.new_page(width=595, height=842)
        for c in range(3):
            x = mx + c * cw
            page.draw_line((x, my - 8), (x, my + 5 * ch + 8), color=(0.7, 0.7, 0.7), dashes="[3 3] 0", width=0.5)
        for rr in range(6):
            y = my + rr * ch
            page.draw_line((mx - 8, y), (mx + 2 * cw + 8, y), color=(0.7, 0.7, 0.7), dashes="[3 3] 0", width=0.5)
    k = i % 10
    x, y = mx + (k % 2) * cw, my + (k // 2) * ch
    page.insert_image(pymupdf.Rect(x + 2, y + 2, x + cw - 2, y + ch - 2), filename=p)
doc.save(os.path.join(PRIV, "passwords-cards.pdf"))

# ---- full list PDF ----
doc = pymupdf.open()
per_page, top, rh = 40, 110, 17
for i in range(0, len(rows), per_page):
    page = doc.new_page(width=595, height=842)
    page.insert_text((40, 50), "ICE-B Hub: first passwords", fontname="hebo", fontsize=18)
    page.insert_text((40, 70), "CR copy. PRIVATE. Send each student only their own line. Site: " + URL, fontname="helv", fontsize=9)
    y = top
    for h, x in (("Sl", 40), ("Roll number", 75), ("Name", 170), ("First password", 450)):
        page.insert_text((x, y - 6), h, fontname="hebo", fontsize=10)
    page.draw_line((40, y), (555, y), width=0.8)
    for n, r in enumerate(rows[i:i + per_page], start=i + 1):
        y += rh
        if n % 2 == 0:
            page.draw_rect(pymupdf.Rect(40, y - 12, 555, y + 4), color=None, fill=(0.95, 0.96, 0.98))
        page.insert_text((40, y), str(n), fontname="helv", fontsize=10)
        page.insert_text((75, y), r["rollNo"], fontname="cour", fontsize=10)
        page.insert_text((170, y), r["name"][:34], fontname="helv", fontsize=10)
        page.insert_text((450, y), r["initialPassword"], fontname="cobo", fontsize=11)
doc.save(os.path.join(PRIV, "passwords-list.pdf"))

print(f"Done: {len(rows)} cards in {OUT}\n      {os.path.join(PRIV, 'passwords-cards.pdf')}\n      {os.path.join(PRIV, 'passwords-list.pdf')}")
