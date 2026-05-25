"use client";

import { useEffect } from "react";
import { CheckCircle, XCircle, X } from "lucide-react";

export type FeedbackType = "success" | "error";

type FeedbackModalProps = {
  open: boolean;
  type: FeedbackType;
  title: string;
  message: string;
  onClose: () => void;
  /** Auto-dismiss success modals after ms (0 = disabled) */
  autoCloseMs?: number;
};

export function FeedbackModal({
  open,
  type,
  title,
  message,
  onClose,
  autoCloseMs = 0,
}: FeedbackModalProps) {
  useEffect(() => {
    if (!open || type !== "success" || !autoCloseMs) return;
    const t = setTimeout(onClose, autoCloseMs);
    return () => clearTimeout(t);
  }, [open, type, autoCloseMs, onClose]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;

  const isSuccess = type === "success";

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      dir="rtl"
      role="dialog"
      aria-modal="true"
      aria-labelledby="feedback-modal-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/50 backdrop-blur-[2px]"
        onClick={onClose}
        aria-label="بستن"
      />
      <div className="relative w-full max-w-sm bg-white rounded-2xl shadow-2xl overflow-hidden">
        <div
          className={`px-6 pt-8 pb-4 text-center ${
            isSuccess ? "bg-green-50" : "bg-red-50"
          }`}
        >
          <div
            className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center ${
              isSuccess ? "bg-green-500" : "bg-red-500"
            }`}
          >
            {isSuccess ? (
              <CheckCircle className="w-9 h-9 text-white" strokeWidth={2.5} />
            ) : (
              <XCircle className="w-9 h-9 text-white" strokeWidth={2.5} />
            )}
          </div>
          <h2
            id="feedback-modal-title"
            className={`mt-4 text-lg font-bold ${
              isSuccess ? "text-green-900" : "text-red-900"
            }`}
          >
            {title}
          </h2>
        </div>
        <div className="px-6 pb-6 pt-2 text-center">
          <p className="text-gray-600 text-sm leading-relaxed">{message}</p>
          <button
            type="button"
            onClick={onClose}
            className={`mt-6 w-full py-3 rounded-xl font-bold text-white transition ${
              isSuccess
                ? "bg-green-600 hover:bg-green-700"
                : "bg-red-600 hover:bg-red-700"
            }`}
          >
            باشه
          </button>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="absolute top-3 left-3 p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          aria-label="بستن"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
