import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getAdminEmails } from "@/lib/env";

export async function getCurrentAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) {
    return null;
  }

  const adminEmails = getAdminEmails();
  const email = user.email.toLowerCase();

  if (adminEmails.length > 0 && !adminEmails.includes(email)) {
    return null;
  }

  return {
    id: user.id,
    email: user.email,
  };
}

export async function requireAdmin() {
  const admin = await getCurrentAdmin();

  if (!admin) {
    redirect("/login");
  }

  return admin;
}
