/** 照片僅存瀏覽器 IndexedDB，展示資料及影像都不對外傳送。 */
function database(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("santino-care-media", 1);
    request.onupgradeneeded = () => request.result.createObjectStore("photos");
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(new Error("瀏覽器無法使用本機照片儲存。"));
  });
}
export async function saveCarePhoto(file: File): Promise<string> {
  if (!file.type.startsWith("image/") || file.size > 10 * 1024 * 1024) throw new Error("請選取 10 MB 以下的圖片。");
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, 1200 / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale); canvas.height = Math.round(bitmap.height * scale);
  const context = canvas.getContext("2d");
  if (!context) { bitmap.close(); throw new Error("瀏覽器無法預覽圖片。"); }
  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height); bitmap.close();
  const blob = await new Promise<Blob>((resolve, reject) => canvas.toBlob((result) => result ? resolve(result) : reject(new Error("圖片轉換失敗。")), "image/jpeg", 0.85));
  const db = await database();
  const id = crypto.randomUUID();
  try {
    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction("photos", "readwrite");
      transaction.objectStore("photos").put(blob, id);
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(new Error("本機照片儲存失敗，請檢查瀏覽器空間。"));
      transaction.onabort = () => reject(new Error("本機照片儲存已中斷。"));
    });
  } finally { db.close(); }
  return id;
}
export async function readCarePhoto(id: string): Promise<Blob | null> {
  const db = await database();
  try {
    return await new Promise((resolve, reject) => {
      const request = db.transaction("photos", "readonly").objectStore("photos").get(id);
      request.onsuccess = () => resolve(request.result instanceof Blob ? request.result : null);
      request.onerror = () => reject(new Error("無法讀取本機照片。"));
    });
  } finally { db.close(); }
}
export async function clearCarePhotos() {
  const db = await database();
  try { await new Promise<void>((resolve, reject) => { const transaction = db.transaction("photos", "readwrite"); transaction.objectStore("photos").clear(); transaction.oncomplete = () => resolve(); transaction.onerror = () => reject(new Error("無法清除本機展示圖片。")); transaction.onabort = () => reject(new Error("清除圖片已中斷。")); }); } finally { db.close(); }
}
