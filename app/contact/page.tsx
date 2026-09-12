"use client";

import { useLanguage } from "@/lib/LanguageContext";

export default function ContactPage() {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="container mx-auto px-4 py-16">
        <h1 className="text-2xl sm:text-3xl font-bold text-center text-slate-900 mb-8">
          {t("contact_title")}
        </h1>
        <div className="max-w-2xl mx-auto bg-white rounded-2xl border border-slate-200 shadow-sm p-8">
          <p className="text-slate-400 text-center">
            Contact information coming soon...
          </p>
        </div>
      </div>
    </div>
  );
}
