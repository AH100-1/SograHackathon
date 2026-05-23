/**
 * 파일 업로드 방어: MIME + 확장자 + 매직넘버 검사.
 * 이미지만 허용 (jpg, png, webp).
 */
const ALLOWED_MIME = new Set(["image/jpeg", "image/png", "image/webp"]);
const ALLOWED_EXT = new Set([".jpg", ".jpeg", ".png", ".webp"]);
const MAX_SIZE = 5 * 1024 * 1024; // 5MB

const MAGIC_NUMBERS: Array<{ mime: string; bytes: number[] }> = [
  { mime: "image/jpeg", bytes: [0xff, 0xd8, 0xff] },
  { mime: "image/png", bytes: [0x89, 0x50, 0x4e, 0x47] },
  { mime: "image/webp", bytes: [0x52, 0x49, 0x46, 0x46] }, // "RIFF"
];

export async function validateUpload(file: File): Promise<{
  ok: boolean;
  reason?: string;
}> {
  if (file.size > MAX_SIZE) return { ok: false, reason: "file_too_large" };
  if (!ALLOWED_MIME.has(file.type)) return { ok: false, reason: "mime_not_allowed" };

  const name = file.name.toLowerCase();
  const ext = name.slice(name.lastIndexOf("."));
  if (!ALLOWED_EXT.has(ext)) return { ok: false, reason: "extension_not_allowed" };

  // 매직 넘버 검사
  const buf = new Uint8Array(await file.slice(0, 8).arrayBuffer());
  const magicMatch = MAGIC_NUMBERS.some((m) =>
    m.bytes.every((b, i) => buf[i] === b),
  );
  if (!magicMatch) return { ok: false, reason: "magic_number_mismatch" };

  return { ok: true };
}
