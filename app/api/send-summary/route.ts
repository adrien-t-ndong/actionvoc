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

function priorityStyle(priority: string): { bg: string; color: string } {
  if (priority === "high") return { bg: "#fee2e2", color: "#b91c1c" };
  if (priority === "low") return { bg: "#f3f4f6", color: "#6b7280" };
  return { bg: "#fef3c7", color: "#92400e" };
}

function generateEmailHtml(meeting: {
  title: string | null;
  created_at: string;
  summary: string | null;
  decisions: string[];
  actions: Array<{
    title: string;
    owner_name: string | null;
    due_date: string | null;
    status: string;
    priority: string;
  }>;
}): string {
  const formattedDate = format(new Date(meeting.created_at), "MMMM d, yyyy");
  const title = meeting.title || "Untitled Meeting";

  const decisionsHtml =
    meeting.decisions && meeting.decisions.length > 0
      ? meeting.decisions
          .map(
            (d) =>
              `<li style="margin-bottom:10px;color:#374151;font-size:16px;line-height:1.6;">${d}</li>`
          )
          .join("")
      : `<li style="color:#6b7280;font-style:italic;font-size:16px;">No decisions recorded.</li>`;

  // Cards empilées (une par action) — compatibles mobile et desktop
  const actionsHtml =
    meeting.actions && meeting.actions.length > 0
      ? meeting.actions
          .map((a) => {
            const { bg, color } = priorityStyle(a.priority);
            const dueText = a.due_date
              ? format(new Date(a.due_date), "MMM d, yyyy")
              : null;
            return `
<div class="action-card" style="background:#ffffff;border:1px solid #e5e7eb;border-radius:8px;padding:14px 16px;margin-bottom:10px;">
  <p style="margin:0 0 8px;font-size:16px;font-weight:600;color:#111827;line-height:1.4;${a.status === "done" ? "text-decoration:line-through;color:#9ca3af;" : ""}">${a.title}</p>
  <table style="width:100%;border-collapse:collapse;">
    <tr>
      ${a.owner_name ? `<td style="padding:0 12px 0 0;font-size:14px;color:#6b7280;white-space:nowrap;">👤 ${a.owner_name}</td>` : ""}
      ${dueText ? `<td style="padding:0 12px 0 0;font-size:14px;color:#6b7280;white-space:nowrap;">📅 ${dueText}</td>` : ""}
      <td style="text-align:right;">
        <span style="display:inline-block;padding:2px 10px;border-radius:9999px;font-size:12px;font-weight:600;background:${bg};color:${color};">${a.priority}</span>
      </td>
    </tr>
  </table>
</div>`;
          })
          .join("")
      : `<p style="color:#6b7280;font-style:italic;font-size:16px;">No action items.</p>`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>${title}</title>
  <style>
    body { margin: 0; padding: 0; background-color: #f9fafb; -webkit-text-size-adjust: 100%; }
    .wrapper { max-width: 600px; margin: 0 auto; padding: 32px 24px; }
    .card { background: white; border-radius: 12px; border: 1px solid #e5e7eb; overflow: hidden; }
    .header { background-color: #2d5a27; padding: 28px 32px; }
    .body { padding: 32px; }
    .section { margin-bottom: 28px; }
    .section-title { margin: 0 0 14px; font-size: 13px; font-weight: 700; color: #6b7280; text-transform: uppercase; letter-spacing: 0.06em; }
    .summary-box { background: #f9fafb; border-radius: 8px; padding: 16px 20px; }
    .footer { background: #f9fafb; border-top: 1px solid #e5e7eb; padding: 16px 32px; text-align: center; }
    @media (max-width: 600px) {
      .wrapper { padding: 16px !important; }
      .header { padding: 20px 16px !important; }
      .body { padding: 20px 16px !important; }
      .footer { padding: 14px 16px !important; }
      .action-card table tr { display: block; }
      .action-card table td { display: block; padding: 2px 0 !important; white-space: normal !important; }
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="card">

      <!-- Header -->
      <div class="header">
        <table style="border-collapse:collapse;margin-bottom:14px;">
          <tr>
            <td style="padding:0 10px 0 0;">
              <div style="width:30px;height:30px;background:rgba(255,255,255,0.2);border-radius:6px;text-align:center;line-height:30px;font-size:16px;color:white;">✓</div>
            </td>
            <td style="font-size:17px;font-weight:700;color:white;">ActionVoc</td>
          </tr>
        </table>
        <h1 style="margin:0 0 6px;color:white;font-size:22px;font-weight:700;line-height:1.3;">${title}</h1>
        <p style="margin:0;color:rgba(255,255,255,0.8);font-size:15px;">${formattedDate}</p>
      </div>

      <!-- Body -->
      <div class="body">

        <!-- Summary -->
        <div class="section">
          <p class="section-title">Summary</p>
          <div class="summary-box">
            <p style="margin:0;color:#374151;font-size:16px;line-height:1.7;">${meeting.summary || "No summary available."}</p>
          </div>
        </div>

        <!-- Decisions -->
        <div class="section">
          <p class="section-title">Key Decisions</p>
          <ul style="margin:0;padding-left:22px;">
            ${decisionsHtml}
          </ul>
        </div>

        <!-- Action Items -->
        <div class="section" style="margin-bottom:0;">
          <p class="section-title">Action Items</p>
          ${actionsHtml}
        </div>

      </div>

      <!-- Footer -->
      <div class="footer">
        <p style="margin:0;color:#9ca3af;font-size:13px;">Sent via <strong>ActionVoc</strong> — AI Meeting Assistant</p>
      </div>

    </div>
  </div>
</body>
</html>`;
}

export async function POST(request: NextRequest) {
  const { resend, supabaseAdmin } = getClients();
  try {
    const { meetingId, emails } = await request.json();

    if (!meetingId || !emails || emails.length === 0) {
      return NextResponse.json({ error: "Missing meetingId or emails" }, { status: 400 });
    }

    // Fetch meeting with actions
    const { data: meeting, error } = await supabaseAdmin
      .from("meetings")
      .select("*, actions(*)")
      .eq("id", meetingId)
      .single();

    if (error || !meeting) {
      return NextResponse.json({ error: "Meeting not found" }, { status: 404 });
    }

    const html = generateEmailHtml(meeting);
    const subject = `Meeting Summary — ${meeting.title || "Untitled Meeting"}`;

    // Send emails
    const sendResults = await Promise.allSettled(
      emails.map((email: string) =>
        resend.emails.send({
          from: "ActionVoc <onboarding@resend.dev>",
          to: email,
          subject,
          html,
        })
      )
    );

    const failed = sendResults.filter((r) => r.status === "rejected");
    if (failed.length > 0) {
      console.error("Some emails failed:", failed);
    }

    // Save recipients
    const now = new Date().toISOString();
    await supabaseAdmin.from("meeting_recipients").insert(
      emails.map((email: string) => ({
        meeting_id: meetingId,
        email,
        sent_at: now,
      }))
    );

    return NextResponse.json({ success: true, sent: emails.length - failed.length });
  } catch (error) {
    console.error("Send summary error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to send summary" },
      { status: 500 }
    );
  }
}
