import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "UrbanPlan AI — Municipal Planning Engine",
  description: "Advanced municipal zoning and infrastructure planning visualization engine.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} font-sans h-full overflow-hidden antialiased`}
    >
      <body className="h-full overflow-hidden flex flex-col">{children}</body>
    </html>
  );
}
