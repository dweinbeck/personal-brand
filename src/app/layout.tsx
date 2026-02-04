import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Footer } from "@/components/layout/Footer";
import { Navbar } from "@/components/layout/Navbar";
import { AuthProvider } from "@/context/AuthContext";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://dweinbeck.com"),
  title: {
    template: "%s | Dan Weinbeck",
    default: "Dan Weinbeck - AI Developer & Data Scientist",
  },
  description: "AI developer, analytics professional, and data scientist",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://dweinbeck.com",
    siteName: "Dan Weinbeck",
    title: "Dan Weinbeck - AI Developer & Data Scientist",
    description: "AI developer, analytics professional, and data scientist",
    images: [
      {
        url: "/opengraph-image.png",
        width: 1200,
        height: 630,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AuthProvider>
          <Navbar />
          <main className="min-h-screen">{children}</main>
          <Footer />
        </AuthProvider>
      </body>
    </html>
  );
}
