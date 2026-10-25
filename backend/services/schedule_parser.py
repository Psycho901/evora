import os
from pathlib import Path

import fitz  # PyMuPDF
import pytesseract
from PIL import Image

TESSERACT_PATH = os.getenv('TESSERACT_PATH', r'C:\Program Files\Tesseract-OCR\tesseract.exe')
if os.path.exists(TESSERACT_PATH):
    pytesseract.pytesseract.tesseract_cmd = TESSERACT_PATH

IMAGE_EXTS = {'png', 'jpg', 'jpeg', 'webp', 'gif', 'bmp', 'tif', 'tiff'}
MAX_PDF_PAGES = 5
MIN_TEXT_CHARS = 30


def _ocr_image(img):
    img = img.convert('L')  # grayscale reads better
    if img.width < 1500:  # enlarge small images
        scale = 1500 / img.width
        img = img.resize((int(img.width * scale), int(img.height * scale)))
    return pytesseract.image_to_string(img, config='--psm 6')


def extract_text(filepath, ext):
    """Return the text found in a txt, image or PDF file."""
    ext = ext.lower()

    if ext == 'txt':
        return Path(filepath).read_text(encoding='utf-8', errors='ignore')

    if ext in IMAGE_EXTS:
        with Image.open(filepath) as img:
            return _ocr_image(img)

    if ext == 'pdf':
        parts = []
        with fitz.open(filepath) as doc:
            for page_num, page in enumerate(doc):
                if page_num >= MAX_PDF_PAGES:
                    break
                text = page.get_text().strip()
                if len(text) < MIN_TEXT_CHARS:  # scanned page: use OCR
                    pix = page.get_pixmap(dpi=200)
                    img = Image.frombytes('RGB', (pix.width, pix.height), pix.samples)
                    text = _ocr_image(img).strip()
                parts.append(text)
        return '\n\n'.join(t for t in parts if t)

    return ''