import Link from "next/link";
import { requireRole } from "@/app/lib/auth";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireRole(["OWNER", "ADMIN"]);
  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      <nav className="mb-6 flex gap-4 border-b border-[#1f2933] pb-3 text-sm">
        <Link href="/admin" className="hover:text-terminal-blue">
          Dashboard
        </Link>
        <Link href="/admin/users" className="hover:text-terminal-blue">
          Users
        </Link>
        <Link href="/admin/teams" className="hover:text-terminal-blue">
          Teams
        </Link>
      </nav>
      {children}
    </div>
  );
}
