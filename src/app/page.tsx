"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Upload, Sparkles, Download, Brush, RotateCcw, ChevronRight,
  Zap, Shield, Star, CreditCard, X, CheckCircle, Lock
} from "lucide-react";
import { useCredits } from "@/hooks/useCredits";
import { SignInButton, UserButton, useAuth } from "@clerk/nextjs";

type ProcessingState = "idle" | "uploading" | "processing" | "done" | "error";

// ─── Stripe Paywall Modal ────────────────────────────────────────────────────
function PaywallModal({ onClose }: { onClose: () => void }) {
  const [loading, setLoading] = useState(false);

  const handleCheckout = async (plan: string) => {
    setLoading(true);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert("Error al iniciar el pago.");
      }
    } catch (err) {
      console.error(err);
      alert("Error de conexión.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.85)", backdropFilter: "blur(12px)" }}
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ type: "spring", duration: 0.5 }}
        className="relative w-full max-w-md rounded-3xl border border-white/10 p-8"
        style={{ background: "rgba(15,15,20,0.95)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors">
          <X size={20} />
        </button>

        {/* Icon */}
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6"
          style={{ background: "linear-gradient(135deg, rgba(139,92,246,0.3), rgba(59,130,246,0.3))", border: "1px solid rgba(139,92,246,0.4)" }}>
          <Sparkles size={28} className="text-purple-400" />
        </div>

        <h2 className="text-2xl font-bold text-white text-center mb-2" style={{ letterSpacing: "-0.03em" }}>
          Sube de nivel a Pro
        </h2>
        <p className="text-gray-400 text-center text-sm mb-8 leading-relaxed">
          Eliminación ilimitada con motor SDXL. Resultados premium para profesionales.
        </p>

        {/* Plans */}
        <div className="space-y-3 mb-6">
          <button 
            onClick={() => handleCheckout("monthly")}
            disabled={loading}
            className="w-full flex items-center justify-between p-4 rounded-2xl border border-white/10 bg-white/5 hover:bg-white/8 transition-all"
          >
            <div className="text-left">
              <p className="font-semibold text-white text-sm">Pro Mensual</p>
              <p className="text-xs text-gray-400 mt-0.5">50 créditos · Descarga HD</p>
            </div>
            <span className="text-white font-bold text-lg">9.99 CHF<span className="text-xs text-gray-400 font-normal">/mes</span></span>
          </button>

          <button 
            onClick={() => handleCheckout("annual")}
            disabled={loading}
            className="w-full flex items-center justify-between p-4 rounded-2xl border border-purple-500/40 bg-purple-500/8 hover:bg-purple-500/12 transition-all relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 px-2 py-0.5 bg-purple-500 text-[10px] font-bold text-white rounded-bl-lg">AHORRA 25%</div>
            <div className="text-left">
              <p className="font-semibold text-white text-sm">Pro Anual</p>
              <p className="text-xs text-gray-400 mt-0.5">600 créditos · Soporte VIP</p>
            </div>
            <span className="text-white font-bold text-lg">7.49 CHF<span className="text-xs text-gray-400 font-normal">/mes</span></span>
          </button>
        </div>

        {/* Features */}
        <div className="space-y-2 mb-8">
          {["Motor SDXL Content-Aware", "Descarga en calidad original HD", "Pincel manual avanzado", "Sin marcas de agua de la web"].map((f) => (
            <div key={f} className="flex items-center gap-2 text-sm text-gray-300">
              <CheckCircle size={14} className="text-green-400 flex-shrink-0" />
              {f}
            </div>
          ))}
        </div>

        <motion.button
          onClick={() => handleCheckout("annual")}
          disabled={loading}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="flex items-center justify-center gap-2 w-full py-4 rounded-2xl font-bold text-white text-base shadow-xl shadow-purple-500/20"
          style={{ background: "linear-gradient(135deg, #7c3aed, #4f46e5)" }}
        >
          <CreditCard size={18} />
          {loading ? "Procesando..." : "Comenzar ahora con Stripe"}
        </motion.button>

        <p className="text-center text-xs text-gray-500 mt-4">
          Pago seguro procesado por Stripe
        </p>
      </motion.div>
    </motion.div>
  );
}

