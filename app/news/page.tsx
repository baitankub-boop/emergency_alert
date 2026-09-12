"use client";

import { Newspaper } from "lucide-react";
import { useLanguage } from "@/lib/LanguageContext";

export default function NewsPage() {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="container mx-auto px-4 py-16">
        <h1 className="text-2xl sm:text-3xl font-bold text-center text-slate-900 mb-8">{t("news_title")}</h1>
        <div className="max-w-lg mx-auto bg-white rounded-2xl shadow-sm border border-slate-200 p-10 flex flex-col items-center gap-3 text-center">
          <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center">
            <Newspaper className="w-6 h-6 text-slate-400" />
          </div>
          <p className="text-slate-400 text-sm">{t("news_empty")}</p>
        </div>
      </div>
    </div>
  );
}
