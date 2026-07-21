"use client";

import { useState, useEffect, useCallback } from "react";
import { AlertTriangle, CheckCircle2, Clock, AlertCircle, Users, Loader2 } from "lucide-react";
import { Action, getActionStatus } from "@/types";
import { createClient } from "@/lib/supabase/client";
import TaskRow from "@/components/TaskRow";
import Toast from "@/components/Toast";

type FilterView = "all" | "mine" | "this-week";
type SidebarFilter = "all" | "overdue" | "today" | "completed" | string;

export default function ActionsPage() {
  const [actions, setActions] = useState<Action[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterView>("all");
  const [sidebarFilter, setSidebarFilter] = useState<SidebarFilter>("all");
  const [sendingReminders, setSendingReminders] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const showToast = useCallback((message: string, type: "success" | "error") => {
    setToast({ message, type });
  }, []);

  useEffect(() => {
    async function fetchActions() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from("actions")
        .select("*, meetings(id, title)")
        .eq("user_id", user.id)
        .order("due_date", { ascending: true });

      setActions((data as Action[]) || []);
      setLoading(false);
    }

    fetchActions();
  }, []);

  function handleUpdate(updated: Action) {
    setActions((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
  }

  async function sendAllReminders() {
    setSendingReminders(true);
    try {
      const res = await fetch("/api/send-reminders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      if (!res.ok) throw new Error("Failed to send reminders");
      showToast("Reminders sent to all overdue action owners.", "success");
    } catch {
      showToast("Failed to send reminders. Please try again.", "error");
    } finally {
      setSendingReminders(false);
    }
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const weekEnd = new Date(today);
  weekEnd.setDate(weekEnd.getDate() + 7);

  const overdueActions = actions.filter((a) => getActionStatus(a) === "overdue");
  const todayActions = actions.filter((a) => getActionStatus(a) === "today");
  const completedThisWeek = actions.filter(
    (a) => a.status === "done" && new Date(a.created_at) >= today
  );

  const uniqueOwners = Array.from(new Set(actions.map((a) => a.owner_name).filter(Boolean))) as string[];

  function getFilteredActions(): Action[] {
    let filtered = actions;

    if (filter === "this-week") {
      filtered = filtered.filter(
        (a) => a.due_date && new Date(a.due_date) <= weekEnd && a.status === "open"
      );
    }

    if (sidebarFilter === "overdue") filtered = filtered.filter((a) => getActionStatus(a) === "overdue");
    else if (sidebarFilter === "today") filtered = filtered.filter((a) => getActionStatus(a) === "today");
    else if (sidebarFilter === "completed") filtered = filtered.filter((a) => a.status === "done");
    else if (sidebarFilter !== "all") filtered = filtered.filter((a) => a.owner_name === sidebarFilter);

    return filtered;
  }

  const filteredActions = getFilteredActions();

  const grouped = {
    overdue: filteredActions.filter((a) => getActionStatus(a) === "overdue"),
    today: filteredActions.filter((a) => getActionStatus(a) === "today"),
    upcoming: filteredActions.filter((a) => getActionStatus(a) === "upcoming"),
    done: filteredActions.filter((a) => getActionStatus(a) === "done"),
  };

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

      {/* Sidebar */}
      <div className="w-52 border-r border-stone-200 bg-white p-4 flex-shrink-0 overflow-y-auto">
        <p className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-2">My tasks</p>
        <div className="space-y-0.5 mb-4">
          {[
            { key: "all", label: "All actions", count: actions.length },
            { key: "overdue", label: "Overdue", count: overdueActions.length, red: overdueActions.length > 0 },
            { key: "today", label: "Due today", count: todayActions.length },
            { key: "completed", label: "Completed", count: actions.filter((a) => a.status === "done").length },
          ].map(({ key, label, count, red }) => (
            <button
              key={key}
              onClick={() => setSidebarFilter(key)}
              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-sm transition-colors ${
                sidebarFilter === key
                  ? "bg-green-50 text-green-800 font-medium"
                  : "text-stone-600 hover:bg-[#f6f1ed]"
              }`}
            >
              <span>{label}</span>
              <span className={`text-xs ${red ? "text-red-600 font-semibold" : "text-stone-400"}`}>
                {count}
              </span>
            </button>
          ))}
        </div>

        {uniqueOwners.length > 0 && (
          <>
            <p className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-2">Team</p>
            <div className="space-y-0.5">
              {uniqueOwners.map((owner) => {
                const ownerCount = actions.filter(
                  (a) => a.owner_name === owner && a.status === "open"
                ).length;
                return (
                  <button
                    key={owner}
                    onClick={() => setSidebarFilter(owner)}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-sm transition-colors ${
                      sidebarFilter === owner
                        ? "bg-green-50 text-green-800 font-medium"
                        : "text-stone-600 hover:bg-[#f6f1ed]"
                    }`}
                  >
                    <span className="flex items-center gap-1.5">
                      <div className="w-5 h-5 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-xs text-blue-700 font-medium">
                          {owner[0]?.toUpperCase()}
                        </span>
                      </div>
                      <span className="truncate">{owner}</span>
                    </span>
                    {ownerCount > 0 && (
                      <span className="text-xs text-stone-400">{ownerCount}</span>
                    )}
                  </button>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Main */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-3xl mx-auto space-y-5">
          {/* Header */}
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold text-stone-900">All actions</h1>
            <div className="flex gap-1">
              {(["all", "mine", "this-week"] as FilterView[]).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                    filter === f
                      ? "bg-stone-900 text-white"
                      : "text-stone-500 hover:text-stone-900 hover:bg-stone-100"
                  }`}
                >
                  {f === "all" ? "All team" : f === "mine" ? "Assigned to me" : "This week"}
                </button>
              ))}
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white rounded-xl border border-stone-200 p-4">
              <div className="flex items-center gap-2 mb-1">
                <Clock className="w-4 h-4 text-amber-500" />
                <span className="text-xs text-stone-500 font-medium">Open</span>
              </div>
              <p className="text-2xl font-bold text-stone-900">
                {actions.filter((a) => a.status === "open").length}
              </p>
            </div>
            <div className="bg-white rounded-xl border border-stone-200 p-4">
              <div className="flex items-center gap-2 mb-1">
                <AlertCircle className="w-4 h-4 text-red-500" />
                <span className="text-xs text-stone-500 font-medium">Overdue</span>
              </div>
              <p className="text-2xl font-bold text-red-600">{overdueActions.length}</p>
            </div>
            <div className="bg-white rounded-xl border border-stone-200 p-4">
              <div className="flex items-center gap-2 mb-1">
                <CheckCircle2 className="w-4 h-4 text-green-500" />
                <span className="text-xs text-stone-500 font-medium">Done this week</span>
              </div>
              <p className="text-2xl font-bold text-green-600">{completedThisWeek.length}</p>
            </div>
          </div>

          {/* Overdue banner */}
          {overdueActions.length > 0 && (
            <div className="flex items-center justify-between gap-4 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                <p className="text-sm text-amber-800">
                  <strong>{overdueActions.length} actions are overdue</strong> — your team hasn&apos;t been reminded yet.
                </p>
              </div>
              <button
                onClick={sendAllReminders}
                disabled={sendingReminders}
                className="flex items-center gap-1.5 text-sm font-medium text-amber-700 hover:text-amber-900 whitespace-nowrap"
              >
                {sendingReminders ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : null}
                Send reminders →
              </button>
            </div>
          )}

          {/* Action groups */}
          {Object.entries(grouped).map(([group, items]) => {
            if (items.length === 0) return null;
            const labels: Record<string, { label: string; icon: React.ReactNode }> = {
              overdue: { label: "Overdue", icon: <AlertCircle className="w-4 h-4 text-red-500" /> },
              today: { label: "Due today", icon: <Clock className="w-4 h-4 text-amber-500" /> },
              upcoming: { label: "Upcoming", icon: <Users className="w-4 h-4 text-stone-400" /> },
              done: { label: "Completed", icon: <CheckCircle2 className="w-4 h-4 text-green-500" /> },
            };
            const { label, icon } = labels[group];

            return (
              <div key={group}>
                <div className="flex items-center gap-2 mb-2">
                  {icon}
                  <h2 className="text-sm font-semibold text-stone-700">{label}</h2>
                  <span className="text-xs text-stone-400">({items.length})</span>
                </div>
                <div className="space-y-2">
                  {items.map((action) => (
                    <TaskRow
                      key={action.id}
                      action={action}
                      onUpdate={handleUpdate}
                      showMeetingRef={true}
                    />
                  ))}
                </div>
              </div>
            );
          })}

          {filteredActions.length === 0 && (
            <div className="text-center py-16 text-stone-400">
              <CheckCircle2 className="w-10 h-10 mx-auto mb-3 opacity-40" />
              <p className="font-medium">All caught up!</p>
              <p className="text-sm">No action items to show.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
