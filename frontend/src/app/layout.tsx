import type { Metadata } from "next";
import { Inter, Outfit, Cairo } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import I18nProvider from "@/components/providers/I18nProvider";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  display: "swap",
});

const cairo = Cairo({
  subsets: ["arabic", "latin"],
  variable: "--font-cairo",
  display: "swap",
});

export const metadata: Metadata = {
  title: "EduQuiz - Interactive Learning Platform",
  description: "Interactive educational platform where teachers create engaging quiz games, students learn through play, and parents monitor progress.",
  keywords: ["education", "quiz", "learning", "students", "teachers", "parents", "interactive"],
  authors: [{ name: "EduQuiz Team" }],
  openGraph: {
    title: "EduQuiz - Interactive Learning Platform",
    description: "Making learning fun and interactive for everyone",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className={`${inter.variable} ${outfit.variable} ${cairo.variable}`}>
      <body className="antialiased">
        <I18nProvider>
          <AuthProvider>
            {children}
          </AuthProvider>
        </I18nProvider>
      </body>
    </html>
  );
}