// ─── Credits Badge ────────────────────────────────────────────────────────────
function CreditsBadge({ remaining, total, onClick }: { remaining: number; total: number; onClick: () => void }) {
  const pct = (remaining / total) * 100;
  const color = pct > 40 ? "#22c55e" : pct > 20 ? "#f59e0b" : "#ef4444";

  return (
    <button
      onClick={onClick}
      className="flex items-center gap-3 px-4 py-2 rounded-xl border border-white/8 hover:border-white/20 transition-all"
      style={{ background: "rgba(255,255,255,0.03)" }}
    >
      <div className="flex items-center gap-1.5">
        <Sparkles size={13} style={{ color }} />
        <span className="text-sm font-medium text-white">{remaining} <span className="text-gray-500 font-normal">/ {total} gratis</span></span>
      </div>
      {/* Mini bar */}
      <div className="w-16 h-1 rounded-full bg-white/10">
        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
      </div>
    </button>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function Home() {
  const credits = useCredits();

  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [state, setState] = useState<ProcessingState>("idle");
  const [progress, setProgress] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [sliderPos, setSliderPos] = useState(50);
  const [isSliding, setIsSliding] = useState(false);
  const [mode, setMode] = useState<"auto" | "manual">("auto");
  const [brushSize, setBrushSize] = useState(20);
  const [isDrawing, setIsDrawing] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [showPaywall, setShowPaywall] = useState(false);
  const { userId, isLoaded: authLoaded } = useAuth();
  const [successMsg, setSuccessMsg] = useState(false);


  const fileInputRef = useRef<HTMLInputElement>(null);
  const maskCanvasRef = useRef<HTMLCanvasElement>(null);
  const sliderRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("success")) {
      setSuccessMsg(true);
      credits.refresh();
      // Limpiar URL
      window.history.replaceState({}, "", "/");
      setTimeout(() => setSuccessMsg(false), 5000);
    }
    if (params.get("canceled")) {
      setErrorMsg("El pago fue cancelado.");
      window.history.replaceState({}, "", "/");
    }
  }, [credits]);

  const animateProgress = (target: number, duration: number) => {

    if (progressRef.current) clearInterval(progressRef.current);
    const steps = 60;
    let i = 0;
    progressRef.current = setInterval(() => {
      i++;
      setProgress(p => Math.min(p + (target - p) / (steps - i + 1), target));
      if (i >= steps) clearInterval(progressRef.current!);
    }, duration / steps);
  };

  const handleFile = useCallback((f: File) => {
    if (!f.type.startsWith("image/")) return;
    if (f.size > 10 * 1024 * 1024) { alert("Máximo 10MB por imagen."); return; }
    setFile(f);
    setResultUrl(null);
    setState("idle");
    setProgress(0);
    const url = URL.createObjectURL(f);
    setPreviewUrl(url);

    const img = new Image();
    img.onload = () => {
      if (maskCanvasRef.current) {
        maskCanvasRef.current.width = img.width;
        maskCanvasRef.current.height = img.height;
        maskCanvasRef.current.getContext("2d")?.clearRect(0, 0, img.width, img.height);
      }
    };
    img.src = url;
  }, []);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  }, [handleFile]);

  const draw = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !maskCanvasRef.current) return;
    const rect = maskCanvasRef.current.getBoundingClientRect();
    const scaleX = maskCanvasRef.current.width / rect.width;
    const scaleY = maskCanvasRef.current.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;
    const ctx = maskCanvasRef.current.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = "rgba(139, 92, 246, 0.75)";
    ctx.beginPath();
    ctx.arc(x, y, brushSize * scaleX, 0, Math.PI * 2);
    ctx.fill();
  }, [isDrawing, brushSize]);

  const processImage = async () => {
    if (!file) return;

    // Auth gate
    if (!userId) {
      alert("Por favor, inicia sesión para procesar imágenes.");
      return;
    }

    // Credit gate
    if (!credits.hasCredits) {
      setShowPaywall(true);
      return;
    }

    setState("uploading");
    setProgress(0);
    animateProgress(25, 600);

    const formData = new FormData();

    if (mode === "manual" && maskCanvasRef.current) {
      const maskBlob = await new Promise<Blob>((resolve) =>
        maskCanvasRef.current!.toBlob((b) => resolve(b!), "image/png")
      );
      formData.append("mask_file", maskBlob, "mask.png");
    }
    formData.append("file", file);

    setState("processing");
    animateProgress(80, 4000);

    try {
      // Go through Next.js API route (auth-ready proxy)
      const res = await fetch("/api/process", { method: "POST", body: formData });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: "Error desconocido" }));
        throw new Error(err.detail || `HTTP ${res.status}`);
      }

      const blob = await res.blob();
      setResultUrl(URL.createObjectURL(blob));
      setProgress(100);
      setState("done");
      credits.consume(); // Deduct 1 credit on success
    } catch (err: any) {
      setState("error");
      setErrorMsg(err.message);
      setProgress(0);
    }
  };

  const download = () => {
    if (!resultUrl) return;
    const a = document.createElement("a");
    a.href = resultUrl;
    a.download = `sin_marca_${Date.now()}.png`;
    a.click();
  };

  const reset = () => {
    setFile(null); setPreviewUrl(null); setResultUrl(null);
    setState("idle"); setProgress(0); setSliderPos(50);
  };

  // Mouse-drag slider
  const onSliderMouseDown = () => setIsSliding(true);
  const onSliderMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!isSliding || !sliderRef.current) return;
    const rect = sliderRef.current.getBoundingClientRect();
    setSliderPos((Math.max(0, Math.min(e.clientX - rect.left, rect.width)) / rect.width) * 100);
  }, [isSliding]);

  const progressLabel = state === "uploading" ? "Subiendo imagen..."
    : state === "processing" ? "Motor de inpainting activo..."
      : state === "done" ? "¡Listo!" : "";

  const stateColor = state === "done" ? "#22c55e" : state === "error" ? "#ef4444" : "#8b5cf6";

  return (
    <div className="min-h-screen bg-[#0A0A0B] text-white" onMouseUp={() => setIsSliding(false)}>

      {/* Ambient blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-[500px] h-[500px] rounded-full opacity-[0.15]" style={{ background: "radial-gradient(circle, #7c3aed, transparent 70%)" }} />
        <div className="absolute top-1/2 -right-60 w-96 h-96 rounded-full opacity-[0.12]" style={{ background: "radial-gradient(circle, #2563eb, transparent 70%)" }} />
        <div className="absolute -bottom-20 left-1/3 w-80 h-80 rounded-full opacity-[0.08]" style={{ background: "radial-gradient(circle, #db2777, transparent 70%)" }} />
      </div>

      {/* Navbar */}
      <nav className="relative z-20 flex items-center justify-between px-8 py-5 border-b border-white/5">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "linear-gradient(135deg, #7c3aed, #4f46e5)" }}>
            <Sparkles size={15} className="text-white" />
          </div>
          <span className="font-bold text-white text-lg tracking-tight">WatermarkAI</span>
          <span className="px-2 py-0.5 rounded text-xs font-medium bg-purple-500/15 text-purple-400 border border-purple-500/20">PRO BETA</span>
        </div>

        <div className="flex items-center gap-4">
          {!userId && (
            <SignInButton mode="modal">
              <button className="text-sm font-medium text-gray-400 hover:text-white transition-colors">
                Iniciar Sesión
              </button>
            </SignInButton>
          )}

          {userId && (
            <>
              {credits.loaded && (
                <CreditsBadge
                  remaining={credits.remaining}
                  total={5} // Base free limit
                  onClick={() => setShowPaywall(true)}
                />
              )}
              <UserButton />
            </>
          )}

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowPaywall(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white shadow-lg shadow-purple-500/20"
            style={{ background: "linear-gradient(135deg, #7c3aed, #4f46e5)" }}
          >
            <CreditCard size={14} />
            Upgrade Pro
          </motion.button>
        </div>
      </nav>

      <div className="relative z-10 max-w-5xl mx-auto px-6 py-12">

        {/* Notifications */}
        <AnimatePresence>
          {successMsg && (
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="fixed top-24 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-2xl bg-green-500/20 border border-green-500/30 text-green-400 backdrop-blur-xl font-medium shadow-2xl">
              ✨ ¡Pago confirmado! Tus créditos han sido actualizados.
            </motion.div>
          )}
        </AnimatePresence>

        {/* Hero */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">

          <h1 className="text-5xl md:text-6xl font-bold text-white mb-4" style={{ letterSpacing: "-0.03em", lineHeight: 1.1 }}>
            Elimina marcas de agua
            <br />
            <span style={{ background: "linear-gradient(135deg, #8b5cf6, #3b82f6)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              con motor de inpainting
            </span>
          </h1>
          <p className="text-gray-400 text-lg max-w-lg mx-auto leading-relaxed">
            Content-Aware Fill reconstruye la textura original debajo de cualquier texto o logo.
          </p>
        </motion.div>

        {/* Editor Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-3xl border border-white/8 overflow-hidden"
          style={{ background: "rgba(255,255,255,0.025)", backdropFilter: "blur(20px)" }}
        >
          {/* Mode Tabs */}
          {file && (
            <div className="flex items-center gap-1 px-8 pt-6">
              {(["auto", "manual"] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => setMode(m)}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all ${mode === m ? "bg-purple-600/90 text-white" : "text-gray-400 hover:text-white hover:bg-white/5"
                    }`}
                >
                  {m === "auto" ? <><Zap size={13} /> Auto-Detección</> : <><Brush size={13} /> Pincel Manual</>}
                </button>
              ))}
              {mode === "manual" && (
                <div className="ml-auto flex items-center gap-3">
                  <span className="text-xs text-gray-500">Brush:</span>
                  <input type="range" min={5} max={80} value={brushSize}
                    onChange={(e) => setBrushSize(Number(e.target.value))}
                    className="w-24" style={{ accentColor: "#8b5cf6" }}
                  />
                  <span className="text-xs font-mono text-purple-400 w-8">{brushSize}px</span>
                  <button onClick={() => maskCanvasRef.current?.getContext("2d")?.clearRect(0, 0, 9999, 9999)}
                    className="flex items-center gap-1 text-xs text-gray-500 hover:text-white transition-colors px-2 py-1 rounded-lg hover:bg-white/5">
                    <RotateCcw size={11} /> Borrar
                  </button>
                </div>
              )}
            </div>
          )}

          <div className="p-8">
            <AnimatePresence mode="wait">

              {/* ── Drop Zone ── */}
              {!file && (
                <motion.div key="drop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={onDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`flex flex-col items-center justify-center h-72 rounded-2xl border-2 border-dashed cursor-pointer transition-all duration-300 ${isDragging ? "border-purple-500 bg-purple-500/8" : "border-white/10 hover:border-purple-500/40 hover:bg-white/2"
                    }`}
                >
                  <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
                  <motion.div animate={isDragging ? { scale: 1.08 } : { scale: 1 }} className="flex flex-col items-center gap-4">
                    <div className="w-18 h-18 w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, rgba(139,92,246,0.15), rgba(59,130,246,0.15))", border: "1px solid rgba(139,92,246,0.25)" }}>
                      <Upload size={32} className="text-purple-400" />
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-semibold text-white mb-1">{isDragging ? "¡Suéltala!" : "Arrastra tu imagen aquí"}</p>
                      <p className="text-sm text-gray-500">PNG, JPG, WEBP · Máx 10MB</p>
                    </div>
                  </motion.div>
                </motion.div>
              )}

              {/* ── Before/After Result ── */}
              {file && state === "done" && resultUrl && (
                <motion.div key="result" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <div
                    ref={sliderRef}
                    className="relative select-none rounded-2xl overflow-hidden cursor-ew-resize"
                    style={{ height: "420px" }}
                    onMouseDown={onSliderMouseDown}
                    onMouseMove={onSliderMouseMove}
                  >
                    <img src={resultUrl} alt="Resultado" className="absolute inset-0 w-full h-full object-contain bg-[#111]" />
                    <div className="absolute inset-0 overflow-hidden pointer-events-none" style={{ width: `${sliderPos}%` }}>
                      <img src={previewUrl!} alt="Original" className="absolute inset-0 h-full object-contain bg-[#0d0d0d]"
                        style={{ width: `${sliderRef.current?.offsetWidth || 800}px`, maxWidth: "none" }} />
                    </div>
                    <div className="absolute top-0 bottom-0 w-px bg-white/90 pointer-events-none" style={{ left: `${sliderPos}%` }}>
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white flex items-center justify-center shadow-2xl">
                        <div className="flex gap-0.5">
                          <ChevronRight size={11} className="text-gray-700 -scale-x-100" />
                          <ChevronRight size={11} className="text-gray-700" />
                        </div>
                      </div>
                    </div>
                    <div className="absolute top-4 left-4 px-3 py-1.5 rounded-lg bg-black/70 text-xs font-bold backdrop-blur">ANTES</div>
                    <div className="absolute top-4 right-4 px-3 py-1.5 rounded-lg bg-purple-700/80 text-xs font-bold backdrop-blur">DESPUÉS</div>
                  </div>
                </motion.div>
              )}

              {/* ── Preview/Processing/Canvas ── */}
              {file && !(state === "done" && resultUrl) && (
                <motion.div key="preview" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className="relative rounded-2xl overflow-hidden" style={{ height: "420px", background: "#111" }}>
                  <img src={previewUrl!} alt="Preview" className="w-full h-full object-contain" />

                  {mode === "manual" && (
                    <canvas
                      ref={maskCanvasRef}
                      className="absolute inset-0 w-full h-full canvas-brush"
                      style={{ opacity: 0.65 }}
                      onMouseDown={() => setIsDrawing(true)}
                      onMouseUp={() => setIsDrawing(false)}
                      onMouseLeave={() => setIsDrawing(false)}
                      onMouseMove={draw}
                    />
                  )}

                  <AnimatePresence>
                    {(state === "uploading" || state === "processing") && (
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="absolute inset-0 flex flex-col items-center justify-center"
                        style={{ background: "rgba(10,10,11,0.88)", backdropFilter: "blur(10px)" }}>
                        <div className="w-16 h-16 rounded-full border-4 border-purple-900 border-t-purple-400 animate-spin mb-5" />
                        <p className="text-white font-semibold mb-1">{progressLabel}</p>
                        <p className="text-gray-500 text-sm">Content-Aware Fill en proceso...</p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              )}

            </AnimatePresence>

            {/* Progress bar */}
            <AnimatePresence>
              {["uploading", "processing", "done"].includes(state) && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="mt-5">
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="text-gray-400">{progressLabel}</span>
                    <span className="font-mono" style={{ color: stateColor }}>{Math.round(progress)}%</span>
                  </div>
                  <div className="relative h-1 rounded-full bg-white/8 overflow-hidden">
                    <motion.div className="h-full rounded-full"
                      style={{ background: `linear-gradient(90deg, ${stateColor}, #3b82f6)` }}
                      animate={{ width: `${progress}%` }}
                      transition={{ ease: "easeOut", duration: 0.3 }}
                    />
                    {state === "processing" && (
                      <div className="absolute inset-0 shimmer" />
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Error */}
            <AnimatePresence>
              {state === "error" && (
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                  className="mt-4 p-4 rounded-xl border border-red-500/25 bg-red-500/8 text-red-400 text-sm">
                  ❌ {errorMsg}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Action buttons */}
            <div className="flex flex-wrap gap-3 mt-6">
              {file && state !== "uploading" && state !== "processing" && (
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                  onClick={processImage}
                  className="flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-white glow-purple"
                  style={{ background: "linear-gradient(135deg, #7c3aed, #4f46e5)" }}>
                  <Sparkles size={17} />
                  {state === "done" ? "Procesar de nuevo" : "Eliminar Marca de Agua"}
                  {!credits.hasCredits && <Lock size={14} className="opacity-70" />}
                </motion.button>
              )}

              {state === "done" && resultUrl && (
                <motion.button initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                  whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                  onClick={download}
                  className="flex items-center gap-2 px-6 py-3 rounded-xl font-semibold border border-green-500/35 text-green-400 hover:bg-green-500/8 transition-all">
                  <Download size={17} />
                  Descargar HD
                </motion.button>
              )}

              {file && (
                <button onClick={reset} className="ml-auto text-sm text-gray-500 hover:text-white transition-colors px-4 py-3 rounded-xl hover:bg-white/5">
                  Nueva imagen
                </button>
              )}
            </div>
          </div>
        </motion.div>

        {/* Feature badges */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
          className="flex flex-wrap justify-center gap-3 mt-10">
          {[
            { icon: <Zap size={13} />, label: "OCR Auto-Detección" },
            { icon: <Shield size={13} />, label: "Content-Aware Fill" },
            { icon: <Star size={13} />, label: "Inpainting Generativo" },
            { icon: <Download size={13} />, label: "Descarga HD" },
            { icon: <CreditCard size={13} />, label: "5 usos gratuitos" },
          ].map((f) => (
            <div key={f.label} className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/8 bg-white/2 text-sm text-gray-400">
              <span className="text-purple-400">{f.icon}</span>
              {f.label}
            </div>
          ))}
        </motion.div>

        {/* How it works */}
        <div className="mt-32 pt-24 border-t border-white/5">
          <h2 className="text-4xl font-bold text-center mb-4">¿Cómo funciona?</h2>
          <p className="text-gray-400 text-center mb-16">Elimina marcas de agua en segundos con tecnología neuronal.</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {[
              { step: "01", title: "Sube tu imagen", desc: "Soporta formatos JPG, PNG y WEBP hasta 10MB con máxima privacidad." },
              { step: "02", title: "Marca el área", desc: "Usa el pincel manual avanzado para definir qué quieres eliminar." },
              { step: "03", title: "IA en la nube", desc: "Nuestro motor SDXL reconstruye la textura original sin dejar rastro." },
            ].map((s) => (
              <div key={s.step} className="relative group">
                <div className="text-7xl font-bold text-white/5 absolute -top-10 -left-4 group-hover:text-purple-500/10 transition-colors">{s.step}</div>
                <h3 className="text-xl font-bold mb-3 relative z-10">{s.title}</h3>
                <p className="text-gray-500 leading-relaxed text-sm">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Features Grid */}
        <div className="mt-32 grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="p-10 rounded-3xl bg-white/2 border border-white/5 hover:border-purple-500/20 transition-all group">
            <div className="w-14 h-14 rounded-2xl bg-purple-500/10 flex items-center justify-center mb-8 group-hover:scale-110 transition-transform">
              <Shield size={28} className="text-purple-400" />
            </div>
            <h3 className="text-2xl font-bold mb-4">Seguridad Profesional</h3>
            <p className="text-gray-500 leading-relaxed">Tus datos están protegidos. El procesamiento es efímero y cifrado; nunca almacenamos tus archivos personales ni compartimos tus resultados.</p>
          </div>
          <div className="p-10 rounded-3xl bg-white/2 border border-white/5 hover:border-blue-500/20 transition-all group">
            <div className="w-14 h-14 rounded-2xl bg-blue-500/10 flex items-center justify-center mb-8 group-hover:scale-110 transition-transform">
              <Zap size={28} className="text-blue-400" />
            </div>
            <h3 className="text-2xl font-bold mb-4">Velocidad Extrema</h3>
            <p className="text-gray-500 leading-relaxed">Impulsado por GPUs NVIDIA de última generación. Los resultados se generan en menos de 5 segundos gracias a nuestra integración directa con Replicate.</p>
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-40 pt-16 pb-12 border-t border-white/5 text-center">
          <div className="flex items-center justify-center gap-2 mb-8">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center shadow-lg shadow-purple-500/20">
              <Sparkles size={16} />
            </div>
            <span className="font-bold text-lg tracking-tight">WatermarkAI</span>
          </div>
          <p className="text-gray-500 text-sm mb-10 max-w-sm mx-auto">La herramienta definitiva para creadores de contenido y fotógrafos profesionales.</p>
          <div className="flex justify-center gap-8 text-sm text-gray-500 font-medium">
            <a href="#" className="hover:text-white transition-colors">Términos</a>
            <a href="#" className="hover:text-white transition-colors">Privacidad</a>
            <a href="#" className="hover:text-white transition-colors">Cookies</a>
            <a href="#" className="hover:text-white transition-colors">Soporte</a>
          </div>
          <div className="mt-12 text-xs text-gray-700">
            © 2026 WatermarkAI SaaS Platform. Todos los derechos reservados.
          </div>
        </footer>
      </div>

      {/* Stripe Paywall Modal */}
      <AnimatePresence>
        {showPaywall && <PaywallModal onClose={() => setShowPaywall(false)} />}
      </AnimatePresence>
    </div>
  );
}
