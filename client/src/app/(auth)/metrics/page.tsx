import MetricsClient from "@/components/MetricsClient";
import { serverFetch } from "@/lib/server";
import type { Metric, Settings } from "@/lib/types";

export const metadata = { title: "Weight — FitTrack" };

export default async function MetricsPage() {
  const [metrics, settings] = await Promise.all([
    serverFetch<Metric[]>("/api/v1/metrics?limit=30").then((r) => r ?? []),
    serverFetch<Settings>("/api/v1/settings"),
  ]);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Body Weight</h1>
      <MetricsClient
        initialMetrics={metrics}
        initialWeightUnit={settings?.weightUnit ?? "kg"}
        initialHeightUnit={settings?.heightUnit ?? "cm"}
        initialHeightCm={settings?.heightCm ?? null}
      />
    </div>
  );
}
