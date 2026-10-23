"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/store/auth.store";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { setLoading } = useAuthStore();

  useEffect(() => {
    // By the time this effect runs on the client, Zustand's persist middleware 
    // has already synchronized with localStorage. 
    // We instantly unblock the global loading state without any setTimeout hacks.
    setLoading(false);
  }, [setLoading]);

  // We return children immediately, completely unblocking Server-Side Rendering (SSR).
  // Public pages (like marketing/landing) will now load instantly for users and SEO crawlers.
  return <>{children}</>;
}