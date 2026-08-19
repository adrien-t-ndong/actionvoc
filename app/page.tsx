import Link from "next/link";
import { CheckSquare, Mic, ListChecks, Mail, ChevronRight, Play } from "lucide-react";

const features = [
  {
    icon: Mic,
    title: "Record & Transcribe",
    description:
      "Capture every word with AI-powered transcription. Never miss a key detail from your meetings.",
  },
  {
    icon: ListChecks,
    title: "Auto-detect action items",
    description:
      "Automatically identify tasks, owners, and deadlines directly from the conversation.",
  },
  {
    icon: Mail,
    title: "Send team summaries",
    description:
      "Deliver meeting recaps and follow-up reminders to your whole team in one click.",
  },
];

export default function LandingPage() {
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

      {/* Hero */}
      <section className="pt-36 pb-24 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl sm:text-6xl font-bold text-stone-900 leading-tight mb-5">
            Your meetings deserve<br />better follow-ups
          </h1>
          <p className="text-xl text-stone-500 mb-10 max-w-2xl mx-auto leading-relaxed">
            ActionVoc records, transcribes, and extracts action items from your meetings —
            then sends summaries to your team automatically.
          </p>
          <Link
            href="/signup"
            className="inline-flex items-center gap-2 bg-[#24481f] text-white px-7 py-3.5 rounded-xl font-medium text-base hover:bg-[#1b3617] transition-colors shadow-sm"
          >
            Start for free
            <ChevronRight className="w-4 h-4" />
          </Link>

          {/* Video placeholder — replace inner content with <iframe src="https://www.youtube.com/embed/YOUR_ID" ... /> */}
          <div className="mt-16 relative rounded-2xl overflow-hidden bg-stone-900 aspect-video max-w-3xl mx-auto shadow-2xl">
            <div className="absolute inset-0 bg-gradient-to-br from-[#24481f]/40 to-stone-900/70" />
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm border border-white/30 hover:bg-white/30 transition-colors cursor-pointer">
                <Play className="w-6 h-6 text-white ml-1" fill="white" />
              </div>
              <p className="text-white/60 text-sm">Watch the 2-min demo</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-stone-900 text-center mb-3">
            Everything you need after a meeting
          </h2>
          <p className="text-stone-500 text-center mb-12 max-w-xl mx-auto">
            From recording to action, ActionVoc handles the full post-meeting workflow
            so your team can focus on what matters.
          </p>
          <div className="grid md:grid-cols-3 gap-6">
            {features.map(({ icon: Icon, title, description }) => (
              <div
                key={title}
                className="bg-[#f6f1ed] rounded-xl p-6 border border-stone-200"
              >
                <div className="w-10 h-10 bg-[#24481f] rounded-lg flex items-center justify-center mb-4">
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <h3 className="font-semibold text-stone-900 mb-2">{title}</h3>
                <p className="text-stone-500 text-sm leading-relaxed">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

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
