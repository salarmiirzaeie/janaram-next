"use client";

import Link from "next/link";
import { Stethoscope } from "lucide-react";

const PsychologistInvite = () => {
  return (
    <section
      className="mx-4 my-10 md:my-14"
      aria-labelledby="psychologist-invite-heading"
    >
      <div className="max-w-6xl mx-auto rounded-2xl overflow-hidden bg-gradient-to-l from-[#7B1FA2] via-[#AB47BC] to-[#CE93D8] shadow-xl">
        <div className="flex flex-col md:flex-row items-center justify-between gap-8 p-8 sm:p-10 md:p-12">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 text-white text-center sm:text-right flex-1">
            <div className="shrink-0 w-14 h-14 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center">
              <Stethoscope className="w-7 h-7 text-white" aria-hidden />
            </div>
            <div>
              <p className="text-sm font-semibold text-white/90 mb-2">
                دعوت به همکاری
              </p>
              <h2
                id="psychologist-invite-heading"
                className="text-2xl sm:text-3xl font-bold leading-snug mb-3"
              >
                روانشناس هستید؟ در پنل جانارام ثبت‌نام کنید
              </h2>
              <p className="text-sm sm:text-base text-white/95 leading-relaxed max-w-xl">
                به شبکه روانشناسان جانارام بپیوندید، نوبت‌دهی و جلسات آنلاین را
                مدیریت کنید و به کاربران اپلیکیشن خدمات مشاوره ارائه دهید.
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto shrink-0">
            <Link
              href="/doctor/register"
              className="inline-flex items-center justify-center px-6 py-3 rounded-full bg-white text-[#7B1FA2] font-semibold shadow-lg hover:bg-gray-50 transition-colors text-center"
            >
              ثبت‌نام در پنل روانشناسان
            </Link>
            <Link
              href="/doctor/login"
              className="inline-flex items-center justify-center px-6 py-3 rounded-full border-2 border-white/80 text-white font-semibold hover:bg-white/10 transition-colors text-center"
            >
              ورود به پنل
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PsychologistInvite;
