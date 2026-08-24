import Link from "next/link";
import { CheckSquare } from "lucide-react";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#f6f1ed]">
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

      <main className="pt-32 pb-24 px-6">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-3xl font-bold text-stone-900 mb-2">Privacy Policy</h1>
          <p className="text-stone-500 text-sm mb-10">Last updated: January 2026</p>

          <div className="bg-white rounded-xl border border-stone-200 p-8 space-y-8 text-sm text-stone-700 leading-relaxed">
            <section>
              <h2 className="font-semibold text-stone-900 mb-2">Data We Collect</h2>
              <p>
                When you use ActionVoc, we collect the following information:
              </p>
              <ul className="mt-2 space-y-1 list-disc list-inside text-stone-600">
                <li>Account information (name, email address, password hash)</li>
                <li>Meeting recordings and transcriptions you create</li>
                <li>Action items and summaries generated from your meetings</li>
                <li>Payment information processed securely via Stripe</li>
              </ul>
            </section>

            <section>
              <h2 className="font-semibold text-stone-900 mb-2">How We Use Your Data</h2>
              <p>
                We use your data solely to provide and improve the ActionVoc service:
                transcribing your recordings, extracting action items, and sending
                summaries to participants you designate. We do not sell your data to
                third parties.
              </p>
            </section>

            <section>
              <h2 className="font-semibold text-stone-900 mb-2">Data Storage & Security</h2>
              <p>
                Your data is stored securely on Supabase infrastructure. Audio recordings
                are processed by our AI provider and are not retained beyond the
                transcription process. We use industry-standard encryption for data
                in transit and at rest.
              </p>
            </section>

            <section>
              <h2 className="font-semibold text-stone-900 mb-2">Third-Party Services</h2>
              <p>We use the following third-party services:</p>
              <ul className="mt-2 space-y-1 list-disc list-inside text-stone-600">
                <li>Supabase — database and authentication</li>
                <li>Stripe — payment processing</li>
                <li>Vercel — application hosting</li>
                <li>OpenAI / Anthropic — AI transcription and analysis</li>
              </ul>
            </section>

            <section>
              <h2 className="font-semibold text-stone-900 mb-2">Your Rights</h2>
              <p>
                You have the right to access, correct, or delete your personal data at
                any time. To exercise these rights or to request account deletion, contact
                us at{" "}
                <a
                  href="mailto:adrient.ndong@gmail.com"
                  className="text-[#24481f] hover:underline"
                >
                  adrient.ndong@gmail.com
                </a>
                .
              </p>
            </section>

            <section>
              <h2 className="font-semibold text-stone-900 mb-2">Cookies</h2>
              <p>
                ActionVoc uses strictly necessary cookies to maintain your authenticated
                session. We do not use tracking or advertising cookies.
              </p>
            </section>

            <section>
              <h2 className="font-semibold text-stone-900 mb-2">Contact</h2>
              <p>
                For any privacy-related questions, contact us at{" "}
                <a
                  href="mailto:adrient.ndong@gmail.com"
                  className="text-[#24481f] hover:underline"
                >
                  adrient.ndong@gmail.com
                </a>
                .
              </p>
            </section>
          </div>
        </div>
      </main>

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
