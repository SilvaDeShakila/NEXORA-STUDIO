import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Maximize2,
  Minimize2,
  Volume2,
  VolumeX,
  Maximize,
  Ratio,
  Grid,
  ChevronDown
} from 'lucide-react';
import { useStudioStore } from '../../store/studioStore';
import { AspectRatio } from '../../types/studio';
import { renderCanvasFrame } from '../../engine/previewRenderer';

export const PreviewPlayer: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const {
    project,
    currentTime,
    setCurrentTime,
    isPlaying,
    togglePlayPause,
    stepFrame,
    volume,
    setVolume,
    isMuted,
    toggleMute,
    setAspectRatio,
    previewResolution,
    lowPerformanceMode,
    showSafeGuides,
    isFullscreenPreview,
    setIsFullscreenPreview,
    selectedClipId,
    updateClip,
  } = useStudioStore();

  const [aspectDropdownOpen, setAspectDropdownOpen] = useState(false);
  const [zoomScale, setZoomScale] = useState<'fit' | '50%' | '75%' | '100%'>('fit');
  const [isDraggingCanvas, setIsDraggingCanvas] = useState(false);
  const [dragStartPos, setDragStartPos] = useState<{ x: number; y: number } | null>(null);

  // Playback timer loop
  useEffect(() => {
    let animationFrameId: number;
    let lastTime = performance.now();

    const loop = (now: number) => {
      const delta = (now - lastTime) / 1000;
      lastTime = now;

      if (isPlaying) {
        const nextTime = currentTime + delta;
        if (nextTime >= project.duration) {
          setCurrentTime(0);
        } else {
          setCurrentTime(nextTime);
        }
      }

      // Draw canvas frame
      if (canvasRef.current) {
        renderCanvasFrame(canvasRef.current, project, currentTime, {
          lowPerformanceMode,
          previewQuality: previewResolution,
          isPlaying,
        });
      }

      animationFrameId = requestAnimationFrame(loop);
    };

    animationFrameId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animationFrameId);
  }, [isPlaying, currentTime, project, lowPerformanceMode, previewResolution, setCurrentTime]);

  // Format timecode (HH:MM:SS:FF)
  const formatTimecode = (seconds: number, fps = 30) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const frames = Math.floor((seconds % 1) * fps);
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}:${String(frames).padStart(2, '0')}`;
  };

  // Canvas aspect ratio dimensions
  const getCanvasDimensions = () => {
    let w = 1280;
    let h = 720;
    if (previewResolution === '360p') {
      w = 640;
      h = 360;
    } else if (previewResolution === '480p') {
      w = 854;
      h = 480;
    } else if (previewResolution === 'original' || previewResolution === '720p') {
      w = 1280;
      h = 720;
    }

    if (project.aspectRatio === '9:16') {
      return { width: h, height: w };
    } else if (project.aspectRatio === '1:1') {
      return { width: h, height: h };
    } else if (project.aspectRatio === '4:5') {
      return { width: Math.round((h * 4) / 5), height: h };
    } else if (project.aspectRatio === '21:9') {
      return { width: Math.round((h * 21) / 9), height: h };
    }
    return { width: w, height: h };
  };

  const { width: canvasW, height: canvasH } = getCanvasDimensions();

  // Interactive bounding box drag for selected clip
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!selectedClipId) return;
    setIsDraggingCanvas(true);
    setDragStartPos({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingCanvas || !dragStartPos || !selectedClipId) return;
    const dx = e.clientX - dragStartPos.x;
    const dy = e.clientY - dragStartPos.y;

    const clip = project.clips.find((c) => c.id === selectedClipId);
    if (!clip) return;

    // Convert pixel delta to percentage offset
    const currentX = clip.transform.x;
    const currentY = clip.transform.y;
    updateClip(selectedClipId, {
      transform: {
        ...clip.transform,
        x: currentX + dx * 0.15,
        y: currentY + dy * 0.15,
      },
    });

    setDragStartPos({ x: e.clientX, y: e.clientY });
  };

  const handleMouseUp = () => {
    setIsDraggingCanvas(false);
    setDragStartPos(null);
  };

  // Keyboard shortcut listener for spacebar playback
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.code === 'Space') {
        e.preventDefault();
        togglePlayPause();
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault();
        stepFrame('backward');
      } else if (e.code === 'ArrowRight') {
        e.preventDefault();
        stepFrame('forward');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [togglePlayPause, stepFrame]);

  const selectedClip = project.clips.find((c) => c.id === selectedClipId);

  return (
    <div
      ref={containerRef}
      className={`flex flex-col bg-[#0b0d13] border-b border-[#232736] relative select-none ${
        isFullscreenPreview ? 'fixed inset-0 z-50' : 'flex-1'
      }`}
    >
      {/* Top Bar inside Viewport */}
      <div className="h-9 px-3 bg-[#11131c] border-b border-[#1f2334] flex items-center justify-between text-xs text-[#94a3b8]">
        {/* Left: Aspect Ratio Selector */}
        <div className="relative">
          <button
            onClick={() => setAspectDropdownOpen(!aspectDropdownOpen)}
            className="flex items-center gap-1.5 px-2 py-1 bg-[#181a26] hover:bg-[#202433] text-white rounded border border-[#2b3044] transition-colors"
          >
            <Ratio className="w-3.5 h-3.5 text-[#7c3aed]" />
            <span className="font-semibold">{project.aspectRatio}</span>
            <ChevronDown className="w-3 h-3 text-[#64748b]" />
          </button>

          {aspectDropdownOpen && (
            <div className="absolute left-0 mt-1 w-44 bg-[#181a26] border border-[#2b3044] rounded-lg shadow-xl py-1 z-30">
              {(['16:9', '9:16', '1:1', '4:5', '21:9'] as AspectRatio[]).map((aspect) => (
                <button
                  key={aspect}
                  onClick={() => {
                    setAspectRatio(aspect);
                    setAspectDropdownOpen(false);
                  }}
                  className={`w-full text-left px-3 py-1.5 text-xs flex items-center justify-between hover:bg-[#222738] ${
                    project.aspectRatio === aspect ? 'text-[#06b6d4] font-semibold bg-[#222738]/40' : 'text-[#cbd5e1]'
                  }`}
                >
                  <span>{aspect}</span>
                  <span className="text-[10px] text-[#64748b]">
                    {aspect === '16:9'
                      ? 'YouTube / Film'
                      : aspect === '9:16'
                      ? 'TikTok / Reels'
                      : aspect === '1:1'
                      ? 'Square'
                      : aspect === '4:5'
                      ? 'Portrait'
                      : 'Ultrawide'}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Center: Active Resolution Badge */}
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-mono text-[#cbd5e1] font-semibold">
            {canvasW} × {canvasH}
          </span>
          <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-[#7c3aed]/20 text-[#a78bfa] border border-[#7c3aed]/30 uppercase">
            {previewResolution}
          </span>
        </div>

        {/* Right: Scale & Fullscreen */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              const scales: ('fit' | '50%' | '75%' | '100%')[] = ['fit', '50%', '75%', '100%'];
              const nextIndex = (scales.indexOf(zoomScale) + 1) % scales.length;
              setZoomScale(scales[nextIndex]);
            }}
            className="px-2 py-0.5 bg-[#181a26] hover:bg-[#202433] rounded text-[11px] text-[#cbd5e1] border border-[#232736]"
          >
            {zoomScale.toUpperCase()}
          </button>

          <button
            onClick={() => setIsFullscreenPreview(!isFullscreenPreview)}
            className="p-1 text-[#94a3b8] hover:text-white rounded hover:bg-[#181a26]"
            title={isFullscreenPreview ? 'Exit Fullscreen' : 'Fullscreen Preview'}
          >
            {isFullscreenPreview ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Center Viewport Display Area */}
      <div
        className="flex-1 flex items-center justify-center p-3 relative overflow-hidden bg-[#0a0a0f] cursor-default"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
      >
        {/* Background Grid Pattern */}
        <div
          className="absolute inset-0 opacity-15 pointer-events-none"
          style={{
            backgroundImage:
              'linear-gradient(to right, #232736 1px, transparent 1px), linear-gradient(to bottom, #232736 1px, transparent 1px)',
            backgroundSize: '24px 24px',
          }}
        />

        {/* Main Canvas Viewport with Shadow Frame */}
        <div
          className="relative shadow-2xl rounded shadow-black/80 flex items-center justify-center border border-[#1f2334]"
          style={{
            aspectRatio: `${canvasW} / ${canvasH}`,
            maxHeight: '100%',
            maxWidth: '100%',
            transform: zoomScale === '50%' ? 'scale(0.75)' : zoomScale === '75%' ? 'scale(0.9)' : 'none',
          }}
        >
          <canvas
            ref={canvasRef}
            width={canvasW}
            height={canvasH}
            className="w-full h-full object-contain rounded bg-black block"
          />

          {/* TikTok / Reels Safe Zones Overlay */}
          {showSafeGuides && project.aspectRatio === '9:16' && (
            <div className="absolute inset-0 pointer-events-none border-2 border-dashed border-[#06b6d4]/40 z-20 flex flex-col justify-between p-6">
              <div className="h-10 border border-[#06b6d4]/30 bg-[#06b6d4]/10 rounded flex items-center justify-center text-[10px] text-[#06b6d4] font-bold">
                TOP SAFE ZONE (NO TEXT)
              </div>
              <div className="flex justify-end pr-2">
                <div className="w-12 h-44 border border-[#06b6d4]/30 bg-[#06b6d4]/10 rounded flex items-center justify-center text-[9px] text-[#06b6d4] font-bold writing-mode-vertical">
                  ICONS
                </div>
              </div>
              <div className="h-16 border border-[#06b6d4]/30 bg-[#06b6d4]/10 rounded flex items-center justify-center text-[10px] text-[#06b6d4] font-bold">
                CAPTION & AUDIO MARGIN
              </div>
            </div>
          )}

          {/* Interactive Clip Overlay Selection Indicator */}
          {selectedClip && (
            <div
              className="absolute pointer-events-none border-2 border-[#7c3aed] rounded z-20"
              style={{
                top: `${50 + selectedClip.transform.y * 0.4}%`,
                left: `${50 + selectedClip.transform.x * 0.4}%`,
                width: `${40 * selectedClip.transform.scale}%`,
                height: `${25 * selectedClip.transform.scale}%`,
                transform: 'translate(-50%, -50%)',
              }}
            >
              <div className="w-2.5 h-2.5 bg-white border border-[#7c3aed] rounded-full absolute -top-1.5 -left-1.5" />
              <div className="w-2.5 h-2.5 bg-white border border-[#7c3aed] rounded-full absolute -top-1.5 -right-1.5" />
              <div className="w-2.5 h-2.5 bg-white border border-[#7c3aed] rounded-full absolute -bottom-1.5 -left-1.5" />
              <div className="w-2.5 h-2.5 bg-white border border-[#7c3aed] rounded-full absolute -bottom-1.5 -right-1.5" />
            </div>
          )}
        </div>
      </div>

      {/* Bottom Transport Controls Bar */}
      <div className="h-12 bg-[#10121a] border-t border-[#1f2334] px-4 flex items-center justify-between text-xs">
        {/* Left: Timecode */}
        <div className="flex items-center gap-2 font-mono">
          <span className="text-white font-bold text-sm tracking-wider">
            {formatTimecode(currentTime)}
          </span>
          <span className="text-[#64748b]">/</span>
          <span className="text-[#94a3b8] text-xs">
            {formatTimecode(project.duration)}
          </span>
        </div>

        {/* Center: Playback Controls */}
        <div className="flex items-center gap-2">
          {/* Step Back 1 Frame */}
          <button
            onClick={() => stepFrame('backward')}
            title="Step Back 1 Frame (Left Arrow)"
            className="p-1.5 text-[#94a3b8] hover:text-white rounded-md hover:bg-[#181b26] transition-colors"
          >
            <SkipBack className="w-4 h-4" />
          </button>

          {/* Play / Pause Button */}
          <button
            onClick={togglePlayPause}
            title="Play / Pause (Space)"
            className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#7c3aed] to-[#06b6d4] hover:from-[#6d28d9] hover:to-[#0891b2] text-white flex items-center justify-center shadow-lg shadow-purple-500/20 active:scale-95 transition-all"
          >
            {isPlaying ? <Pause className="w-4 h-4 fill-white" /> : <Play className="w-4 h-4 fill-white ml-0.5" />}
          </button>

          {/* Step Forward 1 Frame */}
          <button
            onClick={() => stepFrame('forward')}
            title="Step Forward 1 Frame (Right Arrow)"
            className="p-1.5 text-[#94a3b8] hover:text-white rounded-md hover:bg-[#181b26] transition-colors"
          >
            <SkipForward className="w-4 h-4" />
          </button>
        </div>

        {/* Right: Audio Volume Control */}
        <div className="flex items-center gap-2">
          <button
            onClick={toggleMute}
            className="p-1 text-[#94a3b8] hover:text-white transition-colors"
          >
            {isMuted || volume === 0 ? <VolumeX className="w-4 h-4 text-[#ef4444]" /> : <Volume2 className="w-4 h-4" />}
          </button>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={isMuted ? 0 : volume}
            onChange={(e) => setVolume(parseFloat(e.target.value))}
            className="w-20 h-1 bg-[#232736] rounded accent-[#7c3aed]"
          />
        </div>
      </div>
    </div>
  );
};
