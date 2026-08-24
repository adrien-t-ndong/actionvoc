import Link from "next/link";
import { CheckSquare } from "lucide-react";

export default function LegalPage() {
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
          <h1 className="text-3xl font-bold text-stone-900 mb-2">Legal Notices</h1>
          <p className="text-stone-500 text-sm mb-10">Last updated: January 2026</p>

          <div className="bg-white rounded-xl border border-stone-200 p-8 space-y-8 text-sm text-stone-700 leading-relaxed">
            <section>
              <h2 className="font-semibold text-stone-900 mb-2">Publisher</h2>
              <p>
                ActionVoc is published and operated by its founder. For any inquiries,
                please contact us at{" "}
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
              <h2 className="font-semibold text-stone-900 mb-2">Hosting</h2>
              <p>
                This application is hosted on Vercel Inc., 340 Pine Street, Suite 900,
                San Francisco, CA 94104, USA.
              </p>
            </section>

            <section>
              <h2 className="font-semibold text-stone-900 mb-2">Intellectual Property</h2>
              <p>
                All content on this site — including but not limited to text, graphics,
                logos, and software — is the exclusive property of ActionVoc and is
                protected by applicable intellectual property laws. Any reproduction or
                distribution without prior written permission is strictly prohibited.
              </p>
            </section>

            <section>
              <h2 className="font-semibold text-stone-900 mb-2">Limitation of Liability</h2>
              <p>
                ActionVoc strives to provide accurate and up-to-date information but makes
                no warranties of any kind regarding the completeness or reliability of the
                content on this site. ActionVoc shall not be liable for any direct,
                indirect, or consequential damages arising from the use of this service.
              </p>
            </section>

            <section>
              <h2 className="font-semibold text-stone-900 mb-2">Governing Law</h2>
              <p>
                These legal notices are governed by applicable law. Any disputes shall be
                subject to the exclusive jurisdiction of the competent courts.
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
