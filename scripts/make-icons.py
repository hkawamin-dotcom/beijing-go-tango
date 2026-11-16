"""アプリのアイコン（PNG）を作る。public/ に書き出す。
使い方：python scripts/make-icons.py
"""
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "public"
BRAND = (194, 65, 12)
PAPER = (255, 250, 245)

# 中国本土向けフォント（Windows の Microsoft YaHei）を優先して使う
FONT_CANDIDATES = [
    "C:/Windows/Fonts/msyhbd.ttc",
    "C:/Windows/Fonts/msyh.ttc",
    "/System/Library/Fonts/PingFang.ttc",
    "/usr/share/fonts/opentype/noto/NotoSansCJK-Bold.ttc",
]


def load_font(size: int) -> ImageFont.FreeTypeFont:
    for path in FONT_CANDIDATES:
        if Path(path).exists():
            return ImageFont.truetype(path, size)
    raise SystemExit("中国語フォントが見つかりません")


def make(size: int, name: str, padding_ratio: float = 0.0) -> None:
    img = Image.new("RGB", (size, size), BRAND)
    draw = ImageDraw.Draw(img)
    # マスカブルアイコンでも切れないよう、文字は中央の安全領域に収める
    inner = size * (1 - padding_ratio * 2)
    font = load_font(int(inner * 0.62))
    text = "汉"
    box = draw.textbbox((0, 0), text, font=font)
    w, h = box[2] - box[0], box[3] - box[1]
    draw.text(((size - w) / 2 - box[0], (size - h) / 2 - box[1]), text, font=font, fill=PAPER)
    img.save(OUT / name)
    print("書き出し:", name)


OUT.mkdir(exist_ok=True)
make(192, "icon-192.png", 0.1)
make(512, "icon-512.png", 0.1)
make(180, "apple-touch-icon.png", 0.05)
