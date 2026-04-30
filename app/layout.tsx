import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "COBOL-MF — learn COBOL, mainframes, and low-latency networks",
  description:
    "An interactive learning platform for COBOL, mainframe management, and low-latency network design.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <div className="flex min-h-screen flex-col">
          <header className="border-b border-[#1f2933] bg-[#0a0e14]">
            <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
              <Link
                href="/"
                className="font-mono text-lg font-bold text-terminal-green"
              >
                COBOL-MF
              </Link>
              <nav className="flex items-center gap-6 text-sm">
                <Link href="/learn" className="hover:text-terminal-blue">
                  Learn
                </Link>
                <Link href="/admin" className="hover:text-terminal-blue">
                  Admin
                </Link>
                <Link
                  href="/api/auth/signin"
                  className="rounded border border-[#1f2933] px-3 py-1 hover:border-terminal-blue hover:text-terminal-blue"
                >
                  Sign in
                </Link>
              </nav>
            </div>
          </header>
          <main className="flex-1">{children}</main>
          <footer className="border-t border-[#1f2933] py-4 text-center text-xs text-[#6c7079]">
            COBOL-MF — interactive learning platform
          </footer>
        </div>
      </body>
    </html>
  );
}
