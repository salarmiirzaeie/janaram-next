"use client";

import { useEffect, useState } from "react";
import { FileText, X } from "lucide-react";
import { getDoctorTermsSections } from "@/lib/doctor-terms";

type DoctorTermsModalProps = {
  open: boolean;
  onClose: () => void;
  onAccept: () => void;
  isSubmitting?: boolean;
};

export function DoctorTermsModal({
  open,
  onClose,
  onAccept,
  isSubmitting = false,
}: DoctorTermsModalProps) {
  const [checked, setChecked] = useState(false);
  const sections = getDoctorTermsSections();

  useEffect(() => {
    if (!open) {
      setChecked(false);
      return;
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isSubmitting) onClose();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose, isSubmitting]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      dir="rtl"
      role="dialog"
      aria-modal="true"
      aria-labelledby="doctor-terms-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/50 backdrop-blur-[2px]"
        aria-label="بستن"
        onClick={isSubmitting ? undefined : onClose}
        disabled={isSubmitting}
      />

      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[min(90vh,640px)] flex flex-col">
        <div className="flex items-start justify-between gap-3 p-5 border-b border-gray-100 shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600 shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h2 id="doctor-terms-title" className="font-bold text-gray-900 text-lg">
                قوانین و مقررات روانشناسان
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                برای تکمیل ثبت‌نام، مطالعه و پذیرش الزامی است
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 disabled:opacity-50"
            aria-label="بستن"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="overflow-y-auto px-5 py-4 space-y-4 flex-1 text-sm text-gray-700 leading-relaxed">
          {sections.map((section) => (
            <section key={section.title}>
              <h3 className="font-semibold text-gray-900 mb-2">{section.title}</h3>
              <ul className="list-disc pr-5 space-y-1.5">
                {section.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </section>
          ))}
        </div>

        <div className="p-5 border-t border-gray-100 shrink-0 space-y-3">
          <label className="flex items-start gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={checked}
              onChange={(e) => setChecked(e.target.checked)}
              disabled={isSubmitting}
              className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">
              قوانین و مقررات جانارام را مطالعه کردم و با ثبت‌نام آن‌ها را می‌پذیرم.
            </span>
          </label>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-700 text-sm font-medium hover:bg-gray-50 disabled:opacity-50"
            >
              انصراف
            </button>
            <button
              type="button"
              onClick={onAccept}
              disabled={!checked || isSubmitting}
              className="flex-1 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-bold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "در حال ثبت‌نام..." : "می‌پذیرم و ثبت‌نام"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
