/** 瀏覽器版單頁 XLSX；ZIP 採 STORE，不依賴 Node.js 或伺服器壓縮。 */
const encode = (text: string) => new TextEncoder().encode(text);
const escape = (value: string) => value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;").replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, "");
function concat(chunks: Uint8Array[]) { const result = new Uint8Array(chunks.reduce((sum, chunk) => sum + chunk.length, 0)); let at = 0; for (const chunk of chunks) { result.set(chunk, at); at += chunk.length; } return result; }
function crc32(bytes: Uint8Array) { let crc = 0xffffffff; for (const byte of bytes) { crc ^= byte; for (let bit = 0; bit < 8; bit++) crc = crc & 1 ? 0xedb88320 ^ (crc >>> 1) : crc >>> 1; } return (crc ^ 0xffffffff) >>> 0; }
function zip(files: [string, string][]) {
  const local: Uint8Array[] = []; const central: Uint8Array[] = []; let offset = 0;
  for (const [path, text] of files) {
    const name = encode(path); const data = encode(text); const crc = crc32(data);
    const header = new Uint8Array(30); const view = new DataView(header.buffer);
    view.setUint32(0, 0x04034b50, true); view.setUint16(4, 20, true); view.setUint16(6, 0x0800, true); view.setUint16(12, 0x21, true); view.setUint32(14, crc, true); view.setUint32(18, data.length, true); view.setUint32(22, data.length, true); view.setUint16(26, name.length, true);
    local.push(header, name, data);
    const index = new Uint8Array(46); const table = new DataView(index.buffer);
    table.setUint32(0, 0x02014b50, true); table.setUint16(4, 20, true); table.setUint16(6, 20, true); table.setUint16(8, 0x0800, true); table.setUint16(14, 0x21, true); table.setUint32(16, crc, true); table.setUint32(20, data.length, true); table.setUint32(24, data.length, true); table.setUint16(28, name.length, true); table.setUint32(42, offset, true);
    central.push(index, name); offset += header.length + name.length + data.length;
  }
  const directory = concat(central); const end = new Uint8Array(22); const view = new DataView(end.buffer);
  view.setUint32(0, 0x06054b50, true); view.setUint16(8, files.length, true); view.setUint16(10, files.length, true); view.setUint32(12, directory.length, true); view.setUint32(16, offset, true);
  return concat([...local, directory, end]);
}
function column(index: number) { let result = ""; for (let value = index; value >= 0; value = Math.floor(value / 26) - 1) result = String.fromCharCode(65 + value % 26) + result; return result; }
export function toBrowserXlsx(headers: string[], rows: (string | number)[][]) {
  const sheet = [headers, ...rows].map((row, index) => `<row r="${index + 1}">${row.map((value, cell) => typeof value === "number" && Number.isFinite(value) ? `<c r="${column(cell)}${index + 1}"><v>${value}</v></c>` : `<c r="${column(cell)}${index + 1}" t="inlineStr"><is><t xml:space="preserve">${escape(String(value))}</t></is></c>`).join("")}</row>`).join("");
  const relations = "http://schemas.openxmlformats.org/package/2006/relationships";
  const document = "http://schemas.openxmlformats.org/officeDocument/2006/relationships";
  return zip([
    ["[Content_Types].xml", '<?xml version="1.0" encoding="UTF-8"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/></Types>'],
    ["_rels/.rels", `<Relationships xmlns="${relations}"><Relationship Id="rId1" Type="${document}/officeDocument" Target="xl/workbook.xml"/></Relationships>`],
    ["xl/workbook.xml", `<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="${document}"><sheets><sheet name="展示報表" sheetId="1" r:id="rId1"/></sheets></workbook>`],
    ["xl/_rels/workbook.xml.rels", `<Relationships xmlns="${relations}"><Relationship Id="rId1" Type="${document}/worksheet" Target="worksheets/sheet1.xml"/></Relationships>`],
    ["xl/worksheets/sheet1.xml", `<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData>${sheet}</sheetData></worksheet>`],
  ]);
}
export function downloadFile(name: string, bytes: Uint8Array | string, type: string) {
  const blob = new Blob([typeof bytes === "string" ? bytes : new Uint8Array(bytes)], { type });
  const url = URL.createObjectURL(blob); const link = document.createElement("a"); link.href = url; link.download = name; link.click(); window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
