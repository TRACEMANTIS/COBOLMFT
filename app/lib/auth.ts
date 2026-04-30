import NextAuth, { type NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import GitHub from "next-auth/providers/github";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { compareSync } from "bcryptjs";
import { redirect } from "next/navigation";
import { prisma } from "./db";

const providers: NextAuthConfig["providers"] = [
  Credentials({
    name: "Email + password",
    credentials: {
      email: { label: "Email", type: "email" },
      password: { label: "Password", type: "password" },
    },
    async authorize(creds) {
      const email = String(creds?.email ?? "").toLowerCase().trim();
      const password = String(creds?.password ?? "");
      if (!email || !password) return null;
      const user = await prisma.user.findUnique({ where: { email } });
      if (!user || !user.passwordHash) return null;
      if (user.status !== "ACTIVE") return null;
      if (!compareSync(password, user.passwordHash)) return null;
      await prisma.user.update({
        where: { id: user.id },
        data: { lastActiveAt: new Date() },
      });
      return {
        id: user.id,
        email: user.email,
        name: user.name ?? undefined,
        role: user.role,
      };
    },
  }),
];

if (process.env.GITHUB_ID && process.env.GITHUB_SECRET) {
  providers.push(
    GitHub({
      clientId: process.env.GITHUB_ID,
      clientSecret: process.env.GITHUB_SECRET,
    }),
  );
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  providers,
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.uid = (user as { id?: string }).id;
        token.role = (user as { role?: string }).role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.uid) {
        (session.user as { id?: string }).id = token.uid as string;
        (session.user as { role?: string }).role = token.role as string;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
});

export type SessionRole = "OWNER" | "ADMIN" | "MEMBER";

export async function requireUser() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  return session.user as { id: string; email: string; role: SessionRole; name?: string };
}

export async function requireRole(roles: SessionRole | SessionRole[]) {
  const u = await requireUser();
  const allowed = Array.isArray(roles) ? roles : [roles];
  if (!allowed.includes(u.role)) redirect("/learn");
  return u;
}

export function canManageUser(actor: SessionRole, target: SessionRole): boolean {
  if (actor === "OWNER") return true;
  if (actor === "ADMIN") return target === "MEMBER";
  return false;
}
