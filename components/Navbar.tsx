"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { CheckSquare, Mic, ListChecks, Video, Zap } from "lucide-react";
import UpgradeModal from "@/components/UpgradeModal";

interface NavbarProps {
  userInitials: string;
  userEmail?: string;
  plan?: "free" | "pro";
}

export default function Navbar({ userInitials, userEmail, plan }: NavbarProps) {
  const pathname = usePathname();
  const [showUpgrade, setShowUpgrade] = useState(false);

  const navItems = [
    { href: "/record", label: "New meeting", icon: Mic, dark: true },
    { href: "/actions", label: "Actions", icon: ListChecks },
    { href: "/meetings", label: "Meetings", icon: Video },
  ];

  return (
    <nav className="bg-white border-b border-stone-200 sticky top-0 z-50">
      {showUpgrade && <UpgradeModal onClose={() => setShowUpgrade(false)} />}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          <Link href="/record" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-[#2d5a27] rounded-lg flex items-center justify-center flex-shrink-0">
              <CheckSquare className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-stone-900 text-sm">ActionVoc</span>
          </Link>

          <div className="flex items-center gap-1">
            {navItems.map(({ href, label, icon: Icon, dark }) => {
              const isActive = pathname === href || pathname.startsWith(href + "/");
              return (
                <Link
                  key={href}
                  href={href}
                  className={`flex items-center gap-1.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-green-50 text-green-800 px-3 py-1.5"
                      : dark
                      ? "bg-[#24481f] text-white hover:bg-[#1d3a19] px-4 py-2"
                      : "text-stone-500 hover:text-stone-900 hover:bg-stone-100 px-3 py-1.5"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </Link>
              );
            })}
          </div>

          <div className="flex items-center gap-2">
            {plan === "free" && (
              <button
                onClick={() => setShowUpgrade(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-lg transition-colors"
              >
                <Zap className="w-3.5 h-3.5" />
                Upgrade to Pro
              </button>
            )}
            <div
              className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0"
              title={userEmail}
            >
              <span className="text-xs font-semibold text-blue-700">
                {userInitials}
              </span>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
