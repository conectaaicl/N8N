import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import DashboardShell from "@/components/layout/DashboardShell";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
    title: "OmniFlow | Dashboard",
    description: "Omnichannel SaaS for sales automation",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en" className="dark">
            <body className={`${inter.className} min-h-screen bg-background`}>
                <DashboardShell>
                    {children}
                </DashboardShell>
            </body>
        </html>
    );
}
