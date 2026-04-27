"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, Sparkles, Download, Brush, RotateCcw, ChevronRight, Zap, Shield, Star } from "lucide-react";

type ProcessingState = "idle" | "uploading" | "processing" | "done" | "error";

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [state, setState] = useState<ProcessingState>("idle");
  const [progress, setProgress] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [sliderPos, setSliderPos] = useState(50);
  const [mode, setMode] = useState<"auto" | "manual">("auto");
  const [brushSize, setBrushSize] = useState(20);
  const [isDrawing, setIsDrawing] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const maskCanvasRef = useRef<HTMLCanvasElement>(null);
  const sliderRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<NodeJS.Timeout | null>(null);

  // Fake progress animation
  const animateProgress = useCallback((target: number, duration: number) => {
    if (progressRef.current) clearInterval(progressRef.current);
    const start = progress;
    const steps = 60;
    const step = (target - start) / steps;
    let i = 0;
    progressRef.current = setInterval(() => {
      i++;
      setProgress(p => Math.min(p + step, target));
      if (i >= steps) clearInterval(progressRef.current!);
    }, duration / steps);
  }, [progress]);

  const handleFile = useCallback((f: File) => {
    if (!f.type.startsWith("image/")) return;
    setFile(f);
    setResultUrl(null);
    setState("idle");
    setProgress(0);
    const url = URL.createObjectURL(f);
    setPreviewUrl(url);

    // Load onto canvas for manual mode
    const img = new Image();
    img.onload = () => {
      if (canvasRef.current && maskCanvasRef.current) {
        canvasRef.current.width = img.width;
        canvasRef.current.height = img.height;
        maskCanvasRef.current.width = img.width;
        maskCanvasRef.current.height = img.height;
        const ctx = canvasRef.current.getContext("2d");
        ctx?.drawImage(img, 0, 0);
        // Clear mask
        const mctx = maskCanvasRef.current.getContext("2d");
        if (mctx) {
          mctx.clearRect(0, 0, img.width, img.height);
        }
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

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) handleFile(f);
  };

  // Manual brush drawing on mask canvas
  const draw = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !maskCanvasRef.current) return;
    const rect = maskCanvasRef.current.getBoundingClientRect();
    const scaleX = maskCanvasRef.current.width / rect.width;
    const scaleY = maskCanvasRef.current.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;
    const ctx = maskCanvasRef.current.getContext("2d");
    if (!ctx) return;
    ctx.globalCompositeOperation = "source-over";
    ctx.fillStyle = "rgba(139, 92, 246, 0.7)";
    ctx.beginPath();
    ctx.arc(x, y, brushSize * scaleX, 0, Math.PI * 2);
    ctx.fill();
  }, [isDrawing, brushSize]);

  const clearMask = () => {
    if (!maskCanvasRef.current) return;
    const ctx = maskCanvasRef.current.getContext("2d");
    ctx?.clearRect(0, 0, maskCanvasRef.current.width, maskCanvasRef.current.height);
  };

  const processImage = async () => {
    if (!file) return;
    setState("uploading");
    setProgress(0);
    animateProgress(30, 800);

    const formData = new FormData();

    if (mode === "manual" && maskCanvasRef.current) {
      // Get mask as blob and include it
      const maskBlob = await new Promise<Blob>((resolve) => {
        maskCanvasRef.current!.toBlob((b) => resolve(b!), "image/png");
      });
      formData.append("mask_file", maskBlob, "mask.png");
      formData.append("file", file);
    } else {
      formData.append("file", file);
    }

    setState("processing");
    animateProgress(75, 3000);

    try {
      const res = await fetch("/edit-image", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: "Error desconocido" }));
        throw new Error(err.detail || `HTTP ${res.status}`);
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      setResultUrl(url);
      setProgress(100);
      setState("done");
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
    a.download = `watermark_removed_${Date.now()}.png`;
    a.click();
  };

  const reset = () => {
    setFile(null);
    setPreviewUrl(null);
    setResultUrl(null);
    setState("idle");
    setProgress(0);
    setSliderPos(50);
  };

  // Slider drag
  const onSliderMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!sliderRef.current) return;
    const rect = sliderRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    setSliderPos((x / rect.width) * 100);
  }, []);

  const progressLabel = state === "uploading" ? "Subiendo imagen..." 
    : state === "processing" ? "Motor IA procesando..."
    : state === "done" ? "¡Completado!" : "";

  const stateColor = state === "done" ? "#22c55e"
    : state === "error" ? "#ef4444"
    : "#8b5cf6";

  return (
    <div className="min-h-screen bg-[#0A0A0B] text-white font-[var(--font-inter)]">
      {/* Ambient background blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full opacity-20" style={{ background: "radial-gradient(circle, #7c3aed, transparent)" }} />
        <div className="absolute top-1/2 -right-40 w-80 h-80 rounded-full opacity-15" style={{ background: "radial-gradient(circle, #2563eb, transparent)" }} />
        <div className="absolute -bottom-20 left-1/3 w-72 h-72 rounded-full opacity-10" style={{ background: "radial-gradient(circle, #db2777, transparent)" }} />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-6 py-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-purple-500/30 bg-purple-500/10 text-purple-400 text-sm font-medium mb-6">
            <Sparkles size={14} />
            <span>Motor de Inpainting IA</span>
            <span className="px-2 py-0.5 bg-purple-500 text-white text-xs rounded-full">BETA</span>
          </div>
          <h1 className="text-6xl font-bold tracking-tight text-white mb-4" style={{ letterSpacing: "-0.03em" }}>
            Elimina marcas de agua
            <br />
            <span style={{ background: "linear-gradient(135deg, #8b5cf6, #3b82f6)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              con IA generativa
            </span>
          </h1>
          <p className="text-lg text-gray-400 max-w-xl mx-auto leading-relaxed">
            Content-Aware Fill reconstruye la textura original debajo de cualquier marca de agua. 
            Automático o manual, siempre perfecto.
          </p>
        </motion.div>

        {/* Main Editor */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-3xl border border-white/8 overflow-hidden"
          style={{ background: "rgba(255,255,255,0.03)", backdropFilter: "blur(20px)" }}
        >
          {/* Mode Toggle */}
          {file && (
            <div className="flex items-center gap-2 px-8 pt-6">
              <button
                onClick={() => setMode("auto")}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  mode === "auto" ? "bg-purple-600 text-white" : "text-gray-400 hover:text-white hover:bg-white/5"
                }`}
              >
                <Zap size={14} />
                Auto-Detección
              </button>
              <button
                onClick={() => setMode("manual")}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  mode === "manual" ? "bg-purple-600 text-white" : "text-gray-400 hover:text-white hover:bg-white/5"
                }`}
              >
                <Brush size={14} />
                Pincel Manual
              </button>
            </div>
          )}

          <div className="p-8">
            <AnimatePresence mode="wait">
              {!file ? (
                /* Drop Zone */
                <motion.div
                  key="dropzone"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={onDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`relative flex flex-col items-center justify-center h-80 rounded-2xl border-2 border-dashed cursor-pointer transition-all duration-300 ${
                    isDragging ? "border-purple-500 bg-purple-500/10 drop-active" : "border-white/10 hover:border-white/25 hover:bg-white/3"
                  }`}
                >
                  <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={onFileChange} />
                  
                  <motion.div
                    animate={isDragging ? { scale: 1.1 } : { scale: 1 }}
                    className="flex flex-col items-center gap-4"
                  >
                    <div className="w-20 h-20 rounded-2xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, rgba(139,92,246,0.2), rgba(59,130,246,0.2))", border: "1px solid rgba(139,92,246,0.3)" }}>
                      <Upload size={36} className="text-purple-400" />
                    </div>
                    <div className="text-center">
                      <p className="text-xl font-semibold text-white mb-1">
                        {isDragging ? "¡Suéltala aquí!" : "Arrastra tu imagen aquí"}
                      </p>
                      <p className="text-sm text-gray-500">PNG, JPG, WEBP · Máx 10MB</p>
                    </div>
                  </motion.div>
                </motion.div>
              ) : state === "done" && resultUrl ? (
                /* Before/After Comparison Slider */
                <motion.div key="result" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <div
                    ref={sliderRef}
                    className="relative select-none rounded-2xl overflow-hidden cursor-ew-resize"
                    style={{ height: "420px" }}
                    onMouseMove={onSliderMove}
                  >
                    {/* After image (full) */}
                    <img src={resultUrl} alt="Resultado" className="absolute inset-0 w-full h-full object-contain bg-[#111]" />
                    
                    {/* Before image clipped */}
                    <div
                      className="absolute inset-0 overflow-hidden"
                      style={{ width: `${sliderPos}%` }}
                    >
                      <img src={previewUrl!} alt="Original" className="w-full h-full object-contain bg-[#0d0d0d]" style={{ width: `${sliderRef.current?.offsetWidth || 800}px` }} />
                    </div>

                    {/* Divider line */}
                    <div
                      className="absolute top-0 bottom-0 w-0.5 bg-white shadow-2xl pointer-events-none"
                      style={{ left: `${sliderPos}%` }}
                    >
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-xl">
                        <div className="flex gap-0.5">
                          <ChevronRight size={12} className="text-gray-800 -scale-x-100" />
                          <ChevronRight size={12} className="text-gray-800" />
                        </div>
                      </div>
                    </div>

                    {/* Labels */}
                    <div className="absolute top-4 left-4 px-3 py-1.5 rounded-lg bg-black/60 text-xs font-bold text-white backdrop-blur">ANTES</div>
                    <div className="absolute top-4 right-4 px-3 py-1.5 rounded-lg bg-purple-600/80 text-xs font-bold text-white backdrop-blur">DESPUÉS</div>
                  </div>
                </motion.div>
              ) : (
                /* Preview + Canvas for manual mode */
                <motion.div key="preview" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="relative">
                  <div className="relative rounded-2xl overflow-hidden" style={{ height: "420px", background: "#111" }}>
                    <img src={previewUrl!} alt="Preview" className="w-full h-full object-contain" />
                    
                    {/* Manual mask canvas overlay */}
                    {mode === "manual" && (
                      <canvas
                        ref={maskCanvasRef}
                        className="absolute inset-0 w-full h-full canvas-brush"
                        style={{ opacity: 0.6 }}
                        onMouseDown={() => setIsDrawing(true)}
                        onMouseUp={() => setIsDrawing(false)}
                        onMouseLeave={() => setIsDrawing(false)}
                        onMouseMove={draw}
                      />
                    )}

                    {/* Processing overlay */}
                    <AnimatePresence>
                      {(state === "uploading" || state === "processing") && (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="absolute inset-0 flex flex-col items-center justify-center"
                          style={{ background: "rgba(10,10,11,0.85)", backdropFilter: "blur(8px)" }}
                        >
                          {/* Spinning ring */}
                          <div className="w-20 h-20 rounded-full border-4 border-purple-900 border-t-purple-500 animate-spin mb-6" />
                          <p className="text-white font-semibold text-lg mb-2">{progressLabel}</p>
                          <p className="text-gray-500 text-sm">Motor de inpainting activo...</p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Progress Bar */}
            <AnimatePresence>
              {(state === "uploading" || state === "processing" || state === "done") && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-6"
                >
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-gray-400">{progressLabel}</span>
                    <span className="text-sm font-mono" style={{ color: stateColor }}>{Math.round(progress)}%</span>
                  </div>
                  <div className="relative h-1.5 rounded-full bg-white/8 overflow-hidden shimmer">
                    <motion.div
                      className="h-full rounded-full"
                      style={{ background: `linear-gradient(90deg, ${stateColor}, #3b82f6)` }}
                      animate={{ width: `${progress}%` }}
                      transition={{ ease: "easeOut", duration: 0.4 }}
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Error message */}
            <AnimatePresence>
              {state === "error" && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-4 p-4 rounded-xl border border-red-500/30 bg-red-500/10 text-red-400 text-sm"
                >
                  ❌ {errorMsg || "Error al procesar. Verifica tu conexión."}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-3 mt-6">
              {file && state !== "uploading" && state !== "processing" && (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={processImage}
                  disabled={false}
                  className="flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-white transition-all glow-purple"
                  style={{ background: "linear-gradient(135deg, #7c3aed, #4f46e5)" }}
                >
                  <Sparkles size={18} />
                  {state === "done" ? "Procesar de nuevo" : "Eliminar Marca de Agua"}
                </motion.button>
              )}

              {state === "done" && resultUrl && (
                <motion.button
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={download}
                  className="flex items-center gap-2 px-6 py-3 rounded-xl font-semibold border border-green-500/40 text-green-400 hover:bg-green-500/10 transition-all"
                >
                  <Download size={18} />
                  Descargar HD
                </motion.button>
              )}

              {mode === "manual" && file && (
                <button
                  onClick={clearMask}
                  className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm text-gray-400 hover:text-white hover:bg-white/5 transition-all"
                >
                  <RotateCcw size={16} />
                  Limpiar Pincel
                </button>
              )}

              {file && (
                <button
                  onClick={reset}
                  className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm text-gray-500 hover:text-white hover:bg-white/5 transition-all ml-auto"
                >
                  Nueva imagen
                </button>
              )}
            </div>

            {/* Brush Size (manual mode) */}
            {mode === "manual" && file && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mt-4 flex items-center gap-4"
              >
                <span className="text-sm text-gray-400 min-w-fit">Tamaño pincel:</span>
                <input
                  type="range"
                  min={5}
                  max={80}
                  value={brushSize}
                  onChange={(e) => setBrushSize(Number(e.target.value))}
                  className="flex-1"
                  style={{ accentColor: "#8b5cf6" }}
                />
                <span className="text-sm font-mono text-purple-400 min-w-[2rem]">{brushSize}px</span>
              </motion.div>
            )}
          </div>
        </motion.div>

        {/* Feature Badges */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="flex flex-wrap justify-center gap-4 mt-10"
        >
          {[
            { icon: <Zap size={14} />, label: "OCR Auto-Detección" },
            { icon: <Shield size={14} />, label: "Content-Aware Fill" },
            { icon: <Star size={14} />, label: "Inpainting Generativo" },
            { icon: <Download size={14} />, label: "Descarga HD Gratuita" },
          ].map((f) => (
            <div key={f.label} className="flex items-center gap-2 px-4 py-2 rounded-full border border-white/8 bg-white/3 text-sm text-gray-400">
              <span className="text-purple-400">{f.icon}</span>
              {f.label}
            </div>
          ))}
        </motion.div>
      </div>
    </div>
  );
}
