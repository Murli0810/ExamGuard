import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

import { AppSidebar } from "@/components/app-sidebar";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";

// Initialize optimized Google Fonts
const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });
const jetbrainsMono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono" });

export const metadata: Metadata = {
  title: "ExamGuard — Secure AI Exam Evaluation",
  description: "SOC-style dashboard for AI exam grading, threat detection, and audit logs.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body suppressHydrationWarning className={`${inter.variable} ${jetbrainsMono.variable} antialiased`}>
        <SidebarProvider>
          <div className="min-h-screen flex w-full bg-background">
            <AppSidebar />
            <div className="flex-1 flex flex-col min-w-0">
              {/* Top Navigation Header */}
              <header className="h-12 flex items-center gap-3 border-b border-border bg-sidebar/60 backdrop-blur px-3 sticky top-0 z-30">
                <SidebarTrigger />
                <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary glow-green animate-pulse" />
                  <span>SYSTEM ONLINE</span>
                  <span className="text-border">|</span>
                  <span>uptime 14d 03:21:55</span>
                </div>
              </header>
              
              {/* Dynamic Page Content */}
              <main className="flex-1 min-w-0">
                {children}
              </main>
            </div>
          </div>
        </SidebarProvider>
      </body>
    </html>
  );
}