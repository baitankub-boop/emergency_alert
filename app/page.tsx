"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Flame, Zap, Droplet, ArrowUpDown, Settings, ShieldAlert, Wrench, Clock, ArrowRight } from "lucide-react";
import { useLanguage } from "@/lib/LanguageContext";
import { supabase } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";

const FEATURES = [
  { icon: ShieldAlert, titleKey: "feature_emergency_title", descKey: "feature_emergency_desc", color: "text-red-600 bg-red-50" },
  { icon: Wrench, titleKey: "feature_breakdown_title", descKey: "feature_breakdown_desc", color: "text-amber-600 bg-amber-50" },
];

const CATEGORIES = [
  { icon: Flame, titleKey: "category_emergency_title", descKey: "category_emergency_desc", href: "/emergency", color: "bg-red-500", ring: "hover:border-red-200", text: "text-red-500" },
  { icon: Zap, titleKey: "category_electrical_title", descKey: "category_electrical_desc", href: "/breakdown", color: "bg-amber-500", ring: "hover:border-amber-200", text: "text-amber-500" },
  { icon: Droplet, titleKey: "category_plumbing_title", descKey: "category_plumbing_desc", href: "/breakdown", color: "bg-blue-500", ring: "hover:border-blue-200", text: "text-blue-500" },
  { icon: ArrowUpDown, titleKey: "category_elevator_title", descKey: "category_elevator_desc", href: "/breakdown", color: "bg-emerald-500", ring: "hover:border-emerald-200", text: "text-emerald-500" },
  { icon: Settings, titleKey: "category_equipment_title", descKey: "category_equipment_desc", href: "/breakdown", color: "bg-purple-500", ring: "hover:border-purple-200", text: "text-purple-500" },
];

export default function Home() {
  const { t } = useLanguage();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleReportClick = (e: React.MouseEvent) => {
    if (!user) {
      e.preventDefault();
      router.push("/user_login");
    }
  };

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
            <a href="#categories" className="flex items-center gap-2 px-6 py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold text-sm shadow-lg shadow-red-900/30 transition-all">
              <ShieldAlert className="w-4 h-4" />
              {t("hero_cta_report")}
            </a>
            <Link href="/status" className="flex items-center gap-2 px-6 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-sm border border-white/30 backdrop-blur-sm transition-all">
              <Clock className="w-4 h-4" />
              {t("hero_cta_status")}
            </Link>
          </div>
        </div>
      </section>

      {/* Feature strip */}
      <section className="border-b border-slate-100">
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

      {/* Categories */}
      <section id="categories" className="container mx-auto px-4 py-14 sm:py-16">
        <div className="mb-8">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900">{t("category_section_title")}</h2>
          <div className="w-10 h-1 bg-red-500 rounded-full mt-2 mb-3" />
          <p className="text-sm text-slate-400 max-w-xl">{t("category_section_subtitle")}</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 sm:gap-5">
          {CATEGORIES.map((c) => (
            <Link
              key={c.titleKey}
              href={c.href}
              onClick={handleReportClick}
              className={`group flex flex-col gap-3 p-5 rounded-2xl border border-slate-200 bg-white shadow-sm hover:shadow-md transition-all duration-200 ${c.ring}`}
            >
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${c.color}`}>
                <c.icon className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-800 text-sm">{t(c.titleKey)}</h3>
                <p className="text-xs text-slate-400 mt-0.5">{t(c.descKey)}</p>
              </div>
              <span className={`inline-flex items-center gap-1 text-xs font-medium mt-auto ${c.text}`}>
                <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
              </span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
