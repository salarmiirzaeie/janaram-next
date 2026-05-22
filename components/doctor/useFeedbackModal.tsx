"use client";

import { useCallback, useState } from "react";
import { FeedbackModal, type FeedbackType } from "./FeedbackModal";

type FeedbackState = {
  type: FeedbackType;
  title: string;
  message: string;
};

export function useFeedbackModal(options?: { autoCloseSuccessMs?: number }) {
  const [feedback, setFeedback] = useState<FeedbackState | null>(null);
  const autoCloseMs = options?.autoCloseSuccessMs ?? 0;

  const dismiss = useCallback(() => setFeedback(null), []);

  const showSuccess = useCallback((message: string, title = "عملیات موفق") => {
    setFeedback({ type: "success", title, message });
  }, []);

  const showError = useCallback((message: string, title = "خطا") => {
    setFeedback({ type: "error", title, message });
  }, []);

  const modal = (
    <FeedbackModal
      open={feedback !== null}
      type={feedback?.type ?? "success"}
      title={feedback?.title ?? ""}
      message={feedback?.message ?? ""}
      onClose={dismiss}
      autoCloseMs={feedback?.type === "success" ? autoCloseMs : 0}
    />
  );

  return { modal, showSuccess, showError, dismiss };
}
