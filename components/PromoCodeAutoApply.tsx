"use client";

import { useEffect, useState } from "react";
import Toast from "@/components/Toast";

export default function PromoCodeAutoApply() {
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  useEffect(() => {
    const pendingCode = localStorage.getItem("pendingPromoCode");
    if (!pendingCode) return;

    // Remove immediately to prevent double-apply on re-render
    localStorage.removeItem("pendingPromoCode");

    fetch("/api/redeem-code", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: pendingCode }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setToast({ message: data.message, type: "success" });
        }
        // Silently ignore errors for auto-apply (code may have expired, been used, etc.)
      })
      .catch(() => {
        // Network errors ignored for auto-apply
      });
  }, []);

  if (!toast) return null;

  return (
    <Toast
      message={toast.message}
      type={toast.type}
      onClose={() => setToast(null)}
    />
  );
}
