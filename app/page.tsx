"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Mic, ListChecks, Mail, ChevronRight, Check, Zap, Loader2 } from "lucide-react";

const features = [
  {
    step: "Step 1",
    icon: Mic,
    title: "Record & Transcribe",
    description:
      "Capture every word with AI-powered transcription. Never miss a key detail from your meetings.",
  },
  {
    step: "Step 2",
    icon: ListChecks,
    title: "Auto-detect action items",
    description:
      "Automatically identify tasks, owners, and deadlines directly from the conversation.",
  },
  {
    step: "Step 3",
    icon: Mail,
    title: "Send team summaries",
    description:
      "Deliver meeting recaps and follow-up reminders to your whole team in one click.",
  },
];

const freeFeatures = [
  "3 meetings included",
  "AI transcription",
  "Action item extraction",
  "Email summary",
];

const proFeatures = [
  "Unlimited meetings",
  "AI transcription",
  "Action item extraction",
  "Email summary",
  "Automated reminders",
  "Priority support",
];

export default function LandingPage() {
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  function scrollTo(id: string) {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  }

  async function handleProCheckout() {
    setCheckoutLoading(true);
    try {
      const res = await fetch("/api/stripe/checkout", { method: "POST" });
      if (res.status === 401) {
        window.location.href = "/signup";
        return;
      }
      const { url } = await res.json();
      if (url) window.location.href = url;
    } catch {
      setCheckoutLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#f6f1ed]">
      {/* Fixed header */}
      <header className="fixed top-0 inset-x-0 z-50 bg-[#f6f1ed]/90 backdrop-blur border-b border-stone-200">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Image src="/logo.png" alt="ActionVoc" width={32} height={32} />
            <span className="font-bold text-stone-900">ActionVoc</span>
          </Link>
          <nav className="flex items-center gap-3">
            <button
              onClick={() => scrollTo("pricing")}
              className="bg-[#24481f] text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-[#1b3617] transition-colors"
            >
              Pricing
            </button>
            <Link
              href="/login"
              className="bg-[#24481f] text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-[#1b3617] transition-colors"
            >
              Login
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="pt-36 pb-24 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl sm:text-6xl font-bold text-stone-900 leading-tight mb-5">
            Turn your meetings into<br />what gets done
          </h1>
          <p className="text-xl text-stone-500 mb-10 max-w-2xl mx-auto leading-relaxed">
            ActionVoc records, transcribes, and extracts action items from your meetings —
            then sends summaries to your team automatically.
          </p>
          <div className="flex items-center justify-center gap-3 flex-wrap">
            <Link
              href="/signup"
              id="cta-hero"
              className="inline-flex items-center gap-2 bg-[#24481f] text-white px-7 py-3.5 rounded-xl font-medium text-base hover:bg-[#1b3617] transition-colors shadow-sm"
            >
              Start for free
              <ChevronRight className="w-4 h-4" />
            </Link>
            <button
              onClick={() => scrollTo("how-it-works")}
              className="inline-flex items-center gap-2 bg-[#f6f1ed] text-[#24481f] px-7 py-3.5 rounded-xl font-medium text-base border border-[#24481f] hover:bg-[#ede8e3] transition-colors"
            >
              How does it work?
            </button>
          </div>

          <div className="mt-16 max-w-3xl mx-auto relative w-full aspect-video rounded-xl overflow-hidden shadow-lg">
            <iframe
              src="https://www.youtube.com/embed/PmlKqxEos5Y"
              title="ActionVoc Demo"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="w-full h-full"
            />
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="how-it-works" className="py-20 px-6 bg-white">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-stone-900 text-center mb-3">
            Everything you need after a meeting
          </h2>
          <p className="text-stone-500 text-center mb-12 max-w-xl mx-auto">
            From recording to action, ActionVoc handles the full post-meeting workflow
            so your team can focus on what matters.
          </p>
          <div className="grid md:grid-cols-3 gap-6">
            {features.map(({ step, icon: Icon, title, description }) => (
              <div
                key={title}
                className="bg-[#f6f1ed] rounded-xl p-6 border border-stone-200"
              >
                <div className="w-10 h-10 bg-[#24481f] rounded-lg flex items-center justify-center mb-3">
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <p className="text-xs font-bold text-[#24481f] uppercase tracking-widest mb-2">
                  {step}
                </p>
                <h3 className="font-semibold text-stone-900 mb-2">{title}</h3>
                <p className="text-stone-500 text-sm leading-relaxed">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-stone-900 text-center mb-3">
            Simple, transparent pricing
          </h2>
          <p className="text-stone-500 text-center mb-12 max-w-xl mx-auto">
            Start for free, upgrade when you&apos;re ready.
          </p>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Free */}
            <div className="bg-white rounded-xl border border-stone-200 p-8 shadow-sm flex flex-col">
              <div className="mb-6">
                <h3 className="text-xl font-bold text-stone-900 mb-1">Free</h3>
                <p className="text-stone-500 text-sm">Get started with no commitment</p>
              </div>
              <div className="mb-6">
                <span className="text-4xl font-bold text-stone-900">$0</span>
                <span className="text-stone-500 text-sm ml-1">/month</span>
              </div>
              <ul className="space-y-3 mb-8 flex-1">
                {freeFeatures.map((f) => (
                  <li key={f} className="flex items-center gap-2.5 text-sm text-stone-700">
                    <Check className="w-4 h-4 text-[#24481f] shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                href="/signup"
                id="cta-free"
                className="block w-full text-center border border-[#24481f] text-[#24481f] py-2.5 rounded-xl font-medium text-sm hover:bg-[#24481f]/5 transition-colors"
              >
                Get started for free
              </Link>
            </div>

            {/* Pro */}
            <div className="bg-white rounded-xl border-2 border-[#24481f] p-8 shadow-sm relative overflow-hidden flex flex-col">
              <div className="absolute top-4 right-4 bg-[#24481f] rounded-full px-3 py-0.5 text-xs text-white font-medium">
                Most popular
              </div>
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-1">
                  <Zap className="w-4 h-4 text-[#24481f]" />
                  <h3 className="text-xl font-bold text-stone-900">Pro</h3>
                </div>
                <p className="text-stone-500 text-sm">For teams that never stop moving</p>
              </div>
              <div className="mb-6">
                <span className="text-4xl font-bold text-stone-900">$15</span>
                <span className="text-stone-500 text-sm ml-1">/month</span>
              </div>
              <ul className="space-y-3 mb-8 flex-1">
                {proFeatures.map((f) => (
                  <li key={f} className="flex items-center gap-2.5 text-sm text-stone-700">
                    <Check className="w-4 h-4 text-[#24481f] shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <button
                id="cta-pro"
                onClick={handleProCheckout}
                disabled={checkoutLoading}
                className="w-full bg-[#24481f] text-white py-2.5 rounded-xl font-medium text-sm hover:bg-[#1b3617] transition-colors disabled:opacity-70 flex items-center justify-center gap-2"
              >
                {checkoutLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                {checkoutLoading ? "Redirecting..." : "Start Pro — $15/month"}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 border-t border-stone-200">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-stone-500">
          <span>© 2026 ActionVoc. All rights reserved.</span>
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
