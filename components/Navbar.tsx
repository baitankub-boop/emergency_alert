"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useLanguage } from "@/lib/LanguageContext";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";
import { isAdminSessionValid, clearAdminSession } from "@/lib/adminSession";
import { isOperatorSessionValid, clearOperatorSession } from "@/lib/operatorSession";

export default function Navbar() {
  const { language, setLanguage, t } = useLanguage();
  const pathname = usePathname();
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [staffMenuOpen, setStaffMenuOpen] = useState(false);
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [isOperatorLoggedIn, setIsOperatorLoggedIn] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    setIsAdminLoggedIn(isAdminSessionValid());
    setIsOperatorLoggedIn(isOperatorSessionValid());
  }, [pathname]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUserMenuOpen(false);
    setIsMenuOpen(false);
    router.push("/");
  };

  const handleAdminLogout = () => {
    clearAdminSession();
    setIsAdminLoggedIn(false);
    setStaffMenuOpen(false);
    setIsMenuOpen(false);
    router.push("/login_admin");
  };

  const handleOperatorLogout = () => {
    clearOperatorSession();
    setIsOperatorLoggedIn(false);
    setStaffMenuOpen(false);
    setIsMenuOpen(false);
    router.push("/operator_login");
  };

  const navItems = [
    { href: "/", label: t("nav_home") },
    { href: "/emergency", label: t("nav_emergency") },
    { href: "/breakdown", label: t("nav_breakdown") },
    { href: "/login_admin", label: t("nav_admin") },
    { href: "/operator_login", label: t("nav_operator") },
  ];

  const toggleLanguage = () => {
    setLanguage(language === "en" ? "th" : "en");
  };

  const scrollToFooter = () => {
    const footer = document.getElementById("footer");
    if (footer) {
      footer.scrollIntoView({ behavior: "smooth" });
    }
    setIsMenuOpen(false);
  };

  const isAdminOrOperatorPage = [
    "/login_admin", "/admin_page", "/add_admin",
    "/operator_login", "/operator_page", "/add_operator",
  ].some(path => pathname.startsWith(path));

  const shortEmail = user?.email
    ? user.email.length > 18
      ? user.email.slice(0, 15) + "..."
      : user.email
    : "";

  return (
    <nav className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 shadow-xl border-b border-slate-700/50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <div className="flex-shrink-0">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="relative">
                <div className="absolute inset-0 bg-red-500/20 rounded-full blur-sm group-hover:bg-red-500/30 transition-all duration-300" />
                <Image
                  src="/KMUTNB_Logo.svg.png"
                  alt="KMUTNB Logo"
                  width={36}
                  height={36}
                  className="h-9 w-auto relative"
                />
              </div>
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
                      isActive
                        ? "text-white"
                        : "text-slate-400 hover:text-white hover:bg-slate-700/50"
                    }`}
                  >
                    {isActive && (
                      <span className="absolute inset-0 bg-red-600/20 rounded-lg border border-red-500/30" />
                    )}
                    <span className="relative">{item.label}</span>
                    {isActive && (
                      <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-0.5 bg-red-500 rounded-full" />
                    )}
                  </Link>
                );
              })}
              <button
                onClick={scrollToFooter}
                className="px-4 py-2 rounded-lg text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-700/50 transition-all duration-200"
              >
                {t("nav_contact")}
              </button>
            </div>
          </div>

          {/* Right side - Desktop: Language + User */}
          <div className="hidden md:flex items-center gap-2">
            {/* Language Toggle */}
            <button
              onClick={toggleLanguage}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-medium bg-slate-700/60 border border-slate-600/50 text-slate-300 hover:text-white hover:bg-slate-600/60 hover:border-slate-500/50 transition-all duration-200"
            >
              <span className={language === "en" ? "text-white font-semibold" : "text-slate-500"}>EN</span>
              <span className="text-slate-600">|</span>
              <span className={language === "th" ? "text-white font-semibold" : "text-slate-500"}>TH</span>
            </button>

            {/* User Auth — ซ่อนเมื่ออยู่ในหน้า Admin / Operator */}
            {!isAdminOrOperatorPage && (user ? (
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-600/20 border border-red-500/30 text-red-300 hover:bg-red-600/30 transition-all duration-200 text-sm"
                >
                  <div className="w-5 h-5 rounded-full bg-red-500/40 flex items-center justify-center text-xs font-bold text-white">
                    {user.email?.[0]?.toUpperCase()}
                  </div>
                  <span className="max-w-[120px] truncate">{shortEmail}</span>
                  <svg className={`w-3 h-3 transition-transform ${userMenuOpen ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-slate-800 border border-slate-700 rounded-xl shadow-xl z-50 overflow-hidden">
                    <div className="px-4 py-3 border-b border-slate-700">
                      <p className="text-xs text-slate-500">{t("user_logged_in_as")}</p>
                      <p className="text-sm text-white font-medium truncate">{user.email}</p>
                    </div>
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2 px-4 py-3 text-sm text-red-400 hover:bg-slate-700/50 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      {t("user_logout")}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link
                href="/user_login"
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-medium bg-red-600/20 border border-red-500/30 text-red-300 hover:bg-red-600/30 hover:text-red-200 transition-all duration-200"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                {t("nav_user_login")}
              </Link>
            ))}

            {/* Admin/Operator Auth — แสดงเมื่ออยู่ในหน้า Admin / Operator */}
            {isAdminOrOperatorPage && (isAdminLoggedIn || isOperatorLoggedIn) && (
              <div className="relative">
                <button
                  onClick={() => setStaffMenuOpen(v => !v)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-700/60 border border-slate-600/50 text-slate-300 hover:bg-slate-600/60 transition-all duration-200"
                >
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold text-white ${isAdminLoggedIn ? "bg-blue-500/40" : "bg-indigo-500/40"}`}>
                    {isAdminLoggedIn ? "A" : "O"}
                  </div>
                  <span className="text-xs font-medium">{isAdminLoggedIn ? "Admin" : "Operator"}</span>
                  <svg className={`w-3 h-3 transition-transform ${staffMenuOpen ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {staffMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-slate-800 border border-slate-700 rounded-xl shadow-xl z-50 overflow-hidden">
                    <div className="px-4 py-3 border-b border-slate-700">
                      <p className="text-xs text-slate-500">{t("user_logged_in_as")}</p>
                      <p className="text-sm text-white font-medium">{isAdminLoggedIn ? "Admin" : "Operator"}</p>
                    </div>
                    <button
                      onClick={isAdminLoggedIn ? handleAdminLogout : handleOperatorLogout}
                      className="w-full flex items-center gap-2 px-4 py-3 text-sm text-red-400 hover:bg-slate-700/50 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      {t("btn_logout")}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center gap-2">
            <button
              onClick={toggleLanguage}
              className="px-3 py-1 rounded-full text-xs font-medium bg-slate-700/60 border border-slate-600/50 text-slate-300 hover:text-white transition-all"
            >
              {language === "en" ? "TH" : "EN"}
            </button>
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-slate-300 hover:text-white focus:outline-none p-2 rounded-lg hover:bg-slate-700/50 transition-all"
              aria-label="Toggle menu"
            >
              <div className="w-5 h-4 flex flex-col justify-between">
                <span className={`block h-0.5 bg-current rounded transition-all duration-300 ${isMenuOpen ? "rotate-45 translate-y-1.5" : ""}`} />
                <span className={`block h-0.5 bg-current rounded transition-all duration-300 ${isMenuOpen ? "opacity-0 scale-x-0" : ""}`} />
                <span className={`block h-0.5 bg-current rounded transition-all duration-300 ${isMenuOpen ? "-rotate-45 -translate-y-2.5" : ""}`} />
              </div>
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        <div className={`md:hidden overflow-hidden transition-all duration-300 ${isMenuOpen ? "max-h-96 pb-4" : "max-h-0"}`}>
          <div className="flex flex-col gap-1 pt-2 border-t border-slate-700/50">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsMenuOpen(false)}
                  className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? "bg-red-600/20 text-white border border-red-500/30"
                      : "text-slate-400 hover:bg-slate-700/50 hover:text-white"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
            <button
              onClick={scrollToFooter}
              className="px-4 py-2.5 rounded-lg text-sm font-medium text-slate-400 hover:bg-slate-700/50 hover:text-white transition-all text-left"
            >
              {t("nav_contact")}
            </button>

            {/* User auth in mobile menu — ซ่อนเมื่ออยู่ในหน้า Admin / Operator */}
            {!isAdminOrOperatorPage && (
              <div className="mt-1 pt-2 border-t border-slate-700/50">
                {user ? (
                  <>
                    <div className="px-4 py-2">
                      <p className="text-xs text-slate-500">{t("user_logged_in_as")}</p>
                      <p className="text-sm text-slate-300 truncate">{user.email}</p>
                    </div>
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium text-red-400 hover:bg-slate-700/50 transition-all text-left"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      {t("user_logout")}
                    </button>
                  </>
                ) : (
                  <Link
                    href="/user_login"
                    onClick={() => setIsMenuOpen(false)}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium text-red-400 hover:bg-slate-700/50 hover:text-red-300 transition-all"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    {t("nav_user_login")}
                  </Link>
                )}
              </div>
            )}

            {/* Admin/Operator logout in mobile menu */}
            {isAdminOrOperatorPage && (isAdminLoggedIn || isOperatorLoggedIn) && (
              <div className="mt-1 pt-2 border-t border-slate-700/50">
                <div className="px-4 py-2">
                  <p className="text-xs text-slate-500">{t("user_logged_in_as")}</p>
                  <p className="text-sm text-slate-300">{isAdminLoggedIn ? "Admin" : "Operator"}</p>
                </div>
                <button
                  onClick={isAdminLoggedIn ? handleAdminLogout : handleOperatorLogout}
                  className="w-full flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium text-red-400 hover:bg-slate-700/50 transition-all text-left"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  {t("btn_logout")}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Close dropdowns on outside click */}
      {userMenuOpen && <div className="fixed inset-0 z-40" onClick={() => setUserMenuOpen(false)} />}
      {staffMenuOpen && <div className="fixed inset-0 z-40" onClick={() => setStaffMenuOpen(false)} />}
    </nav>
  );
}
