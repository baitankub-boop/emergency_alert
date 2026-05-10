"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";

type Language = "en" | "th";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const translations: Record<Language, Record<string, string>> = {
  en: {
    // Navbar
    nav_home: "Home",
    nav_emergency: "Report Emergency",
    nav_breakdown: "Report Breakdown",
    nav_contact: "Contact",
    nav_admin: "Admin",
    nav_operator: "Operator",

    // Home page
    home_title: "Emergency and Breakdown Alerts",
    btn_emergency: "Emergency",
    btn_breakdown: "Breakdown",
    recent_events: "Report Table",
    th_no: "No.",
    th_timestamp: "Timestamp",
    th_floor: "Floor",
    th_description: "Description",
    th_event: "Event",
    th_type: "Type",
    th_email: "Email",
    th_status: "Status",
    status_waiting: "Waiting",
    status_success: "Success",
    status_in_process: "In Process",
    status_failed: "Failed",
    no_events: "No events found",

    // Event names
    event_fire_alarm: "Fire alarm triggered",
    event_equipment_malfunction: "Equipment malfunction",
    event_power_outage: "Power outage",

    // Event types
    event_type_emergency: "Emergency",
    event_type_breakdown: "Breakdown",

    // Emergency page
    emergency_title: "Report Emergency",
    emergency_type_label: "Emergency Type",
    emergency_select_type: "-- Select Type --",
    emergency_type_fainting: "Fainting",
    emergency_type_accident: "Serious Accident",
    emergency_type_fighting: "Fighting",
    emergency_type_robbery: "Theft/Robbery",
    emergency_type_harassment: "Sexual Harassment",
    emergency_type_animal: "Venomous Animal Bite",
    emergency_floor_label: "Floor",
    emergency_desc_label: "Description",
    emergency_desc_placeholder: "Please describe the emergency situation...",
    emergency_email_label: "Reporter Email",
    emergency_contact: "Emergency Contact Numbers",

    // Breakdown page
    breakdown_title: "Report Breakdown",
    breakdown_type_label: "Breakdown Type",
    breakdown_floor_label: "Floor",
    breakdown_desc_label: "Description",
    breakdown_desc_placeholder: "Please describe the breakdown issue...",
    breakdown_email_label: "Reporter Email",
    breakdown_photo_label: "Photo (Optional)",
    breakdown_photo_hint: "Upload a photo of the issue if available",

    // Breakdown types
    select_type: "-- Select Type --",
    type_electricity: "Electrical System",
    type_plumbing: "Plumbing",
    type_ac: "Air Conditioning",
    type_elevator: "Elevator",
    type_internet: "Internet/Network",
    type_equipment: "Equipment",
    type_other: "Other",
    other_type_label: "Please Specify",
    other_type_placeholder: "Enter breakdown type...",

    // Common form
    select_floor: "-- Select Floor --",
    floor: "Floor",
    btn_submit: "Submit",
    submitting: "Submitting...",
    submit_success: "Submitted successfully!",
    submit_error: "Submission failed. Please try again.",

    // Contact page
    contact_title: "Contact Us",

    // Footer
    footer_contact: "Contact",
    footer_name: "Prapawit",

    // Admin / Operator dashboard
    admin_dashboard: "Admin Dashboard",
    operator_dashboard: "Operator Dashboard",
    btn_add_admin: "Add Admin",
    btn_add_operator: "Add Operator",
    btn_logout: "Logout",
    btn_accept: "Accept",
    btn_view_photo: "View Photo",
    btn_save: "Save",
    btn_cancel: "Cancel",
    btn_saving: "Saving...",
    btn_close: "Close",
    btn_delete: "Delete",
    btn_confirm_delete: "Confirm Delete?",
    btn_deleting: "Deleting...",

    // Table / states
    no_records: "No records found",
    loading: "Loading...",
    updating: "Updating...",
    th_action: "Action",
    th_photo: "Photo",

    // Stats
    stat_total_emergency: "Total Emergency",
    stat_total_breakdown: "Total Breakdown",
    stat_waiting_emergency: "Waiting (Emergency)",
    stat_waiting_breakdown: "Waiting (Breakdown)",
    stat_in_process_emergency: "In Process (Emergency)",
    stat_in_process_breakdown: "In Process (Breakdown)",
    stat_success_emergency: "Success (Emergency)",
    stat_success_breakdown: "Success (Breakdown)",

    // Tabs
    tab_emergency: "Emergency",
    tab_breakdown: "Breakdown",

    // Pagination
    prev_page: "Previous",
    next_page: "Next",
    records: "records",

    // Home extras
    my_reports: "My Reports",
    for_me_label: "(My Reports)",
    live_monitoring: "Live Monitoring",

    // Edit modal
    edit_emergency_title: "Edit Emergency",
    edit_breakdown_title: "Edit Breakdown",
    status_label: "Status",

    // Floor display
    floor_display: "Floor",

    // Report
    report_title: "Report",
    btn_show_report: "Report",
    btn_export_excel: "Export Excel",
    btn_export_pdf: "Export PDF",
    report_emergency_stats: "Emergency Statistics",
    report_breakdown_stats: "Breakdown Statistics",
    report_top_floors_emergency: "Top Floors (Emergency)",
    report_top_floors_breakdown: "Top Floors (Breakdown)",
    report_top_emergency_types: "Top Emergency Types",
    report_top_types: "Top Breakdown Types",
    report_generated: "Generated",
    report_no_data: "No data",

    // User Auth
    user_login_title: "Sign In",
    user_login_subtitle: "Sign in to report emergency or breakdown",
    auth_login_google: "Sign in with Google",
    auth_or: "or",
    auth_email: "Email",
    auth_password: "Password",
    auth_confirm_password: "Confirm Password",
    auth_login_btn: "Sign In",
    auth_logging_in: "Signing in...",
    auth_login_error: "Invalid email or password",
    auth_email_not_verified: "Please verify your email before signing in",
    auth_no_account: "Don't have an account?",
    auth_register_link: "Register",
    auth_register_title: "Create Account",
    auth_register_subtitle: "Register to report emergency or breakdown",
    auth_password_hint: "At least 6 characters",
    auth_password_mismatch: "Passwords do not match",
    auth_password_short: "Password must be at least 6 characters",
    auth_register_btn: "Register",
    auth_registering: "Registering...",
    auth_have_account: "Already have an account?",
    auth_login_link: "Sign in",
    auth_otp_title: "Verify Email",
    auth_otp_subtitle: "Enter the OTP code sent to",
    auth_otp_incomplete: "Please enter all 6 digits",
    auth_otp_error: "Invalid or expired OTP",
    auth_verify_btn: "Verify",
    auth_verifying: "Verifying...",
    auth_resend: "Resend OTP",
    auth_resend_wait: "Resend in",
    auth_resend_seconds: "s",
    auth_resending: "Sending...",
    auth_otp_check_email: "Check your email for a 6-digit OTP code",
    nav_user_login: "Sign In",
    user_logout: "Sign Out",
    user_logged_in_as: "Signed in as",
    auth_login_required: "Please sign in to submit a report",
    auth_go_login: "Sign In",
    auth_register_success: "Registration successful! Please check your email for OTP.",
  },
  th: {
    // Navbar
    nav_home: "หน้าหลัก",
    nav_emergency: "แจ้งเหตุฉุกเฉิน",
    nav_breakdown: "แจ้งเหตุขัดข้อง",
    nav_contact: "ติดต่อเรา",
    nav_admin: "แอดมิน",
    nav_operator: "เจ้าหน้าที่",

    // Home page
    home_title: "ระบบแจ้งเหตุฉุกเฉินและเหตุขัดข้อง",
    btn_emergency: "เหตุฉุกเฉิน",
    btn_breakdown: "เหตุขัดข้อง",
    recent_events: "ตารางแจ้งเหตุ",
    th_no: "ลำดับ",
    th_timestamp: "เวลา",
    th_floor: "ชั้น",
    th_description: "รายละเอียด",
    th_event: "เหตุการณ์",
    th_type: "ประเภท",
    th_email: "อีเมล",
    th_status: "สถานะ",
    status_waiting: "รอรับเรื่อง",
    status_success: "สำเร็จ",
    status_in_process: "กำลังดำเนินการ",
    status_failed: "ล้มเหลว",
    no_events: "ไม่พบเหตุการณ์",

    // Event names
    event_fire_alarm: "สัญญาณเตือนไฟไหม้ดังขึ้น",
    event_equipment_malfunction: "อุปกรณ์ทำงานผิดปกติ",
    event_power_outage: "ไฟฟ้าดับ",

    // Event types
    event_type_emergency: "เหตุฉุกเฉิน",
    event_type_breakdown: "เหตุขัดข้อง",

    // Emergency page
    emergency_title: "แจ้งเหตุฉุกเฉิน",
    emergency_type_label: "ประเภทเหตุฉุกเฉิน",
    emergency_select_type: "-- เลือกประเภท --",
    emergency_type_fainting: "เป็นลม",
    emergency_type_accident: "อุบัติเหตุร้ายแรง",
    emergency_type_fighting: "ทะเลาะวิวาท",
    emergency_type_robbery: "พบโจร",
    emergency_type_harassment: "โดนล่วงละเมิด",
    emergency_type_animal: "สัตว์มีพิษกัด",
    emergency_floor_label: "ชั้น",
    emergency_desc_label: "รายละเอียด",
    emergency_desc_placeholder: "กรุณาอธิบายสถานการณ์ฉุกเฉิน...",
    emergency_email_label: "อีเมลผู้แจ้ง",
    emergency_contact: "เบอร์โทรฉุกเฉิน",

    // Breakdown page
    breakdown_title: "แจ้งเหตุขัดข้อง",
    breakdown_type_label: "ประเภทเหตุขัดข้อง",
    breakdown_floor_label: "ชั้น",
    breakdown_desc_label: "รายละเอียด",
    breakdown_desc_placeholder: "กรุณาอธิบายปัญหาที่พบ...",
    breakdown_email_label: "อีเมลผู้แจ้ง",
    breakdown_photo_label: "รูปภาพ (ไม่บังคับ)",
    breakdown_photo_hint: "อัปโหลดรูปภาพของปัญหาถ้ามี",

    // Breakdown types
    select_type: "-- เลือกประเภท --",
    type_electricity: "ระบบไฟฟ้า",
    type_plumbing: "ระบบประปา",
    type_ac: "ระบบปรับอากาศ",
    type_elevator: "ลิฟต์",
    type_internet: "อินเทอร์เน็ต/เครือข่าย",
    type_equipment: "อุปกรณ์",
    type_other: "อื่นๆ",
    other_type_label: "กรุณาระบุ",
    other_type_placeholder: "ระบุประเภทเหตุขัดข้อง...",

    // Common form
    select_floor: "-- เลือกชั้น --",
    floor: "ชั้น",
    btn_submit: "ส่งข้อมูล",
    submitting: "กำลังส่ง...",
    submit_success: "ส่งข้อมูลสำเร็จ!",
    submit_error: "ส่งข้อมูลไม่สำเร็จ กรุณาลองใหม่อีกครั้ง",

    // Contact page
    contact_title: "ติดต่อเรา",

    // Footer
    footer_contact: "ติดต่อ",
    footer_name: "ประภวิษณุ์",

    // Admin / Operator dashboard
    admin_dashboard: "แดชบอร์ด Admin",
    operator_dashboard: "แดชบอร์ด Operator",
    btn_add_admin: "เพิ่ม Admin",
    btn_add_operator: "เพิ่ม Operator",
    btn_logout: "ออกจากระบบ",
    btn_accept: "รับเรื่อง",
    btn_view_photo: "ดูรูป",
    btn_save: "บันทึก",
    btn_cancel: "ยกเลิก",
    btn_saving: "กำลังบันทึก...",
    btn_close: "ปิด",
    btn_delete: "ลบ",
    btn_confirm_delete: "ยืนยันการลบ?",
    btn_deleting: "กำลังลบ...",

    // Table / states
    no_records: "ไม่พบข้อมูล",
    loading: "กำลังโหลด...",
    updating: "กำลังอัปเดต...",
    th_action: "ดำเนินการ",
    th_photo: "รูปภาพ",

    // Stats
    stat_total_emergency: "ฉุกเฉินทั้งหมด",
    stat_total_breakdown: "ขัดข้องทั้งหมด",
    stat_waiting_emergency: "รอรับเรื่อง (ฉุกเฉิน)",
    stat_waiting_breakdown: "รอรับเรื่อง (ขัดข้อง)",
    stat_in_process_emergency: "ดำเนินการ (ฉุกเฉิน)",
    stat_in_process_breakdown: "ดำเนินการ (ขัดข้อง)",
    stat_success_emergency: "สำเร็จ (ฉุกเฉิน)",
    stat_success_breakdown: "สำเร็จ (ขัดข้อง)",

    // Tabs
    tab_emergency: "เหตุฉุกเฉิน",
    tab_breakdown: "เหตุขัดข้อง",

    // Pagination
    prev_page: "ก่อนหน้า",
    next_page: "ถัดไป",
    records: "รายการ",

    // Home extras
    my_reports: "สำหรับฉัน",
    for_me_label: "(สำหรับฉัน)",
    live_monitoring: "ตรวจสอบแบบเรียลไทม์",

    // Edit modal
    edit_emergency_title: "แก้ไขข้อมูลเหตุฉุกเฉิน",
    edit_breakdown_title: "แก้ไขข้อมูลเหตุขัดข้อง",
    status_label: "สถานะ",

    // Floor display
    floor_display: "ชั้น",

    // Report
    report_title: "รายงาน",
    btn_show_report: "รายงาน",
    btn_export_excel: "ส่งออก Excel",
    btn_export_pdf: "ส่งออก PDF",
    report_emergency_stats: "สถิติเหตุฉุกเฉิน",
    report_breakdown_stats: "สถิติเหตุขัดข้อง",
    report_top_floors_emergency: "ชั้นที่มีเหตุบ่อย (ฉุกเฉิน)",
    report_top_floors_breakdown: "ชั้นที่มีเหตุบ่อย (ขัดข้อง)",
    report_top_emergency_types: "ประเภทเหตุฉุกเฉินบ่อย",
    report_top_types: "ประเภทขัดข้องบ่อย",
    report_generated: "สร้างเมื่อ",
    report_no_data: "ไม่มีข้อมูล",

    // User Auth
    user_login_title: "เข้าสู่ระบบ",
    user_login_subtitle: "เข้าสู่ระบบเพื่อแจ้งเหตุฉุกเฉินหรือเหตุขัดข้อง",
    auth_login_google: "เข้าสู่ระบบด้วย Google",
    auth_or: "หรือ",
    auth_email: "อีเมล",
    auth_password: "รหัสผ่าน",
    auth_confirm_password: "ยืนยันรหัสผ่าน",
    auth_login_btn: "เข้าสู่ระบบ",
    auth_logging_in: "กำลังเข้าสู่ระบบ...",
    auth_login_error: "อีเมลหรือรหัสผ่านไม่ถูกต้อง",
    auth_email_not_verified: "กรุณายืนยันอีเมลก่อนเข้าสู่ระบบ",
    auth_no_account: "ยังไม่มีบัญชี?",
    auth_register_link: "สมัครสมาชิก",
    auth_register_title: "สมัครสมาชิก",
    auth_register_subtitle: "สร้างบัญชีเพื่อแจ้งเหตุฉุกเฉินหรือเหตุขัดข้อง",
    auth_password_hint: "อย่างน้อย 6 ตัวอักษร",
    auth_password_mismatch: "รหัสผ่านไม่ตรงกัน",
    auth_password_short: "รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร",
    auth_register_btn: "สมัครสมาชิก",
    auth_registering: "กำลังสมัครสมาชิก...",
    auth_have_account: "มีบัญชีแล้ว?",
    auth_login_link: "เข้าสู่ระบบ",
    auth_otp_title: "ยืนยัน OTP",
    auth_otp_subtitle: "กรุณากรอกรหัส OTP ที่ส่งไปยัง",
    auth_otp_incomplete: "กรุณากรอก OTP ให้ครบ 6 หลัก",
    auth_otp_error: "OTP ไม่ถูกต้องหรือหมดอายุ",
    auth_verify_btn: "ยืนยัน",
    auth_verifying: "กำลังตรวจสอบ...",
    auth_resend: "ส่ง OTP อีกครั้ง",
    auth_resend_wait: "ส่งอีกครั้งใน",
    auth_resend_seconds: "วินาที",
    auth_resending: "กำลังส่ง...",
    auth_otp_check_email: "กรุณาตรวจสอบอีเมลของท่านเพื่อรับรหัส OTP 6 หลัก",
    nav_user_login: "เข้าสู่ระบบ",
    user_logout: "ออกจากระบบ",
    user_logged_in_as: "เข้าสู่ระบบในนาม",
    auth_login_required: "กรุณาเข้าสู่ระบบก่อนแจ้งเหตุ",
    auth_go_login: "เข้าสู่ระบบ",
    auth_register_success: "สมัครสมาชิกสำเร็จ! กรุณาตรวจสอบอีเมลเพื่อรับรหัส OTP",
  },
};

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>("en");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const savedLang = localStorage.getItem("language") as Language;
    if (savedLang && (savedLang === "en" || savedLang === "th")) {
      setLanguage(savedLang);
    }
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted) {
      localStorage.setItem("language", language);
    }
  }, [language, mounted]);

  const t = (key: string): string => {
    return translations[language][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
