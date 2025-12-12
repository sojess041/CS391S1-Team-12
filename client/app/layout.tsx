import type { Metadata } from "next";
import "./globals.css";
import "@/lib/console-filter"; // Filter browser extension errors
import Navbar from "@/components/navbar";
import { ThemeProvider } from "@/lib/theme-provider";

export const metadata: Metadata = {
  title: "Spark!Bytes - Find Free Food Around Campus",
  description: "A site made by students, for students. Connect with leftover event food in real time.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased bg-gray-50 dark:bg-slate-900 transition-colors duration-300">
        <ThemeProvider>
          <>
            <Navbar />
            {children}
          </>
        </ThemeProvider>
      </body>
    </html>
  );
}
