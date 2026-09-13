"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useLanguage } from "@/lib/LanguageContext";
import { useState, useEffect } from "react";
import { ChevronDown, LogOut, Menu, X, LogIn, UserCog, Settings } from "lucide-react";
import { getStaffRole, getStaffNickname, clearStaffSession, StaffRole } from "@/lib/staffSession";

export default function StaffNavbar() {
  const { language, setLanguage, t } = useLanguage();
  const pathname = usePathname();
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [staffMenuOpen, setStaffMenuOpen] = useState(false);
  const [staffRole, setStaffRole] = useState<StaffRole | null>(null);
  const [staffNickname, setStaffNickname] = useState<string | null>(null);

  useEffect(() => {
    setStaffRole(getStaffRole());
    setStaffNickname(getStaffNickname());
  }, [pathname]);

  const roleLabel = staffRole === "admin" ? "Admin" : staffRole === "superadmin" ? "Super Admin" : "Operator";
  const displayLabel = staffNickname || roleLabel;

  const handleStaffLogout = () => {
    clearStaffSession();
    fetch("/api/staff_logout", { method: "POST" }).catch(() => {});
    setStaffRole(null);
    setStaffMenuOpen(false);
    setIsMenuOpen(false);
    router.push("/admin40");
  };

  const toggleLanguage = () => {
    setLanguage(language === "en" ? "th" : "en");
  };

  const navItems = [
    { href: "/admin40", label: t("nav_home") },
    { href: "/admin_page", label: t("nav_status") },
    { href: "/manage_users", label: t("nav_manage_users") },
    { href: "/notify_settings", label: t("nav_notify_setting") },
  ];

  return (
    <nav className="bg-white dark:bg-slate-900 shadow-sm border-b border-slate-200 dark:border-slate-800 sticky top-0 z-50 transition-colors">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <div className="flex-shrink-0">
            <Link href="/admin40" className="flex items-center gap-2.5 group">
              <Image
                src="/kmutnb_font_logo.png"
                alt="KMUTNB Logo"
                width={36}
                height={36}
                className="h-9 w-auto"
              />
            </Link>
          </div>

          {/* Nav Links - Desktop */}
          <div className="hidden md:flex items-center justify-center flex-1">
            <div className="flex items-center gap-1">
              {navItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`relative px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                      isActive ? "text-red-600 bg-red-50 dark:bg-red-500/10" : "text-slate-500 dark:text-slate-400 hover:text-red-600 hover:bg-red-50/60 dark:hover:bg-red-500/10"
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Right side - Desktop: Language + Staff */}
          <div className="hidden md:flex items-center gap-2">
            <button
              onClick={toggleLanguage}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-sm font-medium bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-100 hover:bg-slate-200/70 dark:hover:bg-slate-700 transition-all duration-200"
            >
              <span className={language === "en" ? "text-slate-900 dark:text-white font-semibold" : "text-slate-400"}>EN</span>
              <span className="text-slate-300 dark:text-slate-600">|</span>
              <span className={language === "th" ? "text-slate-900 dark:text-white font-semibold" : "text-slate-400"}>TH</span>
            </button>

            {staffRole ? (
              <div className="relative">
                <button
                  onClick={() => setStaffMenuOpen(v => !v)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-700 transition-all duration-200"
                >
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold text-white ${staffRole === "admin" ? "bg-blue-500" : staffRole === "superadmin" ? "bg-amber-500" : "bg-indigo-500"}`}>
                    {displayLabel[0]?.toUpperCase()}
                  </div>
                  <span className="text-xs font-medium max-w-[110px] truncate">{displayLabel}</span>
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform ${staffMenuOpen ? "rotate-180" : ""}`} />
                </button>
                {staffMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg z-50 overflow-hidden">
                    <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-700">
                      <p className="text-xs text-slate-400 dark:text-slate-500">{t("user_logged_in_as")}</p>
                      <p className="text-sm text-slate-800 dark:text-slate-100 font-medium truncate">{displayLabel}</p>
                    </div>
                    <Link
                      href="/staff_profile"
                      onClick={() => setStaffMenuOpen(false)}
                      className="w-full flex items-center gap-2 px-4 py-3 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                    >
                      <UserCog className="w-4 h-4" />
                      {t("nav_profile")}
                    </Link>
                    <Link
                      href="/staff_account"
                      onClick={() => setStaffMenuOpen(false)}
                      className="w-full flex items-center gap-2 px-4 py-3 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors border-t border-slate-100 dark:border-slate-700"
                    >
                      <Settings className="w-4 h-4" />
                      {t("nav_account")}
                    </Link>
                    <button
                      onClick={handleStaffLogout}
                      className="w-full flex items-center gap-2 px-4 py-3 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors border-t border-slate-100 dark:border-slate-700"
                    >
                      <LogOut className="w-4 h-4" />
                      {t("btn_logout")}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link
                href="/admin_login"
                className="flex items-center gap-1.5 px-5 py-2 rounded-lg text-sm font-semibold bg-red-600 text-white hover:bg-red-700 shadow-sm shadow-red-600/20 transition-all duration-200"
              >
                <LogIn className="w-4 h-4" />
                {t("nav_user_login")}
              </Link>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center gap-2">
            <button
              onClick={toggleLanguage}
              className="px-3 py-1 rounded-full text-xs font-medium bg-slate-100 border border-slate-200 text-slate-500 hover:text-slate-800 transition-all"
            >
              {language === "en" ? "TH" : "EN"}
            </button>
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-slate-500 hover:text-slate-800 focus:outline-none p-2 rounded-lg hover:bg-slate-100 transition-all"
              aria-label="Toggle menu"
            >
              {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        <div className={`md:hidden overflow-hidden transition-all duration-300 ${isMenuOpen ? "max-h-96 pb-4" : "max-h-0"}`}>
          <div className="flex flex-col gap-1 pt-2 border-t border-slate-100">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsMenuOpen(false)}
                  className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                    isActive ? "bg-red-50 text-red-600" : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}

            {staffRole ? (
              <div className="mt-1 pt-2 border-t border-slate-100">
                <div className="px-4 py-2">
                  <p className="text-xs text-slate-400">{t("user_logged_in_as")}</p>
                  <p className="text-sm text-slate-700 truncate">{displayLabel}</p>
                </div>
                <Link
                  href="/staff_profile"
                  onClick={() => setIsMenuOpen(false)}
                  className="w-full flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 transition-all"
                >
                  <UserCog className="w-4 h-4" />
                  {t("nav_profile")}
                </Link>
                <Link
                  href="/staff_account"
                  onClick={() => setIsMenuOpen(false)}
                  className="w-full flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 transition-all"
                >
                  <Settings className="w-4 h-4" />
                  {t("nav_account")}
                </Link>
                <button
                  onClick={handleStaffLogout}
                  className="w-full flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-all text-left"
                >
                  <LogOut className="w-4 h-4" />
                  {t("btn_logout")}
                </button>
              </div>
            ) : (
              <div className="mt-1 pt-2 border-t border-slate-100">
                <Link
                  href="/admin_login"
                  onClick={() => setIsMenuOpen(false)}
                  className="flex items-center justify-center gap-2 mx-4 px-4 py-2.5 rounded-lg text-sm font-semibold bg-red-600 text-white hover:bg-red-700 transition-all"
                >
                  <LogIn className="w-4 h-4" />
                  {t("nav_user_login")}
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Close dropdown on outside click */}
      {staffMenuOpen && <div className="fixed inset-0 z-40" onClick={() => setStaffMenuOpen(false)} />}
    </nav>
  );
}
