"""準備本機原件；--publish-blank 產生已核對無個資的空白網站資源。"""
from pathlib import Path
import hashlib
import json
import shutil
import sys
import pypdfium2 as pdfium
from pypdf import PdfReader, PdfWriter
from PIL import ImageChops

root = Path(__file__).resolve().parents[2]
source = root / 'Document' / '20261112需求討論' / '表格'
publish = '--publish-blank' in sys.argv
out = root / 'web' / 'public' / 'care-paper' / ('templates' if publish else 'private')


def strip_jpeg_metadata(data):
    """保留原壓縮影像，移除 APP1～APP15 與註解，不重新壓縮像素。"""
    if data[:2] != b'\xff\xd8':
        raise ValueError('空白母版影像不是已核對的 JPEG。')
    result = bytearray(data[:2])
    index = 2
    while index < len(data):
        start = index
        if data[index] != 255:
            raise ValueError('JPEG 標記不正確。')
        while data[index] == 255:
            index += 1
        marker = data[index]
        index += 1
        if marker in (0xda, 0xd9):
            result.extend(data[start:])
            return bytes(result)
        length = int.from_bytes(data[index:index + 2], 'big')
        end = index + length
        if marker not in range(0xe1, 0xf0) and marker != 0xfe:
            result.extend(data[start:end])
        index = end
    raise ValueError('JPEG 缺少影像資料。')


def public_blank(path, target):
    reader = PdfReader(path)
    writer = PdfWriter()
    for page in reader.pages:
        if page.extract_text() or page.get('/Annots') or len(page.images) != 1:
            raise ValueError('空白母版含非預期文字、註記或影像，禁止發布。')
        image = next(iter(page['/Resources']['/XObject'].values())).get_object()
        if image.get('/Filter') != '/DCTDecode':
            raise ValueError('空白母版影像格式已變更，請重新核對。')
        image._data = strip_jpeg_metadata(image._data)
        for key in ('/Metadata', '/PieceInfo'):
            image.pop(key, None)
        writer.add_page(page, excluded_keys=['/Metadata', '/PieceInfo', '/AA', '/Annots'])
    writer.add_metadata({'/Title': '聖帝諾空白表格母版 20261113', '/Producer': 'Santino'})
    writer.write(target)
sources = [
    ('scales', '心情量表與社會支持量表.pdf', 'ac82746d655daa79d1cf18b288161d30c1c2e119649c26febf8efe8cd918d3f2'),
    ('baby-admission', '新生兒入住評估單.pdf', '0d676472f6e48edce0628be79b6a41c766895950ff7aa03f06db8f0fe2dd4d4f'),
    ('baby-daily', '新生兒每日評估照護單.pdf', 'a21d58324295c8cd7c08b69993683cf7a8e8809ce4849a3465c28c0c3a0e79b7'),
    ('mama-admission', '產婦入住護理評估表.pdf', '6fabbd00e31a7ca86c86736e99426be8b3234b116a7eecdcfc e3be20b0f53ea3'.replace(' ', '')),
    ('mama-daily', '產婦每日護理評估表.pdf', '4a3f13d9bf3ef523ff5e36fc64c23cc94a1c26c5b87e5dd718be2e8867d31874'),
]
out.mkdir(parents=True, exist_ok=True)
manifest = []
for key, filename, expected in sources:
    path = source / filename
    digest = hashlib.sha256(path.read_bytes()).hexdigest()
    if digest != expected:
        raise ValueError(f'{filename} 與已核對空白紙本不一致，請重新檢查來源，禁止自動公開或套用。')
    target = out / f'{key}.pdf'
    if publish:
        public_blank(path, target)
    else:
        shutil.copyfile(path, target)
    pdf = pdfium.PdfDocument(target)
    original = pdfium.PdfDocument(path)
    pages = []
    for index in range(len(pdf)):
        page = pdf[index]
        bitmap = page.render(scale=1.65).to_pil()
        if publish and ImageChops.difference(bitmap.convert('RGB'), original[index].render(scale=1.65).to_pil().convert('RGB')).getbbox() is not None:
            raise ValueError(f'{key} 第 {index + 1} 頁的發布版與原紙本不一致。')
        bitmap.save(out / f'{key}-{index + 1}.png')
        pages.append({'page': index + 1, 'width': page.get_width(), 'height': page.get_height(), 'previewSize': bitmap.size})
    manifest.append({'id': key, 'sha256': hashlib.sha256(target.read_bytes()).hexdigest(), 'version': '20261113', 'pages': pages})
(out / 'manifest.json').write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding='utf-8')
print(json.dumps(manifest, ensure_ascii=False, indent=2))
