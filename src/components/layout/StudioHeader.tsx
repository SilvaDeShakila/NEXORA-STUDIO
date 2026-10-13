import React, { useState } from 'react';
import { 
  Sparkles, 
  Undo2, 
  Redo2, 
  Download, 
  Monitor, 
  Cpu, 
  Layers, 
  Image as ImageIcon, 
  Video, 
  LayoutTemplate, 
  Bot, 
  Check, 
  ChevronDown,
  Gauge
} from 'lucide-react';
import { useStudioStore } from '../../store/studioStore';
import { PreviewResolution, StudioMode } from '../../types/studio';
import { apiService, SystemHealthResponse } from '../../services/apiService';

export const StudioHeader: React.FC = () => {
  const {
    project,
    setProjectName,
    undoStack,
    redoStack,
    undo,
    redo,
    activeMode,
    setActiveMode,
    previewResolution,
    setPreviewResolution,
    lowPerformanceMode,
    setLowPerformanceMode,
    showSafeGuides,
    setShowSafeGuides,
    setIsExportModalOpen,
    setIsDesktopModalOpen,
  } = useStudioStore();

  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleInput, setTitleInput] = useState(project.name);
  const [showResDropdown, setShowResDropdown] = useState(false);
  const [backendStatus, setBackendStatus] = useState<{ isOnline: boolean; health?: SystemHealthResponse }>({ isOnline: false });

  // Check Python backend health
  React.useEffect(() => {
    let mounted = true;
    const check = async () => {
      const res = await apiService.checkHealth();
      if (mounted) setBackendStatus(res);
    };
    check();
    const interval = setInterval(check, 10000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  const handleTitleSubmit = () => {
    if (titleInput.trim()) {
      setProjectName(titleInput.trim());
    }
    setIsEditingTitle(false);
  };

  const resolutions: PreviewResolution[] = ['360p', '480p', '720p', 'original'];

  return (
    <header className="h-14 bg-[#10121a] border-b border-[#232736] px-4 flex items-center justify-between select-none z-30">
      {/* Left: Branding & Project Title */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-[#7c3aed] to-[#06b6d4] flex items-center justify-center shadow-lg shadow-purple-500/20">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold tracking-wider text-sm bg-gradient-to-r from-white via-[#e2e8f0] to-[#a78bfa] bg-clip-text text-transparent">
                NEXORA
              </span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#7c3aed]/20 text-[#a78bfa] border border-[#7c3aed]/30 uppercase">
                Studio
              </span>
            </div>
          </div>
        </div>

        <div className="h-5 w-px bg-[#262a3b]" />

        {/* Project Name Editor */}
        <div className="flex items-center gap-2">
          {isEditingTitle ? (
            <div className="flex items-center gap-1">
              <input
                type="text"
                value={titleInput}
                onChange={(e) => setTitleInput(e.target.value)}
                onBlur={handleTitleSubmit}
                onKeyDown={(e) => e.key === 'Enter' && handleTitleSubmit()}
                autoFocus
                className="bg-[#181b26] text-xs font-semibold px-2 py-1 rounded border border-[#7c3aed] text-white focus:outline-none w-48"
              />
              <button 
                onClick={handleTitleSubmit}
                className="p-1 hover:bg-[#232736] rounded text-[#06b6d4]"
              >
                <Check className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => {
                setTitleInput(project.name);
                setIsEditingTitle(true);
              }}
              title="Click to rename project"
              className="text-xs font-medium text-[#94a3b8] hover:text-white px-2 py-1 rounded hover:bg-[#181b26] transition-colors flex items-center gap-1.5 max-w-[200px] truncate"
            >
              <span className="truncate">{project.name}</span>
              <span className="text-[10px] text-[#64748b]">v{project.version}</span>
            </button>
          )}
        </div>

        {/* Undo / Redo */}
        <div className="flex items-center gap-1">
          <button
            onClick={undo}
            disabled={undoStack.length === 0}
            title="Undo (Ctrl+Z)"
            className="p-1.5 rounded text-[#94a3b8] hover:text-white hover:bg-[#181b26] disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
          >
            <Undo2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={redo}
            disabled={redoStack.length === 0}
            title="Redo (Ctrl+Y)"
            className="p-1.5 rounded text-[#94a3b8] hover:text-white hover:bg-[#181b26] disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
          >
            <Redo2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Center: Mode Switcher */}
      <div className="flex items-center bg-[#151822] p-1 rounded-lg border border-[#232736]">
        <button
          onClick={() => setActiveMode('video')}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-all ${
            activeMode === 'video'
              ? 'bg-[#7c3aed] text-white shadow-md shadow-purple-500/20'
              : 'text-[#94a3b8] hover:text-white hover:bg-[#1f2433]'
          }`}
        >
          <Video className="w-3.5 h-3.5" />
          <span>Video Editor</span>
        </button>

        <button
          onClick={() => setActiveMode('photo')}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-all ${
            activeMode === 'photo'
              ? 'bg-[#7c3aed] text-white shadow-md shadow-purple-500/20'
              : 'text-[#94a3b8] hover:text-white hover:bg-[#1f2433]'
          }`}
        >
          <ImageIcon className="w-3.5 h-3.5" />
          <span>Photo Studio</span>
        </button>

        <button
          onClick={() => setActiveMode('templates')}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-all ${
            activeMode === 'templates'
              ? 'bg-[#7c3aed] text-white shadow-md shadow-purple-500/20'
              : 'text-[#94a3b8] hover:text-white hover:bg-[#1f2433]'
          }`}
        >
          <LayoutTemplate className="w-3.5 h-3.5" />
          <span>Templates</span>
        </button>

        <button
          onClick={() => setActiveMode('ai_tools')}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-all ${
            activeMode === 'ai_tools'
              ? 'bg-gradient-to-r from-[#7c3aed] to-[#06b6d4] text-white shadow-md shadow-cyan-500/20'
              : 'text-[#94a3b8] hover:text-white hover:bg-[#1f2433]'
          }`}
        >
          <Bot className="w-3.5 h-3.5" />
          <span>AI Lab</span>
        </button>
      </div>

      {/* Right: Hardware Optimization & Export Buttons */}
      <div className="flex items-center gap-3">
        {/* Preview Resolution Selector (Crucial for Intel i7-7500U / HD 620) */}
        <div className="relative">
          <button
            onClick={() => setShowResDropdown(!showResDropdown)}
            title="Preview Proxy Resolution: 360p or 480p recommended for smooth preview on Intel Core i7 / HD 620"
            className="flex items-center gap-1.5 bg-[#181b26] hover:bg-[#202433] text-[#94a3b8] hover:text-white text-xs px-2.5 py-1.5 rounded-md border border-[#262a3b] transition-colors"
          >
            <Gauge className="w-3 h-3 text-[#06b6d4]" />
            <span className="font-semibold">{previewResolution.toUpperCase()}</span>
            <ChevronDown className="w-3 h-3 opacity-60" />
          </button>

          {showResDropdown && (
            <div className="absolute right-0 mt-1 w-44 bg-[#181b26] border border-[#2b3044] rounded-lg shadow-2xl py-1 z-50">
              <div className="px-3 py-1.5 text-[10px] uppercase font-bold text-[#64748b] border-b border-[#232736]">
                Preview Proxy Quality
              </div>
              {resolutions.map((res) => (
                <button
                  key={res}
                  onClick={() => {
                    setPreviewResolution(res);
                    setShowResDropdown(false);
                  }}
                  className={`w-full text-left px-3 py-1.5 text-xs flex items-center justify-between hover:bg-[#222738] ${
                    previewResolution === res ? 'text-[#06b6d4] font-semibold bg-[#222738]/50' : 'text-[#cbd5e1]'
                  }`}
                >
                  <span>{res === 'original' ? 'Original (Full)' : `${res} Proxy`}</span>
                  {res === '480p' && <span className="text-[9px] px-1 bg-[#10b981]/20 text-[#10b981] rounded">Optimal</span>}
                </button>
              ))}
              <div className="px-3 py-1 text-[10px] text-[#64748b] bg-[#11131c]">
                Final export always renders in true 4K / original resolution.
              </div>
            </div>
          )}
        </div>

        {/* Low Performance Mode Toggle (Intel HD 620 optimization) */}
        <button
          onClick={() => setLowPerformanceMode(!lowPerformanceMode)}
          title={lowPerformanceMode ? 'Eco / Intel HD 620 Mode Enabled' : 'Enable Eco Mode for Low-End CPUs/Integrated GPUs'}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium border transition-colors ${
            lowPerformanceMode
              ? 'bg-[#10b981]/15 text-[#10b981] border-[#10b981]/40'
              : 'bg-[#181b26] text-[#94a3b8] border-[#262a3b] hover:text-white'
          }`}
        >
          <Cpu className="w-3 h-3" />
          <span>{lowPerformanceMode ? 'Eco Mode' : 'Performance'}</span>
        </button>

        {/* Safe Guides Toggle */}
        <button
          onClick={() => setShowSafeGuides(!showSafeGuides)}
          title="Toggle TikTok / Reels Safe Zones"
          className={`p-1.5 rounded-md border text-xs transition-colors ${
            showSafeGuides 
              ? 'bg-[#06b6d4]/15 text-[#06b6d4] border-[#06b6d4]/40' 
              : 'bg-[#181b26] text-[#94a3b8] border-[#262a3b] hover:text-white'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
        </button>

        {/* Backend Engine Status Pill */}
        <button
          onClick={() => setIsDesktopModalOpen(true)}
          title={backendStatus.isOnline ? "Python FastAPI Backend: Connected" : "Python Backend: Offline (Using Browser Engine fallback)"}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium border transition-colors ${
            backendStatus.isOnline
              ? 'bg-[#10b981]/15 text-[#10b981] border-[#10b981]/40'
              : 'bg-[#181b26] text-[#64748b] hover:text-[#94a3b8] border-[#262a3b]'
          }`}
        >
          <span className={`w-2 h-2 rounded-full ${backendStatus.isOnline ? 'bg-[#10b981] animate-pulse' : 'bg-[#64748b]'}`} />
          <span>{backendStatus.isOnline ? 'Backend Online' : 'Browser Engine'}</span>
        </button>

        {/* Desktop Tauri & Python Bridge */}
        <button
          onClick={() => setIsDesktopModalOpen(true)}
          title="Desktop App & Local Python Engine"
          className="p-1.5 rounded-md bg-[#181b26] hover:bg-[#202433] text-[#94a3b8] hover:text-white border border-[#262a3b] transition-colors"
        >
          <Monitor className="w-3.5 h-3.5" />
        </button>

        {/* 4K Export Button */}
        <button
          onClick={() => setIsExportModalOpen(true)}
          className="flex items-center gap-2 bg-gradient-to-r from-[#7c3aed] to-[#06b6d4] hover:from-[#6d28d9] hover:to-[#0891b2] text-white text-xs font-semibold px-4 py-1.5 rounded-lg shadow-lg shadow-purple-500/20 active:scale-95 transition-all"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export 4K</span>
        </button>
      </div>
    </header>
  );
};
