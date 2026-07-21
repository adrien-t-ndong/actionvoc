"use client";

import { useState } from "react";
import { X, Zap, Loader2 } from "lucide-react";

interface UpgradeModalProps {
  onClose: () => void;
}

const FEATURES = [
  "Unlimited meetings",
  "All action items",
  "Email summaries",
  "Priority support",
];

export default function UpgradeModal({ onClose }: UpgradeModalProps) {
  const [loading, setLoading] = useState(false);

  async function handleUpgrade() {
    setLoading(true);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const { url } = await res.json();
      if (url) window.location.href = url;
    } catch {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl border border-stone-200 shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between p-5 border-b border-stone-100">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-500" />
            <h2 className="font-semibold text-stone-900">Upgrade to Pro</h2>
          </div>
          <button onClick={onClose} className="text-stone-400 hover:text-stone-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <p className="text-stone-600 text-sm">
            You&apos;ve used all 3 meetings on your free plan. Upgrade to Pro for unlimited meetings.
          </p>

          <div className="bg-green-50 rounded-xl p-4 border border-green-100">
            <div className="flex items-baseline gap-1 mb-3">
              <span className="text-3xl font-bold text-stone-900">$15</span>
              <span className="text-stone-500 text-sm">/month</span>
            </div>
            <ul className="space-y-2 text-sm text-stone-700">
              {FEATURES.map((feature) => (
                <li key={feature} className="flex items-center gap-2">
                  <span className="text-[#2d5a27]">✓</span>
                  {feature}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 p-5 border-t border-stone-100">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-stone-600 hover:text-stone-900"
          >
            Maybe later
          </button>
          <button
            onClick={handleUpgrade}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-[#2d5a27] text-white text-sm rounded-lg hover:bg-[#24481f] transition-colors disabled:opacity-60"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {loading ? "Redirecting..." : "Upgrade — $15/month"}
          </button>
        </div>
      </div>
    </div>
  );
}
