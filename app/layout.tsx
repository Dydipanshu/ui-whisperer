import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "Aurora Atlas",
  description: "Live risk intelligence product using real-world APIs and generative UI",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased bg-slate-50">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
