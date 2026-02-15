// app/layout.tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/Sidebar";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "JossPro Automation",
  description: "Manage your business smart way",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-gray-50`}>
        <div className="flex min-h-screen">
          {/* Sidebar */}
          <aside className="hidden md:block w-64 fixed h-full z-10">
            <Sidebar />
          </aside>

          {/* Main Content */}
          <main className="flex-1 md:ml-64 p-8">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}