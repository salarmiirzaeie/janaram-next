"use client";

import { useEffect, useState } from "react";
import {
  Headphones,
  Phone,
  MessageCircle,
  Mail,
  ChevronLeft,
  X,
} from "lucide-react";

const SUPPORT_PHONE = "+989962424172";
const SUPPORT_BALE_URL = "https://ble.ir/janaram_support";
const SUPPORT_EMAIL = "support@janaram.com";
const SUPPORT_EMAIL_LABEL = "info@janaram.ir";

type SupportOption = {
  id: string;
  title: string;
  subtitle: string;
  href: string;
  icon: React.ReactNode;
  iconBg: string;
};

const supportOptions: SupportOption[] = [
  {
    id: "call",
    title: "تماس تلفنی",
    subtitle: "پشتیبانی ۲۴ ساعته",
    href: `tel:${SUPPORT_PHONE}`,
    icon: <Phone className="w-5 h-5 text-blue-600" />,
    iconBg: "bg-blue-50",
  },
  {
    id: "bale",
    title: "پیام در بله",
    subtitle: "@janaram_support",
    href: SUPPORT_BALE_URL,
    icon: <MessageCircle className="w-5 h-5 text-[#00AEEF]" />,
    iconBg: "bg-[#00AEEF]/10",
  },
  {
    id: "email",
    title: "ایمیل",
    subtitle: SUPPORT_EMAIL_LABEL,
    href: `mailto:${SUPPORT_EMAIL}`,
    icon: <Mail className="w-5 h-5 text-violet-600" />,
    iconBg: "bg-violet-50",
  },
];

export function FloatingSupportButton() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open]);

  const handleOption = (href: string) => {
    window.open(href, href.startsWith("http") ? "_blank" : "_self");
    setOpen(false);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="ارتباط با پشتیبانی"
        className="fixed z-50 bottom-20 right-5 sm:bottom-8 sm:right-8 w-14 h-14 rounded-full bg-violet-600 hover:bg-violet-700 text-white shadow-lg shadow-violet-600/30 flex items-center justify-center transition-transform hover:scale-105 active:scale-95"
      >
        <Headphones className="w-7 h-7" />
      </button>

      {open && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center">
          <button
            type="button"
            className="absolute inset-0 bg-black/50 backdrop-blur-[2px]"
            aria-label="بستن"
            onClick={() => setOpen(false)}
          />

          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="support-modal-title"
            className="relative w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-2xl shadow-xl sm:mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-10 h-1 bg-gray-300 rounded-full mx-auto mt-3 sm:hidden" />

            <div className="flex items-center justify-between px-5 pt-4 pb-2 sm:pt-5">
              <h2
                id="support-modal-title"
                className="text-lg font-bold text-gray-800"
              >
                ارتباط با پشتیبانی
              </h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                aria-label="بستن"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="px-4 pb-6 sm:pb-5 space-y-0">
              {supportOptions.map((option, index) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => handleOption(option.href)}
                  className={`w-full flex items-center gap-3 py-3.5 px-2 text-right hover:bg-gray-50 rounded-xl transition ${
                    index < supportOptions.length - 1
                      ? "border-b border-gray-100"
                      : ""
                  }`}
                >
                  <div
                    className={`w-11 h-11 rounded-full flex items-center justify-center shrink-0 ${option.iconBg}`}
                  >
                    {option.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-800 text-sm">
                      {option.title}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5 dir-ltr text-right">
                      {option.subtitle}
                    </p>
                  </div>
                  <ChevronLeft className="w-5 h-5 text-gray-400 shrink-0" />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
