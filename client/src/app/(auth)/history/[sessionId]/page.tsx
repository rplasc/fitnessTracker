import { notFound } from "next/navigation";
import { serverFetch } from "@/lib/server";
import type { SessionDetail, Settings } from "@/lib/types";
import SessionDetailClient from "@/components/SessionDetailClient";

export const metadata = { title: "Session — FitTrack" };

export default async function HistorySessionPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = await params;
  const id = parseInt(sessionId, 10);
  if (Number.isNaN(id)) notFound();

  const [session, settings] = await Promise.all([
    serverFetch<SessionDetail>(`/api/v1/workouts/sessions/${id}`),
    serverFetch<Settings>("/api/v1/settings"),
  ]);

  if (!session) notFound();

  return (
    <SessionDetailClient
      session={session}
      weightUnit={settings?.weightUnit ?? "kg"}
    />
  );
}
