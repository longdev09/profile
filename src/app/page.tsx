"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { fetchCategoriesApi, DEFAULT_CATEGORIES, AccordionCategory, sortVideosHotFirst } from "@/lib/videoData";
import YouTubeEmbed from "@/components/YouTubeEmbed";

export default function ProfilePage() {
  const [openAccordion, setOpenAccordion] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);
  const [categories, setCategories] = useState<AccordionCategory[]>(DEFAULT_CATEGORIES);
  const [activePlayingId, setActivePlayingId] = useState<string | null>(null);

  useEffect(() => {
    fetchCategoriesApi().then((data) => {
      if (data && data.length > 0) {
        setCategories(data);
      }
    });
  }, []);

  const handleCopyCoupon = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2500);
  };

  const toggleAccordion = (id: string) => {
    setOpenAccordion(openAccordion === id ? null : id);
  };

  return (
    <div className="min-h-screen bg-slate-900 md:py-8 flex justify-center items-center">
      {/* Container giả lập giao diện điện thoại di động */}
      <div className="w-full max-w-[430px] bg-[#fff5f6] min-h-screen md:min-h-[920px] md:rounded-[40px] shadow-[0_0_50px_rgba(241,28,101,0.25)] relative overflow-hidden border border-pink-100/80 flex flex-col">

        {/* Floating Top Navigation Header */}
        <header className="sticky top-0 z-30 bg-[#fff5f6]/90 backdrop-blur-md px-4 py-3 border-b border-pink-100 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#f11c65] animate-ping" />
            <span className="text-xs font-bold uppercase tracking-wider text-[#f11c65]">Slide Cưới Đẹp</span>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => {
                if (navigator.share) {
                  navigator.share({ title: "Slide Cưới Đẹp Bio", url: window.location.href });
                } else {
                  handleCopyCoupon(window.location.href);
                }
              }}
              className="w-8 h-8 rounded-full bg-white shadow-sm border border-pink-200 flex items-center justify-center text-[#f11c65] hover:bg-pink-50 transition active:scale-95"
              title="Chia sẻ trang"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 107.032-2.684 3 3 0 00-7.032 2.684m0 9.316a3 3 0 107.032 2.684 3 3 0 00-7.032-2.684" />
              </svg>
            </button>
          </div>
        </header>

        {/* Scrollable Main Content */}
        <main className="flex-1 overflow-y-auto px-3 py-3.5 space-y-4 pb-8">

          {/* SECTION 1: PROFILE HEADER & BRAND INFO */}
          <section className="text-center pt-1 space-y-3">
            {/* Highlight Direct Zalo Contact Banner Button */}
            <div className="pt-2">
              <a
                href="https://zalo.me/0388520344"
                target="_blank"
                rel="noreferrer"
                className="w-full group relative flex items-center justify-between p-3.5 rounded-2xl bg-gradient-to-r from-[#f11c65] via-[#ff6f91] to-[#ff8a7a] text-white shadow-lg shadow-[#f11c65]/30 hover:shadow-[#f11c65]/50 transition duration-300 active:scale-[0.98] border border-white/20"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-white font-black text-sm border border-white/30 group-hover:rotate-6 transition">
                    Zalo
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-extrabold tracking-wide uppercase">Nhắn Zalo Tư Vấn Trực Tiếp</p>
                    <p className="text-[11px] text-white/90">Hỗ trợ thiết kế & báo giá nhanh 24/7</p>
                  </div>
                </div>
                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center group-hover:translate-x-1 transition">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </a>
            </div>
          </section>

          {/* SECTION 2: ACCORDION CATEGORIES DIRECT YOUTUBE CARDS */}
          <section className="space-y-3">
            <div className="text-center pt-2 space-y-1">
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight font-heading">
                Slide cưới <span className="font-handwriting text-[#f11c65] text-3xl sm:text-4xl font-normal leading-none inline-block pl-1">& LED đẹp</span>
              </h2>
              <p className="text-xs text-slate-500 max-w-[310px] mx-auto leading-relaxed">
                Khám phá bộ sưu tập Video Slide Cưới trend TikTok & Màn LED Sân Khấu tiệc cưới ấn tượng ✨
              </p>
            </div>

            <div className="space-y-2.5">
              {categories.map((cat) => {
                const isOpen = openAccordion === cat.id;
                return (
                  <div
                    key={cat.id}
                    className={`rounded-2xl border transition-all duration-300 overflow-hidden ${isOpen
                      ? "bg-white border-[#f11c65] shadow-md"
                      : "bg-white/80 hover:bg-white border-pink-200/80 shadow-sm"
                      }`}
                  >
                    {/* Accordion Category Header */}
                    <button
                      onClick={() => toggleAccordion(cat.id)}
                      className="w-full p-3 flex items-center justify-between text-left font-bold text-xs tracking-wide text-slate-800 hover:text-[#f11c65] transition"
                    >
                      <span className="flex items-center space-x-2">
                        <span className={`w-2 h-2 rounded-full ${isOpen ? "bg-[#f11c65]" : "bg-slate-300"}`} />
                        <span className="uppercase">{cat.title}</span>
                      </span>
                      <div className="flex items-center space-x-2">
                        {cat.badge && (
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-extrabold ${cat.badge === "HOT" || cat.badge === "BÁN CHẠY"
                            ? "bg-[#f11c65] text-white"
                            : "bg-pink-100 text-[#f11c65]"
                            }`}>
                            {cat.badge}
                          </span>
                        )}
                        <svg
                          className={`w-4 h-4 text-slate-400 transition-transform duration-300 ${isOpen ? "transform rotate-180 text-[#f11c65]" : ""}`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </button>

                    {/* Accordion Content Drawer: Direct Video Cards */}
                    {isOpen && (
                      <div className="p-2 space-y-2 border-t border-pink-100 bg-[#fff7f8]/50 max-h-[460px] sm:max-h-[520px] overflow-y-auto">
                        {sortVideosHotFirst(cat.videos).map((vid) => (
                          <div
                            key={vid.id}
                            className="p-2.5 bg-white rounded-xl border border-pink-100/90 shadow-2xs space-y-1.5 hover:border-pink-300 transition"
                          >
                            {/* Video Title & Duration Header */}
                            <div className="flex items-center justify-between px-0.5 pt-0.5">
                              <p className="text-xs font-bold text-slate-800 flex items-center gap-1.5 truncate pr-2">
                                {vid.hot ? (
                                  <span className="text-[10px] bg-red-500 text-white font-extrabold px-1.5 py-0.2 rounded-md flex-shrink-0 animate-pulse">
                                    🔥 HOT
                                  </span>
                                ) : (
                                  <span className="w-1.5 h-1.5 rounded-full bg-[#f11c65] flex-shrink-0" />
                                )}
                                <span className="truncate">{vid.title}</span>
                              </p>
                              {vid.duration && (
                                <span className="text-[10px] bg-pink-50 text-[#f11c65] border border-pink-200/80 px-2 py-0.5 rounded-full font-semibold flex-shrink-0">
                                  ⏱️ {vid.duration}
                                </span>
                              )}
                            </div>

                            {/* Embedded Responsive YouTube Player with Cover & Play Overlay */}
                            <YouTubeEmbed
                              youtubeId={vid.youtubeId}
                              title={vid.title}
                              isPlaying={activePlayingId === vid.id}
                              onPlay={() => setActivePlayingId(vid.id)}
                            />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>

          {/* SECTION 3: ZALO QR CODE CARD */}
          <section className="bg-white rounded-3xl border border-pink-200 p-4 shadow-sm text-center space-y-3">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-[#f11c65]">ZALO CONTACT CARD</span>
              <p className="text-[11px] text-slate-500">Quét mã QR bên dưới bằng camera hoặc app Zalo</p>
            </div>

            {/* Real Zalo QR Code Card Image */}
            <div className="relative inline-block p-2 bg-[#fff5f6] rounded-3xl border-2 border-dashed border-pink-200 overflow-hidden shadow-inner max-w-[280px] w-full">
              <div className="w-full rounded-2xl overflow-hidden shadow-sm border border-pink-100 bg-white">
                <Image
                  src="/zalo.jpg"
                  alt="Danh Thiếp Zalo Thúy Sa"
                  width={320}
                  height={400}
                  className="w-full h-auto object-contain rounded-2xl"
                />
              </div>
            </div>

            <div className="flex items-center justify-center gap-2 pt-1">
              <a
                href="https://zalo.me/0388520344"
                target="_blank"
                rel="noreferrer"
                className="w-full max-w-[260px] py-2.5 rounded-xl bg-[#0068ff] text-white text-xs font-extrabold hover:bg-blue-600 transition shadow-sm active:scale-95 flex items-center justify-center gap-2 mx-auto"
              >
                <span>Mở Zalo Trực Tiếp</span>
              </a>
            </div>
          </section>

          {/* SECTION 4: ORDERING STEPS */}
          <section className="bg-[#fff0f3] rounded-3xl border border-pink-200/90 p-4 space-y-3">
            <div className="text-center">
              <span className="text-xs font-bold uppercase tracking-wider text-[#f11c65]">QUY TRÌNH ĐẶT HÀNG & THANH TOÁN</span>
              <h3 className="text-sm font-extrabold text-slate-900 mt-0.5">3 Bước Đơn Giản Để Sở Hữu Video Slide Cưới & Màn LED</h3>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="bg-[#ffffff] rounded-2xl p-2.5 border border-pink-100 shadow-2xs space-y-1">
                <div className="w-7 h-7 mx-auto rounded-full bg-[#f11c65] text-white font-extrabold text-xs flex items-center justify-center">
                  1
                </div>
                <h4 className="font-bold text-slate-900 text-[11px]">CHỌN MẪU</h4>
                <p className="text-[10px] text-slate-500 leading-tight">Gửi ảnh & thông tin dâu rể</p>
              </div>

              <div className="bg-[#ffffff] rounded-2xl p-2.5 border border-pink-100 shadow-2xs space-y-1">
                <div className="w-7 h-7 mx-auto rounded-full bg-[#ff6f91] text-white font-extrabold text-xs flex items-center justify-center">
                  2
                </div>
                <h4 className="font-bold text-slate-900 text-[11px]">NHẬN DEMO</h4>
                <p className="text-[10px] text-slate-500 leading-tight">Xem trước & chỉnh sửa theo ý</p>
              </div>

              <div className="bg-[#ffffff] rounded-2xl p-2.5 border border-pink-100 shadow-2xs space-y-1">
                <div className="w-7 h-7 mx-auto rounded-full bg-[#ff8a7a] text-white font-extrabold text-xs flex items-center justify-center">
                  3
                </div>
                <h4 className="font-bold text-slate-900 text-[11px]">HOÀN THIỆN</h4>
                <p className="text-[10px] text-slate-500 leading-tight">Bàn giao Video & Màn LED sẵn sàng</p>
              </div>
            </div>
          </section>

          {/* SECTION 5: FOOTER */}
          <footer className="text-center pt-4 pb-2 space-y-1 border-t border-pink-200/60">
            <div className="flex items-center justify-center space-x-1.5 text-xs font-semibold text-slate-600">
              <span>Thiết kế với</span>
              <span className="text-[#f11c65] animate-pulse">❤️</span>
              <span>bởi <strong className="text-[#f11c65]">Slide Cưới Đẹp</strong></span>
            </div>
            <p className="text-[10px] text-slate-400">© 2026 Slide Cưới Đẹp. All rights reserved.</p>
          </footer>

        </main>
      </div>
    </div>
  );
}
