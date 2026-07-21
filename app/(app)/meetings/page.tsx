"use client";

import { useState, useEffect, useCallback } from "react";
import { Search, Loader2, Video } from "lucide-react";
import { Meeting, Action } from "@/types";
import { createClient } from "@/lib/supabase/client";
import { format } from "date-fns";
import MeetingCard from "@/components/MeetingCard";
import SendSummaryModal from "@/components/SendSummaryModal";
import Toast from "@/components/Toast";

type MeetingType = "all" | "internal" | "client" | "sales";

export default function MeetingsPage() {
  const [meetings, setMeetings] = useState<(Meeting & { actions?: Action[] })[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<MeetingType>("all");
  const [summaryMeetingId, setSummaryMeetingId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const showToast = useCallback((message: string, type: "success" | "error") => {
    setToast({ message, type });
  }, []);

  useEffect(() => {
    fetchMeetings();
  }, []);

  async function fetchMeetings() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("meetings")
      .select("*, actions(*)")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    setMeetings((data as (Meeting & { actions?: Action[] })[]) || []);
    setLoading(false);
  }

  const filteredMeetings = meetings.filter((m) => {
    if (typeFilter !== "all" && m.type !== typeFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        m.title?.toLowerCase().includes(q) ||
        m.summary?.toLowerCase().includes(q) ||
        m.transcript?.toLowerCase().includes(q) ||
        (m.decisions || []).some((d) => d.toLowerCase().includes(q))
      );
    }
    return true;
  });

  // Group by month
  const grouped = filteredMeetings.reduce<Record<string, typeof filteredMeetings>>((acc, m) => {
    const key = format(new Date(m.created_at), "MMMM yyyy");
    if (!acc[key]) acc[key] = [];
    acc[key].push(m);
    return acc;
  }, {});

  const allParticipants = Array.from(
    new Set(
      meetings.flatMap((m) =>
        (m.actions || []).map((a) => a.owner_name).filter(Boolean)
      )
    )
  ) as string[];

  const selectedMeeting = summaryMeetingId
    ? meetings.find((m) => m.id === summaryMeetingId)
    : null;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-stone-400" />
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-56px)]">
      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}
      {selectedMeeting && (
        <SendSummaryModal
          meeting={selectedMeeting}
          onClose={() => setSummaryMeetingId(null)}
          onSuccess={() => {
            setSummaryMeetingId(null);
            showToast("Summary sent successfully!", "success");
          }}
        />
      )}

      {/* Sidebar */}
      <div className="w-52 border-r border-stone-200 bg-white p-4 flex-shrink-0 overflow-y-auto">
        <p className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-2">Filter by type</p>
        <div className="space-y-0.5 mb-4">
          {(["all", "internal", "client", "sales"] as MeetingType[]).map((type) => {
            const count = type === "all" ? meetings.length : meetings.filter((m) => m.type === type).length;
            return (
              <button
                key={type}
                onClick={() => setTypeFilter(type)}
                className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-sm transition-colors ${
                  typeFilter === type
                    ? "bg-green-50 text-green-800 font-medium"
                    : "text-stone-600 hover:bg-[#f6f1ed]"
                }`}
              >
                <span>{type === "all" ? "All meetings" : type.charAt(0).toUpperCase() + type.slice(1)}</span>
                <span className="text-xs text-stone-400">{count}</span>
              </button>
            );
          })}
        </div>

        {allParticipants.length > 0 && (
          <>
            <p className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-2">Filter by person</p>
            <div className="space-y-0.5">
              {allParticipants.map((person) => (
                <button
                  key={person}
                  onClick={() => setSearch(person)}
                  className="w-full flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-sm text-stone-600 hover:bg-[#f6f1ed] transition-colors"
                >
                  <div className="w-5 h-5 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-xs text-blue-700 font-medium">{person[0]?.toUpperCase()}</span>
                  </div>
                  <span className="truncate">{person}</span>
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Main */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-3xl mx-auto space-y-5">
          <h1 className="text-xl font-bold text-stone-900">Meetings</h1>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search meetings, summaries, decisions..."
              className="w-full pl-9 pr-3 py-2.5 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#2d5a27] focus:border-transparent bg-white"
            />
          </div>

          {Object.entries(grouped).length === 0 ? (
            <div className="text-center py-16 text-stone-400">
              <Video className="w-10 h-10 mx-auto mb-3 opacity-40" />
              <p className="font-medium">No meetings yet</p>
              <p className="text-sm">Record your first meeting to get started.</p>
            </div>
          ) : (
            Object.entries(grouped).map(([month, monthMeetings]) => (
              <div key={month}>
                <h2 className="text-sm font-semibold text-stone-500 mb-3">{month}</h2>
                <div className="space-y-3">
                  {monthMeetings.map((meeting) => (
                    <MeetingCard
                      key={meeting.id}
                      meeting={meeting}
                      onSendSummary={(id) => setSummaryMeetingId(id)}
                    />
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
