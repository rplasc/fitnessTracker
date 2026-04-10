import { redirect } from "next/navigation";
import Nav from "@/components/Nav";
import { serverFetch } from "@/lib/server";
import type { MeResponse } from "@/lib/types";

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const me = await serverFetch<MeResponse>("/api/v1/auth/me");
  if (!me?.isAuthenticated) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1 max-w-lg mx-auto w-full px-4 pb-24 pt-6">
        {children}
      </main>
      <Nav />
    </div>
  );
}
