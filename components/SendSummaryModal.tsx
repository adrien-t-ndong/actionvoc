"use client";

import { useState } from "react";
import { X, Mail, Send, Loader2, Plus } from "lucide-react";
import { Meeting } from "@/types";

interface SendSummaryModalProps {
  meeting: Meeting;
  onClose: () => void;
  onSuccess: () => void;
}

export default function SendSummaryModal({ meeting, onClose, onSuccess }: SendSummaryModalProps) {
  const [emails, setEmails] = useState<string[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function addEmail() {
    const email = inputValue.trim();
    if (email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && !emails.includes(email)) {
      setEmails([...emails, email]);
      setInputValue("");
    }
  }

  function removeEmail(email: string) {
    setEmails(emails.filter((e) => e !== email));
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addEmail();
    }
  }

  async function handleSend() {
    if (emails.length === 0) {
      setError("Add at least one recipient.");
      return;
    }
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/send-summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ meetingId: meeting.id, emails }),
      });

      if (!res.ok) throw new Error("Failed to send summary.");
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl border border-stone-200 shadow-xl w-full max-w-lg">
        <div className="flex items-center justify-between p-5 border-b border-stone-100">
          <div className="flex items-center gap-2">
            <Mail className="w-4 h-4 text-[#2d5a27]" />
            <h2 className="font-semibold text-stone-900">Send meeting summary</h2>
          </div>
          <button onClick={onClose} className="text-stone-400 hover:text-stone-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-2">Recipients</label>
            <div className="border border-stone-200 rounded-lg p-2 min-h-12 flex flex-wrap gap-1.5">
              {emails.map((email) => (
                <span
                  key={email}
                  className="flex items-center gap-1 text-xs px-2 py-1 bg-green-50 text-green-700 rounded-full"
                >
                  {email}
                  <button onClick={() => removeEmail(email)}>
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
              <div className="flex items-center gap-1 flex-1">
                <input
                  type="email"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Add email address..."
                  className="flex-1 min-w-32 text-sm outline-none bg-transparent"
                />
                <button
                  onClick={addEmail}
                  className="p-1 text-stone-400 hover:text-[#2d5a27]"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
            <p className="text-xs text-stone-400 mt-1">Press Enter or comma to add an email</p>
          </div>

          <div className="bg-[#f6f1ed] rounded-lg p-4 text-sm">
            <p className="font-medium text-stone-700 mb-2">Email preview</p>
            <div className="space-y-1 text-stone-600">
              <p><strong>Subject:</strong> Meeting Summary — {meeting.title || "Untitled Meeting"}</p>
              <p className="mt-2 text-xs text-stone-500">
                The email will include: the summary, key decisions, and all action items with owners and due dates.
              </p>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 text-red-700 text-sm px-3 py-2 rounded-lg border border-red-200">
              {error}
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 p-5 border-t border-stone-100">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-stone-600 hover:text-stone-900 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSend}
            disabled={loading || emails.length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-[#2d5a27] text-white text-sm rounded-lg hover:bg-[#24481f] transition-colors disabled:opacity-60"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
            {loading ? "Sending..." : "Send summary"}
          </button>
        </div>
      </div>
    </div>
  );
}
