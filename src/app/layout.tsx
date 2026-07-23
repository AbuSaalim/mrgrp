import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils"; 

// Font configure kar rahe hain
const jakarta = Plus_Jakarta_Sans({ 
  subsets: ["latin"],
  variable: "--font-jakarta", // Tailwind ke liye variable
  weight: ["400", "500", "600", "700"], // Regular, Medium, SemiBold, Bold
});



export const metadata: Metadata = {
  title: "MR App",
  description: "Modern construction management software",
  icons: {
    icon: "/logo.png",
    shortcut: "/logo.png",
    apple: "/logo.png",
  },
};

import { Toaster } from "sonner";

import { ThemeProvider } from "@/components/ThemeProvider";
import SplashScreen from "@/components/SplashScreen";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={cn(
          "min-h-screen bg-slate-50 font-sans text-slate-900 antialiased dark:bg-slate-950 dark:text-slate-50",
          jakarta.variable // Font ko inject kar diya
        )}
        style={{ fontFamily: 'var(--font-jakarta)' }} // Apply directly
      >
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
          <SplashScreen />
          {children}
          <Toaster
            position="top-right"
            richColors
            toastOptions={{
              className: "dark:bg-[#0B1121] dark:border-[rgba(255,255,255,0.1)] dark:text-[#f8fafc] bg-white border-slate-200 text-slate-900",
            }}
          />
        </ThemeProvider>
      </body>
    </html>
  );
}