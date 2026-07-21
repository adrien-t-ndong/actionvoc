import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { createClient } from "@supabase/supabase-js";
import { format } from "date-fns";

function getClients() {
  const resend = new Resend(process.env.RESEND_API_KEY);
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  return { resend, supabaseAdmin };
}

function generateReminderHtml(
  ownerName: string,
  actions: Array<{
    title: string;
    due_date: string | null;
    priority: string;
    meetings?: { title: string | null };
  }>
): string {
  const overdueCount = actions.length;

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background-color:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="max-width:600px;margin:0 auto;padding:24px 16px;">
    <div style="background:white;border-radius:12px;border:1px solid #e5e7eb;overflow:hidden;">
      <div style="background-color:#dc2626;padding:20px 24px;">
        <span style="color:white;font-weight:700;font-size:16px;">⚠️ Action Reminder</span>
      </div>
      <div style="padding:24px;">
        <p style="margin:0 0 16px;color:#111827;font-size:15px;">
          Hi <strong>${ownerName}</strong>, you have <strong>${overdueCount} overdue action${overdueCount > 1 ? "s" : ""}</strong> that need your attention:
        </p>
        <div style="border:1px solid #fee2e2;border-radius:8px;overflow:hidden;">
          ${actions
            .map(
              (a, i) => `
            <div style="padding:12px 16px;${i < actions.length - 1 ? "border-bottom:1px solid #fee2e2;" : ""}background:${i % 2 === 0 ? "#fff5f5" : "white"};">
              <p style="margin:0 0 4px;font-weight:600;color:#111827;font-size:14px;">${a.title}</p>
              <div style="display:flex;gap:12px;font-size:12px;color:#6b7280;">
                ${a.due_date ? `<span>📅 Due: ${format(new Date(a.due_date), "MMM d, yyyy")}</span>` : ""}
                ${a.meetings?.title ? `<span>📋 ${a.meetings.title}</span>` : ""}
                <span style="color:${a.priority === "high" ? "#dc2626" : "#d97706"};">● ${a.priority} priority</span>
              </div>
            </div>`
            )
            .join("")}
        </div>
        <p style="margin:16px 0 0;color:#6b7280;font-size:13px;">
          Please complete or update these actions as soon as possible.
        </p>
      </div>
      <div style="background:#f9fafb;border-top:1px solid #e5e7eb;padding:16px 24px;text-align:center;">
        <p style="margin:0;color:#9ca3af;font-size:12px;">Sent via ActionVoc — AI Meeting Assistant</p>
      </div>
    </div>
  </div>
</body>
</html>`;
}

export async function POST(request: NextRequest) {
  const { resend, supabaseAdmin } = getClients();
  try {
    const body = await request.json().catch(() => ({}));
    const { meetingId, actionId } = body;

    const today = new Date().toISOString().split("T")[0];

    let query = supabaseAdmin
      .from("actions")
      .select("*, meetings(id, title)")
      .lt("due_date", today)
      .eq("status", "open")
      .eq("reminder_sent", false);

    if (meetingId) {
      query = query.eq("meeting_id", meetingId);
    }

    if (actionId) {
      query = query.eq("id", actionId);
    }

    const { data: overdueActions, error } = await query;

    if (error) {
      throw new Error("Failed to fetch overdue actions: " + error.message);
    }

    if (!overdueActions || overdueActions.length === 0) {
      return NextResponse.json({ success: true, sent: 0, message: "No overdue actions to remind." });
    }

    // Group by owner_name
    const byOwner: Record<string, typeof overdueActions> = {};
    for (const action of overdueActions) {
      const owner = action.owner_name || "Team";
      if (!byOwner[owner]) byOwner[owner] = [];
      byOwner[owner].push(action);
    }

    // Fetch user emails from profiles for matching
    const { data: profiles } = await supabaseAdmin
      .from("profiles")
      .select("email, full_name");

    const profileEmailMap: Record<string, string> = {};
    for (const profile of profiles || []) {
      if (profile.full_name && profile.email) {
        profileEmailMap[profile.full_name.toLowerCase()] = profile.email;
      }
    }

    let sentCount = 0;
    const updatedActionIds: string[] = [];

    for (const [ownerName, actions] of Object.entries(byOwner)) {
      // Try to find email for this owner
      const ownerEmail =
        profileEmailMap[ownerName.toLowerCase()] ||
        // Fallback: try to match first name
        Object.entries(profileEmailMap).find(([name]) =>
          name.split(" ")[0] === ownerName.toLowerCase().split(" ")[0]
        )?.[1];

      if (ownerEmail) {
        try {
          await resend.emails.send({
            from: "ActionVoc <onboarding@resend.dev>",
            to: ownerEmail,
            subject: `⚠️ You have ${actions.length} overdue action${actions.length > 1 ? "s" : ""}`,
            html: generateReminderHtml(ownerName, actions),
          });
          sentCount++;
          updatedActionIds.push(...actions.map((a) => a.id));
        } catch (err) {
          console.error(`Failed to send reminder to ${ownerEmail}:`, err);
        }
      } else {
        // Still mark as reminded to avoid infinite loops
        updatedActionIds.push(...actions.map((a) => a.id));
      }
    }

    // Mark reminder_sent = true
    if (updatedActionIds.length > 0) {
      await supabaseAdmin
        .from("actions")
        .update({ reminder_sent: true })
        .in("id", updatedActionIds);
    }

    return NextResponse.json({
      success: true,
      sent: sentCount,
      processed: overdueActions.length,
    });
  } catch (error) {
    console.error("Send reminders error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to send reminders" },
      { status: 500 }
    );
  }
}
