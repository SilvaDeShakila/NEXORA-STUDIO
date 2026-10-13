import React, { useState, useEffect } from 'react';
import {
  X,
  Monitor,
  Cpu,
  Terminal,
  Download,
  Copy,
  Check,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  ExternalLink,
  Zap
} from 'lucide-react';
import { useStudioStore } from '../../store/studioStore';
import { apiService, SystemHealthResponse } from '../../services/apiService';

export const DesktopBridgeModal: React.FC = () => {
  const { isDesktopModalOpen, setIsDesktopModalOpen } = useStudioStore();
  const [copiedCmd, setCopiedCmd] = useState(false);
  const [isPinging, setIsPinging] = useState(false);
  const [backendHealth, setBackendHealth] = useState<SystemHealthResponse | null>(null);
  const [pingError, setPingError] = useState<string | null>(null);

  const testConnection = async () => {
    setIsPinging(true);
    setPingError(null);
    try {
      const res = await apiService.checkHealth();
      if (res.isOnline && res.health) {
        setBackendHealth(res.health);
      } else {
        setBackendHealth(null);
        setPingError('Backend not detected at http://localhost:8000/api. Running in browser-only mode.');
      }
    } catch (e: any) {
      setBackendHealth(null);
      setPingError(e.message || 'Connection failed.');
    } finally {
      setIsPinging(false);
    }
  };

  useEffect(() => {
    if (isDesktopModalOpen) {
      testConnection();
    }
  }, [isDesktopModalOpen]);

  if (!isDesktopModalOpen) return null;

  const startCmd = "uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 --reload";

  const handleCopyCmd = () => {
    navigator.clipboard.writeText(startCmd);
    setCopiedCmd(true);
    setTimeout(() => setCopiedCmd(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 select-none">
      <div className="w-full max-w-2xl bg-[#12141c] border border-[#2b3044] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Modal Header */}
        <div className="h-14 px-5 bg-[#10121a] border-b border-[#232736] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-[#7c3aed]/20 text-[#a78bfa] flex items-center justify-center border border-[#7c3aed]/30">
              <Monitor className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Python Backend & Desktop Architecture</h3>
              <p className="text-[10px] text-[#64748b]">FastAPI • FFmpeg 4K Engine • Windows 64-bit</p>
            </div>
          </div>

          <button
            onClick={() => setIsDesktopModalOpen(false)}
            className="p-1.5 text-[#64748b] hover:text-white rounded-lg hover:bg-[#181a26] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-5 space-y-4 overflow-y-auto custom-scrollbar flex-1">
          {/* Live Backend Connection Status */}
          <div className="p-4 rounded-xl bg-[#181a26] border border-[#232736] space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase text-[#cbd5e1] flex items-center gap-2">
                <Zap className="w-4 h-4 text-[#06b6d4]" />
                Live FastAPI Backend Connection
              </span>
              <button
                onClick={testConnection}
                disabled={isPinging}
                className="text-[11px] text-[#a78bfa] hover:text-white px-2 py-1 rounded bg-[#232736] hover:bg-[#2e3448] flex items-center gap-1.5 transition-colors"
              >
                <RefreshCw className={`w-3 h-3 ${isPinging ? 'animate-spin' : ''}`} />
                <span>Ping /api/health</span>
              </button>
            </div>

            {backendHealth ? (
              <div className="p-3 bg-[#10b981]/10 border border-[#10b981]/30 rounded-lg space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs text-[#10b981] font-bold">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Backend Connected: {backendHealth.app_name} v{backendHealth.version}</span>
                  </div>
                  <span className="text-[10px] text-[#cbd5e1] font-mono">Status 200 OK</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] text-[#cbd5e1] pt-1">
                  <div>FFmpeg: <span className="font-bold text-[#10b981]">{backendHealth.ffmpeg_available ? 'Available' : 'Missing'}</span></div>
                  <div>FFprobe: <span className="font-bold text-[#10b981]">{backendHealth.ffprobe_available ? 'Available' : 'Missing'}</span></div>
                  <div>Encoder: <span className="font-bold text-[#06b6d4]">{backendHealth.recommended_encoder}</span></div>
                  <div>Database: <span className="font-mono text-[#a78bfa]">Stateless (None)</span></div>
                </div>
              </div>
            ) : (
              <div className="p-3 bg-[#181b26] border border-[#2d3246] rounded-lg space-y-2">
                <div className="flex items-center gap-2 text-xs text-[#94a3b8]">
                  <AlertCircle className="w-4 h-4 text-[#f59e0b]" />
                  <span>Browser-Engine Fallback Active (FastAPI server offline on localhost:8000)</span>
                </div>
                <p className="text-[11px] text-[#64748b]">
                  {pingError || 'The studio operates independently in-browser. Start the backend below for native server-side FFmpeg rendering.'}
                </p>
              </div>
            )}
          </div>

          {/* Quick Start Command */}
          <div className="p-4 rounded-xl bg-[#181a26] border border-[#232736] space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase text-white flex items-center gap-1.5">
                <Terminal className="w-3.5 h-3.5 text-[#06b6d4]" />
                Start Backend Locally
              </span>
              <button
                onClick={handleCopyCmd}
                className="text-[11px] text-[#06b6d4] hover:underline flex items-center gap-1 font-semibold"
              >
                {copiedCmd ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                <span>{copiedCmd ? 'Copied' : 'Copy'}</span>
              </button>
            </div>

            <pre className="p-2.5 bg-[#0a0b10] border border-[#232736] rounded-lg text-xs font-mono text-[#a78bfa] overflow-x-auto">
              {startCmd}
            </pre>

            <div className="flex items-center gap-3 text-[11px] text-[#64748b] pt-1">
              <span>Interactive Swagger Docs:</span>
              <a
                href="http://localhost:8000/docs"
                target="_blank"
                rel="noreferrer"
                className="text-[#06b6d4] hover:underline flex items-center gap-1"
              >
                <span>http://localhost:8000/docs</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>

          {/* Target Computer Hardware Diagnostics */}
          <div className="p-4 rounded-xl bg-[#181a26] border border-[#232736] space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase text-[#cbd5e1] flex items-center gap-2">
                <Cpu className="w-4 h-4 text-[#06b6d4]" />
                Development Hardware Specifications
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#10b981]/20 text-[#10b981] border border-[#10b981]/30">
                Optimized
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              <div className="p-2 bg-[#12141c] rounded-lg border border-[#232736]">
                <span className="text-[10px] text-[#64748b] block">CPU</span>
                <span className="font-semibold text-white truncate block">Intel Core i7-7500U</span>
                <span className="text-[9px] text-[#94a3b8]">2 cores / 4 threads</span>
              </div>
              <div className="p-2 bg-[#12141c] rounded-lg border border-[#232736]">
                <span className="text-[10px] text-[#64748b] block">RAM</span>
                <span className="font-semibold text-white block">16 GB DDR4</span>
                <span className="text-[9px] text-[#10b981]">High capacity</span>
              </div>
              <div className="p-2 bg-[#12141c] rounded-lg border border-[#232736]">
                <span className="text-[10px] text-[#64748b] block">GPU</span>
                <span className="font-semibold text-white truncate block">Intel HD Graphics 620</span>
                <span className="text-[9px] text-[#a78bfa]">QuickSync Ready</span>
              </div>
              <div className="p-2 bg-[#12141c] rounded-lg border border-[#232736]">
                <span className="text-[10px] text-[#64748b] block">Operating System</span>
                <span className="font-semibold text-white block">Windows 64-bit</span>
                <span className="text-[9px] text-[#94a3b8]">Tauri Desktop Native</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
