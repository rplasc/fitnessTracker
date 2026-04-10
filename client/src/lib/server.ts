// Server-side API helpers — these run in Server Components and forward the
// auth cookie to the .NET backend directly (bypassing Next.js rewrites).
import { cookies } from "next/headers";

const API_URL = process.env.API_URL ?? "http://localhost:5211";

async function cookieHeader(): Promise<string> {
  const store = await cookies();
  return store
    .getAll()
    .map((c) => `${c.name}=${c.value}`)
    .join("; ");
}

export async function serverFetch<T>(
  path: string,
  options?: RequestInit
): Promise<T | null> {
  const cookie = await cookieHeader();
  try {
    const res = await fetch(`${API_URL}${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        Cookie: cookie,
        ...(options?.headers as Record<string, string>),
      },
      cache: "no-store",
    });
    if (!res.ok) return null;
    return res.json() as Promise<T>;
  } catch {
    return null;
  }
}
