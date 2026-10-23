"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useAuthStore } from "@/store/auth.store";
import { TravelPlanner } from "@/components/travel/TravelPlanner";
import { Button } from "@/components/ui/button";

export default function TravelPage() {
  const { user } = useAuthStore();

  return (
    <div className="min-h-screen p-6 sm:p-8 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <Link href="/dashboard">
          <Button variant="ghost" size="sm" className="gap-2 text-gray-400 hover:text-white">
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Button>
        </Link>
      </div>

      <TravelPlanner userId={user?.username || user?.id || "demo_user"} />
    </div>
  );
}
