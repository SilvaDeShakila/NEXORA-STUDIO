import React, { useState } from 'react';
import { LayoutTemplate, Sparkles, Check, ArrowRight, Play, Eye } from 'lucide-react';
import { useStudioStore } from '../../store/studioStore';
import { TEMPLATES } from '../../data/templates';

export const TemplatesWorkspace: React.FC = () => {
  const { applyTemplate, setActiveMode } = useStudioStore();
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  const categories = ['All', 'TikTok', 'Reels', 'YouTube', 'Gaming'];

  const filtered = selectedCategory === 'All'
    ? TEMPLATES
    : TEMPLATES.filter((t) => t.category === selectedCategory);

  const handleApply = (templateId: string) => {
    applyTemplate(templateId);
    setActiveMode('video');
  };

  return (
    <div className="flex-1 bg-[#0c0d12] p-8 overflow-y-auto select-none custom-scrollbar">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Banner */}
        <div className="p-6 rounded-2xl bg-gradient-to-r from-[#181a28] via-[#1a142e] to-[#0f1d2a] border border-[#2e344b] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#7c3aed]/20 text-[#a78bfa] border border-[#7c3aed]/30 uppercase">
                Creator Library
              </span>
              <span className="text-[10px] text-[#10b981] font-semibold">100% Free & Open-License</span>
            </div>
            <h2 className="text-xl font-black text-white">Professional Video Templates</h2>
            <p className="text-xs text-[#94a3b8] max-w-xl">
              Jumpstart your content with multi-track timelines featuring speed ramps, motion graphics, beat markers, and cinematic LUT color grading.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  selectedCategory === cat
                    ? 'bg-[#7c3aed] text-white shadow-md shadow-purple-500/20'
                    : 'bg-[#181a26] text-[#94a3b8] hover:text-white border border-[#232736]'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Templates Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((tpl) => (
            <div
              key={tpl.id}
              className="bg-[#12141c] border border-[#232736] hover:border-[#7c3aed] rounded-2xl overflow-hidden shadow-xl transition-all group flex flex-col"
            >
              <div className="h-48 relative overflow-hidden bg-black">
                <img
                  src={tpl.thumbnailUrl}
                  alt={tpl.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute top-3 left-3 px-2 py-0.5 rounded-md bg-black/80 backdrop-blur-sm text-white text-[11px] font-bold">
                  {tpl.aspectRatio}
                </div>
                <div className="absolute bottom-3 right-3 px-2 py-0.5 rounded-md bg-black/80 backdrop-blur-sm text-white text-[11px] font-mono">
                  {tpl.duration}s
                </div>
              </div>

              <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase text-[#a78bfa]">{tpl.category}</span>
                    <span className="text-[10px] text-[#64748b]">{tpl.tags.join(' • ')}</span>
                  </div>
                  <h3 className="text-sm font-bold text-white group-hover:text-[#a78bfa] transition-colors">
                    {tpl.title}
                  </h3>
                  <p className="text-xs text-[#94a3b8] line-clamp-2">
                    {tpl.description}
                  </p>
                </div>

                <button
                  onClick={() => handleApply(tpl.id)}
                  className="w-full py-2.5 bg-gradient-to-r from-[#7c3aed] to-[#06b6d4] hover:from-[#6d28d9] hover:to-[#0891b2] text-white text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-purple-500/10"
                >
                  <Check className="w-4 h-4" />
                  <span>Open in Video Studio</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
