import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "ActionVoc — AI Meeting Assistant",
  description: "Record meetings, extract action items, and send summaries automatically.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-[#f6f1ed] text-stone-900 antialiased`}>
        {children}
      </body>
    </html>
  );
}
