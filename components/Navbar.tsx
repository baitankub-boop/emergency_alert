"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useLanguage } from "@/lib/LanguageContext";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";
import { ChevronDown, LogOut, Menu, X, UserCircle, UserCog, Settings } from "lucide-react";

export default function Navbar() {
  const { language, setLanguage, t } = useLanguage();
  const pathname = usePathname();
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [reportMenuOpen, setReportMenuOpen] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUserMenuOpen(false);
    setIsMenuOpen(false);
    router.push("/");
  };

  const reportItems = [
    { href: "/emergency", label: t("nav_emergency") },
    { href: "/breakdown", label: t("nav_breakdown") },
  ];

  const navItems = [
    { href: "/", label: t("nav_home") },
    { href: "/status", label: t("nav_status") },
    { href: "/contact", label: t("nav_contact"), scrollToFooter: true },
  ];

  const scrollToFooter = () => {
    document.getElementById("footer")?.scrollIntoView({ behavior: "smooth" });
  };

  const AUTH_GATED_PATHS = ["/status", "/emergency", "/breakdown"];

  const handleNavClick = (e: React.MouseEvent, href: string) => {
    if (AUTH_GATED_PATHS.includes(href) && !user) {
      e.preventDefault();
      setIsMenuOpen(false);
      setReportMenuOpen(false);
      router.push("/user_login");
    }
  };

  const toggleLanguage = () => {
    setLanguage(language === "en" ? "th" : "en");
  };

  const nickname = (user?.user_metadata?.nickname as string | undefined)?.trim() || "";
  const shortEmail = user?.email
    ? user.email.length > 18
      ? user.email.slice(0, 15) + "..."
      : user.email
    : "";
  const displayLabel = nickname
    ? (nickname.length > 18 ? nickname.slice(0, 15) + "..." : nickname)
    : shortEmail;
  const avatarLetter = (nickname || user?.email || "?")[0]?.toUpperCase();

  const isReportActive = reportItems.some(i => pathname === i.href);

  return (
    <nav className="bg-white dark:bg-slate-900 shadow-sm border-b border-slate-200 dark:border-slate-800 sticky top-0 z-50 transition-colors">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <div className="flex-shrink-0">
            <Link href="/" className="flex items-center gap-2.5 group">
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
              <Link
                href="/"
                className={`relative px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  pathname === "/" ? "text-red-600 bg-red-50 dark:bg-red-500/10" : "text-slate-500 dark:text-slate-400 hover:text-red-600 hover:bg-red-50/60 dark:hover:bg-red-500/10"
                }`}
              >
                {t("nav_home")}
              </Link>

              {/* Report dropdown */}
              <div className="relative">
                <button
                  onClick={() => setReportMenuOpen(v => !v)}
                  className={`flex items-center gap-1 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    isReportActive ? "text-red-600 bg-red-50 dark:bg-red-500/10" : "text-slate-500 dark:text-slate-400 hover:text-red-600 hover:bg-red-50/60 dark:hover:bg-red-500/10"
                  }`}
                >
                  {t("nav_report")}
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform ${reportMenuOpen ? "rotate-180" : ""}`} />
                </button>
                {reportMenuOpen && (
                  <div className="absolute left-0 mt-2 w-52 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg z-50 overflow-hidden py-1">
                    {reportItems.map(item => (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={(e) => { handleNavClick(e, item.href); setReportMenuOpen(false); }}
                        className={`block px-4 py-2.5 text-sm transition-colors ${
                          pathname === item.href ? "text-red-600 bg-red-50 dark:bg-red-500/10 font-medium" : "text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
                        }`}
                      >
                        {item.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              {navItems.slice(1).map((item) => {
                if (item.scrollToFooter) {
                  return (
                    <button
                      key={item.href}
                      onClick={scrollToFooter}
                      className="relative px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 text-slate-500 dark:text-slate-400 hover:text-red-600 hover:bg-red-50/60 dark:hover:bg-red-500/10"
                    >
                      {item.label}
                    </button>
                  );
                }
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={(e) => handleNavClick(e, item.href)}
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

          {/* Right side - Desktop: Language + User */}
          <div className="hidden md:flex items-center gap-2">
            {/* Language Toggle */}
            <button
              onClick={toggleLanguage}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-sm font-medium bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-100 hover:bg-slate-200/70 dark:hover:bg-slate-700 transition-all duration-200"
            >
              <span className={language === "en" ? "text-slate-900 dark:text-white font-semibold" : "text-slate-400"}>EN</span>
              <span className="text-slate-300 dark:text-slate-600">|</span>
              <span className={language === "th" ? "text-slate-900 dark:text-white font-semibold" : "text-slate-400"}>TH</span>
            </button>

            {/* User Auth */}
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 text-red-700 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-500/20 transition-all duration-200 text-sm"
                >
                  <div className="w-5 h-5 rounded-full bg-red-500 flex items-center justify-center text-xs font-bold text-white">
                    {avatarLetter}
                  </div>
                  <span className="max-w-[120px] truncate">{displayLabel}</span>
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform ${userMenuOpen ? "rotate-180" : ""}`} />
                </button>
                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg z-50 overflow-hidden">
                    <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-700">
                      <p className="text-xs text-slate-400 dark:text-slate-500">{t("user_logged_in_as")}</p>
                      <p className="text-sm text-slate-800 dark:text-slate-100 font-medium truncate">{displayLabel}</p>
                    </div>
                    <Link
                      href="/profile"
                      onClick={() => setUserMenuOpen(false)}
                      className="w-full flex items-center gap-2 px-4 py-3 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                    >
                      <UserCog className="w-4 h-4" />
                      {t("nav_profile")}
                    </Link>
                    <Link
                      href="/account"
                      onClick={() => setUserMenuOpen(false)}
                      className="w-full flex items-center gap-2 px-4 py-3 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors border-t border-slate-100 dark:border-slate-700"
                    >
                      <Settings className="w-4 h-4" />
                      {t("nav_account")}
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2 px-4 py-3 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors border-t border-slate-100 dark:border-slate-700"
                    >
                      <LogOut className="w-4 h-4" />
                      {t("user_logout")}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link
                href="/user_login"
                className="flex items-center gap-1.5 px-5 py-2 rounded-lg text-sm font-semibold bg-red-600 text-white hover:bg-red-700 shadow-sm shadow-red-600/20 transition-all duration-200"
              >
                <UserCircle className="w-4 h-4" />
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
        <div className={`md:hidden overflow-hidden transition-all duration-300 ${isMenuOpen ? "max-h-[32rem] pb-4" : "max-h-0"}`}>
          <div className="flex flex-col gap-1 pt-2 border-t border-slate-100">
            <Link
              href="/"
              onClick={() => setIsMenuOpen(false)}
              className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                pathname === "/" ? "bg-red-50 text-red-600" : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
              }`}
            >
              {t("nav_home")}
            </Link>

            <p className="px-4 pt-2 text-xs font-semibold uppercase tracking-wide text-slate-300">{t("nav_report")}</p>
            {reportItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={(e) => { handleNavClick(e, item.href); setIsMenuOpen(false); }}
                className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                  pathname === item.href ? "bg-red-50 text-red-600" : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
                }`}
              >
                {item.label}
              </Link>
            ))}

            {navItems.slice(1).map((item) => {
              if (item.scrollToFooter) {
                return (
                  <button
                    key={item.href}
                    onClick={() => { scrollToFooter(); setIsMenuOpen(false); }}
                    className="px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 text-slate-500 hover:bg-slate-50 hover:text-slate-800 text-left"
                  >
                    {item.label}
                  </button>
                );
              }
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={(e) => { handleNavClick(e, item.href); if (!(item.href === "/status" && !user)) setIsMenuOpen(false); }}
                  className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                    isActive ? "bg-red-50 text-red-600" : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}

            {/* User auth in mobile menu */}
            <div className="mt-1 pt-2 border-t border-slate-100">
              {user ? (
                <>
                  <div className="px-4 py-2">
                    <p className="text-xs text-slate-400">{t("user_logged_in_as")}</p>
                    <p className="text-sm text-slate-700 truncate">{displayLabel}</p>
                  </div>
                  <Link
                    href="/profile"
                    onClick={() => setIsMenuOpen(false)}
                    className="w-full flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 transition-all"
                  >
                    <UserCog className="w-4 h-4" />
                    {t("nav_profile")}
                  </Link>
                  <Link
                    href="/account"
                    onClick={() => setIsMenuOpen(false)}
                    className="w-full flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 transition-all"
                  >
                    <Settings className="w-4 h-4" />
                    {t("nav_account")}
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-all text-left"
                  >
                    <LogOut className="w-4 h-4" />
                    {t("user_logout")}
                  </button>
                </>
              ) : (
                <Link
                  href="/user_login"
                  onClick={() => setIsMenuOpen(false)}
                  className="flex items-center justify-center gap-2 mx-4 px-4 py-2.5 rounded-lg text-sm font-semibold bg-red-600 text-white hover:bg-red-700 transition-all"
                >
                  <UserCircle className="w-4 h-4" />
                  {t("nav_user_login")}
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Close dropdowns on outside click */}
      {userMenuOpen && <div className="fixed inset-0 z-40" onClick={() => setUserMenuOpen(false)} />}
      {reportMenuOpen && <div className="fixed inset-0 z-40" onClick={() => setReportMenuOpen(false)} />}
    </nav>
  );
}
