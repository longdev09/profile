import type { Metadata } from "next";
import { Montserrat, Dancing_Script } from "next/font/google";
import "./globals.css";

const fontHeading = Montserrat({
  subsets: ["vietnamese", "latin"],
  weight: ["700", "800", "900"],
  variable: "--font-heading",
  display: "swap",
});

const fontHandwriting = Dancing_Script({
  subsets: ["latin"],
  weight: ["600", "700"],
  variable: "--font-handwriting",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Slide Cưới Đẹp | Video & Thiệp Cưới Online",
  description: "Dịch vụ làm Video Slide Cưới, Màn LED Sân Khấu & Thiệp Cưới Online chuyên nghiệp",
  icons: {
    icon: "/icon.svg",
    shortcut: "/icon.svg",
    apple: "/icon.svg",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi" className={`${fontHeading.variable} ${fontHandwriting.variable}`}>
      <body className="min-h-screen bg-[#fff5f6] text-[#2d1820] antialiased">
        {children}
      </body>
    </html>
  );
}
