"use client";

import Image from "next/image";
import Link from "next/link";
import { useLanguage } from "@/lib/LanguageContext";
import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";

export default function BreakdownPage() {
  const { t } = useLanguage();
  const [user, setUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({
    event_type: "",
    other_type: "",
    floor: "",
    description: "",
    reporter_email: "",
  });
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: string; text: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user?.email) {
        setFormData((prev) => ({ ...prev, reporter_email: session.user.email! }));
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user?.email) {
        setFormData((prev) => ({ ...prev, reporter_email: session.user.email! }));
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setPhoto(file);
    if (file) {
      setPhotoPreview(URL.createObjectURL(file));
    } else {
      setPhotoPreview(null);
    }
  };

  const removePhoto = () => {
    setPhoto(null);
    setPhotoPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      setMessage({ type: "auth", text: "" });
      return;
    }

    setIsSubmitting(true);
    try {
      let photo_url = "";

      if (photo) {
        const ext = photo.name.split(".").pop();
        const path = `${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from("breakdown-photos")
          .upload(path, photo);
        if (uploadError) throw new Error(`Upload failed: ${uploadError.message}`);
        const { data: { publicUrl } } = supabase.storage
          .from("breakdown-photos")
          .getPublicUrl(path);
        photo_url = publicUrl;
      }

      const response = await fetch("/api/submit_breakdown", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          event_type: formData.event_type === "other" ? formData.other_type : formData.event_type,
          floor: formData.floor,
          description: formData.description,
          reporter_email: formData.reporter_email,
          photo_url,
        }),
      });

      if (response.ok) {
        setMessage({ type: "success", text: t("submit_success") || "Submitted successfully!" });
        setFormData({ event_type: "", other_type: "", floor: "", description: "", reporter_email: user?.email ?? "" });
        removePhoto();
      } else {
        setMessage({ type: "error", text: t("submit_error") || "Submission failed. Please try again." });
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "An error occurred.";
      setMessage({ type: "error", text: msg });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const inputCls = "w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400/50 focus:border-emerald-400 transition-all duration-200";

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="relative">
        {/* Dark Header */}
        <div className="bg-gradient-to-br from-slate-900 via-emerald-950 to-slate-900 py-10 px-4">
          <div className="container mx-auto">
            <div className="flex justify-center mb-4 md:hidden">
              <Image src="/breakdown_dog.png" alt="Breakdown" width={100} height={100} className="object-contain drop-shadow-xl" />
            </div>
            <div className="text-center md:pl-44 lg:pl-52">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 mb-3">
                <svg className="w-6 h-6 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-white animate-fadeInUp">
                {t("breakdown_title")}
              </h2>
            </div>
          </div>
        </div>

        {/* Desktop image */}
        <div className="hidden md:block absolute left-4 lg:left-10 top-4 z-20 pointer-events-none select-none">
          <Image src="/breakdown_dog.png" alt="Breakdown" width={160} height={240} className="object-contain drop-shadow-2xl" />
        </div>

        {/* Content area */}
        <div className="container mx-auto px-4 py-6 sm:py-8 mb-16">
          <div className="flex gap-4 lg:gap-6 items-start">
            <div className="hidden md:block w-44 lg:w-52 shrink-0" />

            <div className="flex-1 min-w-0">
              {/* Flash Message */}
              {message && (
                <>
                  {message.type === "auth" ? (
                    <div className="mb-5 p-4 rounded-xl bg-amber-50 border border-amber-200 animate-fadeIn">
                      <div className="flex items-start gap-3">
                        <svg className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                        </svg>
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-amber-800">
                            ไม่สามารถส่งคำขอได้ · Cannot submit
                          </p>
                          <p className="text-sm text-amber-700 mt-0.5">
                            โปรดทำการสมัครหรือเข้าสู่ระบบก่อน · Please register or sign in first
                          </p>
                          <div className="flex gap-3 mt-3">
                            <Link
                              href="/user_login"
                              className="inline-flex items-center px-4 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold transition-colors"
                            >
                              {t("auth_login_btn")}
                            </Link>
                            <Link
                              href="/user_register"
                              className="inline-flex items-center px-4 py-1.5 rounded-lg border border-amber-400 text-amber-700 hover:bg-amber-100 text-xs font-semibold transition-colors"
                            >
                              {t("auth_register_btn")}
                            </Link>
                          </div>
                        </div>
                        <button onClick={() => setMessage(null)} className="text-amber-400 hover:text-amber-600 shrink-0">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className={`mb-5 p-4 rounded-xl flex items-start justify-between gap-3 animate-fadeIn ${
                      message.type === "success"
                        ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                        : "bg-red-50 text-red-800 border border-red-200"
                    }`}>
                      <div className="flex items-center gap-2">
                        {message.type === "success" ? (
                          <svg className="w-5 h-5 text-emerald-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        ) : (
                          <svg className="w-5 h-5 text-red-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        )}
                        <span className="text-sm font-medium">{message.text}</span>
                      </div>
                      <button onClick={() => setMessage(null)} className="text-lg leading-none opacity-60 hover:opacity-100 shrink-0">&times;</button>
                    </div>
                  )}
                </>
              )}

              {/* Form Card */}
              <form onSubmit={handleSubmit}>
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden animate-fadeInUp">
                  <div className="bg-gradient-to-r from-emerald-600 to-teal-500 px-6 py-4">
                    <h3 className="text-white font-semibold text-sm tracking-wide">กรอกข้อมูลเหตุขัดข้อง · Breakdown Details</h3>
                  </div>

                  <div className="p-5 sm:p-6 space-y-5">
                    <div>
                      <label htmlFor="event_type" className="block text-sm font-medium text-slate-700 mb-1.5">
                        {t("breakdown_type_label")} <span className="text-red-500">*</span>
                      </label>
                      <select className={inputCls} id="event_type" name="event_type" value={formData.event_type} onChange={handleChange} required>
                        <option value="">{t("select_type")}</option>
                        <option value={t("type_electricity")}>{t("type_electricity")}</option>
                        <option value={t("type_plumbing")}>{t("type_plumbing")}</option>
                        <option value={t("type_ac")}>{t("type_ac")}</option>
                        <option value={t("type_elevator")}>{t("type_elevator")}</option>
                        <option value={t("type_internet")}>{t("type_internet")}</option>
                        <option value={t("type_equipment")}>{t("type_equipment")}</option>
                        <option value="other">{t("type_other")}</option>
                      </select>
                    </div>

                    {formData.event_type === "other" && (
                      <div className="animate-fadeIn">
                        <label htmlFor="other_type" className="block text-sm font-medium text-slate-700 mb-1.5">
                          {t("other_type_label")} <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text" className={inputCls} id="other_type" name="other_type"
                          placeholder={t("other_type_placeholder")} value={formData.other_type} onChange={handleChange} required
                        />
                      </div>
                    )}

                    <div>
                      <label htmlFor="floor" className="block text-sm font-medium text-slate-700 mb-1.5">
                        {t("breakdown_floor_label")} <span className="text-red-500">*</span>
                      </label>
                      <select className={inputCls} id="floor" name="floor" value={formData.floor} onChange={handleChange} required>
                        <option value="">{t("select_floor")}</option>
                        {Array.from({ length: 12 }, (_, i) => i + 1).map((i) => (
                          <option key={i} value={`${i}`}>{t("floor")} {i}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label htmlFor="description" className="block text-sm font-medium text-slate-700 mb-1.5">
                        {t("breakdown_desc_label")} <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        className={inputCls} id="description" name="description"
                        rows={4} placeholder={t("breakdown_desc_placeholder")}
                        value={formData.description} onChange={handleChange} required
                      />
                    </div>

                    <div>
                      <label htmlFor="reporter_email" className="block text-sm font-medium text-slate-700 mb-1.5">
                        {t("breakdown_email_label")} <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="email"
                        className={user ? `${inputCls} bg-slate-50 text-slate-500` : inputCls}
                        id="reporter_email" name="reporter_email"
                        placeholder="example@email.com"
                        value={formData.reporter_email}
                        onChange={handleChange}
                        readOnly={!!user}
                        required
                      />
                    </div>

                    {/* Photo Upload */}
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">
                        {t("breakdown_photo_label")}
                      </label>
                      {photoPreview ? (
                        <div className="relative rounded-xl overflow-hidden border border-slate-200">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={photoPreview} alt="preview" className="w-full max-h-48 object-cover" />
                          <button
                            type="button"
                            onClick={removePhoto}
                            className="absolute top-2 right-2 w-7 h-7 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center shadow transition-colors"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      ) : (
                        <div
                          className="border-2 border-dashed border-slate-200 rounded-xl p-4 hover:border-emerald-300 transition-colors duration-200 cursor-pointer"
                          onClick={() => fileInputRef.current?.click()}
                        >
                          <div className="flex flex-col items-center gap-2 text-slate-400">
                            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                            </svg>
                            <p className="text-xs text-center">{t("breakdown_photo_hint")}</p>
                          </div>
                          <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleFileChange}
                            className="hidden"
                          />
                        </div>
                      )}
                    </div>

                    <button
                      type="submit" disabled={isSubmitting}
                      className="w-full py-3 px-6 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-700 hover:to-teal-600 text-white font-semibold text-sm shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {isSubmitting ? (
                        <><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin-smooth" />{t("submitting")}</>
                      ) : t("btn_submit")}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
