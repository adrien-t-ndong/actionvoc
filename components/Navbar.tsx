"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { CheckSquare, Mic, ListChecks, Video, Zap, LogOut } from "lucide-react";
import UpgradeModal from "@/components/UpgradeModal";
import { createClient } from "@/lib/supabase/client";

interface NavbarProps {
  userInitials: string;
  userEmail?: string;
  userName?: string;
  plan?: "free" | "pro";
}

export default function Navbar({ userInitials, userEmail, userName, plan }: NavbarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const navItems = [
    { href: "/record", label: "New meeting", icon: Mic, dark: true },
    { href: "/actions", label: "Actions", icon: ListChecks },
    { href: "/meetings", label: "Meetings", icon: Video },
  ];

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  }

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

            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setShowDropdown((v) => !v)}
                className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 hover:ring-2 hover:ring-blue-200 transition-all"
                title={userEmail}
              >
                <span className="text-xs font-semibold text-blue-700">
                  {userInitials}
                </span>
              </button>

              {showDropdown && (
                <div className="absolute right-0 top-10 w-52 bg-white border border-stone-200 rounded-xl shadow-lg py-1 z-50">
                  <div className="px-4 py-2.5">
                    {userName && (
                      <p className="text-sm font-medium text-stone-900 truncate">{userName}</p>
                    )}
                    <p className="text-xs text-stone-400 truncate">{userEmail}</p>
                  </div>
                  <div className="border-t border-stone-100 my-1" />
                  <button
                    onClick={handleSignOut}
                    className="w-full flex items-center gap-2 px-4 py-2 text-sm text-stone-600 hover:bg-stone-50 hover:text-stone-900 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign out
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
