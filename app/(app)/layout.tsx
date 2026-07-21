import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Navbar from "@/components/Navbar";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, email, plan")
    .eq("id", user.id)
    .single();

  const name = profile?.full_name || profile?.email || user.email || "U";
  const initials = name
    .split(" ")
    .map((n: string) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="min-h-screen bg-[#f6f1ed]">
      <Navbar userInitials={initials} userEmail={user.email} plan={profile?.plan as "free" | "pro" | undefined} />
      <main>{children}</main>
    </div>
  );
}
