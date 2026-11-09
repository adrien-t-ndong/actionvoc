import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";

function getSupabaseAdmin() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const code = typeof body?.code === "string" ? body.code.trim().toUpperCase() : "";

  if (!code) {
    return NextResponse.json({ error: "Invalid code" }, { status: 400 });
  }

  const admin = getSupabaseAdmin();

  const { data: promoCode } = await admin
    .from("promo_codes")
    .select("*")
    .eq("code", code)
    .single();

  if (!promoCode || !promoCode.active) {
    return NextResponse.json({ error: "Invalid promo code" }, { status: 404 });
  }

  if (promoCode.uses_count >= promoCode.max_uses) {
    return NextResponse.json({ error: "This promo code has expired" }, { status: 410 });
  }

  const { data: existing } = await admin
    .from("promo_redemptions")
    .select("id")
    .eq("user_id", user.id)
    .eq("code", code)
    .single();

  if (existing) {
    return NextResponse.json({ error: "You've already used this code" }, { status: 409 });
  }

  const { data: profile } = await admin
    .from("profiles")
    .select("bonus_meetings")
    .eq("id", user.id)
    .single();

  const currentBonus = profile?.bonus_meetings ?? 0;

  await admin
    .from("profiles")
    .update({ bonus_meetings: currentBonus + promoCode.bonus_meetings })
    .eq("id", user.id);

  await admin
    .from("promo_redemptions")
    .insert({ user_id: user.id, code });

  await admin
    .from("promo_codes")
    .update({ uses_count: promoCode.uses_count + 1 })
    .eq("code", code);

  return NextResponse.json({
    success: true,
    bonus_meetings: promoCode.bonus_meetings,
    message: `${promoCode.bonus_meetings} free meetings added to your account!`,
  });
}
