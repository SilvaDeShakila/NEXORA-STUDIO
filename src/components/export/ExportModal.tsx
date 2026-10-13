import React, { useState, useRef } from 'react';
import {
  Download,
  X,
  Play,
  CheckCircle2,
  AlertCircle,
  Cpu,
  Layers,
  Terminal,
  Copy,
  Check
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useStudioStore } from '../../store/studioStore';
import { ExportSettings, ExportResolution } from '../../types/studio';
import { exportVideo } from '../../engine/exportRenderer';
import { generateFFmpegCommand } from '../../engine/ffmpegBridge';

export const ExportModal: React.FC = () => {
  const {
    project,
    isExportModalOpen,
    setIsExportModalOpen,
    isExporting,
    exportProgress,
    exportStage,
    exportedBlobUrl,
    setExportProgress,
    setExportedBlobUrl,
    cancelExport,
  } = useStudioStore();

  const [resolution, setResolution] = useState<ExportResolution>('1080p');
  const [fps, setFps] = useState<24 | 30 | 60>(30);
  const [format, setFormat] = useState<'mp4' | 'webm'>('mp4');
  const [bitrate, setBitrate] = useState<'standard' | 'high' | 'ultra'>('high');
  const [useHardwareAccel, setUseHardwareAccel] = useState(true);
  const [activeTab, setActiveTab] = useState<'render' | 'ffmpeg'>('render');
  const [copiedCmd, setCopiedCmd] = useState(false);

  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  const isCancelledRef = useRef<{ current: boolean }>({ current: false });

  if (!isExportModalOpen) return null;

  const exportSettings: ExportSettings = {
    resolution,
    format,
    fps,
    bitrate,
    useHardwareAccel,
    useProxiesForExport: false, // Always true source media
  };

  const handleStartExport = async () => {
    isCancelledRef.current.current = false;
    useStudioStore.setState({ isExporting: true, exportProgress: 0, exportStage: 'Initializing...', exportedBlobUrl: null });

    try {
      const blob = await exportVideo(
        project,
        exportSettings,
        (progress, stage, canvas) => {
          setExportProgress(progress, stage);
          if (canvas && previewCanvasRef.current) {
            const dest = previewCanvasRef.current;
            dest.width = 320;
            dest.height = 180;
            const destCtx = dest.getContext('2d');
            if (destCtx) {
              destCtx.drawImage(canvas, 0, 0, dest.width, dest.height);
            }
          }
        },
        isCancelledRef.current
      );

      const blobUrl = URL.createObjectURL(blob);
      setExportedBlobUrl(blobUrl);
      useStudioStore.setState({ isExporting: false, exportProgress: 100, exportStage: 'Render complete!' });

      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });
    } catch (err: any) {
      if (err.message !== 'Export cancelled by user') {
        useStudioStore.setState({ isExporting: false, exportStage: `Error: ${err.message}` });
      }
    }
  };

  const handleCancelExport = () => {
    isCancelledRef.current.current = true;
    cancelExport();
  };

  const ffmpegCommand = generateFFmpegCommand(project, exportSettings);

  const handleCopyFFmpeg = () => {
    navigator.clipboard.writeText(ffmpegCommand);
    setCopiedCmd(true);
    setTimeout(() => setCopiedCmd(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 select-none">
      <div className="w-full max-w-xl bg-[#12141c] border border-[#2b3044] rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="h-14 px-5 bg-[#10121a] border-b border-[#232736] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-[#7c3aed] to-[#06b6d4] flex items-center justify-center text-white">
              <Download className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Export Video Project</h3>
              <p className="text-[10px] text-[#64748b]">True 4K UHD Master • Zero Watermarks • 100% Free</p>
            </div>
          </div>

          <button
            onClick={() => setIsExportModalOpen(false)}
            className="p-1.5 text-[#64748b] hover:text-white rounded-lg hover:bg-[#181a26] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4">
          {/* Sub Navigation */}
          <div className="flex bg-[#0f1118] p-1 rounded-xl border border-[#232736]">
            <button
              onClick={() => setActiveTab('render')}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                activeTab === 'render' ? 'bg-[#7c3aed] text-white shadow-md' : 'text-[#64748b] hover:text-white'
              }`}
            >
              Direct Studio Render
            </button>
            <button
              onClick={() => setActiveTab('ffmpeg')}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-1.5 ${
                activeTab === 'ffmpeg' ? 'bg-[#7c3aed] text-white shadow-md' : 'text-[#64748b] hover:text-white'
              }`}
            >
              <Terminal className="w-3.5 h-3.5" />
              <span>FFmpeg Pipeline</span>
            </button>
          </div>

          {activeTab === 'render' && (
            <>
              {/* Settings Selection when not exporting */}
              {!isExporting && !exportedBlobUrl && (
                <div className="space-y-4">
                  {/* Resolution Selector */}
                  <div>
                    <label className="text-xs font-semibold text-[#cbd5e1] block mb-2">Export Resolution</label>
                    <div className="grid grid-cols-4 gap-2">
                      {(['720p', '1080p', '1440p', '4K'] as ExportResolution[]).map((res) => (
                        <button
                          key={res}
                          onClick={() => setResolution(res)}
                          className={`p-2.5 rounded-xl border text-center transition-all ${
                            resolution === res
                              ? 'bg-[#7c3aed]/20 text-white border-[#7c3aed] font-bold shadow-sm shadow-purple-500/10'
                              : 'bg-[#181a26] text-[#94a3b8] border-[#232736] hover:bg-[#202334]'
                          }`}
                        >
                          <span className="text-sm block">{res}</span>
                          <span className="text-[9px] text-[#64748b] block mt-0.5">
                            {res === '4K' ? '3840×2160' : res === '1440p' ? '2560×1440' : res === '1080p' ? '1920×1080' : '1280×720'}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Frame Rate & Bitrate */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-[#cbd5e1] block mb-1.5">Frame Rate</label>
                      <select
                        value={fps}
                        onChange={(e) => setFps(parseInt(e.target.value) as any)}
                        className="w-full bg-[#181a26] text-white text-xs px-3 py-2 rounded-xl border border-[#2b3044]"
                      >
                        <option value={24}>24 fps (Cinematic Film)</option>
                        <option value={30}>30 fps (Standard Web)</option>
                        <option value={60}>60 fps (Ultra Smooth Motion)</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-[#cbd5e1] block mb-1.5">Bitrate Quality</label>
                      <select
                        value={bitrate}
                        onChange={(e) => setBitrate(e.target.value as any)}
                        className="w-full bg-[#181a26] text-white text-xs px-3 py-2 rounded-xl border border-[#2b3044]"
                      >
                        <option value="standard">Standard (8 Mbps)</option>
                        <option value="high">High Quality (16 Mbps)</option>
                        <option value="ultra">Ultra Master (35 Mbps)</option>
                      </select>
                    </div>
                  </div>

                  {/* Hardware Encoder Info */}
                  <div className="p-3 rounded-xl bg-[#181a26] border border-[#232736] flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <Cpu className="w-4 h-4 text-[#06b6d4]" />
                      <div>
                        <span className="font-semibold text-white block">Intel QuickSync Encoding</span>
                        <span className="text-[10px] text-[#64748b]">Optimized for Intel Core i7-7500U / HD 620</span>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#10b981]/20 text-[#10b981] border border-[#10b981]/30">
                      Active
                    </span>
                  </div>

                  {/* Render Start Button */}
                  <button
                    onClick={handleStartExport}
                    className="w-full py-3 bg-gradient-to-r from-[#7c3aed] to-[#06b6d4] hover:from-[#6d28d9] hover:to-[#0891b2] text-white font-bold text-sm rounded-xl shadow-lg shadow-purple-500/20 active:scale-98 transition-all flex items-center justify-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    <span>Start Rendering {resolution} Video</span>
                  </button>
                </div>
              )}

              {/* Rendering in progress */}
              {isExporting && (
                <div className="space-y-4 py-2">
                  <div className="w-full h-36 bg-black rounded-xl overflow-hidden flex items-center justify-center border border-[#232736] relative">
                    <canvas ref={previewCanvasRef} className="max-h-full max-w-full object-contain" />
                    <div className="absolute top-2 right-2 px-2 py-0.5 rounded bg-black/70 text-[#06b6d4] text-[10px] font-bold">
                      LIVE RENDER
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="text-white font-semibold">{exportStage}</span>
                      <span className="font-mono text-[#06b6d4] font-bold">{exportProgress}%</span>
                    </div>
                    <div className="w-full h-2 bg-[#1f2334] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-[#7c3aed] to-[#06b6d4] transition-all duration-200"
                        style={{ width: `${exportProgress}%` }}
                      />
                    </div>
                  </div>

                  <button
                    onClick={handleCancelExport}
                    className="w-full py-2 bg-[#232736] hover:bg-[#2b3144] text-[#ef4444] font-semibold text-xs rounded-xl transition-colors"
                  >
                    Cancel Render
                  </button>
                </div>
              )}

              {/* Render Finished Download Screen */}
              {exportedBlobUrl && (
                <div className="text-center py-4 space-y-4">
                  <div className="w-12 h-12 rounded-full bg-[#10b981]/20 text-[#10b981] flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-7 h-7" />
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-white">Rendering Complete!</h4>
                    <p className="text-xs text-[#94a3b8] mt-0.5">
                      Your master video has been encoded in {resolution} with no watermarks.
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <a
                      href={exportedBlobUrl}
                      download={`${project.name.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${resolution}.mp4`}
                      className="flex-1 py-3 bg-gradient-to-r from-[#7c3aed] to-[#06b6d4] text-white font-bold text-sm rounded-xl shadow-lg shadow-purple-500/20 flex items-center justify-center gap-2"
                    >
                      <Download className="w-4 h-4" />
                      <span>Download Video File</span>
                    </a>
                    <button
                      onClick={() => setExportedBlobUrl(null)}
                      className="px-4 py-3 bg-[#181a26] text-[#cbd5e1] hover:text-white rounded-xl text-xs font-semibold"
                    >
                      New Render
                    </button>
                  </div>
                </div>
              )}
            </>
          )}

          {activeTab === 'ffmpeg' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#94a3b8]">Production CLI Command</span>
                <button
                  onClick={handleCopyFFmpeg}
                  className="text-[#06b6d4] hover:underline flex items-center gap-1 font-semibold"
                >
                  {copiedCmd ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedCmd ? 'Copied!' : 'Copy Command'}</span>
                </button>
              </div>

              <pre className="p-3 bg-[#0a0b10] border border-[#232736] rounded-xl text-[11px] font-mono text-[#a78bfa] overflow-x-auto whitespace-pre-wrap max-h-56 custom-scrollbar">
                {ffmpegCommand}
              </pre>

              <p className="text-[10px] text-[#64748b]">
                Run this directly on Windows, macOS, or Linux in the directory of your media assets. Includes Intel QuickSync hardware flags.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
