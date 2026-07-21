"use client";

import Link from "next/link";
import { Clock, Users, Mail } from "lucide-react";
import { Meeting, Action, getActionStatus } from "@/types";
import { format } from "date-fns";

interface MeetingCardProps {
  meeting: Meeting & { actions?: Action[] };
  onSendSummary?: (meetingId: string) => void;
}

const typeBadgeColors: Record<string, string> = {
  internal: "bg-violet-50 text-violet-700",
  client: "bg-green-50 text-green-700",
  sales: "bg-orange-50 text-orange-700",
};

function formatDuration(seconds: number | null): string {
  if (!seconds) return "—";
  const m = Math.floor(seconds / 60);
  const h = Math.floor(m / 60);
  if (h > 0) return `${h}h ${m % 60}m`;
  return `${m}m`;
}

export default function MeetingCard({ meeting, onSendSummary }: MeetingCardProps) {
  const actions = meeting.actions || [];
  const overdue = actions.filter((a) => getActionStatus(a) === "overdue").length;
  const open = actions.filter((a) => a.status === "open" && getActionStatus(a) !== "overdue").length;
  const done = actions.filter((a) => a.status === "done").length;

  return (
    <Link href={`/meetings/${meeting.id}`} className="block">
      <div className="bg-white rounded-xl border border-stone-200 hover:border-stone-300 hover:shadow-sm transition-all p-5 cursor-pointer">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-stone-900 truncate">
                {meeting.title || "Untitled Meeting"}
              </h3>
              <span
                className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${
                  typeBadgeColors[meeting.type] || typeBadgeColors.internal
                }`}
              >
                {meeting.type.charAt(0).toUpperCase() + meeting.type.slice(1)}
              </span>
            </div>
            <div className="flex items-center gap-3 text-xs text-stone-500">
              <span>{format(new Date(meeting.created_at), "MMM d, yyyy")}</span>
              {meeting.duration_seconds && (
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {formatDuration(meeting.duration_seconds)}
                </span>
              )}
              {actions.length > 0 && (
                <span className="flex items-center gap-1">
                  <Users className="w-3 h-3" />
                  {Array.from(new Set(actions.map((a) => a.owner_name).filter(Boolean))).length} participants
                </span>
              )}
            </div>
          </div>

          <div className="flex-shrink-0" onClick={(e) => e.preventDefault()}>
            <button
              onClick={() => onSendSummary?.(meeting.id)}
              className="flex items-center gap-1 px-2.5 py-1.5 text-xs text-stone-600 border border-stone-200 rounded-lg hover:bg-[#f6f1ed] transition-colors"
            >
              <Mail className="w-3.5 h-3.5" />
              Send summary
            </button>
          </div>
        </div>

        {meeting.summary && (
          <p className="mt-3 text-sm text-stone-600 line-clamp-2">{meeting.summary}</p>
        )}

        {actions.length > 0 && (
          <div className="mt-3 flex items-center gap-2">
            {overdue > 0 && (
              <span className="text-xs px-2 py-0.5 bg-red-50 text-red-700 rounded-full">
                {overdue} overdue
              </span>
            )}
            {open > 0 && (
              <span className="text-xs px-2 py-0.5 bg-amber-50 text-amber-700 rounded-full">
                {open} open
              </span>
            )}
            {done > 0 && (
              <span className="text-xs px-2 py-0.5 bg-green-50 text-green-700 rounded-full">
                {done} done
              </span>
            )}
          </div>
        )}
      </div>
    </Link>
  );
}
