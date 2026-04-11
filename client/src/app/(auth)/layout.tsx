import { redirect } from "next/navigation";
import DrawerNav from "@/components/DrawerNav";
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
      <DrawerNav />
      <main className="flex-1 max-w-lg mx-auto w-full px-4 pt-6 pb-24">
        {children}
      </main>
    </div>
  );
}
