import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "WatermarkAI — Remove Watermarks Instantly",
  description: "AI-powered watermark and text removal. Upload your image and our Content-Aware Fill engine will reconstruct the original texture beneath any watermark.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} font-sans bg-[#0A0A0B] text-white antialiased`}>
        {children}
      </body>
    </html>
  );
}
