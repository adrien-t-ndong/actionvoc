"use client";

import { useState } from "react";
import Link from "next/link";
import { CheckSquare, Check, Zap, Loader2 } from "lucide-react";

const freeFeatures = [
  "3 meetings included",
  "AI transcription",
  "Action item extraction",
  "Meeting summaries",
];

const proFeatures = [
  "Unlimited meetings",
  "AI transcription",
  "Action item extraction",
  "Meeting summaries",
  "Automated email reminders",
  "Priority support",
];

export default function PricingPage() {
  const [loading, setLoading] = useState(false);

  async function handleProCheckout() {
    setLoading(true);
    try {
      const res = await fetch("/api/stripe/checkout", { method: "POST" });
      if (res.status === 401) {
        window.location.href = "/signup";
        return;
      }
      const { url } = await res.json();
      if (url) window.location.href = url;
    } catch {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#f6f1ed]">
      {/* Fixed header */}
      <header className="fixed top-0 inset-x-0 z-50 bg-[#f6f1ed]/90 backdrop-blur border-b border-stone-200">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-[#24481f] rounded-lg flex items-center justify-center">
              <CheckSquare className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-stone-900">ActionVoc</span>
          </Link>
          <nav className="flex items-center gap-3">
            <Link
              href="/pricing"
              className="bg-[#24481f] text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-[#1b3617] transition-colors"
            >
              Pricing
            </Link>
            <Link
              href="/login"
              className="bg-[#24481f] text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-[#1b3617] transition-colors"
            >
              Login
            </Link>
          </nav>
        </div>
      </header>

      {/* Pricing content */}
      <main className="pt-32 pb-24 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-14">
            <h1 className="text-4xl font-bold text-stone-900 mb-3">Simple, honest pricing</h1>
            <p className="text-stone-500 text-lg max-w-xl mx-auto">
              Start for free. Upgrade when you need more.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Free plan */}
            <div className="bg-white rounded-xl border border-stone-200 p-8 shadow-sm">
              <div className="mb-6">
                <h2 className="text-xl font-bold text-stone-900 mb-1">Free</h2>
                <p className="text-stone-500 text-sm">Get started with no commitment</p>
              </div>
              <div className="mb-6">
                <span className="text-4xl font-bold text-stone-900">$0</span>
                <span className="text-stone-500 text-sm ml-1">/month</span>
              </div>
              <ul className="space-y-3 mb-8">
                {freeFeatures.map((feature) => (
                  <li key={feature} className="flex items-center gap-2.5 text-sm text-stone-700">
                    <Check className="w-4 h-4 text-[#24481f] shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>
              <Link
                href="/signup"
                className="block w-full text-center border border-[#24481f] text-[#24481f] py-2.5 rounded-xl font-medium text-sm hover:bg-[#24481f]/5 transition-colors"
              >
                Get started free
              </Link>
            </div>

            {/* Pro plan */}
            <div className="bg-[#24481f] rounded-xl p-8 shadow-sm relative overflow-hidden">
              <div className="absolute top-4 right-4 bg-white/20 rounded-full px-3 py-0.5 text-xs text-white font-medium">
                Most popular
              </div>
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-1">
                  <Zap className="w-4 h-4 text-white" />
                  <h2 className="text-xl font-bold text-white">Pro</h2>
                </div>
                <p className="text-white/60 text-sm">For teams that never stop moving</p>
              </div>
              <div className="mb-6">
                <span className="text-4xl font-bold text-white">$15</span>
                <span className="text-white/60 text-sm ml-1">/month</span>
              </div>
              <ul className="space-y-3 mb-8">
                {proFeatures.map((feature) => (
                  <li key={feature} className="flex items-center gap-2.5 text-sm text-white">
                    <Check className="w-4 h-4 text-white/80 shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>
              <button
                onClick={handleProCheckout}
                disabled={loading}
                className="w-full bg-white text-[#24481f] py-2.5 rounded-xl font-medium text-sm hover:bg-stone-100 transition-colors disabled:opacity-70 flex items-center justify-center gap-2"
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                {loading ? "Redirecting..." : "Get Pro — $15/month"}
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-8 px-6 border-t border-stone-200">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-stone-500">
          <span>© 2025 ActionVoc. All rights reserved.</span>
          <nav className="flex items-center gap-6">
            <Link href="/legal" className="hover:text-stone-900 transition-colors">
              Legal
            </Link>
            <Link href="/privacy" className="hover:text-stone-900 transition-colors">
              Privacy Policy
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
