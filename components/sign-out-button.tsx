"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";

export function SignOutButton() {
  const router = useRouter();

  async function signOut() {
    await fetch("/api/auth/logout", {
      method: "POST",
    });

    router.replace("/login");
    router.refresh();
  }

  return (
    <button className="secondary-button" type="button" onClick={signOut}>
      <LogOut size={17} />
      Sign out
    </button>
  );
}
