"use client"

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import Link from "next/link";
import { toast } from "sonner";

import { authService } from "@/services/auth.service";
import { userService } from "@/services/user.service";
import { useAuthStore } from "@/store/auth.store";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
// import { Car } from "lucide-react";

const requestResendSchema = z.object({
    email: z.string().email({message: "Invalid email address"})
})

type RequestResendValues = z.infer<typeof requestResendSchema>

export default function ResendVerificationPage(){
    const router = useRouter();
    const { authenticated, loading} = useAuthStore();
    const [isLoading,setIsLoading] = useState(false);

    useEffect(() => {
        if(authenticated && !loading){
            router.push("/dashboard");
        }
    }, [authenticated, loading, router]);

    const { register, handleSubmit, formState: {errors}} = useForm<RequestResendValues>({
        resolver: zodResolver(requestResendSchema),
        defaultValues: {
            email: "",
        },
    });

    const onSubmit = async(data: RequestResendValues) => {
        try{
            setIsLoading(true)
            const res = await authService.requestResendVerification(data);
            toast.success("Verification email sent successfully!");
            router.push("/login");
        }catch(error: any){
            toast.error(error?.response?.data?.detail || "Failed to resend verification email.");
        }finally{
            setIsLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center p-4">
            <Card className="w-full max-w-md">
                <CardHeader className="space-y-1">
                    <CardTitle className="text-2xl font-bold text-center">Resend Verification</CardTitle>
                    <CardDescription className="text-center">
                        Enter your email to request a verification email resend
                    </CardDescription>
                </CardHeader>
                    <form onSubmit={handleSubmit(onSubmit)}>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="m@example.com"
                                    {...register("email")}
                                />
                                {errors.email && (
                                    <p className="text-sm text-red-500">{errors.email.message}</p>
                                )}
                            </div>
                        </CardContent>
                    <CardFooter className="flex flex-col space-y-4">
                        <Button type="submit" className="w-full" disabled={isLoading}>
                            {isLoading ? "Sending..." : "Send Verification Email"}
                        </Button>
                        <div className="text-center text-sm">
                            Already have an account?{" "}
                            <Link href="/login" className="text-blue-600 hover:underline">
                                Sign in
                            </Link>
                        </div>
                    </CardFooter>
                </form>
            </Card>
        </div>
    )
}