import React, { useRef, useState, useEffect } from 'react';
import {
  Scissors,
  Copy,
  Trash2,
  Magnet,
  ZoomIn,
  ZoomOut,
  Plus,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Volume2,
  VolumeX,
  Zap,
  Music,
  Video,
  Type,
  Layers,
  ChevronRight
} from 'lucide-react';
import { useStudioStore } from '../../store/studioStore';
import { TimelineClip, TimelineTrack } from '../../types/studio';

export const MultiTrackTimeline: React.FC = () => {
  const timelineRef = useRef<HTMLDivElement>(null);
  const playheadRef = useRef<HTMLDivElement>(null);

  const {
    project,
    currentTime,
    setCurrentTime,
    zoomLevel,
    setZoomLevel,
    snapToGrid,
    setSnapToGrid,
    selectedClipId,
    setSelectedClipId,
    splitClipAtPlayhead,
    duplicateClip,
    deleteClip,
    moveClip,
    trimClip,
    addTrack,
    removeTrack,
    toggleTrackLock,
    toggleTrackMute,
    toggleTrackVisibility,
    autoCutToBeats,
    activeTool,
    setActiveTool,
  } = useStudioStore();

  const [isScrubbing, setIsScrubbing] = useState(false);
  const [draggingClipId, setDraggingClipId] = useState<string | null>(null);
  const [dragStartX, setDragStartX] = useState<number>(0);
  const [clipInitialStart, setClipInitialStart] = useState<number>(0);

  const [trimmingClipId, setTrimmingClipId] = useState<string | null>(null);
  const [trimType, setTrimType] = useState<'left' | 'right' | null>(null);
  const [trimInitialData, setTrimInitialData] = useState<{ start: number; duration: number; offset: number } | null>(null);

  const totalDuration = Math.max(project.duration, 15);
  const timelineWidth = Math.max(1200, totalDuration * zoomLevel);

  // Playhead scrubber click / drag
  const handleTimelineScrub = (e: React.MouseEvent) => {
    if (!timelineRef.current) return;
    const rect = timelineRef.current.getBoundingClientRect();
    const scrollLeft = timelineRef.current.scrollLeft;
    const clickX = e.clientX - rect.left + scrollLeft;
    const time = Math.max(0, Math.min(totalDuration, clickX / zoomLevel));

    // Snapping logic if snapToGrid is active
    let snappedTime = time;
    if (snapToGrid) {
      // Snap to beat markers
      for (const beat of project.beatMarkers) {
        if (Math.abs(time - beat) < 0.15) {
          snappedTime = beat;
          break;
        }
      }
      // Snap to clip edges
      for (const c of project.clips) {
        if (Math.abs(time - c.start) < 0.15) {
          snappedTime = c.start;
          break;
        }
        if (Math.abs(time - (c.start + c.duration)) < 0.15) {
          snappedTime = c.start + c.duration;
          break;
        }
      }
    }

    setCurrentTime(snappedTime);
  };

  const handleMouseDownScrub = (e: React.MouseEvent) => {
    setIsScrubbing(true);
    handleTimelineScrub(e);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isScrubbing && timelineRef.current) {
        const rect = timelineRef.current.getBoundingClientRect();
        const scrollLeft = timelineRef.current.scrollLeft;
        const x = e.clientX - rect.left + scrollLeft;
        const time = Math.max(0, Math.min(totalDuration, x / zoomLevel));
        setCurrentTime(time);
      } else if (draggingClipId && clipInitialStart !== null) {
        const deltaPixels = e.clientX - dragStartX;
        const deltaTime = deltaPixels / zoomLevel;
        let newStart = Math.max(0, clipInitialStart + deltaTime);

        if (snapToGrid) {
          for (const beat of project.beatMarkers) {
            if (Math.abs(newStart - beat) < 0.15) {
              newStart = beat;
              break;
            }
          }
        }
        moveClip(draggingClipId, newStart);
      } else if (trimmingClipId && trimInitialData) {
        const deltaPixels = e.clientX - dragStartX;
        const deltaTime = deltaPixels / zoomLevel;

        if (trimType === 'left') {
          const newStart = Math.max(0, trimInitialData.start + deltaTime);
          const newDuration = Math.max(0.2, trimInitialData.duration - deltaTime);
          const newOffset = Math.max(0, trimInitialData.offset + deltaTime);
          trimClip(trimmingClipId, newStart, newDuration, newOffset);
        } else if (trimType === 'right') {
          const newDuration = Math.max(0.2, trimInitialData.duration + deltaTime);
          trimClip(trimmingClipId, trimInitialData.start, newDuration);
        }
      }
    };

    const handleMouseUp = () => {
      setIsScrubbing(false);
      setDraggingClipId(null);
      setTrimmingClipId(null);
      setTrimType(null);
      setTrimInitialData(null);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [
    isScrubbing,
    draggingClipId,
    clipInitialStart,
    dragStartX,
    zoomLevel,
    totalDuration,
    snapToGrid,
    project.beatMarkers,
    setCurrentTime,
    moveClip,
    trimmingClipId,
    trimInitialData,
    trimType,
    trimClip,
  ]);

  // Generate ruler tick marks
  const renderRulerTicks = () => {
    const ticks = [];
    const step = zoomLevel > 70 ? 1 : zoomLevel > 35 ? 2 : 5;
    for (let sec = 0; sec <= totalDuration; sec += step) {
      ticks.push(
        <div
          key={sec}
          className="absolute top-0 bottom-0 flex flex-col justify-end pointer-events-none"
          style={{ left: `${sec * zoomLevel}px` }}
        >
          <span className="text-[9px] font-mono text-[#64748b] ml-1 mb-1">
            {sec}s
          </span>
          <div className="w-px h-2 bg-[#2d3246]" />
        </div>
      );
    }
    return ticks;
  };

  return (
    <div className="h-64 bg-[#0e1017] border-t border-[#232736] flex flex-col select-none">
      {/* Timeline Controls Toolbar */}
      <div className="h-10 px-4 bg-[#12141c] border-b border-[#232736] flex items-center justify-between text-xs">
        {/* Left Toolbar Tools */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => splitClipAtPlayhead()}
            disabled={!selectedClipId}
            title="Split Clip at Playhead (Ctrl+B)"
            className="p-1.5 rounded text-[#94a3b8] hover:text-white hover:bg-[#1a1d2a] disabled:opacity-30 transition-colors flex items-center gap-1"
          >
            <Scissors className="w-3.5 h-3.5 text-[#06b6d4]" />
            <span className="text-[11px] font-medium hidden sm:inline">Split</span>
          </button>

          <button
            onClick={() => selectedClipId && duplicateClip(selectedClipId)}
            disabled={!selectedClipId}
            title="Duplicate Selected Clip"
            className="p-1.5 rounded text-[#94a3b8] hover:text-white hover:bg-[#1a1d2a] disabled:opacity-30 transition-colors"
          >
            <Copy className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => selectedClipId && deleteClip(selectedClipId)}
            disabled={!selectedClipId}
            title="Delete Selected Clip (Delete)"
            className="p-1.5 rounded text-[#94a3b8] hover:text-[#ef4444] hover:bg-[#1a1d2a] disabled:opacity-30 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>

          <div className="h-4 w-px bg-[#262a3b] mx-1" />

          {/* Snapping Toggle */}
          <button
            onClick={() => setSnapToGrid(!snapToGrid)}
            title={snapToGrid ? 'Timeline Snapping Enabled' : 'Timeline Snapping Disabled'}
            className={`p-1.5 rounded transition-colors ${
              snapToGrid ? 'text-[#7c3aed] bg-[#7c3aed]/15' : 'text-[#64748b] hover:text-white'
            }`}
          >
            <Magnet className="w-3.5 h-3.5" />
          </button>

          {/* Quick Cut to Beats Button */}
          <button
            onClick={autoCutToBeats}
            title="Automatically cut video clips to audio beat markers"
            className="px-2 py-1 bg-[#06b6d4]/15 hover:bg-[#06b6d4]/25 text-[#06b6d4] text-[11px] font-semibold rounded border border-[#06b6d4]/30 flex items-center gap-1 transition-colors"
          >
            <Zap className="w-3 h-3" />
            <span>Beat Cut</span>
          </button>
        </div>

        {/* Right Toolbar: Zoom & Add Track */}
        <div className="flex items-center gap-3">
          {/* Zoom Slider */}
          <div className="flex items-center gap-1.5">
            <ZoomOut
              onClick={() => setZoomLevel(zoomLevel - 10)}
              className="w-3.5 h-3.5 text-[#64748b] hover:text-white cursor-pointer"
            />
            <input
              type="range"
              min="20"
              max="150"
              value={zoomLevel}
              onChange={(e) => setZoomLevel(parseInt(e.target.value))}
              className="w-20 h-1 bg-[#232736] rounded accent-[#7c3aed]"
            />
            <ZoomIn
              onClick={() => setZoomLevel(zoomLevel + 10)}
              className="w-3.5 h-3.5 text-[#64748b] hover:text-white cursor-pointer"
            />
          </div>

          <div className="h-4 w-px bg-[#262a3b]" />

          {/* Add Track Menu */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => addTrack('video')}
              className="px-2 py-1 bg-[#181a26] hover:bg-[#202433] text-[#cbd5e1] hover:text-white rounded text-[11px] font-medium border border-[#232736] flex items-center gap-1"
            >
              <Plus className="w-3 h-3 text-[#7c3aed]" />
              <span>+ Track</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Tracks & Timeline Scroller */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left Track Headers Column */}
        <div className="w-48 bg-[#10121a] border-r border-[#232736] flex flex-col shrink-0 z-20 overflow-y-auto">
          {/* Top ruler header blank */}
          <div className="h-7 border-b border-[#232736] bg-[#0c0e14] px-3 flex items-center text-[10px] text-[#64748b] font-bold uppercase tracking-wider">
            Tracks
          </div>

          {/* Track Headers */}
          {project.tracks.map((track) => (
            <div
              key={track.id}
              className="h-14 border-b border-[#1f2334] px-3 flex items-center justify-between hover:bg-[#151822] transition-colors"
            >
              <div className="flex items-center gap-2 min-w-0">
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: track.color }}
                />
                <span className="text-xs font-semibold text-white truncate">{track.name}</span>
              </div>

              {/* Track Controls */}
              <div className="flex items-center gap-1 text-[#64748b]">
                <button
                  onClick={() => toggleTrackVisibility(track.id)}
                  title={track.visible ? 'Hide Track' : 'Show Track'}
                  className="p-1 hover:text-white transition-colors"
                >
                  {track.visible ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3 text-[#ef4444]" />}
                </button>
                <button
                  onClick={() => toggleTrackMute(track.id)}
                  title={track.muted ? 'Unmute Track' : 'Mute Track'}
                  className="p-1 hover:text-white transition-colors"
                >
                  {track.muted ? <VolumeX className="w-3 h-3 text-[#ef4444]" /> : <Volume2 className="w-3 h-3" />}
                </button>
                <button
                  onClick={() => toggleTrackLock(track.id)}
                  title={track.locked ? 'Unlock Track' : 'Lock Track'}
                  className="p-1 hover:text-white transition-colors"
                >
                  {track.locked ? <Lock className="w-3 h-3 text-[#f59e0b]" /> : <Unlock className="w-3 h-3" />}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Right Scrollable Timeline View */}
        <div
          ref={timelineRef}
          onMouseDown={handleMouseDownScrub}
          className="flex-1 overflow-x-auto overflow-y-auto relative bg-[#0b0c12] custom-scrollbar"
        >
          <div
            className="relative"
            style={{ width: `${timelineWidth}px`, minHeight: '100%' }}
          >
            {/* Top Time Ruler */}
            <div className="h-7 border-b border-[#232736] bg-[#0c0e14] relative sticky top-0 z-10 cursor-pointer">
              {renderRulerTicks()}

              {/* Beat Markers Visualization */}
              {project.beatMarkers.map((beat, idx) => (
                <div
                  key={idx}
                  title={`Beat: ${beat}s`}
                  className="absolute top-1 w-1.5 h-1.5 rounded-full bg-[#06b6d4] shadow-sm shadow-cyan-500/50 -translate-x-1/2 pointer-events-none"
                  style={{ left: `${beat * zoomLevel}px` }}
                />
              ))}
            </div>

            {/* Playhead Vertical Line */}
            <div
              ref={playheadRef}
              className="absolute top-0 bottom-0 z-30 pointer-events-none flex flex-col items-center"
              style={{ left: `${currentTime * zoomLevel}px` }}
            >
              {/* Playhead Handle */}
              <div className="w-3 h-3 bg-[#06b6d4] rotate-45 -translate-y-1 shadow-md shadow-cyan-500/40" />
              {/* Vertical Playhead Bar */}
              <div className="w-0.5 flex-1 bg-[#06b6d4] shadow-sm shadow-cyan-500/50" />
            </div>

            {/* Track Lanes */}
            {project.tracks.map((track) => {
              const trackClips = project.clips.filter((c) => c.trackId === track.id);

              return (
                <div
                  key={track.id}
                  className="h-14 border-b border-[#1f2334] relative bg-[#0e1017]/40 hover:bg-[#131622]/40"
                >
                  {/* Clips on this track */}
                  {trackClips.map((clip) => {
                    const isSelected = selectedClipId === clip.id;
                    const clipLeft = clip.start * zoomLevel;
                    const clipWidth = Math.max(15, clip.duration * zoomLevel);

                    return (
                      <div
                        key={clip.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedClipId(clip.id);
                        }}
                        onMouseDown={(e) => {
                          e.stopPropagation();
                          setSelectedClipId(clip.id);
                          setDraggingClipId(clip.id);
                          setDragStartX(e.clientX);
                          setClipInitialStart(clip.start);
                        }}
                        className={`absolute top-1 bottom-1 rounded-lg px-2 flex flex-col justify-between overflow-hidden cursor-move transition-shadow ${
                          isSelected
                            ? 'ring-2 ring-[#06b6d4] ring-offset-1 ring-offset-[#0e1017] shadow-lg shadow-cyan-500/20 z-20'
                            : 'hover:brightness-110 z-10'
                        }`}
                        style={{
                          left: `${clipLeft}px`,
                          width: `${clipWidth}px`,
                          backgroundColor: `${clip.color || '#8b5cf6'}dd`,
                          opacity: track.visible ? 1 : 0.3,
                        }}
                      >
                        {/* Clip Top Bar */}
                        <div className="flex items-center justify-between text-[10px] text-white font-semibold truncate pt-0.5">
                          <span className="truncate">{clip.name}</span>
                          <span className="text-[9px] opacity-75 font-mono ml-1 shrink-0">
                            {clip.duration.toFixed(1)}s
                          </span>
                        </div>

                        {/* Audio Waveform visualization if audio clip */}
                        {clip.type === 'audio' && (
                          <div className="h-4 flex items-end gap-0.5 opacity-60 overflow-hidden pointer-events-none pb-0.5">
                            {Array.from({ length: Math.min(30, Math.floor(clipWidth / 4)) }).map((_, i) => (
                              <div
                                key={i}
                                className="w-1 bg-white rounded-t"
                                style={{ height: `${20 + (Math.sin(i * 0.8) + 1) * 35}%` }}
                              />
                            ))}
                          </div>
                        )}

                        {/* Transition In Badge */}
                        {clip.transitionIn && (
                          <div className="absolute top-0 left-0 bottom-0 w-4 bg-[#7c3aed]/70 border-r border-white/40 flex items-center justify-center text-[7px] text-white font-bold pointer-events-none">
                            ▶
                          </div>
                        )}

                        {/* Left Trim Handle */}
                        <div
                          onMouseDown={(e) => {
                            e.stopPropagation();
                            setTrimmingClipId(clip.id);
                            setTrimType('left');
                            setDragStartX(e.clientX);
                            setTrimInitialData({ start: clip.start, duration: clip.duration, offset: clip.mediaOffset });
                          }}
                          className="absolute top-0 bottom-0 left-0 w-2 hover:w-3 bg-white/20 hover:bg-white/50 cursor-ew-resize transition-all z-20"
                        />

                        {/* Right Trim Handle */}
                        <div
                          onMouseDown={(e) => {
                            e.stopPropagation();
                            setTrimmingClipId(clip.id);
                            setTrimType('right');
                            setDragStartX(e.clientX);
                            setTrimInitialData({ start: clip.start, duration: clip.duration, offset: clip.mediaOffset });
                          }}
                          className="absolute top-0 bottom-0 right-0 w-2 hover:w-3 bg-white/20 hover:bg-white/50 cursor-ew-resize transition-all z-20"
                        />
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
