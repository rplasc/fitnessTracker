import { redirect } from "next/navigation";
import { serverFetch } from "@/lib/server";
import type { MeResponse } from "@/lib/types";
import OnboardingClient from "@/components/OnboardingClient";

export const metadata = { title: "Get Started — FitTrack" };

export default async function OnboardingPage() {
  const me = await serverFetch<MeResponse>("/api/v1/auth/me");

  if (!me?.isAuthenticated) {
    redirect("/login");
  }

  if (me.onboardingComplete) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-sm">
        <OnboardingClient />
      </div>
    </div>
  );
}
