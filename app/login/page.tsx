import { signIn } from "@/app/lib/auth";

export const dynamic = "force-dynamic";

export default function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; callbackUrl?: string }>;
}) {
  return (
    <div className="mx-auto mt-16 max-w-sm px-6">
      <h1 className="mb-6 text-2xl font-bold text-white">Sign in</h1>
      <form
        action={async (data) => {
          "use server";
          const sp = await searchParams;
          await signIn("credentials", {
            email: data.get("email"),
            password: data.get("password"),
            redirectTo: sp.callbackUrl ?? "/learn",
          });
        }}
        className="space-y-3"
      >
        <input
          name="email"
          type="email"
          required
          placeholder="email"
          className="w-full rounded border border-[#1f2933] bg-[#11161d] px-3 py-2 outline-none focus:border-terminal-blue"
        />
        <input
          name="password"
          type="password"
          required
          placeholder="password"
          className="w-full rounded border border-[#1f2933] bg-[#11161d] px-3 py-2 outline-none focus:border-terminal-blue"
        />
        <button
          type="submit"
          className="w-full rounded bg-terminal-green py-2 font-mono text-sm font-semibold text-[#0a0e14]"
        >
          Sign in
        </button>
      </form>
      <p className="mt-4 text-xs text-[#a8a59b]">
        First-time setup uses the BOOTSTRAP_ADMIN_EMAIL /
        BOOTSTRAP_ADMIN_PASSWORD env vars to create the OWNER account.
      </p>
    </div>
  );
}
