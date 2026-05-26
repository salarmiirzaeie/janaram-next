/** Shared form control classes for doctor auth + dashboard (readable on mobile web) */

const fieldBase =
  "doctor-field w-full rounded-xl border border-gray-200 bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent";

export const doctorInputClass = `${fieldBase} px-4 py-3`;
export const doctorInputClassRight = `${doctorInputClass} text-right`;
export const doctorInputClassLtr = `${doctorInputClass} text-right`;

export const doctorInputDisabledClass =
  "doctor-field w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-500 text-right";

export const doctorSelectClass = `${fieldBase} px-4 py-3 text-right`;
export const doctorSelectSmClass =
  "doctor-field px-3 py-2 rounded-lg border border-gray-200 bg-white text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500";

export const doctorTextareaClass = `${fieldBase} px-4 py-3 text-right`;

export const doctorDateInputClass =
  "doctor-field flex-1 px-4 py-3 border border-gray-300 rounded-xl bg-white text-gray-900 text-base min-h-[48px]";
