import { serverFetch } from "@/lib/server";
import type { Settings } from "@/lib/types";
import SettingsClient from "@/components/SettingsClient";

export const metadata = { title: "Settings — FitTrack" };

export default async function SettingsPage() {
  const settings = await serverFetch<Settings>("/api/v1/settings");

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Settings</h1>
      <SettingsClient
        initialWeightUnit={settings?.weightUnit ?? "kg"}
        initialHeightUnit={settings?.heightUnit ?? "cm"}
      />
    </div>
  );
}
