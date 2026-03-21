import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { Toaster } from "react-hot-toast";
import "./globals.css";

export const metadata: Metadata = {
  title: "blogbykanu — Your Tech Notes",
  description: "A dark terminal-themed blog and notes app for software engineers and tech enthusiasts.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <html lang="en" className="h-full">
        <body className="min-h-full flex flex-col bg-background text-text-primary font-mono scanline-overlay">
          {children}
          <Toaster
            position="bottom-right"
            toastOptions={{
              style: {
                background: "#111318",
                color: "#e0e0e0",
                border: "1px solid #1e2430",
                fontFamily: "JetBrains Mono, monospace",
                fontSize: "0.8rem",
              },
              success: {
                iconTheme: { primary: "#00ff9d", secondary: "#0a0a0a" },
              },
              error: {
                iconTheme: { primary: "#ff003c", secondary: "#0a0a0a" },
              },
            }}
          />
        </body>
      </html>
    </ClerkProvider>
  );
}
