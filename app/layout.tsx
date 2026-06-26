import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Sidebar from "./components/Sidebar";
import Header from "./components/Header";
import { AuditProvider } from "./context/AuditContext";
import { AuthProvider } from "./context/AuthContext";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Makine Emniyet Raporlama",
  description: "Endüstriyel güvenlik denetimi ve raporlama sistemi",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr">
      <body className={inter.className}>
        <AuthProvider>
          <AuditProvider>
            <div className="flex h-screen bg-[#F8F9FA]">
              <Sidebar />
              <div className="flex-1 flex flex-col overflow-hidden">
                <Header />
                <main className="flex-1 overflow-x-hidden overflow-y-auto bg-[#F8F9FA] p-8">
                  {children}
                </main>
              </div>
            </div>
          </AuditProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
