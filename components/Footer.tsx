"use client";

import Link from "next/link";
import { Facebook, Phone } from "lucide-react";
import { useLanguage } from "@/lib/LanguageContext";

export default function Footer() {
  const { t } = useLanguage();

  const quickLinks = [
    { href: "/", label: t("nav_home") },
    { href: "/emergency", label: t("nav_emergency") },
    { href: "/breakdown", label: t("nav_breakdown") },
    { href: "/status", label: t("nav_status") },
    { href: "/contact", label: t("nav_contact") },
  ];

  return (
    <footer id="footer" className="bg-slate-900 text-white border-t border-slate-800">
      <div className="container mx-auto px-4 py-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
          {/* Quick links */}
          <div>
            <p className="text-xs font-semibold tracking-widest text-slate-500 uppercase mb-3">{t("footer_quick_links")}</p>
            <div className="flex flex-col gap-2">
              {quickLinks.map(link => (
                <Link key={link.href} href={link.href} className="text-sm text-slate-400 hover:text-white transition-colors w-fit">
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Contact */}
          <div>
            <p className="text-xs font-semibold tracking-widest text-slate-500 uppercase mb-3">{t("footer_contact")}</p>
            <div className="flex flex-col gap-2.5">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse shrink-0" />
                <span className="text-sm text-slate-300">
                  <span className="font-medium text-white">{t("footer_building_label")}</span>{" "}
                  <a href="tel:0255552000" className="text-slate-400 hover:text-white transition-colors">02-555-2000</a>
                </span>
              </div>
            </div>
            <div className="flex items-center gap-3 mt-4">
              <a href="https://www.facebook.com/KMUTNBofficial/?locale=th_TH" target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-colors">
                <Facebook className="w-4 h-4" />
              </a>
              <a href="tel:0255552000" aria-label="Call" className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-colors">
                <Phone className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>
      </div>
      <div className="border-t border-slate-800">
        <div className="container mx-auto px-4 py-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-xs text-slate-500">© {new Date().getFullYear()} KMUTNB. {t("footer_rights")}</p>
          <Link href="/admin_login" className="text-xs text-slate-500 hover:text-white transition-colors">
            {t("footer_for_admin")}
          </Link>
        </div>
      </div>
    </footer>
  );
}
