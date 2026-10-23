"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";

import { authService } from "@/services/auth.service";
import { useAuthStore } from "@/store/auth.store";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { authenticated, loading } = useAuthStore();
  const [isVerifying, setIsVerifying] = useState(true);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const token = searchParams.get("token");

  useEffect(() => {
    // If the user is logged in, and we already finished verifying or didn't have a token, we might redirect them
    // But typically they can just go to dashboard
    if (authenticated && !loading && !token) {
      router.push("/dashboard");
    }
  }, [authenticated, loading, router, token]);

  useEffect(() => {
    const verifyToken = async () => {
      if (!token) {
        setIsVerifying(false);
        setErrorMessage("No verification token found in URL.");
        return;
      }

      try {
        await authService.verifyEmail(token);
        setIsSuccess(true);
        toast.success("Email verified successfully!");
      } catch (error: any) {
        setErrorMessage(error?.response?.data?.detail || "Verification failed. The token may be invalid or expired.");
        toast.error("Email verification failed.");
      } finally {
        setIsVerifying(false);
      }
    };

    verifyToken();
  }, [token]);

  if (isVerifying) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <CardTitle className="text-2xl font-bold">Verifying Email</CardTitle>
            <CardDescription>Please wait while we verify your email address...</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-green-600">Verification Successful!</CardTitle>
            <CardDescription>Your email address has been verified.</CardDescription>
          </CardHeader>
          <CardFooter className="flex justify-center">
            <Link href={authenticated ? "/dashboard" : "/login"}>
              <Button>{authenticated ? "Go to Dashboard" : "Sign in to your account"}</Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md text-center border-red-200">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-red-600">Verification Failed</CardTitle>
          <CardDescription>{errorMessage}</CardDescription>
        </CardHeader>
        <CardFooter className="flex justify-center flex-col space-y-4">
          <Link href="/login">
            <Button variant="outline">Return to Sign In</Button>
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center">Loading...</div>}>
      <VerifyEmailContent />
    </Suspense>
  );
}
