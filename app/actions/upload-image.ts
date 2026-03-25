"use server";

import { auth } from "@clerk/nextjs/server";
import { getPublicSupabase } from "@/lib/supabase";

export async function getImageUploadUrl(
  fileName: string
): Promise<{ signedUrl: string; publicUrl: string }> {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const ext = fileName.split(".").pop()?.toLowerCase() ?? "jpg";
  const path = `${userId}/${Date.now()}.${ext}`;

  const supabase = getPublicSupabase();

  const { data, error } = await supabase.storage
    .from("note-images")
    .createSignedUploadUrl(path);

  if (error || !data) throw new Error(`Failed to create upload URL: ${error?.message}`);

  const { data: { publicUrl } } = supabase.storage
    .from("note-images")
    .getPublicUrl(path);

  return { signedUrl: data.signedUrl, publicUrl };
}
