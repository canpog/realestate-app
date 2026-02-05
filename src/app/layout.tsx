import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

import { ThemeProvider } from "@/components/theme-provider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
    title: {
        template: '%s | TR Danışman CRM',
        default: 'TR Danışman CRM',
    },
    description: "Türkiye emlak danışmanları için CRM ve Portföy Yönetimi - Kolay, Hızlı ve Güvenilir.",
    keywords: ['emlak', 'crm', 'gayrimenkul', 'portföy yönetimi', 'emlak danışmanı', 'real estate'],
    authors: [{ name: 'TR Danışman Team' }],
    creator: 'TR Danışman',
    icons: {
        icon: '/favicon.ico',
    },
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="tr" suppressHydrationWarning>
            <body className={inter.className}>
                <ThemeProvider
                    attribute="class"
                    defaultTheme="system"
                    enableSystem
                    disableTransitionOnChange
                >
                    {children}
                </ThemeProvider>
            </body>
        </html>
    );
}
