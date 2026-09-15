"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  AccordionCategory,
  YoutubeVideo,
  DEFAULT_CATEGORIES,
  fetchCategoriesApi,
  saveCategoriesApi,
  extractYoutubeId,
  sortVideosHotFirst,
} from "@/lib/videoData";
import YouTubeEmbed from "@/components/YouTubeEmbed";

export default function AdminPage() {
  const ADMIN_PASSWORD = "2107";

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [passwordInput, setPasswordInput] = useState<string>("");
  const [passwordError, setPasswordError] = useState<boolean>(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState<boolean>(true);

  const [categories, setCategories] = useState<AccordionCategory[]>(DEFAULT_CATEGORIES);
  const [selectedCatId, setSelectedCatId] = useState<string>("cat-1");
  const [videoTitle, setVideoTitle] = useState<string>("");
  const [youtubeUrlInput, setYoutubeUrlInput] = useState<string>("");
  const [durationInput, setDurationInput] = useState<string>("");
  const [isHot, setIsHot] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [activeAdminTab, setActiveAdminTab] = useState<string>("cat-1");
  const [isLoadingYtInfo, setIsLoadingYtInfo] = useState<boolean>(false);
  const [fetchedYtId, setFetchedYtId] = useState<string | null>(null);
  const [activePlayingId, setActivePlayingId] = useState<string | null>(null);

  // Edit State
  const [editingVideoId, setEditingVideoId] = useState<string | null>(null);

  const previewExtractedId = extractYoutubeId(youtubeUrlInput);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedAuth = sessionStorage.getItem("admin_authenticated");
      if (savedAuth === "true") {
        setIsAuthenticated(true);
      }
      setIsCheckingAuth(false);
    }
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordInput.trim() === ADMIN_PASSWORD) {
      setIsAuthenticated(true);
      setPasswordError(false);
      sessionStorage.setItem("admin_authenticated", "true");
    } else {
      setPasswordError(true);
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    sessionStorage.removeItem("admin_authenticated");
    setPasswordInput("");
  };

  useEffect(() => {
    fetchCategoriesApi().then((data) => {
      if (data && data.length > 0) {
        setCategories(data);
      }
    });
  }, []);

  const fetchYoutubeInfo = async (id: string, force = false) => {
    if (!id || (id === fetchedYtId && !force)) return;
    setIsLoadingYtInfo(true);
    try {
      const res = await fetch(`/api/youtube-info?id=${id}`);
      if (res.ok) {
        const data = await res.json();
        if (data.title) {
          setVideoTitle(data.title);
        }
        if (data.duration) {
          setDurationInput(data.duration);
        }
        setFetchedYtId(id);
        if (data.title || data.duration) {
          showToast(`⚡ Đã tự điền Tên & Thời lượng từ YouTube!`);
        }
      }
    } catch (e) {
      console.error("Lỗi tự lấy thông tin từ YouTube:", e);
    } finally {
      setIsLoadingYtInfo(false);
    }
  };

  useEffect(() => {
    if (previewExtractedId && previewExtractedId !== fetchedYtId && !editingVideoId) {
      fetchYoutubeInfo(previewExtractedId);
    }
  }, [previewExtractedId, editingVideoId]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleStartEdit = (catId: string, video: YoutubeVideo) => {
    setEditingVideoId(video.id);
    setSelectedCatId(catId);
    setVideoTitle(video.title);
    setYoutubeUrlInput(video.youtubeId);
    setDurationInput(video.duration || "");
    setIsHot(!!video.hot);
    setFetchedYtId(video.youtubeId);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleCancelEdit = () => {
    setEditingVideoId(null);
    setVideoTitle("");
    setYoutubeUrlInput("");
    setDurationInput("");
    setIsHot(false);
    setFetchedYtId(null);
  };

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!youtubeUrlInput.trim()) {
      alert("Vui lòng nhập Link YouTube hoặc ID Video!");
      return;
    }

    const extractedId = extractYoutubeId(youtubeUrlInput);
    if (!extractedId) {
      alert("Link YouTube không hợp lệ!");
      return;
    }

    let updatedCategories: AccordionCategory[] = [];

    if (editingVideoId) {
      // MODE: EDIT EXISTING VIDEO
      const updatedVideo: YoutubeVideo = {
        id: editingVideoId,
        title: videoTitle.trim() || "Demo Video",
        youtubeId: extractedId,
        duration: durationInput.trim() || undefined,
        hot: isHot,
      };

      updatedCategories = categories.map((cat) => {
        // Remove video from old category list if moving category
        const filteredVideos = cat.videos.filter((v) => v.id !== editingVideoId);

        if (cat.id === selectedCatId) {
          return {
            ...cat,
            videos: [updatedVideo, ...filteredVideos],
          };
        }
        return {
          ...cat,
          videos: filteredVideos,
        };
      });

      showToast("✏️ Đã cập nhật Video thành công!");
    } else {
      // MODE: ADD NEW VIDEO
      const newVideo: YoutubeVideo = {
        id: `v-${Date.now()}`,
        title: videoTitle.trim() || "Demo Video",
        youtubeId: extractedId,
        duration: durationInput.trim() || undefined,
        hot: isHot,
      };

      updatedCategories = categories.map((cat) => {
        if (cat.id === selectedCatId) {
          return {
            ...cat,
            videos: [newVideo, ...cat.videos],
          };
        }
        return cat;
      });

      showToast("🎉 Đã lưu video mới vào src/data/videos.json!");
    }

    setCategories(updatedCategories);
    await saveCategoriesApi(updatedCategories);
    handleCancelEdit();
  };

  const handleDeleteVideo = async (catId: string, videoId: string) => {
    if (!confirm("Bạn có chắc chắn muốn xóa video này không?")) return;

    const updatedCategories = categories.map((cat) => {
      if (cat.id === catId) {
        return {
          ...cat,
          videos: cat.videos.filter((v) => v.id !== videoId),
        };
      }
      return cat;
    });

    setCategories(updatedCategories);
    const success = await saveCategoriesApi(updatedCategories);
    if (success) {
      showToast("🗑️ Đã xóa & cập nhật src/data/videos.json!");
    }
  };

  const handleSortCategoryHotFirst = async (catId: string) => {
    const updatedCategories = categories.map((cat) => {
      if (cat.id === catId) {
        return {
          ...cat,
          videos: sortVideosHotFirst(cat.videos),
        };
      }
      return cat;
    });

    setCategories(updatedCategories);
    const success = await saveCategoriesApi(updatedCategories);
    if (success) {
      showToast("🔥 Đã ưu tiên đẩy tất cả Mẫu Hot lên đầu danh mục!");
    }
  };

  const handleMoveVideo = async (catId: string, videoId: string, direction: "up" | "down") => {
    const updatedCategories = categories.map((cat) => {
      if (cat.id === catId) {
        const idx = cat.videos.findIndex((v) => v.id === videoId);
        if (idx === -1) return cat;
        const targetIdx = direction === "up" ? idx - 1 : idx + 1;
        if (targetIdx < 0 || targetIdx >= cat.videos.length) return cat;

        const newVideos = [...cat.videos];
        const [moved] = newVideos.splice(idx, 1);
        newVideos.splice(targetIdx, 0, moved);

        return {
          ...cat,
          videos: newVideos,
        };
      }
      return cat;
    });

    setCategories(updatedCategories);
    await saveCategoriesApi(updatedCategories);
  };

  const handleResetDefault = async () => {
    if (!confirm("Bạn có chắc muốn khôi phục danh sách video mẫu mặc định không?")) return;
    setCategories(DEFAULT_CATEGORIES);
    handleCancelEdit();
    const success = await saveCategoriesApi(DEFAULT_CATEGORIES);
    if (success) {
      showToast("🔄 Đã khôi phục dữ liệu mặc định trong videos.json!");
    }
  };

  const handleDownloadJson = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(categories, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", "videos.json");
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showToast("📥 Đã tải file videos.json về máy thành công!");
  };

  const handleCopyJson = () => {
    navigator.clipboard.writeText(JSON.stringify(categories, null, 2));
    showToast("📋 Đã copy dữ liệu JSON vào Clipboard!");
  };

  const handleImportJsonFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setCategories(parsed);
          await saveCategoriesApi(parsed);
          showToast("📥 Đã nhập và cập nhật dữ liệu từ file JSON!");
        } else {
          alert("File JSON không đúng cấu trúc danh mục!");
        }
      } catch (err) {
        alert("Lỗi đọc file JSON: File không hợp lệ!");
      }
    };
    reader.readAsText(file);
  };

  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">
        <div className="animate-spin w-8 h-8 border-4 border-[#f11c65] border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 font-sans selection:bg-[#f11c65] selection:text-white">
        <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 text-center">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#f11c65] to-[#ff6f91] p-1 mx-auto shadow-lg shadow-[#f11c65]/30">
            <div className="w-full h-full bg-slate-950 rounded-[12px] flex items-center justify-center text-2xl">
              🔐
            </div>
          </div>

          <div>
            <h1 className="text-xl font-extrabold text-white">Đăng Nhập Trang Admin</h1>
            <p className="text-xs text-slate-400 mt-1">
              Vui lòng nhập mật khẩu quản trị để truy cập hệ thống
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4 text-left">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5 uppercase">
                Mật khẩu Quản Trị
              </label>
              <input
                type="password"
                placeholder="Nhập mật khẩu..."
                value={passwordInput}
                onChange={(e) => {
                  setPasswordInput(e.target.value);
                  setPasswordError(false);
                }}
                className={`w-full bg-slate-950 border rounded-xl px-4 py-3 text-sm text-white focus:outline-none transition ${
                  passwordError
                    ? "border-red-500 ring-1 ring-red-500"
                    : "border-slate-700 focus:border-[#f11c65]"
                }`}
                autoFocus
              />
              {passwordError && (
                <p className="text-xs text-red-400 mt-1 font-medium">
                  ❌ Mật khẩu không chính xác. Vui lòng thử lại!
                </p>
              )}
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-gradient-to-r from-[#f11c65] via-[#ff6f91] to-[#ff8a7a] hover:opacity-95 text-white font-extrabold text-xs uppercase tracking-wider shadow-lg shadow-[#f11c65]/30 transition active:scale-[0.98] cursor-pointer"
            >
              🔓 Đăng Nhập
            </button>
          </form>

          <div className="text-[11px] text-slate-500 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800">
            💡 Mật khẩu mặc định: <code className="text-[#ff6f91] font-mono font-bold">123456</code>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-8 font-sans selection:bg-[#f11c65] selection:text-white">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-[#f11c65] text-white px-5 py-3 rounded-2xl shadow-2xl font-bold text-sm border border-white/20 animate-bounce">
          {toastMessage}
        </div>
      )}

      <div className="max-w-4xl mx-auto space-y-6">
        {/* Admin Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#f11c65] to-[#ff8a7a] p-0.5 overflow-hidden flex-shrink-0">
              <Image
                src="/icon.svg"
                alt="Admin Logo"
                width={48}
                height={48}
                className="w-full h-full object-cover rounded-[14px]"
              />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-white flex items-center gap-2">
                Trang Quản Lý Video <span className="text-xs bg-[#f11c65]/20 text-[#ff6f91] px-2 py-0.5 rounded-full border border-[#f11c65]/30">ADMIN</span>
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Thêm & Chỉnh sửa link YouTube tự động lưu vào src/data/videos.json
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/"
              target="_blank"
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#f11c65] to-[#ff6f91] hover:from-[#ff6f91] hover:to-[#ff8a7a] text-white text-xs font-bold shadow-md transition active:scale-95 flex items-center gap-1.5"
            >
              <span>Xem Trang Chủ</span>
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </Link>

            <button
              onClick={handleDownloadJson}
              className="px-3 py-2.5 rounded-xl bg-pink-500/20 hover:bg-pink-500/30 text-pink-300 border border-pink-500/40 text-xs font-bold transition flex items-center gap-1 cursor-pointer"
              title="Tải file videos.json về máy để cập nhật cố định vào source code"
            >
              📥 Tải JSON
            </button>

            <button
              onClick={handleCopyJson}
              className="px-3 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-xs font-semibold transition cursor-pointer"
              title="Copy dữ liệu JSON vào bộ nhớ tạm"
            >
              📋 Copy JSON
            </button>

            <label className="px-3 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-xs font-semibold transition cursor-pointer flex items-center gap-1">
              <span>📤 Nhập JSON</span>
              <input type="file" accept=".json" onChange={handleImportJsonFile} className="hidden" />
            </label>

            <button
              onClick={handleResetDefault}
              className="px-3 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-400 text-xs font-semibold transition cursor-pointer"
              title="Khôi phục dữ liệu ban đầu"
            >
              Mặc Định
            </button>

            <button
              onClick={handleLogout}
              className="px-3 py-2.5 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/40 text-xs font-bold transition flex items-center gap-1 cursor-pointer"
              title="Đăng xuất khỏi trang admin"
            >
              <span>🚪 Đăng Xuất</span>
            </button>
          </div>
        </div>

        {/* Thông báo hỗ trợ Vercel Production */}
        <div className="bg-slate-900/80 border border-pink-500/30 rounded-2xl p-4 text-xs text-slate-300 flex items-start gap-3 shadow-md">
          <div className="text-xl">⚡</div>
          <div className="space-y-1">
            <p className="font-bold text-pink-400">Hướng dẫn lưu vĩnh viễn dữ liệu trên Vercel Production:</p>
            <p className="text-slate-400 leading-relaxed">
              Mọi thay đổi khi bấm <strong className="text-white">Lưu Video</strong> sẽ tự động cập nhật ngay trên giao diện web (bộ nhớ tạm serverless & LocalStorage).
              Để lưu <strong className="text-pink-300">cố định vĩnh viễn</strong> khi Vercel khởi động lại, bạn chỉ cần bấm nút <strong className="text-pink-300">📥 Tải JSON</strong> ở trên và thay thế file <code className="bg-slate-800 px-1.5 py-0.5 rounded text-pink-300">src/data/videos.json</code> trong dự án (hoặc push lên GitHub).
            </p>
          </div>
        </div>

        {/* SECTION 1: FORM THÊM / CHỈNH SỬA VIDEO */}
        <div className={`bg-slate-900 border rounded-3xl p-6 shadow-xl space-y-5 transition duration-300 ${editingVideoId ? "border-[#f11c65] ring-2 ring-[#f11c65]/20" : "border-slate-800"}`}>
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#f11c65] animate-pulse" />
              <span>{editingVideoId ? "✏️ Chỉnh Sửa Video Demo" : "Thêm Video YouTube Mới"}</span>
            </h2>
            {editingVideoId && (
              <button
                type="button"
                onClick={handleCancelEdit}
                className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-1 rounded-lg border border-slate-700 transition"
              >
                ✕ Hủy Chỉnh Sửa
              </button>
            )}
          </div>

          <form onSubmit={handleSubmitForm} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Select Category */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5 uppercase">
                  Chọn Danh Mục
                </label>
                <select
                  value={selectedCatId}
                  onChange={(e) => setSelectedCatId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-[#f11c65] focus:outline-none"
                >
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.title}
                    </option>
                  ))}
                </select>
              </div>

              {/* Video Title */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5 uppercase">
                  Tên Video Demo
                </label>
                <input
                  type="text"
                  placeholder="VD: Demo 6: Save The Date TikTok Hot Trend 2026"
                  value={videoTitle}
                  onChange={(e) => setVideoTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-[#f11c65] focus:outline-none placeholder:text-slate-600"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* YouTube Link / ID Input */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-300 mb-1.5 uppercase">
                  Link Video YouTube (Hoặc Video ID)
                </label>
                <input
                  type="text"
                  placeholder="VD: https://www.youtube.com/watch?v=LXb3EKWsInQ"
                  value={youtubeUrlInput}
                  onChange={(e) => setYoutubeUrlInput(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-[#f11c65] focus:outline-none placeholder:text-slate-600"
                />
              </div>

              {/* Duration Input */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5 uppercase">
                  Thời lượng (Tùy chọn)
                </label>
                <input
                  type="text"
                  placeholder="VD: 0:45 hoặc 1:30"
                  value={durationInput}
                  onChange={(e) => setDurationInput(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-[#f11c65] focus:outline-none placeholder:text-slate-600"
                />
              </div>
            </div>

            {/* Checkbox Hot & Real-time Live Preview */}
            <div className="flex flex-wrap items-center justify-between gap-4 pt-1">
              <label className="flex items-center space-x-2 text-xs font-semibold text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isHot}
                  onChange={(e) => setIsHot(e.target.checked)}
                  className="w-4 h-4 rounded accent-[#f11c65]"
                />
                <span>Đánh dấu nhãn 🔥 Hot</span>
              </label>

              {previewExtractedId && (
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs text-emerald-400 font-medium flex items-center gap-1">
                    ✓ Đã nhận diện ID: <code className="bg-slate-950 px-1.5 py-0.5 rounded font-mono text-emerald-300">{previewExtractedId}</code>
                  </span>
                  <button
                    type="button"
                    onClick={() => fetchYoutubeInfo(previewExtractedId, true)}
                    disabled={isLoadingYtInfo}
                    className="px-2.5 py-1 rounded-lg bg-[#f11c65]/20 hover:bg-[#f11c65]/30 text-[#ff6f91] border border-[#f11c65]/40 text-[11px] font-bold flex items-center gap-1 transition active:scale-95 disabled:opacity-50 cursor-pointer"
                  >
                    {isLoadingYtInfo ? "⏳ Đang tải thông tin..." : "⚡ Lấy lại Tên & Thời lượng"}
                  </button>
                </div>
              )}
            </div>

            {/* Live Video Preview Box */}
            {previewExtractedId && (
              <div className="p-3 bg-slate-950 border border-slate-800 rounded-2xl space-y-2">
                <p className="text-[11px] text-slate-400 font-semibold uppercase">Xem trước khung Video YouTube:</p>
                <div className="relative w-full max-w-sm aspect-video rounded-xl overflow-hidden bg-black border border-slate-800 mx-auto">
                  <iframe
                    className="absolute -top-[12%] -left-[2%] w-[104%] h-[124%] max-w-none"
                    src={`https://www.youtube.com/embed/${previewExtractedId}?modestbranding=1&rel=0&iv_load_policy=3&controls=1&playsinline=1`}
                    title="Live Preview"
                    allowFullScreen
                  />
                </div>
              </div>
            )}

            {/* Form Submit & Cancel Buttons */}
            <div className="flex items-center gap-2 pt-2">
              <button
                type="submit"
                className="flex-1 py-3 rounded-xl bg-gradient-to-r from-[#f11c65] via-[#ff6f91] to-[#ff8a7a] hover:opacity-95 text-white font-extrabold text-xs uppercase tracking-wider shadow-lg shadow-[#f11c65]/25 transition active:scale-[0.99]"
              >
                {editingVideoId ? "💾 Lưu Cập Nhật Video" : "+ Thêm Video YouTube Vào Danh Mục"}
              </button>

              {editingVideoId && (
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="px-4 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition"
                >
                  Hủy
                </button>
              )}
            </div>
          </form>
        </div>

        {/* SECTION 2: DANH SÁCH VIDEO ĐÃ THÊM */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-4">
            <div>
              <h2 className="text-base font-bold text-white">Danh Sách Video Đã Thêm</h2>
              <p className="text-xs text-slate-400">Chọn danh mục để quản lý & chỉnh sửa các video</p>
            </div>

            {/* Category Tabs & Quick Sort Hot */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => handleSortCategoryHotFirst(activeAdminTab)}
                className="px-3 py-1.5 rounded-xl bg-[#f11c65]/20 hover:bg-[#f11c65]/30 text-[#ff6f91] border border-[#f11c65]/40 text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                title="Sắp xếp ưu tiên các mẫu đánh dấu 🔥 Hot lên đầu danh mục này"
              >
                <span>🔥 Đẩy mẫu Hot lên đầu</span>
              </button>

              <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800">
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setActiveAdminTab(cat.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                      activeAdminTab === cat.id
                        ? "bg-[#f11c65] text-white shadow-sm"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    {cat.title} ({cat.videos.length})
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Videos Grid */}
          {categories
            .filter((c) => c.id === activeAdminTab)
            .map((cat) => (
              <div key={cat.id} className="space-y-4">
                {cat.videos.length === 0 ? (
                  <div className="text-center py-8 text-slate-500 text-xs">
                    Chưa có video nào trong danh mục này. Hãy thêm video mới ở form trên!
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {cat.videos.map((vid, vidIdx) => (
                      <div
                        key={vid.id}
                        className={`bg-slate-950 border rounded-2xl p-3 space-y-2 transition ${
                          editingVideoId === vid.id
                            ? "border-[#f11c65] ring-1 ring-[#f11c65]"
                            : "border-slate-800 hover:border-slate-700"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="text-xs font-bold text-white line-clamp-2">
                            {vid.title}
                          </h3>
                          {vid.hot && (
                            <span className="text-[9px] bg-red-500/20 text-red-400 border border-red-500/30 px-1.5 py-0.2 rounded font-extrabold flex-shrink-0">
                              🔥 Hot
                            </span>
                          )}
                        </div>

                        <p className="text-[10px] text-slate-400 font-mono">
                          ID: {vid.youtubeId} {vid.duration && `• ${vid.duration}`}
                        </p>

                        {/* Player Preview */}
                        <YouTubeEmbed
                          youtubeId={vid.youtubeId}
                          title={vid.title}
                          isPlaying={activePlayingId === vid.id}
                          onPlay={() => setActivePlayingId(vid.id)}
                        />

                        {/* Card Actions: Order Up/Down, Edit & Delete */}
                        <div className="flex flex-wrap items-center justify-between gap-1.5 pt-1 border-t border-slate-900">
                          {/* Order move buttons */}
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleMoveVideo(cat.id, vid.id, "up")}
                              disabled={vidIdx === 0}
                              className="w-6 h-6 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-slate-300 text-xs flex items-center justify-center border border-slate-700 transition"
                              title="Chuyển video lên trước"
                            >
                              ▲
                            </button>
                            <button
                              type="button"
                              onClick={() => handleMoveVideo(cat.id, vid.id, "down")}
                              disabled={vidIdx === cat.videos.length - 1}
                              className="w-6 h-6 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-slate-300 text-xs flex items-center justify-center border border-slate-700 transition"
                              title="Chuyển video xuống sau"
                            >
                              ▼
                            </button>
                            <a
                              href={`https://www.youtube.com/watch?v=${vid.youtubeId}`}
                              target="_blank"
                              rel="noreferrer"
                              className="text-[10px] text-slate-400 hover:text-white underline pl-1"
                            >
                              YouTube ↗
                            </a>
                          </div>

                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => handleStartEdit(cat.id, vid)}
                              className="px-2.5 py-1 rounded-lg bg-blue-500/20 hover:bg-blue-500 text-blue-300 hover:text-white border border-blue-500/30 text-[10px] font-bold transition flex items-center gap-1"
                            >
                              <span>✏️ Sửa</span>
                            </button>

                            <button
                              onClick={() => handleDeleteVideo(cat.id, vid.id)}
                              className="px-2.5 py-1 rounded-lg bg-red-500/20 hover:bg-red-500 text-red-300 hover:text-white border border-red-500/30 text-[10px] font-bold transition flex items-center gap-1"
                            >
                              <span>🗑️ Xóa</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}
