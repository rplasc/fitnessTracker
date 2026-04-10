import { redirect } from "next/navigation";

// Root redirects to the dashboard (inside the (auth) group).
export default function RootPage() {
  redirect("/dashboard");
}
