import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

// Any page under (app) requires a signed-in user. The middleware also guards
// this, but checking here protects against a missing matcher.
export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/signin");
  return <>{children}</>;
}
