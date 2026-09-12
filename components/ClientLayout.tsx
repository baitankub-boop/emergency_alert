"use client";

import { ReactNode, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { LanguageProvider } from "@/lib/LanguageContext";
import { ThemeProvider } from "@/lib/ThemeContext";
import { isStaffSessionValid } from "@/lib/staffSession";
import Navbar from "./Navbar";
import StaffNavbar from "./StaffNavbar";
import Footer from "./Footer";

const STAFF_PATHS = ["/admin40", "/admin_login", "/admin_page", "/add_admin", "/add_operator", "/add_superadmin", "/manage_users", "/staff_profile", "/staff_account", "/notify_settings"];
// Routes shared with the public site — still show the staff header when a staff member is signed in
const SHARED_STAFF_PATHS = ["/news"];

export default function ClientLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [hasStaffSession, setHasStaffSession] = useState(false);

  useEffect(() => {
    setHasStaffSession(isStaffSessionValid());
  }, [pathname]);

  const isStaffPage =
    STAFF_PATHS.some((path) => pathname.startsWith(path)) ||
    (SHARED_STAFF_PATHS.some((path) => pathname.startsWith(path)) && hasStaffSession);

  return (
    <ThemeProvider>
      <LanguageProvider>
        <div className="min-h-screen flex flex-col">
          {isStaffPage ? <StaffNavbar /> : <Navbar />}
          <main className="flex-1">{children}</main>
          <Footer />
        </div>
      </LanguageProvider>
    </ThemeProvider>
  );
}
