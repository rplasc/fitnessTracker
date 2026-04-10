import MetricsClient from "@/components/MetricsClient";
import { serverFetch } from "@/lib/server";
import type { Metric } from "@/lib/types";

export const metadata = { title: "Weight — FitTrack" };

export default async function MetricsPage() {
  const metrics = await serverFetch<Metric[]>("/api/v1/metrics?limit=30") ?? [];

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Body Weight</h1>
      <MetricsClient initialMetrics={metrics} />
    </div>
  );
}
