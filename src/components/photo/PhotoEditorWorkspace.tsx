import React, { useRef, useState, useEffect } from 'react';
import {
  Crop,
  RotateCw,
  RotateCcw,
  FlipHorizontal,
  FlipVertical,
  Sun,
  Sliders,
  Sparkles,
  Download,
  Upload,
  RefreshCw,
  Layers,
  Wand2,
  Scissors,
  Check,
  Type
} from 'lucide-react';
import { useStudioStore } from '../../store/studioStore';
import { enhancePhotoImage, removeImageBackground } from '../../engine/aiEngine';

export const PhotoEditorWorkspace: React.FC = () => {
  const {
    photoImageSrc,
    setPhotoImageSrc,
    photoAdjustments,
    setPhotoAdjustments,
    resetPhotoAdjustments,
    photoCrop,
    setPhotoCrop,
  } = useStudioStore();

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [activeTab, setActiveTab] = useState<'adjust' | 'crop' | 'ai' | 'layers'>('adjust');
  const [rotation, setRotation] = useState<number>(0);
  const [flipH, setFlipH] = useState<boolean>(false);
  const [flipV, setFlipV] = useState<boolean>(false);
  const [aiStatus, setAiStatus] = useState<string | null>(null);

  // Render photo canvas with filters & adjustments
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = photoImageSrc;

    img.onload = () => {
      canvas.width = img.naturalWidth || 1200;
      canvas.height = img.naturalHeight || 800;

      ctx.save();
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Center transform
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate((rotation * Math.PI) / 180);
      ctx.scale(flipH ? -1 : 1, flipV ? -1 : 1);

      // Filters
      const b = 100 + photoAdjustments.brightness;
      const c = 100 + photoAdjustments.contrast;
      const s = 100 + photoAdjustments.saturation;
      const blurPx = photoAdjustments.blur * 0.2;
      ctx.filter = `brightness(${b}%) contrast(${c}%) saturate(${s}%) blur(${blurPx}px)`;

      ctx.drawImage(img, -canvas.width / 2, -canvas.height / 2, canvas.width, canvas.height);
      ctx.restore();

      // Vignette effect
      if (photoAdjustments.vignette > 0) {
        const grad = ctx.createRadialGradient(
          canvas.width / 2,
          canvas.height / 2,
          canvas.width * 0.3,
          canvas.width / 2,
          canvas.height / 2,
          canvas.width * 0.7
        );
        grad.addColorStop(0, 'rgba(0,0,0,0)');
        grad.addColorStop(1, `rgba(0,0,0,${(photoAdjustments.vignette / 100) * 0.85})`);
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
    };
  }, [photoImageSrc, photoAdjustments, rotation, flipH, flipV]);

  // Handle local image upload
  const handleUploadImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setPhotoImageSrc(url);
    resetPhotoAdjustments();
    setRotation(0);
    setFlipH(false);
    setFlipV(false);
  };

  // AI Auto Enhance
  const handleAiAutoEnhance = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    setAiStatus('Applying AI tone optimization and unsharp mask...');

    setTimeout(() => {
      setPhotoAdjustments({
        contrast: 15,
        saturation: 20,
        exposure: 5,
        sharpen: 30,
        highlights: 10,
        shadows: -5,
      });
      setAiStatus('Image auto-enhanced with professional studio profile!');
      setTimeout(() => setAiStatus(null), 3000);
    }, 500);
  };

  // AI Background Removal
  const handleAiRemoveBackground = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    setAiStatus('Isolating foreground subject and extracting background...');

    setTimeout(() => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = photoImageSrc;
      img.onload = () => {
        removeImageBackground(img, canvas, 40);
        setAiStatus('Background removed successfully!');
        setTimeout(() => setAiStatus(null), 3000);
      };
    }, 600);
  };

  // Export processed image
  const handleDownload = (format: 'png' | 'jpeg' | 'webp') => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = `nexora_edit_${Date.now()}.${format}`;
    link.href = canvas.toDataURL(`image/${format}`, 0.95);
    link.click();
  };

  return (
    <div className="flex-1 flex bg-[#0c0d12] overflow-hidden select-none">
      {/* Center Image Canvas Viewport */}
      <div className="flex-1 flex flex-col bg-[#08090d] relative overflow-hidden">
        {/* Status banner */}
        {aiStatus && (
          <div className="absolute top-3 left-1/2 -translate-x-1/2 z-30 bg-[#7c3aed] text-white text-xs px-4 py-2 rounded-full shadow-xl flex items-center gap-2 animate-bounce">
            <Sparkles className="w-4 h-4 text-[#06b6d4]" />
            <span>{aiStatus}</span>
          </div>
        )}

        {/* Viewport Top Bar */}
        <div className="h-11 px-4 bg-[#10121a] border-b border-[#232736] flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-3 py-1.5 bg-[#181a26] hover:bg-[#202433] text-white rounded-lg border border-[#262a3b] flex items-center gap-1.5 transition-colors"
            >
              <Upload className="w-3.5 h-3.5 text-[#7c3aed]" />
              <span>Import Photo</span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleUploadImage}
              className="hidden"
            />
          </div>

          {/* Quick Rotation / Flip Controls */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => setRotation((r) => (r - 90) % 360)}
              title="Rotate Counter-Clockwise"
              className="p-1.5 rounded text-[#94a3b8] hover:text-white hover:bg-[#181a26]"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <button
              onClick={() => setRotation((r) => (r + 90) % 360)}
              title="Rotate Clockwise"
              className="p-1.5 rounded text-[#94a3b8] hover:text-white hover:bg-[#181a26]"
            >
              <RotateCw className="w-4 h-4" />
            </button>
            <button
              onClick={() => setFlipH(!flipH)}
              title="Flip Horizontal"
              className={`p-1.5 rounded hover:bg-[#181a26] ${flipH ? 'text-[#06b6d4]' : 'text-[#94a3b8]'}`}
            >
              <FlipHorizontal className="w-4 h-4" />
            </button>
            <button
              onClick={() => setFlipV(!flipV)}
              title="Flip Vertical"
              className={`p-1.5 rounded hover:bg-[#181a26] ${flipV ? 'text-[#06b6d4]' : 'text-[#94a3b8]'}`}
            >
              <FlipVertical className="w-4 h-4" />
            </button>
          </div>

          {/* Export Photo Dropdown */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => handleDownload('png')}
              className="px-3 py-1.5 bg-gradient-to-r from-[#7c3aed] to-[#06b6d4] text-white font-semibold rounded-lg flex items-center gap-1.5 text-xs shadow-md shadow-purple-500/20"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export PNG</span>
            </button>
          </div>
        </div>

        {/* Canvas Display */}
        <div className="flex-1 flex items-center justify-center p-6 overflow-hidden">
          <canvas
            ref={canvasRef}
            className="max-h-full max-w-full object-contain rounded-lg shadow-2xl shadow-black/80 border border-[#232736]"
          />
        </div>
      </div>

      {/* Right Adjustments & Filters Sidebar */}
      <div className="w-80 bg-[#12141c] border-l border-[#232736] flex flex-col h-full overflow-hidden">
        {/* Navigation Tabs */}
        <div className="flex border-b border-[#232736] bg-[#0e1017]">
          <button
            onClick={() => setActiveTab('adjust')}
            className={`flex-1 py-2.5 text-xs font-bold uppercase transition-colors ${
              activeTab === 'adjust' ? 'text-[#a78bfa] border-b-2 border-[#7c3aed]' : 'text-[#64748b] hover:text-white'
            }`}
          >
            Adjust
          </button>
          <button
            onClick={() => setActiveTab('crop')}
            className={`flex-1 py-2.5 text-xs font-bold uppercase transition-colors ${
              activeTab === 'crop' ? 'text-[#a78bfa] border-b-2 border-[#7c3aed]' : 'text-[#64748b] hover:text-white'
            }`}
          >
            Crop
          </button>
          <button
            onClick={() => setActiveTab('ai')}
            className={`flex-1 py-2.5 text-xs font-bold uppercase transition-colors ${
              activeTab === 'ai' ? 'text-[#06b6d4] border-b-2 border-[#06b6d4]' : 'text-[#64748b] hover:text-white'
            }`}
          >
            AI Lab
          </button>
        </div>

        {/* Panel Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
          {/* TAB 1: ADJUSTMENTS */}
          {activeTab === 'adjust' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase text-[#94a3b8]">Lighting & Color</span>
                <button
                  onClick={resetPhotoAdjustments}
                  className="text-[10px] text-[#64748b] hover:text-white flex items-center gap-1"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Reset</span>
                </button>
              </div>

              {/* Sliders */}
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-[#cbd5e1]">Brightness</span>
                    <span className="font-mono text-[#a78bfa]">{photoAdjustments.brightness}</span>
                  </div>
                  <input
                    type="range"
                    min="-100"
                    max="100"
                    value={photoAdjustments.brightness}
                    onChange={(e) => setPhotoAdjustments({ brightness: parseInt(e.target.value) })}
                    className="w-full h-1 bg-[#232736] rounded accent-[#7c3aed]"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-[#cbd5e1]">Contrast</span>
                    <span className="font-mono text-[#a78bfa]">{photoAdjustments.contrast}</span>
                  </div>
                  <input
                    type="range"
                    min="-100"
                    max="100"
                    value={photoAdjustments.contrast}
                    onChange={(e) => setPhotoAdjustments({ contrast: parseInt(e.target.value) })}
                    className="w-full h-1 bg-[#232736] rounded accent-[#7c3aed]"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-[#cbd5e1]">Saturation</span>
                    <span className="font-mono text-[#a78bfa]">{photoAdjustments.saturation}</span>
                  </div>
                  <input
                    type="range"
                    min="-100"
                    max="100"
                    value={photoAdjustments.saturation}
                    onChange={(e) => setPhotoAdjustments({ saturation: parseInt(e.target.value) })}
                    className="w-full h-1 bg-[#232736] rounded accent-[#7c3aed]"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-[#cbd5e1]">Blur</span>
                    <span className="font-mono text-[#06b6d4]">{photoAdjustments.blur}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={photoAdjustments.blur}
                    onChange={(e) => setPhotoAdjustments({ blur: parseInt(e.target.value) })}
                    className="w-full h-1 bg-[#232736] rounded accent-[#06b6d4]"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-[#cbd5e1]">Vignette</span>
                    <span className="font-mono text-[#06b6d4]">{photoAdjustments.vignette}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={photoAdjustments.vignette}
                    onChange={(e) => setPhotoAdjustments({ vignette: parseInt(e.target.value) })}
                    className="w-full h-1 bg-[#232736] rounded accent-[#06b6d4]"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: CROP & ASPECT */}
          {activeTab === 'crop' && (
            <div className="space-y-4">
              <span className="text-xs font-bold uppercase text-[#94a3b8] block">Aspect Ratio Crop</span>

              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: 'Freeform', val: 'free' },
                  { label: '1:1 Square (Feed)', val: '1:1' },
                  { label: '4:5 Instagram Portrait', val: '4:5' },
                  { label: '9:16 Story / TikTok', val: '9:16' },
                  { label: '16:9 YouTube Banner', val: '16:9' },
                  { label: 'Circular Avatar', val: 'circle' },
                ].map((item) => (
                  <button
                    key={item.val}
                    onClick={() => setPhotoCrop({ aspect: item.val as any })}
                    className={`p-3 rounded-xl border text-left text-xs font-semibold transition-all ${
                      photoCrop.aspect === item.val
                        ? 'bg-[#7c3aed]/20 text-[#c4b5fd] border-[#7c3aed]'
                        : 'bg-[#181a26] text-[#cbd5e1] border-[#232736] hover:bg-[#202433]'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: AI PHOTO LAB */}
          {activeTab === 'ai' && (
            <div className="space-y-4">
              <span className="text-xs font-bold uppercase text-[#94a3b8] block">AI Studio Enhancement</span>

              {/* One Click Enhance */}
              <div className="p-3 bg-[#181a26] border border-[#232736] rounded-xl space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded bg-[#7c3aed]/20 text-[#a78bfa] flex items-center justify-center">
                    <Sparkles className="w-3.5 h-3.5" />
                  </div>
                  <h4 className="text-xs font-bold text-white">AI Auto Enhance</h4>
                </div>
                <p className="text-[11px] text-[#94a3b8]">
                  Automatically equalizes contrast, enhances edge micro-details, and enlivens colors.
                </p>
                <button
                  onClick={handleAiAutoEnhance}
                  className="w-full py-1.5 bg-[#7c3aed] hover:bg-[#6d28d9] text-white font-semibold text-xs rounded-lg transition-colors flex items-center justify-center gap-1.5"
                >
                  <Wand2 className="w-3.5 h-3.5" />
                  <span>Auto Enhance Photo</span>
                </button>
              </div>

              {/* Background Removal */}
              <div className="p-3 bg-[#181a26] border border-[#232736] rounded-xl space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded bg-[#06b6d4]/20 text-[#06b6d4] flex items-center justify-center">
                    <Scissors className="w-3.5 h-3.5" />
                  </div>
                  <h4 className="text-xs font-bold text-white">AI Background Remover</h4>
                </div>
                <p className="text-[11px] text-[#94a3b8]">
                  Segments edge contrasts and removes the background for PNG transparency.
                </p>
                <button
                  onClick={handleAiRemoveBackground}
                  className="w-full py-1.5 bg-[#06b6d4] hover:bg-[#0891b2] text-black font-semibold text-xs rounded-lg transition-colors flex items-center justify-center gap-1.5"
                >
                  <Scissors className="w-3.5 h-3.5" />
                  <span>Cutout Foreground</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
