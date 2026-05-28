"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";

import { api } from "@/lib/api";
import { authStore } from "@/lib/auth";

/** Deep link: open (or start) a direct chat with a Carbon, composer ready. */
export default function CarbonDeepLink() {
  const params = useParams<{ carbonId: string }>();
  const router = useRouter();

  React.useEffect(() => {
    const handle = params.carbonId;
    if (!authStore.getAccess()) {
      router.replace(`/auth/login?identifier=${encodeURIComponent(handle)}`);
      return;
    }
    let alive = true;
    (async () => {
      try {
        const carbon = await api.carbonByHandle(handle);
        const room = await api.directRoom("carbon", carbon.carbon_id);
        if (alive) router.replace(`/chat?room=${room.room_id}`);
      } catch {
        if (alive) router.replace("/chat");
      }
    })();
    return () => {
      alive = false;
    };
  }, [params.carbonId, router]);

  return (
    <main className="grid min-h-screen place-items-center">
      <span className="text-sm text-muted-foreground">opening chat…</span>
    </main>
  );
}
