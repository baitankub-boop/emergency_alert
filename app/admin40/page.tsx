"use client";

import Image from "next/image";
import Link from "next/link";
import { ShieldAlert, Wrench, LogIn } from "lucide-react";
import { useLanguage } from "@/lib/LanguageContext";

const FEATURES = [
  { icon: ShieldAlert, titleKey: "feature_emergency_title", descKey: "feature_emergency_desc", color: "text-red-600 bg-red-50" },
  { icon: Wrench, titleKey: "feature_breakdown_title", descKey: "feature_breakdown_desc", color: "text-amber-600 bg-amber-50" },
];

export default function AdminHomePage() {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <section className="relative isolate overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <Image src="/40building.png" alt="40th Anniversary Building, KMUTNB" fill priority className="object-cover" />
          <div className="absolute inset-0 bg-gradient-to-b from-slate-900/80 via-slate-900/70 to-slate-900/90" />
        </div>
        <div className="container mx-auto px-4 py-12 sm:py-16 md:py-20 text-left">
          <h1 className="text-2xl sm:text-4xl md:text-5xl font-bold text-white max-w-3xl leading-snug animate-fadeInUp delay-100">
            {t("hero_title")}
          </h1>
          <p className="text-slate-300 text-sm sm:text-base max-w-xl mt-4 animate-fadeInUp delay-200">
            {t("hero_subtitle")}
          </p>
          <div className="flex flex-wrap items-center gap-3 mt-8 animate-fadeInUp delay-300">
            <Link
              href="/admin_login"
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold text-sm shadow-lg shadow-red-900/30 transition-all"
            >
              <LogIn className="w-4 h-4" />
              {t("nav_user_login")}
            </Link>
          </div>
        </div>
      </section>

      {/* Feature strip */}
      <section>
        <div className="container mx-auto px-4 py-10">
          <div className="grid grid-cols-2 gap-6">
            {FEATURES.map((f) => (
              <div key={f.titleKey} className="flex flex-col items-center text-center gap-2.5">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${f.color}`}>
                  <f.icon className="w-6 h-6" />
                </div>
                <h3 className="font-semibold text-slate-800 text-sm">{t(f.titleKey)}</h3>
                <p className="text-xs text-slate-400 max-w-[220px]">{t(f.descKey)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
