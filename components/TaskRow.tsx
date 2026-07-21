"use client";

import { useState } from "react";
import Link from "next/link";
import { Bell, ExternalLink, Calendar } from "lucide-react";
import { Action, getActionStatus } from "@/types";
import { createClient } from "@/lib/supabase/client";
import { format } from "date-fns";

interface TaskRowProps {
  action: Action;
  onUpdate?: (updated: Action) => void;
  showMeetingRef?: boolean;
}

const priorityColors: Record<string, string> = {
  high: "text-red-600",
  medium: "text-amber-600",
  low: "text-stone-400",
};

export default function TaskRow({ action, onUpdate, showMeetingRef = true }: TaskRowProps) {
  const [loading, setLoading] = useState(false);
  const status = getActionStatus(action);

  async function toggleStatus() {
    setLoading(true);
    const supabase = createClient();
    const newStatus = action.status === "done" ? "open" : "done";
    const { data, error } = await supabase
      .from("actions")
      .update({ status: newStatus })
      .eq("id", action.id)
      .select()
      .single();

    setLoading(false);
    if (!error && data && onUpdate) {
      onUpdate(data as Action);
    }
  }

  async function sendReminder() {
    setLoading(true);
    try {
      await fetch("/api/send-reminders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ actionId: action.id }),
      });
    } finally {
      setLoading(false);
    }
  }

  const accentClass =
    status === "overdue"
      ? "border-l-4 border-red-400"
      : status === "today"
      ? "border-l-4 border-amber-400"
      : "";

  const dateBadgeClass =
    status === "overdue"
      ? "bg-red-50 text-red-700"
      : status === "today"
      ? "bg-amber-50 text-amber-700"
      : status === "done"
      ? "bg-green-50 text-green-700"
      : "bg-stone-100 text-stone-600";

  return (
    <div
      className={`flex items-center gap-3 px-4 py-3 bg-white rounded-xl border border-stone-200 hover:border-stone-300 transition-colors ${accentClass}`}
    >
      <button
        onClick={toggleStatus}
        disabled={loading}
        className={`w-5 h-5 rounded border-2 flex-shrink-0 flex items-center justify-center transition-colors ${
          action.status === "done"
            ? "bg-[#2d5a27] border-[#2d5a27]"
            : "border-stone-300 hover:border-[#2d5a27]"
        }`}
      >
        {action.status === "done" && (
          <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        )}
      </button>

      <div className="flex-1 min-w-0">
        <p
          className={`text-sm font-medium truncate ${
            action.status === "done" ? "line-through text-stone-400" : "text-stone-900"
          }`}
        >
          {action.title}
        </p>
        <div className="flex items-center gap-1.5 mt-1 flex-wrap">
          {action.owner_name && (
            <span className="text-xs px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full">
              {action.owner_name}
            </span>
          )}
          {showMeetingRef && action.meetings && (
            <Link
              href={`/meetings/${action.meeting_id}`}
              className="text-xs px-2 py-0.5 bg-violet-50 text-violet-700 rounded-full hover:bg-violet-100 transition-colors"
            >
              {action.meetings.title || "Untitled meeting"}
            </Link>
          )}
          {action.due_date && (
            <span className={`text-xs px-2 py-0.5 rounded-full flex items-center gap-1 ${dateBadgeClass}`}>
              <Calendar className="w-3 h-3" />
              {format(new Date(action.due_date), "MMM d")}
            </span>
          )}
          {action.priority && (
            <span className={`text-xs font-medium ${priorityColors[action.priority]}`}>
              {action.priority}
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-1 flex-shrink-0">
        <button
          onClick={sendReminder}
          title="Send reminder"
          className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-lg transition-colors"
        >
          <Bell className="w-3.5 h-3.5" />
        </button>
        {action.meeting_id && (
          <Link
            href={`/meetings/${action.meeting_id}`}
            title="Open meeting"
            className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-lg transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        )}
      </div>
    </div>
  );
}
