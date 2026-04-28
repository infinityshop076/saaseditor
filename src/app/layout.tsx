import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";

const outfit = Outfit({ subsets: ["latin"], variable: "--font-outfit" });

export const metadata: Metadata = {
  title: "WatermarkAI — Remove Watermarks Instantly",
  description: "AI-powered watermark and text removal using Content-Aware Fill inpainting.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  if (!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) {
    return (
      <html lang="es" className="dark">
        <body className="bg-black text-white flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Mantenimiento</h1>
            <p className="text-gray-400">Configurando servicios de autenticación...</p>
          </div>
        </body>
      </html>
    );
  }

  return (
    <ClerkProvider
      afterSignOutUrl="/"
      appearance={{
        variables: {
          colorPrimary: "#7c3aed",
          colorBackground: "#0A0A0B",
          colorInputBackground: "#111115",
          colorText: "#ffffff",
          colorTextSecondary: "#9CA3AF",
          borderRadius: "16px",
          fontFamily: "Outfit, sans-serif",
        },
        elements: {
          card: "border border-white/8 shadow-2xl",
          formButtonPrimary: "bg-purple-600 hover:bg-purple-700",
        },
      }}
    >
      <html lang="es" className="dark">
        <body className={`${outfit.variable} font-sans bg-[#0A0A0B] text-white antialiased`}>
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
