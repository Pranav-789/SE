"use client"

import { ThemeProvider } from "next-themes"
import {Toaster} from "sonner";
import { ReactNode } from "react";
import { AuthProvider } from "./AuthProvider";

type ProviderProps = {
    children: ReactNode;
};

export function Providers({children}: ProviderProps){
    return(
        <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
        >
            <AuthProvider>
                {children}
            </AuthProvider>
            <Toaster
                position="top-right"
                richColors
                closeButton
            />
        </ThemeProvider>
    )
}
