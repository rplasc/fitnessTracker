import { redirect } from "next/navigation";

// (auth)/page.tsx would conflict with app/page.tsx at "/".
// The actual dashboard lives at /dashboard.
export default function AuthRoot() {
  redirect("/dashboard");
}
