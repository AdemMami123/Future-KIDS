import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google";
import "./globals.css";

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
    <html lang="en" className={`${inter.variable} ${outfit.variable}`}>
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
