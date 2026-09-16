"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";

export type Language = "en" | "th";

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
    nav_report: "Report Incident",
    nav_emergency: "Report Emergency",
    nav_breakdown: "Report Breakdown",
    nav_status: "Dashboard",
    nav_news: "News",
    nav_notify_setting: "Notify Setting",
    nav_contact: "Contact",
    nav_admin: "Admin",
    nav_operator: "Operator",
    nav_manage_users: "Manage Users",

    // Home page
    home_title: "Emergency and Breakdown Alerts",

    // Landing page (new home)
    hero_badge: "Now Accepting Reports",
    hero_title: "Emergency and Breakdown Alert System — 40th Anniversary Building, KMUTNB",
    hero_subtitle: "Report emergencies, breakdowns, and issues inside the 40th Anniversary Building so we can respond quickly, safely, and effectively.",
    hero_cta_report: "Report Now",
    hero_cta_status: "Check Status",
    feature_emergency_title: "Report Emergency",
    feature_emergency_desc: "Fire, injury, accidents, etc.",
    feature_breakdown_title: "Report Breakdown",
    feature_breakdown_desc: "Electrical, plumbing, elevator, equipment",
    feature_24h_title: "Available 24/7",
    feature_24h_desc: "Every day, no holidays",
    feature_connect_title: "Connect to Staff",
    feature_connect_desc: "Reaches the responsible team directly",
    category_section_title: "Types of Incidents You Can Report",
    category_section_subtitle: "Choose the category you need so our staff can respond quickly.",
    category_emergency_title: "Emergency",
    category_emergency_desc: "Fire, injury, theft, etc.",
    category_electrical_title: "Electrical",
    category_electrical_desc: "Power outage, short circuit",
    category_plumbing_title: "Plumbing",
    category_plumbing_desc: "No water, water leak",
    category_elevator_title: "Elevator",
    category_elevator_desc: "Elevator breakdown, stuck",
    category_equipment_title: "Equipment/Other",
    category_equipment_desc: "Air conditioning, appliances, and other systems",
    cta_banner_title: "Let's Build a Safer Environment Together",
    cta_banner_desc: "With everyone's cooperation in reporting issues, we can maintain the building safely and effectively.",
    cta_contact_label: "Contact Us",
    cta_contact_more: "View More Details",
    footer_quick_links: "Quick Links",
    footer_follow_us: "Follow Us",
    footer_rights: "All rights reserved.",
    footer_building_label: "40 Building",
    footer_for_admin: "For Admin",
    news_title: "News",
    news_empty: "No news at this time.",
    btn_emergency: "Emergency",
    btn_breakdown: "Breakdown",
    recent_events: "Report Table",
    th_no: "Case ID",
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
    filter_all_floors: "All Floors",
    filter_by_floor: "Filter by Floor",
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
    btn_add_superadmin: "Add Super Admin",
    manage_users_locked_hint: "Only a Super Admin can manage this account",
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
    th_finished_at: "Finished At",
    th_remark: "Remark",
    remark_placeholder: "Add a note for the reporter (e.g. reason for delay or failure)...",

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
    chart_title: "Incidents by Floor",
    chart_mode_all: "All",
    filter_all_types: "All Types",
    chart1_title: "Status Comparison",
    chart2_title: "Breakdown by Floor",
    chart3_title: "Breakdown by Type",
    chart4_title: "Emergency by Floor",
    chart5_title: "Emergency by Event",
    range_today: "Today",
    range_7d: "7 Days",
    range_30d: "30 Days",
    range_all: "All Time",
    report_choose_lang_title: "Choose Report Language",
    report_choose_lang_desc: "Select a language for the report view and exports",
    btn_change_language: "Change Language",
    report_summary_sheet: "Summary",
    th_total: "Total",

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
    auth_account_disabled_title: "Access Denied",
    auth_account_disabled_desc: "This account has been disabled. Please contact the administrator for assistance.",
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

    // Forgot / reset password
    auth_forgot_password: "Forgot password?",
    forgot_password_title: "Forgot Password",
    forgot_password_subtitle: "Enter your email and we'll send you a link to reset your password",
    forgot_password_btn: "Send Reset Link",
    forgot_password_sending: "Sending...",
    forgot_password_success_title: "Check your email",
    forgot_password_success_desc: "If an account exists for this email, we've sent a link to reset your password.",
    forgot_password_back_login: "Back to Sign In",
    reset_password_title: "Reset Password",
    reset_password_subtitle: "Enter your new password below",
    reset_password_new_label: "New Password",
    reset_password_confirm_label: "Confirm New Password",
    reset_password_btn: "Update Password",
    reset_password_saving: "Updating...",
    reset_password_success_title: "Password updated",
    reset_password_success_desc: "Your password has been updated. Please sign in with your new password.",
    reset_password_go_login: "Go to Sign In",
    reset_password_invalid_title: "Link expired or invalid",
    reset_password_invalid_desc: "This password reset link is no longer valid. Please request a new one.",
    reset_password_request_new: "Request New Link",
    reset_password_checking: "Verifying link...",

    // Manage Users
    manage_users_title: "Manage Users",
    manage_users_subtitle: "Add staff accounts and manage reporter access",
    th_signup_method: "Signup Method",
    provider_email: "Email",
    provider_google: "Google",
    status_active: "Active",
    status_disabled: "Disabled",
    btn_disable: "Disable",
    btn_enable: "Enable",
    btn_confirm_disable: "Confirm Disable?",
    btn_confirm_enable: "Confirm Enable?",
    manage_users_loading: "Loading users...",
    manage_users_empty: "No registered users found",

    // Profile & Account
    nav_profile: "Profile",
    nav_account: "Account",
    profile_title: "Profile",
    profile_subtitle: "Personalize how your account appears",
    username_label: "Username",
    username_hint: "Set a nickname to display instead of your email/role in the account menu",
    username_placeholder: "Enter a nickname",
    theme_label: "Theme",
    theme_light: "Light Mode",
    theme_dark: "Dark Mode",
    profile_update_success: "Saved successfully",
    profile_update_error: "Failed to save. Please try again.",
    account_title: "Account Settings",
    account_subtitle: "View your account details and manage your password",
    account_info_section: "Account Information",
    account_created_label: "Member Since",
    change_password_section: "Change Password",
    google_password_note: "This account signs in with Google. Password is managed by Google.",
    new_password_label: "New Password",
    current_password_label: "Current Password",
    password_too_short_error: "Password must be at least 8 characters",
    password_mismatch_error: "Passwords do not match",
    password_update_success: "Password updated successfully",
    wrong_current_password_error: "Current password is incorrect",
    superadmin_note: "This is the built-in system account. Profile and password cannot be changed here.",
    first_name_label: "First Name",
    last_name_label: "Last Name",

    // Notify Settings
    notify_settings_title: "Notify Setting",
    notify_settings_subtitle: "Configure LINE and Telegram alerts for new reports",
    notify_status_enabled: "Enabled",
    notify_status_configured_disabled: "Configured (Off)",
    notify_status_not_configured: "Not Configured",
    notify_enabled_label: "Enabled",
    notify_connection_section: "Connection",
    notify_token_unchanged_hint: "Leave blank to keep the currently saved token",
    notify_template_section: "Message Template (JSON)",
    notify_template_hint: "Raw JSON sent to the provider's API. Use {{title}}, {{case_id}}, {{type}}, {{floor}}, {{description}}, {{email}}, {{status}}, {{timestamp}}, {{remark}} as placeholders. {{title}} is the emergency/breakdown header text, {{case_id}} is the report's Case ID, and {{remark}} is only filled in when staff add/change a remark.",
    invalid_json_error: "Message template is not valid JSON",
    btn_test_send: "Send Test Message",
    notify_test_success: "Test message sent successfully",
    notify_test_not_configured: "Save a token and target ID first",
    notify_test_failed: "Failed to send test message",
    manage_users_confirm_disable: "Disable this user's access?",
    manage_users_confirm_enable: "Restore this user's access?",
    th_role: "Role",
    role_user: "Reporter",
    role_admin: "Admin",
    role_operator: "Operator",
    role_superadmin: "Super Admin",
  },
  th: {
    // Navbar
    nav_home: "หน้าหลัก",
    nav_report: "แจ้งเหตุ",
    nav_emergency: "แจ้งเหตุฉุกเฉิน",
    nav_breakdown: "แจ้งเหตุขัดข้อง",
    nav_status: "แดชบอร์ด",
    nav_news: "ข่าวสาร",
    nav_notify_setting: "ตั้งค่าแจ้งเตือน",
    nav_contact: "ติดต่อเรา",
    nav_admin: "แอดมิน",
    nav_operator: "เจ้าหน้าที่",
    nav_manage_users: "จัดการผู้ใช้",

    // Home page
    home_title: "ระบบแจ้งเหตุฉุกเฉินและเหตุขัดข้อง",

    // Landing page (new home)
    hero_badge: "เปิดให้แจ้งเหตุแล้ว",
    hero_title: "ระบบแจ้งเหตุฉุกเฉินและขัดข้อง อาคาร 40 ปี มจพ.",
    hero_subtitle: "ช่องทางการแจ้งเหตุฉุกเฉิน เหตุขัดข้อง และปัญหาต่าง ๆ ภายในอาคาร 40 ปี มจพ. เพื่อให้การดูแลและช่วยเหลือเป็นไปอย่างรวดเร็ว ปลอดภัย และมีประสิทธิภาพ",
    hero_cta_report: "แจ้งเหตุทันที",
    hero_cta_status: "ตรวจสอบสถานะ",
    feature_emergency_title: "แจ้งเหตุฉุกเฉิน",
    feature_emergency_desc: "เช่น เพลิงไหม้/ผู้บาดเจ็บ/อุบัติเหตุ",
    feature_breakdown_title: "แจ้งเหตุขัดข้อง",
    feature_breakdown_desc: "เช่น ไฟฟ้า/ประปา/ลิฟต์/อุปกรณ์ต่าง ๆ",
    feature_24h_title: "แจ้งได้ตลอด 24 ชม.",
    feature_24h_desc: "ทุกวัน ไม่มีวันหยุด",
    feature_connect_title: "เชื่อมต่อเจ้าหน้าที่",
    feature_connect_desc: "ถึงหน่วยงานที่เกี่ยวข้องโดยตรง",
    category_section_title: "ประเภทเหตุที่สามารถแจ้งได้",
    category_section_subtitle: "เลือกประเภทที่ต้องการแจ้ง เพื่อให้เจ้าหน้าที่เข้ามาดำเนินการได้อย่างรวดเร็ว",
    category_emergency_title: "เหตุฉุกเฉิน",
    category_emergency_desc: "เช่น เพลิงไหม้/เหตุบาดเจ็บ",
    category_electrical_title: "ไฟฟ้า",
    category_electrical_desc: "ไฟดับ/ไฟช็อต",
    category_plumbing_title: "ประปา",
    category_plumbing_desc: "น้ำไม่ไหล/น้ำรั่ว",
    category_elevator_title: "ลิฟต์",
    category_elevator_desc: "ลิฟต์เสีย/ติดค้าง",
    category_equipment_title: "อุปกรณ์/ระบบอื่น ๆ",
    category_equipment_desc: "แอร์ ระบบปรับอากาศ เครื่องใช้อุปกรณ์",
    cta_banner_title: "ร่วมกันสร้างสภาพแวดล้อมที่ปลอดภัย",
    cta_banner_desc: "ด้วยความร่วมมือของทุกคนในการแจ้งเหตุ เพื่อหาปัญหา เพื่อให้การดูแลอาคารเป็นไปอย่างมีประสิทธิภาพ",
    cta_contact_label: "ติดต่อสอบถาม",
    cta_contact_more: "ดูรายละเอียดเพิ่มเติม",
    footer_quick_links: "เมนูลัด",
    footer_follow_us: "ติดตามเรา",
    footer_rights: "สงวนลิขสิทธิ์",
    footer_building_label: "อาคาร 40 ปี",
    footer_for_admin: "สำหรับเจ้าหน้าที่",
    news_title: "ข่าวสาร",
    news_empty: "ยังไม่มีข่าวสารในขณะนี้",
    btn_emergency: "เหตุฉุกเฉิน",
    btn_breakdown: "เหตุขัดข้อง",
    recent_events: "ตารางแจ้งเหตุ",
    th_no: "หมายเลขเคส",
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
    filter_all_floors: "ทุกชั้น",
    filter_by_floor: "กรองตามชั้น",
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
    btn_add_superadmin: "เพิ่ม Super Admin",
    manage_users_locked_hint: "มีแค่ Super Admin เท่านั้นที่จัดการบัญชีนี้ได้",
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
    th_finished_at: "เวลาเสร็จสิ้น",
    th_remark: "หมายเหตุ",
    remark_placeholder: "เพิ่มหมายเหตุถึงผู้แจ้ง (เช่น สาเหตุที่ล่าช้าหรือไม่สำเร็จ)...",

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
    chart_title: "จำนวนแจ้งเหตุตามชั้น",
    chart_mode_all: "ทั้งหมด",
    filter_all_types: "ทุกประเภท",
    chart1_title: "เปรียบเทียบสถานะ",
    chart2_title: "เหตุขัดข้องตามชั้น",
    chart3_title: "เหตุขัดข้องตามประเภท",
    chart4_title: "เหตุฉุกเฉินตามชั้น",
    chart5_title: "เหตุฉุกเฉินตามเหตุการณ์",
    range_today: "วันนี้",
    range_7d: "7 วัน",
    range_30d: "30 วัน",
    range_all: "ทั้งหมด",
    report_choose_lang_title: "เลือกภาษารายงาน",
    report_choose_lang_desc: "เลือกภาษาสำหรับมุมมองรายงานและการส่งออก",
    btn_change_language: "เปลี่ยนภาษา",
    report_summary_sheet: "สรุป",
    th_total: "รวม",

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
    auth_account_disabled_title: "ไม่สามารถเข้าใช้งานได้",
    auth_account_disabled_desc: "บัญชีนี้ถูกระงับการใช้งาน กรุณาติดต่อผู้ดูแลระบบเพื่อขอความช่วยเหลือ",
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

    // Forgot / reset password
    auth_forgot_password: "ลืมรหัสผ่าน?",
    forgot_password_title: "ลืมรหัสผ่าน",
    forgot_password_subtitle: "กรอกอีเมลของคุณ เราจะส่งลิงก์สำหรับตั้งรหัสผ่านใหม่ไปให้",
    forgot_password_btn: "ส่งลิงก์รีเซ็ตรหัสผ่าน",
    forgot_password_sending: "กำลังส่ง...",
    forgot_password_success_title: "ตรวจสอบอีเมลของคุณ",
    forgot_password_success_desc: "หากมีบัญชีที่ใช้อีเมลนี้อยู่ในระบบ เราได้ส่งลิงก์สำหรับตั้งรหัสผ่านใหม่ไปให้แล้ว",
    forgot_password_back_login: "กลับไปหน้าเข้าสู่ระบบ",
    reset_password_title: "ตั้งรหัสผ่านใหม่",
    reset_password_subtitle: "กรอกรหัสผ่านใหม่ของคุณด้านล่าง",
    reset_password_new_label: "รหัสผ่านใหม่",
    reset_password_confirm_label: "ยืนยันรหัสผ่านใหม่",
    reset_password_btn: "บันทึกรหัสผ่านใหม่",
    reset_password_saving: "กำลังบันทึก...",
    reset_password_success_title: "ตั้งรหัสผ่านใหม่สำเร็จ",
    reset_password_success_desc: "รหัสผ่านของคุณถูกอัปเดตแล้ว กรุณาเข้าสู่ระบบด้วยรหัสผ่านใหม่",
    reset_password_go_login: "ไปหน้าเข้าสู่ระบบ",
    reset_password_invalid_title: "ลิงก์หมดอายุหรือไม่ถูกต้อง",
    reset_password_invalid_desc: "ลิงก์สำหรับตั้งรหัสผ่านใหม่นี้ใช้ไม่ได้แล้ว กรุณาขอลิงก์ใหม่อีกครั้ง",
    reset_password_request_new: "ขอลิงก์ใหม่",
    reset_password_checking: "กำลังตรวจสอบลิงก์...",

    // Manage Users
    manage_users_title: "จัดการผู้ใช้",
    manage_users_subtitle: "เพิ่มบัญชีเจ้าหน้าที่ และจัดการสิทธิ์การเข้าใช้งานของผู้แจ้งเหตุ",
    th_signup_method: "วิธีสมัครสมาชิก",
    provider_email: "อีเมล",
    provider_google: "Google",
    status_active: "ใช้งานได้",
    status_disabled: "ถูกระงับ",
    btn_disable: "ระงับสิทธิ์",
    btn_enable: "เปิดใช้งาน",
    btn_confirm_disable: "ยืนยันการระงับสิทธิ์?",
    btn_confirm_enable: "ยืนยันการเปิดใช้งาน?",
    manage_users_loading: "กำลังโหลดข้อมูลผู้ใช้...",
    manage_users_empty: "ไม่พบผู้ใช้ที่ลงทะเบียน",

    // Profile & Account
    nav_profile: "โปรไฟล์",
    nav_account: "บัญชี",
    profile_title: "โปรไฟล์",
    profile_subtitle: "ปรับแต่งการแสดงผลบัญชีของคุณ",
    username_label: "ชื่อผู้ใช้",
    username_hint: "ตั้งชื่อเล่นเพื่อแสดงแทนอีเมล/บทบาทในเมนูบัญชี",
    username_placeholder: "ใส่ชื่อเล่น",
    theme_label: "ธีม",
    theme_light: "โหมดสว่าง",
    theme_dark: "โหมดมืด",
    profile_update_success: "บันทึกสำเร็จ",
    profile_update_error: "บันทึกไม่สำเร็จ กรุณาลองใหม่อีกครั้ง",
    account_title: "ตั้งค่าบัญชี",
    account_subtitle: "ดูข้อมูลบัญชีของคุณและจัดการรหัสผ่าน",
    account_info_section: "ข้อมูลบัญชี",
    account_created_label: "สมาชิกตั้งแต่",
    change_password_section: "เปลี่ยนรหัสผ่าน",
    google_password_note: "บัญชีนี้เข้าสู่ระบบด้วย Google รหัสผ่านถูกจัดการโดย Google",
    new_password_label: "รหัสผ่านใหม่",
    current_password_label: "รหัสผ่านปัจจุบัน",
    password_too_short_error: "รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร",
    password_mismatch_error: "รหัสผ่านไม่ตรงกัน",
    password_update_success: "เปลี่ยนรหัสผ่านสำเร็จ",
    wrong_current_password_error: "รหัสผ่านปัจจุบันไม่ถูกต้อง",
    superadmin_note: "นี่คือบัญชีระบบในตัว ไม่สามารถแก้ไขโปรไฟล์หรือรหัสผ่านได้ที่นี่",
    first_name_label: "ชื่อจริง",
    last_name_label: "นามสกุล",

    // Notify Settings
    notify_settings_title: "ตั้งค่าแจ้งเตือน",
    notify_settings_subtitle: "ตั้งค่าแจ้งเตือนเข้า LINE และ Telegram เมื่อมีการแจ้งเหตุใหม่",
    notify_status_enabled: "เปิดใช้งาน",
    notify_status_configured_disabled: "ตั้งค่าแล้ว (ปิดอยู่)",
    notify_status_not_configured: "ยังไม่ได้ตั้งค่า",
    notify_enabled_label: "เปิดใช้งาน",
    notify_connection_section: "การเชื่อมต่อ",
    notify_token_unchanged_hint: "เว้นว่างไว้เพื่อใช้ token เดิมที่บันทึกไว้",
    notify_template_section: "รูปแบบข้อความ (JSON)",
    notify_template_hint: "JSON ดิบที่จะส่งไปยัง API ของผู้ให้บริการ ใช้ {{title}}, {{case_id}}, {{type}}, {{floor}}, {{description}}, {{email}}, {{status}}, {{timestamp}}, {{remark}} เป็นตัวแปรได้ ({{title}} คือหัวข้อฉุกเฉิน/ขัดข้อง, {{case_id}} คือหมายเลขเคส, {{remark}} จะมีค่าเมื่อเจ้าหน้าที่เพิ่ม/แก้ไขหมายเหตุเท่านั้น)",
    invalid_json_error: "รูปแบบข้อความไม่ใช่ JSON ที่ถูกต้อง",
    btn_test_send: "ส่งข้อความทดสอบ",
    notify_test_success: "ส่งข้อความทดสอบสำเร็จ",
    notify_test_not_configured: "กรุณาบันทึก token และ target ID ก่อน",
    notify_test_failed: "ส่งข้อความทดสอบไม่สำเร็จ",
    manage_users_confirm_disable: "ระงับสิทธิ์การเข้าใช้งานของผู้ใช้นี้?",
    manage_users_confirm_enable: "คืนสิทธิ์การเข้าใช้งานของผู้ใช้นี้?",
    th_role: "บทบาท",
    role_user: "ผู้แจ้งเหตุ",
    role_admin: "แอดมิน",
    role_operator: "เจ้าหน้าที่",
    role_superadmin: "ซุปเปอร์แอดมิน",
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

export function translate(lang: Language, key: string): string {
  return translations[lang][key] || key;
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
