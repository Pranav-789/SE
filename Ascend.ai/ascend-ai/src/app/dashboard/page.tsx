"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth.store";
import { authService } from "@/services/auth.service";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TravelPlanner } from "@/components/travel/TravelPlanner";
import { Compass, User as UserIcon, LogOut } from "lucide-react";

export default function DashboardPage() {
  const { user, authenticated, loading, logout } = useAuthStore();
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<"travel" | "profile">("travel");

  // Local hydration check specific to this protected route
  useEffect(() => {
    const timer = setTimeout(() => setIsMounted(true), 0);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (isMounted && !loading && !authenticated) {
      router.push("/login");
    }
  }, [isMounted, loading, authenticated, router]);

  const handleLogout = async () => {
    try {
      await authService.logout();
    } catch (error) {
      console.error("Logout failed", error);
    } finally {
      logout();
      router.push("/login");
    }
  };

  if (!isMounted || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="animate-pulse text-lg text-gray-400">Loading dashboard...</p>
      </div>
    );
  }

  if (!authenticated) {
    return null;
  }

  return (
    <div className="min-h-screen p-6 sm:p-8 max-w-6xl mx-auto space-y-6">
      {/* Top Navbar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-gray-800">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">Ascend AI Workspace</h1>
          <p className="text-sm text-gray-400">Welcome back, {user?.username} ({user?.email})</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex rounded-lg bg-gray-900 p-1 border border-gray-800">
            <button
              onClick={() => setActiveTab("travel")}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                activeTab === "travel"
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              <Compass className="w-4 h-4" />
              <span>AI Travel Planner</span>
            </button>
            <button
              onClick={() => setActiveTab("profile")}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                activeTab === "profile"
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              <UserIcon className="w-4 h-4" />
              <span>My Profile</span>
            </button>
          </div>

          <Button variant="outline" size="sm" onClick={handleLogout} className="gap-2 border-gray-800 text-gray-300 hover:text-white">
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Sign out</span>
          </Button>
        </div>
      </div>

      {/* Main Tab Content */}
      {activeTab === "travel" ? (
        <TravelPlanner userId={user?.username || user?.id || "demo_user"} />
      ) : (
        <div className="max-w-2xl mx-auto space-y-6">
          <Card className="border-gray-800 bg-gray-950/60 shadow-xl">
            <CardHeader>
              <CardTitle className="text-white">Account Details</CardTitle>
              <CardDescription>Your personal credentials and role information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-gray-300">
              <div className="flex justify-between py-2 border-b border-gray-800/80">
                <span className="text-gray-400">Username:</span>
                <span className="font-semibold text-white">{user?.username}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-800/80">
                <span className="text-gray-400">Email Address:</span>
                <span className="font-semibold text-white">{user?.email}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-800/80">
                <span className="text-gray-400">Role:</span>
                <span className="font-semibold capitalize text-blue-400">{user?.role || "User"}</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-gray-400">User ID:</span>
                <span className="font-mono text-xs text-gray-500">{user?.id}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
