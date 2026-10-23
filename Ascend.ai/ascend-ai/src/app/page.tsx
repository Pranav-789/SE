"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/store/auth.store";

export default function HomePage() {
  const { authenticated, loading } = useAuthStore();

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24 text-center">
      <div className="space-y-6 max-w-2xl">
        <h1 className="text-6xl font-bold tracking-tight">
          Welcome to <span className="text-blue-600">Ascend AI</span>
        </h1>
        <p className="text-xl text-gray-500 dark:text-gray-400">
          Your intelligent roadmap and research assistant.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-4 pt-8">
          {!loading && authenticated ? (
            <Link href="/dashboard">
              <Button size="lg" className="text-lg px-8">
                Go to Dashboard
              </Button>
            </Link>
          ) : (
            <>
              <Link href="/login">
                <Button size="lg" className="text-lg px-8">
                  Sign In
                </Button>
              </Link>
              <Link href="/register">
                <Button size="lg" variant="outline" className="text-lg px-8">
                  Create Account
                </Button>
              </Link>
            </>
          )}
          <Link href="/dashboard/travel">
            <Button size="lg" variant="secondary" className="text-lg px-8 gap-2">
              Explore AI Travel Agent 🚀
            </Button>
          </Link>
        </div>
      </div>
    </main>
  );
}