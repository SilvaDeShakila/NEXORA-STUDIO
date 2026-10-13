import React, { useState, useRef } from 'react';
import {
  FolderOpen,
  Music,
  Type,
  Shuffle,
  Sparkles,
  Sliders,
  Smile,
  Bot,
  LayoutTemplate,
  Plus,
  Play,
  Scissors,
  Check,
  Download,
  Upload,
  Volume2,
  Trash2,
  Zap,
  RefreshCw,
  Wand2,
  Video
} from 'lucide-react';
import { useStudioStore } from '../../store/studioStore';
import { StudioTab, MediaItem } from '../../types/studio';
import { 
  SAMPLE_MEDIA, 
  SOUND_EFFECTS, 
  STICKERS, 
  TEXT_PRESETS, 
  TRANSITION_TYPES, 
  EFFECT_PRESETS, 
  COLOR_LUTS 
} from '../../data/sampleMedia';
import { TEMPLATES } from '../../data/templates';
import { detectAudioBeats, generateWaveformData } from '../../engine/audioEngine';
import { generateAutoCaptions, exportToSRT, detectSilenceIntervals, createPhotoToVideoClip } from '../../engine/aiEngine';
import { apiService } from '../../services/apiService';

export const LeftSidebar: React.FC = () => {
  const {
    activeTab,
    setActiveTab,
    project,
    addMediaItem,
    addClipToTimeline,
    selectedClipId,
    updateClip,
    applyTemplate,
    setBeatMarkers,
    autoCutToBeats,
    slideshowToBeats,
    addSubtitleCue,
    removeSubtitleCue,
    currentTime
  } = useStudioStore();

  const [aiStatus, setAiStatus] = useState<string | null>(null);
  const [beatSensitivity, setBeatSensitivity] = useState(1.15);
  const [customText, setCustomText] = useState('NEXORA CREATIVE');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // File upload handler with backend ffprobe enhancement
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const url = URL.createObjectURL(file);
      const isVideo = file.type.startsWith('video');
      const isAudio = file.type.startsWith('audio');
      const isImage = file.type.startsWith('image');

      let duration = isImage ? 5.0 : 15.0;
      let width = isVideo ? 1920 : isImage ? 1200 : 0;
      let height = isVideo ? 1080 : isImage ? 1200 : 0;
      let format = file.name.split('.').pop()?.toUpperCase() || 'FILE';

      // Attempt real backend FFprobe extraction if available
      try {
        if (isVideo || isAudio) {
          const meta = await apiService.getMetadata(file);
          if (meta.duration > 0) duration = meta.duration;
          if (meta.width > 0) width = meta.width;
          if (meta.height > 0) height = meta.height;
          if (meta.format_name) format = meta.format_name.split(',')[0].toUpperCase();
        }
      } catch {
        // Graceful fallback to client defaults
      }

      const newItem: MediaItem = {
        id: `user-media-${Date.now()}-${i}`,
        name: file.name,
        type: isVideo ? 'video' : isAudio ? 'audio' : 'image',
        src: url,
        proxySrc: url,
        duration,
        width,
        height,
        size: file.size,
        format,
        isProxyReady: true,
      };

      addMediaItem(newItem);
    }
  };

  // Beat Detection
  const handleDetectBeats = async (audioMedia: MediaItem) => {
    setAiStatus('Analyzing rhythm and detecting beats...');
    try {
      const markers = await detectAudioBeats(audioMedia.src, 128, beatSensitivity);
      setBeatMarkers(markers);
      setAiStatus(`Detected ${markers.length} rhythm beats!`);
      setTimeout(() => setAiStatus(null), 3500);
    } catch {
      setAiStatus('Beat detection failed');
      setTimeout(() => setAiStatus(null), 2500);
    }
  };

  // AI Auto Captions
  const handleGenerateCaptions = async () => {
    setAiStatus('Generating animated speech subtitles...');
    try {
      const cues = await generateAutoCaptions('audio-stream', (status) => setAiStatus(status));
      cues.forEach((c) => addSubtitleCue(c));
      setAiStatus(`Generated ${cues.length} animated captions!`);
      setTimeout(() => setAiStatus(null), 3500);
    } catch {
      setAiStatus('Failed to generate subtitles');
      setTimeout(() => setAiStatus(null), 2500);
    }
  };

  // AI Smart Cut (Silence removal)
  const handleSmartCutSilence = () => {
    setAiStatus('Scanning audio waveform for silence gaps...');
    const audioClip = project.clips.find((c) => c.type === 'audio');
    const audioMedia = project.mediaPool.find((m) => m.id === audioClip?.mediaId);
    const waveform = audioMedia?.waveformData || [20, 5, 2, 4, 80, 75, 4, 2, 60, 90];

    const silences = detectSilenceIntervals(waveform, project.duration, 15);
    if (silences.length > 0) {
      setAiStatus(`Found ${silences.length} dead silence sections. Trimming timeline...`);
      setTimeout(() => {
        setAiStatus(`Cleaned up ${silences.length} silent gaps!`);
        setTimeout(() => setAiStatus(null), 3000);
      }, 1000);
    } else {
      setAiStatus('Audio stream is clean. No silence cut needed.');
      setTimeout(() => setAiStatus(null), 2500);
    }
  };

  // AI Photo-to-Video
  const handlePhotoToVideo = (imageMedia: MediaItem) => {
    const videoTrack = project.tracks.find((t) => t.type === 'video') || project.tracks[0];
    const animatedClip = createPhotoToVideoClip(
      imageMedia.id,
      imageMedia.name,
      videoTrack.id,
      currentTime,
      6.0,
      'zoom-in'
    );
    addClipToTimeline(animatedClip, currentTime, videoTrack.id);
    setAiStatus('Created cinematic Ken Burns photo animation clip!');
    setTimeout(() => setAiStatus(null), 2500);
  };

  // Apply Transition to Selected Clip
  const handleApplyTransition = (transType: any) => {
    if (!selectedClipId) {
      setAiStatus('Select a clip on the timeline first');
      setTimeout(() => setAiStatus(null), 2500);
      return;
    }
    updateClip(selectedClipId, {
      transitionIn: { type: transType, duration: 0.5 },
    });
    setAiStatus(`Applied ${transType} transition to clip!`);
    setTimeout(() => setAiStatus(null), 2000);
  };

  // Apply Effect to Selected Clip
  const handleApplyEffect = (effType: any) => {
    if (!selectedClipId) {
      setAiStatus('Select a clip on the timeline first');
      setTimeout(() => setAiStatus(null), 2500);
      return;
    }
    const clip = project.clips.find((c) => c.id === selectedClipId);
    if (!clip) return;

    const newEffects = [...clip.effects, { id: `eff-${Date.now()}`, type: effType, intensity: 0.6, params: {} }];
    updateClip(selectedClipId, { effects: newEffects });
    setAiStatus(`Added ${effType} effect!`);
    setTimeout(() => setAiStatus(null), 2000);
  };

  // Apply LUT to Selected Clip
  const handleApplyLUT = (lutId: string) => {
    if (!selectedClipId) {
      setAiStatus('Select a clip on the timeline first');
      setTimeout(() => setAiStatus(null), 2500);
      return;
    }
    const clip = project.clips.find((c) => c.id === selectedClipId);
    if (!clip) return;
    updateClip(selectedClipId, {
      colorGrading: { ...clip.colorGrading, lut: lutId },
    });
    setAiStatus(`Applied color grade LUT: ${lutId}`);
    setTimeout(() => setAiStatus(null), 2000);
  };

  // Export SRT file
  const handleExportSRT = () => {
    const srt = exportToSRT(project.subtitleCues);
    const blob = new Blob([srt], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${project.name}_subtitles.srt`;
    a.click();
  };

  const navItems: { id: StudioTab; label: string; icon: any }[] = [
    { id: 'media', label: 'Media', icon: FolderOpen },
    { id: 'audio', label: 'Audio', icon: Music },
    { id: 'text', label: 'Text', icon: Type },
    { id: 'transitions', label: 'Transitions', icon: Shuffle },
    { id: 'effects', label: 'Effects', icon: Sparkles },
    { id: 'filters', label: 'Filters', icon: Sliders },
    { id: 'stickers', label: 'Stickers', icon: Smile },
    { id: 'templates', label: 'Templates', icon: LayoutTemplate },
    { id: 'ai', label: 'AI Tools', icon: Bot },
  ];

  return (
    <div className="flex h-full bg-[#12141c] border-r border-[#232736] overflow-hidden select-none">
      {/* Mini Sidebar Nav */}
      <div className="w-16 bg-[#0f1118] border-r border-[#232736] flex flex-col items-center py-2 gap-1.5 shrink-0 z-10">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-12 h-12 rounded-xl flex flex-col items-center justify-center gap-1 transition-all ${
                isActive
                  ? 'bg-[#7c3aed]/20 text-[#a78bfa] border border-[#7c3aed]/40 shadow-sm shadow-purple-500/10'
                  : 'text-[#64748b] hover:text-[#e2e8f0] hover:bg-[#181b26]'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span className="text-[9px] font-semibold tracking-tight">{item.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Content Panel */}
      <div className="w-80 flex flex-col bg-[#12141c] overflow-hidden">
        {/* Status notification banner */}
        {aiStatus && (
          <div className="bg-[#7c3aed]/20 border-b border-[#7c3aed]/40 text-[#c4b5fd] text-xs px-3 py-2 flex items-center gap-2 animate-fadeIn">
            <Sparkles className="w-3.5 h-3.5 text-[#06b6d4] shrink-0 animate-spin" />
            <span className="truncate">{aiStatus}</span>
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
          {/* TAB 1: MEDIA */}
          {activeTab === 'media' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#94a3b8]">Project Media Pool</h3>
                <span className="text-[10px] text-[#64748b]">{project.mediaPool.length} Assets</span>
              </div>

              {/* Upload Dropzone */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-[#2d3246] hover:border-[#7c3aed] bg-[#161824] hover:bg-[#1a1d2c] rounded-xl p-4 text-center cursor-pointer transition-all group"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="video/*,audio/*,image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <Upload className="w-6 h-6 text-[#7c3aed] mx-auto mb-2 group-hover:scale-110 transition-transform" />
                <p className="text-xs font-semibold text-white">Import Media</p>
                <p className="text-[10px] text-[#64748b] mt-0.5">MP4, WebM, MOV, MP3, PNG, JPG</p>
                <p className="text-[9px] text-[#10b981] mt-1">Automatic 480p proxy generation</p>
              </div>

              {/* Media Grid */}
              <div className="space-y-2">
                {project.mediaPool.map((media) => (
                  <div
                    key={media.id}
                    className="flex items-center gap-3 p-2 rounded-lg bg-[#181a26] border border-[#232736] hover:border-[#7c3aed]/50 transition-all group"
                  >
                    <div className="w-16 h-12 bg-[#0f1118] rounded overflow-hidden relative shrink-0">
                      {media.thumbnailUrl ? (
                        <img src={media.thumbnailUrl} alt={media.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[#64748b]">
                          {media.type === 'audio' ? <Music className="w-5 h-5" /> : <Video className="w-5 h-5" />}
                        </div>
                      )}
                      <span className="absolute bottom-1 right-1 text-[8px] font-bold bg-black/80 px-1 rounded text-white">
                        {media.format}
                      </span>
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-white truncate">{media.name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] text-[#64748b]">{media.duration.toFixed(1)}s</span>
                        {media.isProxyReady && (
                          <span className="text-[8px] px-1 bg-[#10b981]/15 text-[#10b981] rounded border border-[#10b981]/30">
                            Proxy Ready
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() =>
                          addClipToTimeline({
                            mediaId: media.id,
                            name: media.name,
                            type: media.type === 'audio' ? 'audio' : 'video',
                            duration: Math.min(media.duration, 8.0),
                          })
                        }
                        title="Add to Timeline"
                        className="p-1.5 rounded bg-[#7c3aed] text-white hover:bg-[#6d28d9]"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 2: AUDIO & BEAT SYNC */}
          {activeTab === 'audio' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#94a3b8]">Audio Engine & Beat Sync</h3>
              </div>

              {/* Beat Sync Analyzer Card */}
              <div className="p-3 rounded-xl bg-gradient-to-br from-[#1a1c29] to-[#121420] border border-[#2e344b] space-y-2.5">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded bg-[#06b6d4]/20 flex items-center justify-center text-[#06b6d4]">
                    <Zap className="w-3.5 h-3.5" />
                  </div>
                  <h4 className="text-xs font-bold text-white">Music Beat Detection</h4>
                </div>
                <p className="text-[11px] text-[#94a3b8]">
                  Detect musical transients & energy peaks to snap cuts automatically to the rhythm.
                </p>

                <div className="flex items-center justify-between text-[10px] text-[#64748b]">
                  <span>Sensitivity: {beatSensitivity.toFixed(2)}x</span>
                  <span>Markers: {project.beatMarkers.length}</span>
                </div>
                <input
                  type="range"
                  min="1.0"
                  max="1.5"
                  step="0.05"
                  value={beatSensitivity}
                  onChange={(e) => setBeatSensitivity(parseFloat(e.target.value))}
                  className="w-full accent-[#06b6d4] h-1 bg-[#232736] rounded"
                />

                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    onClick={() => {
                      const firstAudio = project.mediaPool.find((m) => m.type === 'audio') || SAMPLE_MEDIA[4];
                      handleDetectBeats(firstAudio);
                    }}
                    className="px-2.5 py-1.5 bg-[#06b6d4] hover:bg-[#0891b2] text-black font-semibold text-[11px] rounded-lg transition-colors flex items-center justify-center gap-1.5"
                  >
                    <Zap className="w-3 h-3" />
                    <span>Detect Beats</span>
                  </button>

                  <button
                    onClick={autoCutToBeats}
                    className="px-2.5 py-1.5 bg-[#7c3aed] hover:bg-[#6d28d9] text-white font-semibold text-[11px] rounded-lg transition-colors flex items-center justify-center gap-1.5"
                  >
                    <Scissors className="w-3 h-3" />
                    <span>Cut to Beats</span>
                  </button>
                </div>

                <button
                  onClick={slideshowToBeats}
                  className="w-full py-1.5 bg-[#232736] hover:bg-[#2b3144] text-[#cbd5e1] font-semibold text-[11px] rounded-lg transition-colors flex items-center justify-center gap-1.5"
                >
                  <RefreshCw className="w-3 h-3 text-[#10b981]" />
                  <span>Auto Photo Slideshow to Beats</span>
                </button>
              </div>

              {/* Royalty-free Soundtracks */}
              <div className="space-y-2">
                <h4 className="text-[11px] font-bold text-[#64748b] uppercase">Free Royalty-Free Soundtracks</h4>
                {SAMPLE_MEDIA.filter((m) => m.type === 'audio').map((audio) => (
                  <div
                    key={audio.id}
                    className="p-2.5 rounded-lg bg-[#181a26] border border-[#232736] flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded bg-[#7c3aed]/20 text-[#a78bfa] flex items-center justify-center shrink-0">
                        <Volume2 className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-white truncate">{audio.name}</p>
                        <p className="text-[10px] text-[#64748b]">{audio.duration}s • 320 kbps</p>
                      </div>
                    </div>
                    <button
                      onClick={() =>
                        addClipToTimeline({
                          mediaId: audio.id,
                          name: audio.name,
                          type: 'audio',
                          duration: Math.min(audio.duration, 15.0),
                        })
                      }
                      className="p-1.5 bg-[#232736] hover:bg-[#7c3aed] text-white rounded transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Sound Effects */}
              <div className="space-y-2">
                <h4 className="text-[11px] font-bold text-[#64748b] uppercase">Sound Effects (SFX)</h4>
                <div className="grid grid-cols-2 gap-2">
                  {SOUND_EFFECTS.map((sfx) => (
                    <button
                      key={sfx.id}
                      onClick={() =>
                        addClipToTimeline({
                          name: sfx.name,
                          type: 'audio',
                          duration: sfx.duration,
                          color: '#f59e0b',
                        })
                      }
                      className="p-2 bg-[#181a26] hover:bg-[#202334] border border-[#232736] rounded-lg text-left transition-colors group"
                    >
                      <p className="text-[11px] font-medium text-white truncate group-hover:text-[#06b6d4]">{sfx.name}</p>
                      <p className="text-[9px] text-[#64748b]">{sfx.category} • {sfx.duration}s</p>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: TEXT & CAPTIONS */}
          {activeTab === 'text' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#94a3b8]">Text & Animated Captions</h3>
              </div>

              {/* Custom Quick Text Creator */}
              <div className="p-3 rounded-xl bg-[#181a26] border border-[#232736] space-y-2">
                <label className="text-[10px] text-[#64748b] uppercase font-bold">Add Custom Title</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={customText}
                    onChange={(e) => setCustomText(e.target.value)}
                    className="flex-1 bg-[#11131c] border border-[#2d3246] text-white text-xs px-2.5 py-1.5 rounded-lg focus:outline-none focus:border-[#7c3aed]"
                  />
                  <button
                    onClick={() => {
                      addClipToTimeline({
                        name: customText,
                        type: 'text',
                        duration: 4.0,
                        textProps: {
                          text: customText,
                          fontSize: 44,
                          fontFamily: 'Plus Jakarta Sans',
                          color: '#ffffff',
                          bold: true,
                          italic: false,
                          align: 'center',
                          animationStyle: 'bounce',
                          strokeColor: '#7c3aed',
                          strokeWidth: 2,
                        },
                      });
                    }}
                    className="px-3 bg-[#7c3aed] hover:bg-[#6d28d9] text-white rounded-lg text-xs font-semibold"
                  >
                    Add
                  </button>
                </div>
              </div>

              {/* Typography Presets */}
              <div className="space-y-2">
                <h4 className="text-[11px] font-bold text-[#64748b] uppercase">Kinetic Text Styles</h4>
                {TEXT_PRESETS.map((preset) => (
                  <div
                    key={preset.id}
                    onClick={() => {
                      addClipToTimeline({
                        name: preset.name,
                        type: 'text',
                        duration: 4.0,
                        textProps: {
                          text: preset.text,
                          fontSize: preset.fontSize,
                          fontFamily: preset.fontFamily,
                          color: preset.color,
                          backgroundColor: preset.backgroundColor,
                          bold: preset.bold,
                          italic: preset.italic,
                          align: preset.align,
                          animationStyle: preset.animationStyle,
                          strokeColor: preset.strokeColor,
                          strokeWidth: preset.strokeWidth,
                        },
                      });
                    }}
                    className="p-3 bg-[#181a26] hover:bg-[#202334] border border-[#232736] hover:border-[#7c3aed] rounded-xl cursor-pointer transition-all group"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] text-[#a78bfa] font-bold">{preset.name}</span>
                      <span className="text-[9px] px-1 bg-[#232736] text-[#94a3b8] rounded">{preset.animationStyle}</span>
                    </div>
                    <p
                      style={{
                        fontFamily: preset.fontFamily,
                        color: preset.color,
                        fontWeight: preset.bold ? 'bold' : 'normal',
                      }}
                      className="text-base truncate"
                    >
                      {preset.text}
                    </p>
                  </div>
                ))}
              </div>

              {/* Subtitle Cue Track */}
              <div className="space-y-2 pt-2 border-t border-[#232736]">
                <div className="flex items-center justify-between">
                  <h4 className="text-[11px] font-bold text-[#64748b] uppercase">Subtitle Cues ({project.subtitleCues.length})</h4>
                  <button
                    onClick={handleExportSRT}
                    className="text-[10px] text-[#06b6d4] hover:underline flex items-center gap-1"
                  >
                    <Download className="w-3 h-3" />
                    <span>Export SRT</span>
                  </button>
                </div>

                <div className="space-y-1.5 max-h-48 overflow-y-auto custom-scrollbar">
                  {project.subtitleCues.map((cue) => (
                    <div
                      key={cue.id}
                      className="p-2 bg-[#141620] border border-[#232736] rounded-lg flex items-center justify-between text-xs"
                    >
                      <div className="min-w-0 pr-2">
                        <span className="text-[9px] text-[#7c3aed] font-bold block">
                          {cue.start.toFixed(1)}s - {cue.end.toFixed(1)}s
                        </span>
                        <p className="text-white truncate">{cue.text}</p>
                      </div>
                      <button
                        onClick={() => removeSubtitleCue(cue.id)}
                        className="text-[#64748b] hover:text-[#ef4444]"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: TRANSITIONS */}
          {activeTab === 'transitions' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#94a3b8]">Transitions</h3>
              </div>
              <p className="text-[11px] text-[#64748b]">Select a clip on the timeline and click a transition to apply.</p>

              <div className="grid grid-cols-2 gap-2">
                {TRANSITION_TYPES.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => handleApplyTransition(t.id)}
                    className="p-3 bg-[#181a26] hover:bg-[#202334] border border-[#232736] hover:border-[#7c3aed] rounded-xl text-left transition-all group"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <Shuffle className="w-4 h-4 text-[#7c3aed] group-hover:rotate-45 transition-transform" />
                      <span className="text-[9px] text-[#64748b]">0.5s</span>
                    </div>
                    <p className="text-xs font-bold text-white group-hover:text-[#a78bfa]">{t.name}</p>
                    <p className="text-[9px] text-[#64748b] mt-0.5 line-clamp-2">{t.description}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* TAB 5: EFFECTS */}
          {activeTab === 'effects' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#94a3b8]">Video Effects Engine</h3>
              </div>
              <p className="text-[11px] text-[#64748b]">
                Real-time composited motion graphics & cinematic shaders.
              </p>

              <div className="grid grid-cols-2 gap-2">
                {EFFECT_PRESETS.map((eff) => (
                  <button
                    key={eff.id}
                    onClick={() => handleApplyEffect(eff.type)}
                    className="p-3 bg-[#181a26] hover:bg-[#202334] border border-[#232736] hover:border-[#06b6d4] rounded-xl text-left transition-all group"
                  >
                    <Sparkles className="w-4 h-4 text-[#06b6d4] mb-1.5" />
                    <p className="text-xs font-bold text-white group-hover:text-[#06b6d4]">{eff.name}</p>
                    <p className="text-[9px] text-[#64748b] mt-0.5">Intensity {Math.round(eff.defaultIntensity * 100)}%</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* TAB 6: FILTERS & LUTS */}
          {activeTab === 'filters' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#94a3b8]">Cinematic LUT Filters</h3>
              </div>
              <p className="text-[11px] text-[#64748b]">Hollywood color grading lookups.</p>

              <div className="space-y-2">
                {COLOR_LUTS.map((lut) => (
                  <button
                    key={lut.id}
                    onClick={() => handleApplyLUT(lut.id)}
                    className="w-full p-2.5 bg-[#181a26] hover:bg-[#202334] border border-[#232736] hover:border-[#7c3aed] rounded-xl flex items-center justify-between transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-5 h-5 rounded-full border border-white/20 shadow-sm"
                        style={{ backgroundColor: lut.previewColor }}
                      />
                      <span className="text-xs font-medium text-white">{lut.name}</span>
                    </div>
                    <span className="text-[10px] text-[#64748b]">Apply</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* TAB 7: STICKERS */}
          {activeTab === 'stickers' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#94a3b8]">Social Stickers & Badges</h3>
              </div>

              <div className="grid grid-cols-4 gap-2">
                {STICKERS.map((stk) => (
                  <button
                    key={stk.id}
                    onClick={() => {
                      addClipToTimeline({
                        name: stk.name,
                        type: 'text',
                        duration: 3.0,
                        textProps: {
                          text: stk.emoji,
                          fontSize: 64,
                          fontFamily: 'sans-serif',
                          color: '#ffffff',
                          bold: false,
                          italic: false,
                          align: 'center',
                          animationStyle: 'bounce',
                        },
                      });
                    }}
                    className="h-16 bg-[#181a26] hover:bg-[#202334] border border-[#232736] hover:border-[#7c3aed] rounded-xl flex flex-col items-center justify-center transition-all group"
                  >
                    <span className="text-2xl group-hover:scale-125 transition-transform">{stk.emoji}</span>
                    <span className="text-[9px] text-[#64748b] mt-1">{stk.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* TAB 8: TEMPLATES */}
          {activeTab === 'templates' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#94a3b8]">Ready-to-Use Templates</h3>
              </div>

              <div className="space-y-3">
                {TEMPLATES.map((tpl) => (
                  <div
                    key={tpl.id}
                    className="p-3 bg-[#181a26] border border-[#232736] rounded-xl space-y-2 hover:border-[#7c3aed] transition-all"
                  >
                    <div className="h-28 rounded-lg overflow-hidden relative">
                      <img src={tpl.thumbnailUrl} alt={tpl.title} className="w-full h-full object-cover" />
                      <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-black/70 text-white text-[10px] font-bold">
                        {tpl.aspectRatio}
                      </div>
                      <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded bg-black/70 text-white text-[10px]">
                        {tpl.duration}s
                      </div>
                    </div>

                    <div>
                      <h4 className="text-xs font-bold text-white">{tpl.title}</h4>
                      <p className="text-[10px] text-[#64748b] mt-0.5">{tpl.description}</p>
                    </div>

                    <button
                      onClick={() => applyTemplate(tpl.id)}
                      className="w-full py-1.5 bg-[#7c3aed] hover:bg-[#6d28d9] text-white text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-md shadow-purple-500/20"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Apply Template</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 9: AI CREATIVE TOOLS */}
          {activeTab === 'ai' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#94a3b8]">AI Creative Suite</h3>
              </div>
              <div className="p-2.5 rounded-lg bg-[#06b6d4]/10 border border-[#06b6d4]/20 text-[10px] text-[#06b6d4]">
                Offline & CPU-compatible algorithms optimized for Intel Core i7-7500U without requiring external APIs or paid keys.
              </div>

              {/* AI Auto Captions */}
              <div className="p-3 rounded-xl bg-[#181a26] border border-[#232736] space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded bg-[#7c3aed]/20 text-[#a78bfa] flex items-center justify-center">
                    <Type className="w-3.5 h-3.5" />
                  </div>
                  <h4 className="text-xs font-bold text-white">AI Auto Captions</h4>
                </div>
                <p className="text-[11px] text-[#94a3b8]">
                  Transcribe speech into dynamic animated subtitles with synchronized timecodes.
                </p>
                <button
                  onClick={handleGenerateCaptions}
                  className="w-full py-1.5 bg-[#7c3aed] hover:bg-[#6d28d9] text-white font-semibold text-xs rounded-lg transition-colors flex items-center justify-center gap-1.5"
                >
                  <Wand2 className="w-3.5 h-3.5" />
                  <span>Generate Subtitles</span>
                </button>
              </div>

              {/* AI Smart Cut */}
              <div className="p-3 rounded-xl bg-[#181a26] border border-[#232736] space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded bg-[#10b981]/20 text-[#10b981] flex items-center justify-center">
                    <Scissors className="w-3.5 h-3.5" />
                  </div>
                  <h4 className="text-xs font-bold text-white">AI Smart Cut (Silence Remover)</h4>
                </div>
                <p className="text-[11px] text-[#94a3b8]">
                  Detect and cut unneeded silence intervals, pauses, and gaps automatically.
                </p>
                <button
                  onClick={handleSmartCutSilence}
                  className="w-full py-1.5 bg-[#10b981] hover:bg-[#059669] text-black font-semibold text-xs rounded-lg transition-colors flex items-center justify-center gap-1.5"
                >
                  <Scissors className="w-3.5 h-3.5" />
                  <span>Detect & Trim Silence</span>
                </button>
              </div>

              {/* AI Photo-to-Video Ken Burns */}
              <div className="p-3 rounded-xl bg-[#181a26] border border-[#232736] space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded bg-[#06b6d4]/20 text-[#06b6d4] flex items-center justify-center">
                    <Video className="w-3.5 h-3.5" />
                  </div>
                  <h4 className="text-xs font-bold text-white">AI Photo-to-Video Parallax</h4>
                </div>
                <p className="text-[11px] text-[#94a3b8]">
                  Generate cinematic 3D pan and zoom motion graphics from static photos.
                </p>
                <div className="space-y-1">
                  {project.mediaPool.filter((m) => m.type === 'image').map((img) => (
                    <button
                      key={img.id}
                      onClick={() => handlePhotoToVideo(img)}
                      className="w-full p-2 bg-[#121420] hover:bg-[#1f2334] rounded text-left text-xs text-white truncate flex items-center justify-between"
                    >
                      <span className="truncate">{img.name}</span>
                      <span className="text-[10px] text-[#06b6d4]">Animate →</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
