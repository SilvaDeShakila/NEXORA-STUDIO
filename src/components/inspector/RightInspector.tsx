import React, { useState } from 'react';
import {
  Sliders,
  Move,
  RotateCw,
  Sun,
  Activity,
  Layers,
  Zap,
  Trash2,
  Plus,
  RefreshCw,
  Gauge,
  Key,
  Volume2,
  Eye,
  Type
} from 'lucide-react';
import { useStudioStore } from '../../store/studioStore';
import { BlendMode, EasingFunction } from '../../types/studio';

export const RightInspector: React.FC = () => {
  const {
    project,
    selectedClipId,
    updateClip,
    deleteClip,
    currentTime,
    addKeyframe,
    removeKeyframe,
  } = useStudioStore();

  const [activeTab, setActiveTab] = useState<'transform' | 'color' | 'effects' | 'keyframes' | 'text'>('transform');

  const clip = project.clips.find((c) => c.id === selectedClipId);

  if (!clip) {
    return (
      <div className="w-80 bg-[#12141c] border-l border-[#232736] p-6 flex flex-col items-center justify-center text-center text-[#64748b] select-none">
        <Sliders className="w-10 h-10 mb-3 text-[#2d3246]" />
        <h4 className="text-sm font-bold text-[#cbd5e1]">No Clip Selected</h4>
        <p className="text-xs text-[#64748b] mt-1 max-w-[200px]">
          Click on any video, audio, or text clip on the timeline to inspect and edit its properties.
        </p>
      </div>
    );
  }

  const clipTime = (currentTime - clip.start) * clip.speed;

  return (
    <div className="w-80 bg-[#12141c] border-l border-[#232736] flex flex-col h-full select-none overflow-hidden">
      {/* Clip Header Title */}
      <div className="h-12 px-4 bg-[#10121a] border-b border-[#232736] flex items-center justify-between">
        <div className="flex items-center gap-2 min-w-0">
          <span
            className="w-2.5 h-2.5 rounded-full shrink-0"
            style={{ backgroundColor: clip.color || '#7c3aed' }}
          />
          <h3 className="text-xs font-bold text-white truncate">{clip.name}</h3>
        </div>

        <button
          onClick={() => deleteClip(clip.id)}
          title="Delete Clip"
          className="p-1.5 text-[#64748b] hover:text-[#ef4444] rounded hover:bg-[#1a1d2a] transition-colors"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* Mini Inspector Tabs */}
      <div className="flex border-b border-[#232736] bg-[#0e1017]">
        <button
          onClick={() => setActiveTab('transform')}
          className={`flex-1 py-2 text-[10px] font-bold uppercase transition-colors ${
            activeTab === 'transform' ? 'text-[#a78bfa] border-b-2 border-[#7c3aed]' : 'text-[#64748b] hover:text-white'
          }`}
        >
          Transform
        </button>
        <button
          onClick={() => setActiveTab('color')}
          className={`flex-1 py-2 text-[10px] font-bold uppercase transition-colors ${
            activeTab === 'color' ? 'text-[#a78bfa] border-b-2 border-[#7c3aed]' : 'text-[#64748b] hover:text-white'
          }`}
        >
          Color
        </button>
        <button
          onClick={() => setActiveTab('effects')}
          className={`flex-1 py-2 text-[10px] font-bold uppercase transition-colors ${
            activeTab === 'effects' ? 'text-[#a78bfa] border-b-2 border-[#7c3aed]' : 'text-[#64748b] hover:text-white'
          }`}
        >
          Effects
        </button>
        <button
          onClick={() => setActiveTab('keyframes')}
          className={`flex-1 py-2 text-[10px] font-bold uppercase transition-colors ${
            activeTab === 'keyframes' ? 'text-[#a78bfa] border-b-2 border-[#7c3aed]' : 'text-[#64748b] hover:text-white'
          }`}
        >
          Keyframes
        </button>
        {clip.type === 'text' && (
          <button
            onClick={() => setActiveTab('text')}
            className={`flex-1 py-2 text-[10px] font-bold uppercase transition-colors ${
              activeTab === 'text' ? 'text-[#a78bfa] border-b-2 border-[#7c3aed]' : 'text-[#64748b] hover:text-white'
            }`}
          >
            Text
          </button>
        )}
      </div>

      {/* Tab Panels */}
      <div className="flex-1 overflow-y-auto p-4 space-y-5 custom-scrollbar">
        {/* TAB 1: TRANSFORM & SPEED */}
        {activeTab === 'transform' && (
          <div className="space-y-4">
            {/* Position Controls */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-[#cbd5e1]">Position</span>
                <span className="text-[10px] font-mono text-[#64748b]">
                  X: {Math.round(clip.transform.x)}% | Y: {Math.round(clip.transform.y)}%
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[9px] text-[#64748b] uppercase">X Offset</label>
                  <input
                    type="range"
                    min="-100"
                    max="100"
                    value={clip.transform.x}
                    onChange={(e) =>
                      updateClip(clip.id, {
                        transform: { ...clip.transform, x: parseFloat(e.target.value) },
                      })
                    }
                    className="w-full h-1 bg-[#232736] rounded accent-[#7c3aed]"
                  />
                </div>
                <div>
                  <label className="text-[9px] text-[#64748b] uppercase">Y Offset</label>
                  <input
                    type="range"
                    min="-100"
                    max="100"
                    value={clip.transform.y}
                    onChange={(e) =>
                      updateClip(clip.id, {
                        transform: { ...clip.transform, y: parseFloat(e.target.value) },
                      })
                    }
                    className="w-full h-1 bg-[#232736] rounded accent-[#7c3aed]"
                  />
                </div>
              </div>
            </div>

            {/* Scale */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-[#cbd5e1]">Scale</span>
                <span className="text-[10px] font-mono text-[#06b6d4]">
                  {(clip.transform.scale * 100).toFixed(0)}%
                </span>
              </div>
              <input
                type="range"
                min="0.1"
                max="3.0"
                step="0.05"
                value={clip.transform.scale}
                onChange={(e) =>
                  updateClip(clip.id, {
                    transform: { ...clip.transform, scale: parseFloat(e.target.value) },
                  })
                }
                className="w-full h-1 bg-[#232736] rounded accent-[#06b6d4]"
              />
            </div>

            {/* Rotation */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-[#cbd5e1]">Rotation</span>
                <span className="text-[10px] font-mono text-[#a78bfa]">
                  {Math.round(clip.transform.rotation)}°
                </span>
              </div>
              <input
                type="range"
                min="-180"
                max="180"
                value={clip.transform.rotation}
                onChange={(e) =>
                  updateClip(clip.id, {
                    transform: { ...clip.transform, rotation: parseFloat(e.target.value) },
                  })
                }
                className="w-full h-1 bg-[#232736] rounded accent-[#a78bfa]"
              />
            </div>

            {/* Opacity */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-[#cbd5e1]">Opacity</span>
                <span className="text-[10px] font-mono text-white">
                  {Math.round(clip.opacity * 100)}%
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={clip.opacity}
                onChange={(e) => updateClip(clip.id, { opacity: parseFloat(e.target.value) })}
                className="w-full h-1 bg-[#232736] rounded accent-[#7c3aed]"
              />
            </div>

            {/* Blend Mode */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#cbd5e1]">Blend Mode</label>
              <select
                value={clip.blendMode}
                onChange={(e) => updateClip(clip.id, { blendMode: e.target.value as BlendMode })}
                className="w-full bg-[#181a26] text-white text-xs px-2.5 py-1.5 rounded-lg border border-[#2b3044] focus:outline-none focus:border-[#7c3aed]"
              >
                <option value="normal">Normal</option>
                <option value="screen">Screen (Lighten)</option>
                <option value="multiply">Multiply (Darken)</option>
                <option value="overlay">Overlay (Contrast)</option>
                <option value="color-dodge">Color Dodge (Glow)</option>
              </select>
            </div>

            {/* Playback Speed Multiplier */}
            <div className="space-y-2 pt-2 border-t border-[#232736]">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-[#cbd5e1]">Playback Speed</span>
                <span className="text-[10px] font-mono text-[#06b6d4]">{clip.speed}x</span>
              </div>
              <div className="grid grid-cols-4 gap-1.5">
                {[0.5, 1.0, 1.5, 2.0].map((spd) => (
                  <button
                    key={spd}
                    onClick={() => updateClip(clip.id, { speed: spd })}
                    className={`py-1 text-xs font-semibold rounded ${
                      clip.speed === spd
                        ? 'bg-[#7c3aed] text-white'
                        : 'bg-[#181a26] text-[#94a3b8] hover:text-white'
                    }`}
                  >
                    {spd}x
                  </button>
                ))}
              </div>
            </div>

            {/* Reverse Video Toggle */}
            <div className="flex items-center justify-between pt-2 text-xs">
              <span className="font-semibold text-[#cbd5e1]">Reverse Playback</span>
              <button
                onClick={() => updateClip(clip.id, { reverse: !clip.reverse })}
                className={`px-3 py-1 rounded text-xs font-semibold transition-colors ${
                  clip.reverse
                    ? 'bg-[#10b981] text-black font-bold'
                    : 'bg-[#181a26] text-[#94a3b8] hover:text-white'
                }`}
              >
                {clip.reverse ? 'Reversed' : 'Forward'}
              </button>
            </div>
          </div>
        )}

        {/* TAB 2: COLOR GRADING & CHROMA KEY */}
        {activeTab === 'color' && (
          <div className="space-y-4">
            {/* Color Sliders */}
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-[#94a3b8]">Brightness</span>
                  <span className="font-mono text-white">{clip.colorGrading.brightness}</span>
                </div>
                <input
                  type="range"
                  min="-100"
                  max="100"
                  value={clip.colorGrading.brightness}
                  onChange={(e) =>
                    updateClip(clip.id, {
                      colorGrading: { ...clip.colorGrading, brightness: parseInt(e.target.value) },
                    })
                  }
                  className="w-full h-1 bg-[#232736] rounded accent-[#7c3aed]"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-[#94a3b8]">Contrast</span>
                  <span className="font-mono text-white">{clip.colorGrading.contrast}</span>
                </div>
                <input
                  type="range"
                  min="-100"
                  max="100"
                  value={clip.colorGrading.contrast}
                  onChange={(e) =>
                    updateClip(clip.id, {
                      colorGrading: { ...clip.colorGrading, contrast: parseInt(e.target.value) },
                    })
                  }
                  className="w-full h-1 bg-[#232736] rounded accent-[#7c3aed]"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-[#94a3b8]">Saturation</span>
                  <span className="font-mono text-white">{clip.colorGrading.saturation}</span>
                </div>
                <input
                  type="range"
                  min="-100"
                  max="100"
                  value={clip.colorGrading.saturation}
                  onChange={(e) =>
                    updateClip(clip.id, {
                      colorGrading: { ...clip.colorGrading, saturation: parseInt(e.target.value) },
                    })
                  }
                  className="w-full h-1 bg-[#232736] rounded accent-[#7c3aed]"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-[#94a3b8]">Temperature</span>
                  <span className="font-mono text-white">{clip.colorGrading.temperature}</span>
                </div>
                <input
                  type="range"
                  min="-100"
                  max="100"
                  value={clip.colorGrading.temperature}
                  onChange={(e) =>
                    updateClip(clip.id, {
                      colorGrading: { ...clip.colorGrading, temperature: parseInt(e.target.value) },
                    })
                  }
                  className="w-full h-1 bg-[#232736] rounded accent-[#f59e0b]"
                />
              </div>
            </div>

            {/* Chroma Key / Green Screen Section */}
            <div className="p-3 bg-[#181a26] border border-[#232736] rounded-xl space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white">Chroma Key (Green Screen)</span>
                <input
                  type="checkbox"
                  checked={clip.chromaKey?.enabled || false}
                  onChange={(e) =>
                    updateClip(clip.id, {
                      chromaKey: {
                        ...(clip.chromaKey || { color: '#00FF00', tolerance: 30, smoothness: 10 }),
                        enabled: e.target.checked,
                      },
                    })
                  }
                  className="accent-[#10b981] w-4 h-4 cursor-pointer"
                />
              </div>

              {clip.chromaKey?.enabled && (
                <div className="space-y-2 pt-1 border-t border-[#232736]">
                  <div>
                    <label className="text-[10px] text-[#64748b] block mb-1">Key Color</label>
                    <input
                      type="color"
                      value={clip.chromaKey.color}
                      onChange={(e) =>
                        updateClip(clip.id, {
                          chromaKey: { ...clip.chromaKey, color: e.target.value },
                        })
                      }
                      className="w-full h-7 bg-transparent rounded cursor-pointer"
                    />
                  </div>
                  <div>
                    <div className="flex justify-between text-[10px] text-[#64748b]">
                      <span>Tolerance</span>
                      <span>{clip.chromaKey.tolerance}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={clip.chromaKey.tolerance}
                      onChange={(e) =>
                        updateClip(clip.id, {
                          chromaKey: { ...clip.chromaKey, tolerance: parseInt(e.target.value) },
                        })
                      }
                      className="w-full h-1 bg-[#232736] rounded accent-[#10b981]"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 3: EFFECTS PARAMETERS */}
        {activeTab === 'effects' && (
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#94a3b8]">Active Clip Effects</h4>

            {clip.effects.length === 0 ? (
              <p className="text-xs text-[#64748b]">No effects added yet. Add effects from the left sidebar!</p>
            ) : (
              clip.effects.map((eff, index) => (
                <div
                  key={eff.id}
                  className="p-3 bg-[#181a26] border border-[#232736] rounded-xl space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white uppercase">{eff.type}</span>
                    <button
                      onClick={() => {
                        const newEffects = clip.effects.filter((_, i) => i !== index);
                        updateClip(clip.id, { effects: newEffects });
                      }}
                      className="text-[#64748b] hover:text-[#ef4444]"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div>
                    <div className="flex justify-between text-[10px] text-[#64748b] mb-1">
                      <span>Intensity</span>
                      <span>{Math.round(eff.intensity * 100)}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={eff.intensity}
                      onChange={(e) => {
                        const newEffects = [...clip.effects];
                        newEffects[index] = { ...eff, intensity: parseFloat(e.target.value) };
                        updateClip(clip.id, { effects: newEffects });
                      }}
                      className="w-full h-1 bg-[#232736] rounded accent-[#06b6d4]"
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* TAB 4: VISUAL KEYFRAME EDITOR */}
        {activeTab === 'keyframes' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-[#cbd5e1]">Keyframe Timeline</h4>
              <span className="text-[10px] text-[#64748b]">Clip Time: {clipTime.toFixed(2)}s</span>
            </div>

            {/* Add Keyframe Button */}
            <div className="p-3 bg-[#181a26] border border-[#232736] rounded-xl space-y-2">
              <span className="text-xs font-semibold text-white block">Add Node at Playhead</span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() =>
                    addKeyframe(clip.id, {
                      time: clipTime,
                      property: 'scale',
                      value: clip.transform.scale,
                      easing: 'ease-in-out',
                    })
                  }
                  className="px-2 py-1.5 bg-[#7c3aed] hover:bg-[#6d28d9] text-white text-[11px] rounded font-semibold flex items-center justify-center gap-1"
                >
                  <Plus className="w-3 h-3" />
                  <span>Key Scale</span>
                </button>
                <button
                  onClick={() =>
                    addKeyframe(clip.id, {
                      time: clipTime,
                      property: 'opacity',
                      value: clip.opacity,
                      easing: 'ease-in-out',
                    })
                  }
                  className="px-2 py-1.5 bg-[#06b6d4] hover:bg-[#0891b2] text-black text-[11px] rounded font-semibold flex items-center justify-center gap-1"
                >
                  <Plus className="w-3 h-3" />
                  <span>Key Opacity</span>
                </button>
              </div>
            </div>

            {/* Keyframe List */}
            <div className="space-y-1.5">
              {clip.keyframes.map((kf) => (
                <div
                  key={kf.id}
                  className="p-2 bg-[#141620] border border-[#232736] rounded-lg flex items-center justify-between text-xs"
                >
                  <div>
                    <span className="text-[9px] text-[#a78bfa] font-bold block">
                      @{kf.time.toFixed(2)}s • {kf.property.toUpperCase()}
                    </span>
                    <span className="text-white text-xs">
                      Value: {kf.value.toFixed(2)} ({kf.easing})
                    </span>
                  </div>
                  <button
                    onClick={() => removeKeyframe(clip.id, kf.id)}
                    className="text-[#64748b] hover:text-[#ef4444]"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 5: TEXT TYPOGRAPHY INSPECTOR */}
        {activeTab === 'text' && clip.textProps && (
          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-[#cbd5e1] block mb-1">Text Content</label>
              <textarea
                value={clip.textProps.text}
                onChange={(e) =>
                  updateClip(clip.id, {
                    textProps: { ...clip.textProps!, text: e.target.value },
                  })
                }
                rows={3}
                className="w-full bg-[#181a26] text-white text-xs p-2.5 rounded-lg border border-[#2b3044] focus:outline-none focus:border-[#7c3aed]"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-[#94a3b8]">Font Size</span>
                <span className="font-mono text-white">{clip.textProps.fontSize}px</span>
              </div>
              <input
                type="range"
                min="16"
                max="120"
                value={clip.textProps.fontSize}
                onChange={(e) =>
                  updateClip(clip.id, {
                    textProps: { ...clip.textProps!, fontSize: parseInt(e.target.value) },
                  })
                }
                className="w-full h-1 bg-[#232736] rounded accent-[#7c3aed]"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-[#cbd5e1] block mb-1">Kinetic Animation</label>
              <select
                value={clip.textProps.animationStyle}
                onChange={(e) =>
                  updateClip(clip.id, {
                    textProps: { ...clip.textProps!, animationStyle: e.target.value as any },
                  })
                }
                className="w-full bg-[#181a26] text-white text-xs px-2.5 py-1.5 rounded-lg border border-[#2b3044]"
              >
                <option value="none">None (Static)</option>
                <option value="bounce">Bouncy Pop</option>
                <option value="typewriter">Typewriter</option>
                <option value="neon-glow">Cyberpunk Neon Glow</option>
                <option value="slide-up">Slide Up</option>
                <option value="fade">Gentle Fade</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-[#cbd5e1] block mb-1">Text Color</label>
              <input
                type="color"
                value={clip.textProps.color}
                onChange={(e) =>
                  updateClip(clip.id, {
                    textProps: { ...clip.textProps!, color: e.target.value },
                  })
                }
                className="w-full h-8 bg-transparent rounded cursor-pointer"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
