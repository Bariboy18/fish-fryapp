import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Fish Fry - Order Your Meal",
  description: "Order delicious fish fry dinners for pickup",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased font-sans">
        {children}
      </body>
    </html>
  );
}
