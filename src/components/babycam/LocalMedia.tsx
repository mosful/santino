"use client";

/* eslint-disable @next/next/no-img-element */
import { useEffect, useState } from "react";
import { readCarePhoto } from "@/lib/care/media";

export default function LocalMedia({ id, alt, className }: { id: string; alt: string; className?: string }) {
  const [src, setSrc] = useState("");
  useEffect(() => {
    let active = true; let url = "";
    void readCarePhoto(id).then((blob) => { if (blob && active) { url = URL.createObjectURL(blob); setSrc(url); } }).catch(() => undefined);
    return () => { active = false; if (url) URL.revokeObjectURL(url); };
  }, [id]);
  return src ? <img src={src} alt={alt} width={640} height={360} loading="lazy" className={className} /> : <span className="text-sm">本機圖片尚未載入或已移除</span>;
}
