"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ChevronRight, Mail, AlertCircle, Clock, CheckCircle2,
  Loader2, ExternalLink, Plus, X
} from "lucide-react";
import { Meeting, Action, getActionStatus } from "@/types";
import { createClient } from "@/lib/supabase/client";
import { format } from "date-fns";
import TaskRow from "@/components/TaskRow";
import SendSummaryModal from "@/components/SendSummaryModal";
import Toast from "@/components/Toast";

function formatDuration(seconds: number | null): string {
  if (!seconds) return "—";
  const m = Math.floor(seconds / 60);
  const h = Math.floor(m / 60);
  if (h > 0) return `${h}h ${m % 60}m`;
  return `${m}m`;
}

const typeBadgeColors: Record<string, string> = {
  internal: "bg-violet-50 text-violet-700",
  client: "bg-green-50 text-green-700",
  sales: "bg-orange-50 text-orange-700",
};

export default function MeetingDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [meeting, setMeeting] = useState<(Meeting & { actions?: Action[] }) | null>(null);
  const [loading, setLoading] = useState(true);
  const [showSummaryModal, setShowSummaryModal] = useState(false);
  const [sendingReminders, setSendingReminders] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [showAddAction, setShowAddAction] = useState(false);
  const [addingAction, setAddingAction] = useState(false);
  const [newAction, setNewAction] = useState({ title: "", owner_name: "", due_date: "", priority: "medium" as "high" | "medium" | "low" });

  const showToast = useCallback((message: string, type: "success" | "error") => {
    setToast({ message, type });
  }, []);

  useEffect(() => {
    fetchMeeting();
  }, [id]);

  async function fetchMeeting() {
    const supabase = createClient();
    const { data } = await supabase
      .from("meetings")
      .select("*, actions(*)")
      .eq("id", id)
      .single();

    setMeeting(data as Meeting & { actions?: Action[] });
    setLoading(false);
  }

  function handleActionUpdate(updated: Action) {
    setMeeting((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        actions: (prev.actions || []).map((a) => (a.id === updated.id ? updated : a)),
      };
    });
  }

  async function handleAddAction(e: React.FormEvent) {
    e.preventDefault();
    if (!newAction.title.trim()) return;
    setAddingAction(true);

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setAddingAction(false); return; }

    const { data, error } = await supabase
      .from("actions")
      .insert({
        meeting_id: id,
        user_id: user.id,
        title: newAction.title.trim(),
        owner_name: newAction.owner_name.trim() || null,
        due_date: newAction.due_date || null,
        priority: newAction.priority,
        status: "open",
      })
      .select()
      .single();

    setAddingAction(false);

    if (error || !data) {
      showToast("Failed to add action.", "error");
      return;
    }

    setMeeting((prev) => {
      if (!prev) return prev;
      return { ...prev, actions: [...(prev.actions || []), data as Action] };
    });
    setNewAction({ title: "", owner_name: "", due_date: "", priority: "medium" });
    setShowAddAction(false);
    showToast("Action added.", "success");
  }

  async function sendReminders() {
    setSendingReminders(true);
    try {
      const res = await fetch("/api/send-reminders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ meetingId: id }),
      });
      if (!res.ok) throw new Error("Failed to send reminders");
      showToast("Reminders sent successfully!", "success");
    } catch {
      showToast("Failed to send reminders.", "error");
    } finally {
      setSendingReminders(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-stone-400" />
      </div>
    );
  }

  if (!meeting) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-10 text-center text-stone-400">
        Meeting not found.
      </div>
    );
  }

  const actions = meeting.actions || [];
  const overdueActions = actions.filter((a) => getActionStatus(a) === "overdue");
  const openActions = actions.filter((a) => a.status === "open" && getActionStatus(a) !== "overdue");
  const doneActions = actions.filter((a) => a.status === "done");
  const participants = Array.from(new Set(actions.map((a) => a.owner_name).filter(Boolean))) as string[];

  const transcriptHighlights = (meeting.transcript || "")
    .split(/\n{2,}/)
    .filter(Boolean)
    .slice(0, 3);

  return (
    <div className="max-w-6xl mx-auto px-6 py-6">
      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}
      {showSummaryModal && (
        <SendSummaryModal
          meeting={meeting}
          onClose={() => setShowSummaryModal(false)}
          onSuccess={() => {
            setShowSummaryModal(false);
            showToast("Summary sent successfully!", "success");
          }}
        />
      )}

      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 text-sm text-stone-500 mb-5">
        <Link href="/meetings" className="hover:text-stone-900 transition-colors">Meetings</Link>
        <ChevronRight className="w-4 h-4" />
        <span className="text-stone-900 font-medium">{meeting.title || "Untitled Meeting"}</span>
      </div>

      <div className="flex gap-6">
        {/* Main content */}
        <div className="flex-1 min-w-0 space-y-5">
          {/* Header */}
          <div className="bg-white rounded-xl border border-stone-200 p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h1 className="text-xl font-bold text-stone-900">
                    {meeting.title || "Untitled Meeting"}
                  </h1>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${typeBadgeColors[meeting.type]}`}>
                    {meeting.type.charAt(0).toUpperCase() + meeting.type.slice(1)}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-sm text-stone-500">
                  <span>{format(new Date(meeting.created_at), "MMMM d, yyyy")}</span>
                  {meeting.duration_seconds && (
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {formatDuration(meeting.duration_seconds)}
                    </span>
                  )}
                </div>
                {participants.length > 0 && (
                  <div className="flex items-center gap-1.5 mt-2">
                    {participants.map((p) => (
                      <div
                        key={p}
                        className="flex items-center gap-1 px-2 py-0.5 bg-stone-100 rounded-full"
                        title={p}
                      >
                        <div className="w-4 h-4 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-xs text-blue-700">{p[0]?.toUpperCase()}</span>
                        </div>
                        <span className="text-xs text-stone-600">{p}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <button
                onClick={() => setShowSummaryModal(true)}
                className="flex items-center gap-1.5 px-3 py-2 text-sm bg-[#2d5a27] text-white rounded-lg hover:bg-[#24481f] transition-colors flex-shrink-0"
              >
                <Mail className="w-3.5 h-3.5" />
                Send summary
              </button>
            </div>
          </div>

          {/* Summary */}
          {meeting.summary && (
            <div className="bg-white rounded-xl border border-stone-200 p-5">
              <h2 className="text-sm font-semibold text-stone-700 mb-3">Summary</h2>
              <div className="bg-stone-100 rounded-lg p-4 space-y-2">
                {meeting.summary.split("\n").filter(Boolean).map((line, i) => (
                  <p key={i} className="text-sm text-stone-700 leading-relaxed">{line}</p>
                ))}
              </div>
            </div>
          )}

          {/* Key Decisions */}
          {(meeting.decisions || []).length > 0 && (
            <div className="bg-white rounded-xl border border-stone-200 p-5">
              <h2 className="text-sm font-semibold text-stone-700 mb-3">Key decisions</h2>
              <ul className="space-y-2">
                {(meeting.decisions || []).map((decision, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-stone-700">
                    <span className="text-[#2d5a27] mt-0.5 flex-shrink-0">●</span>
                    {decision}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Action items */}
          <div className="bg-white rounded-xl border border-stone-200 p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-stone-700">
                Action items
                {actions.length > 0 && (
                  <span className="ml-2 text-stone-400 font-normal">({actions.length})</span>
                )}
              </h2>
              {!showAddAction && (
                <button
                  onClick={() => setShowAddAction(true)}
                  className="flex items-center gap-1 text-xs text-[#2d5a27] hover:text-[#24481f] font-medium transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add action
                </button>
              )}
            </div>

            {actions.length > 0 && (
              <div className="space-y-2 mb-3">
                {actions.map((action) => (
                  <TaskRow
                    key={action.id}
                    action={action}
                    onUpdate={handleActionUpdate}
                    showMeetingRef={false}
                  />
                ))}
              </div>
            )}

            {showAddAction && (
              <form onSubmit={handleAddAction} className="border border-stone-200 rounded-xl p-4 bg-[#f6f1ed] space-y-3">
                <div>
                  <input
                    type="text"
                    placeholder="Action title *"
                    value={newAction.title}
                    onChange={(e) => setNewAction((p) => ({ ...p, title: e.target.value }))}
                    required
                    autoFocus
                    className="w-full px-3 py-2 text-sm border border-stone-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#2d5a27] focus:border-transparent"
                  />
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <input
                    type="text"
                    placeholder="Owner"
                    value={newAction.owner_name}
                    onChange={(e) => setNewAction((p) => ({ ...p, owner_name: e.target.value }))}
                    className="px-3 py-2 text-sm border border-stone-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#2d5a27] focus:border-transparent"
                  />
                  <input
                    type="date"
                    value={newAction.due_date}
                    onChange={(e) => setNewAction((p) => ({ ...p, due_date: e.target.value }))}
                    className="px-3 py-2 text-sm border border-stone-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#2d5a27] focus:border-transparent"
                  />
                  <select
                    value={newAction.priority}
                    onChange={(e) => setNewAction((p) => ({ ...p, priority: e.target.value as "high" | "medium" | "low" }))}
                    className="px-3 py-2 text-sm border border-stone-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#2d5a27] focus:border-transparent"
                  >
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>
                <div className="flex items-center gap-2 justify-end">
                  <button
                    type="button"
                    onClick={() => { setShowAddAction(false); setNewAction({ title: "", owner_name: "", due_date: "", priority: "medium" }); }}
                    className="flex items-center gap-1 px-3 py-1.5 text-sm text-stone-600 hover:text-stone-900 transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={addingAction || !newAction.title.trim()}
                    className="flex items-center gap-1.5 px-4 py-1.5 text-sm bg-[#2d5a27] text-white rounded-lg hover:bg-[#24481f] transition-colors disabled:opacity-60"
                  >
                    {addingAction ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                    Add
                  </button>
                </div>
              </form>
            )}

            {actions.length === 0 && !showAddAction && (
              <p className="text-sm text-stone-400 italic">No action items yet.</p>
            )}
          </div>

          {/* Transcript highlights */}
          {transcriptHighlights.length > 0 && (
            <div className="bg-white rounded-xl border border-stone-200 p-5">
              <h2 className="text-sm font-semibold text-stone-700 mb-3">Transcript highlights</h2>
              <div className="space-y-3">
                {transcriptHighlights.map((excerpt, i) => (
                  <div key={i} className="flex gap-3">
                    <div className="text-xs text-stone-400 font-mono pt-0.5 flex-shrink-0">
                      {String(Math.floor(i * 3)).padStart(2, "0")}:00
                    </div>
                    <p className="text-sm text-stone-600 leading-relaxed">{excerpt}</p>
                  </div>
                ))}
              </div>
              {meeting.transcript && meeting.transcript.length > 500 && (
                <details className="mt-3">
                  <summary className="text-xs text-[#2d5a27] cursor-pointer hover:underline">
                    Show full transcript
                  </summary>
                  <div className="mt-3 text-sm text-stone-600 whitespace-pre-wrap leading-relaxed">
                    {meeting.transcript}
                  </div>
                </details>
              )}
            </div>
          )}
        </div>

        {/* Aside */}
        <div className="w-64 flex-shrink-0 space-y-4">
          {/* Stats */}
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-white rounded-xl border border-stone-200 p-3 text-center">
              <p className="text-lg font-bold text-red-600">{overdueActions.length}</p>
              <p className="text-xs text-stone-500">Overdue</p>
            </div>
            <div className="bg-white rounded-xl border border-stone-200 p-3 text-center">
              <p className="text-lg font-bold text-amber-600">{openActions.length}</p>
              <p className="text-xs text-stone-500">Open</p>
            </div>
            <div className="bg-white rounded-xl border border-stone-200 p-3 text-center">
              <p className="text-lg font-bold text-green-600">{doneActions.length}</p>
              <p className="text-xs text-stone-500">Done</p>
            </div>
          </div>

          {/* Alert overdue */}
          {overdueActions.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="w-4 h-4 text-red-500" />
                <p className="text-sm font-medium text-red-700">
                  {overdueActions.length} actions overdue
                </p>
              </div>
              <p className="text-xs text-red-600 mb-3">
                {Array.from(new Set(overdueActions.map((a) => a.owner_name).filter(Boolean))).join(", ")}{" "}
                {overdueActions.length === 1 ? "hasn't" : "haven't"} been reminded.
              </p>
              <button
                onClick={sendReminders}
                disabled={sendingReminders}
                className="w-full flex items-center justify-center gap-1.5 text-xs font-medium text-red-700 bg-red-100 hover:bg-red-200 py-1.5 rounded-lg transition-colors"
              >
                {sendingReminders && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Send reminders now
              </button>
            </div>
          )}

          {/* By person */}
          {participants.length > 0 && (
            <div className="bg-white rounded-xl border border-stone-200 p-4">
              <h3 className="text-xs font-semibold text-stone-500 uppercase tracking-wider mb-3">
                By person
              </h3>
              <div className="space-y-2">
                {participants.map((person) => {
                  const personActions = actions.filter((a) => a.owner_name === person);
                  const personOverdue = personActions.filter((a) => getActionStatus(a) === "overdue").length;
                  const personOpen = personActions.filter((a) => a.status === "open").length;
                  const personDone = personActions.filter((a) => a.status === "done").length;

                  return (
                    <div key={person} className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <div className="w-5 h-5 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-xs text-blue-700">{person[0]?.toUpperCase()}</span>
                        </div>
                        <span className="text-sm text-stone-700">{person}</span>
                      </div>
                      <div className="flex gap-1">
                        {personOverdue > 0 && (
                          <span className="text-xs px-1.5 py-0.5 bg-red-50 text-red-700 rounded-full">
                            {personOverdue}
                          </span>
                        )}
                        {personOpen > 0 && (
                          <span className="text-xs px-1.5 py-0.5 bg-amber-50 text-amber-700 rounded-full">
                            {personOpen}
                          </span>
                        )}
                        {personDone > 0 && (
                          <span className="text-xs px-1.5 py-0.5 bg-green-50 text-green-700 rounded-full">
                            <CheckCircle2 className="w-3 h-3" />
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* View all actions */}
          <Link
            href="/actions"
            className="flex items-center justify-between px-4 py-3 bg-white rounded-xl border border-stone-200 hover:border-stone-300 transition-colors"
          >
            <span className="text-sm text-stone-700 font-medium">View all actions</span>
            <ExternalLink className="w-4 h-4 text-stone-400" />
          </Link>
        </div>
      </div>
    </div>
  );
}
