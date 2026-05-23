import { NextResponse } from "next/server";
import { verifyCsrf } from "@/lib/security/csrf";
import { validateUpload } from "@/lib/security/upload";
import { requireRole } from "@/lib/security/rbac";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const csrf = verifyCsrf(req);
  if (!csrf.ok) return NextResponse.json({ error: csrf.reason }, { status: 403 });

  const auth = await requireRole(["seller", "admin"]);
  if (!auth.ok) return NextResponse.json({ error: auth.reason }, { status: auth.status });

  const form = await req.formData();
  const file = form.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "no_file" }, { status: 400 });
  }

  // 파일 검증: MIME + 확장자 + 매직넘버
  const check = await validateUpload(file);
  if (!check.ok) {
    return NextResponse.json({ error: "invalid_file", reason: check.reason }, { status: 400 });
  }

  // Supabase Storage 업로드
  const supabase = await createClient();
  const ext = file.name.slice(file.name.lastIndexOf("."));
  const path = `products/${auth.userId}/${Date.now()}${ext}`;
  const arrayBuffer = await file.arrayBuffer();

  const { error } = await supabase.storage
    .from("uploads")
    .upload(path, new Uint8Array(arrayBuffer), {
      contentType: file.type,
      upsert: false,
    });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const { data: pub } = supabase.storage.from("uploads").getPublicUrl(path);
  return NextResponse.json({ url: pub.publicUrl });
}
