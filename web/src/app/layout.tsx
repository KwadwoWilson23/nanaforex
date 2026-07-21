import type { Metadata } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
  variable: "--font-inter",
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-space-grotesk",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://nanaforex.com"),
  title: {
    default: "Nana Forex — Trade Smarter. Grow Faster.",
    template: "%s | Nana Forex",
  },
  description:
    "Ghana's home for ambitious traders. 12 weeks of live mentorship, copy trading with a proven trader, and funded accounts up to $200K.",
  icons: {
    icon: "/images/favicon.png",
    apple: "/images/apple-touch-icon.png",
  },
  openGraph: {
    title: "Nana Forex — The structured path to consistent forex profits",
    description:
      "Mentorship, copy trading, and funded accounts. Built for beginners who want to become pros — no hype, no gurus.",
    images: ["/images/logo.jpg"],
    url: "https://nanaforex.com",
    siteName: "Nana Forex",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Nana Forex",
    description:
      "The structured path to consistent forex profits. Ghana-based, since 2020.",
    images: ["/images/logo.jpg"],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${spaceGrotesk.variable}`}>
      <head>
        {/* Font Awesome for icons — matches existing site */}
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css"
        />
      </head>
      <body className="font-sans">{children}</body>
    </html>
  );
}
