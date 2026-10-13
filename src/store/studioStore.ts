import { create } from 'zustand';
import { 
  Project, 
  TimelineClip, 
  TimelineTrack, 
  MediaItem, 
  AspectRatio, 
  PreviewResolution, 
  StudioTab, 
  StudioMode, 
  Keyframe, 
  SubtitleCue,
  PhotoAdjustments,
  PhotoCrop,
  PhotoLayer
} from '../types/studio';
import { SAMPLE_MEDIA } from '../data/sampleMedia';
import { TEMPLATES } from '../data/templates';

interface StudioState {
  // Current Active Project
  project: Project;
  
  // Playback & Transport
  currentTime: number;
  isPlaying: boolean;
  volume: number;
  isMuted: boolean;
  
  // Timeline View
  zoomLevel: number; // Pixels per second (e.g. 50px/sec)
  snapToGrid: boolean;
  activeTool: 'select' | 'split' | 'trim';
  selectedClipId: string | null;
  selectedTrackId: string | null;
  selectedKeyframeId: string | null;
  
  // Navigation & Workspace
  activeTab: StudioTab;
  activeMode: StudioMode;
  previewResolution: PreviewResolution;
  lowPerformanceMode: boolean;
  showSafeGuides: boolean;
  isFullscreenPreview: boolean;
  
  // History Stacks (Undo/Redo)
  undoStack: Project[];
  redoStack: Project[];
  
  // Audio Beat Engine
  isDetectingBeats: boolean;
  
  // Photo Editor Workspace State
  photoImageSrc: string;
  photoAdjustments: PhotoAdjustments;
  photoCrop: PhotoCrop;
  photoLayers: PhotoLayer[];
  selectedPhotoLayerId: string | null;
  
  // Export State
  isExportModalOpen: boolean;
  isExporting: boolean;
  exportProgress: number;
  exportStage: string;
  exportedBlobUrl: string | null;

  // Desktop Bridge Modal State
  isDesktopModalOpen: boolean;

  // Actions
  setCurrentTime: (time: number) => void;
  setIsPlaying: (playing: boolean) => void;
  togglePlayPause: () => void;
  stepFrame: (direction: 'forward' | 'backward', fps?: number) => void;
  setVolume: (volume: number) => void;
  toggleMute: () => void;
  setZoomLevel: (zoom: number) => void;
  setSnapToGrid: (snap: boolean) => void;
  setActiveTool: (tool: 'select' | 'split' | 'trim') => void;
  setSelectedClipId: (id: string | null) => void;
  setSelectedTrackId: (id: string | null) => void;
  setActiveTab: (tab: StudioTab) => void;
  setActiveMode: (mode: StudioMode) => void;
  setPreviewResolution: (res: PreviewResolution) => void;
  setLowPerformanceMode: (enabled: boolean) => void;
  setShowSafeGuides: (show: boolean) => void;
  setIsFullscreenPreview: (fullscreen: boolean) => void;
  setIsExportModalOpen: (open: boolean) => void;
  setIsDesktopModalOpen: (open: boolean) => void;

  // Project Mutations
  setProjectName: (name: string) => void;
  setAspectRatio: (aspect: AspectRatio) => void;
  newProject: () => void;
  loadProject: (project: Project) => void;
  saveProjectLocally: () => void;
  applyTemplate: (templateId: string) => void;
  
  // History Actions
  pushHistory: () => void;
  undo: () => void;
  redo: () => void;

  // Timeline Mutations
  addMediaItem: (item: MediaItem) => void;
  removeMediaItem: (mediaId: string) => void;
  addClipToTimeline: (clip: Partial<TimelineClip>, targetTime?: number, targetTrackId?: string) => void;
  updateClip: (clipId: string, updates: Partial<TimelineClip>) => void;
  splitClipAtPlayhead: (clipId?: string) => void;
  trimClip: (clipId: string, newStart: number, newDuration: number, newMediaOffset?: number) => void;
  moveClip: (clipId: string, newStart: number, newTrackId?: string) => void;
  duplicateClip: (clipId: string) => void;
  deleteClip: (clipId: string) => void;
  
  // Track Mutations
  addTrack: (type: 'video' | 'audio' | 'text' | 'overlay') => void;
  removeTrack: (trackId: string) => void;
  toggleTrackLock: (trackId: string) => void;
  toggleTrackMute: (trackId: string) => void;
  toggleTrackVisibility: (trackId: string) => void;
  
  // Keyframes
  addKeyframe: (clipId: string, keyframe: Omit<Keyframe, 'id'>) => void;
  updateKeyframe: (clipId: string, keyframeId: string, updates: Partial<Keyframe>) => void;
  removeKeyframe: (clipId: string, keyframeId: string) => void;

  // Beat Sync
  setBeatMarkers: (markers: number[]) => void;
  autoCutToBeats: () => void;
  slideshowToBeats: () => void;

  // Captions
  addSubtitleCue: (cue: Omit<SubtitleCue, 'id'>) => void;
  updateSubtitleCue: (id: string, updates: Partial<SubtitleCue>) => void;
  removeSubtitleCue: (id: string) => void;

  // Photo Editor Actions
  setPhotoImageSrc: (src: string) => void;
  setPhotoAdjustments: (adjustments: Partial<PhotoAdjustments>) => void;
  resetPhotoAdjustments: () => void;
  setPhotoCrop: (crop: Partial<PhotoCrop>) => void;
  addPhotoLayer: (layer: Partial<PhotoLayer>) => void;
  updatePhotoLayer: (layerId: string, updates: Partial<PhotoLayer>) => void;
  removePhotoLayer: (layerId: string) => void;

  // Export Progress Actions
  setExportProgress: (progress: number, stage: string) => void;
  setExportedBlobUrl: (url: string | null) => void;
  cancelExport: () => void;
}

const DEFAULT_PROJECT: Project = {
  id: 'nexora-project-default',
  name: 'Cyberpunk Neon Drift 4K',
  version: '2.0.0',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  aspectRatio: '16:9',
  width: 1920,
  height: 1080,
  fps: 30,
  duration: 15.0,
  tracks: [
    { id: 'track-text-1', name: 'Text & Titles', type: 'text', locked: false, muted: false, visible: true, color: '#ec4899' },
    { id: 'track-overlay-1', name: 'Video 2 (Overlays)', type: 'overlay', locked: false, muted: false, visible: true, color: '#38bdf8' },
    { id: 'track-video-1', name: 'Video 1 (Base)', type: 'video', locked: false, muted: false, visible: true, color: '#8b5cf6' },
    { id: 'track-audio-1', name: 'Audio 1 (Music)', type: 'audio', locked: false, muted: false, visible: true, color: '#10b981' },
    { id: 'track-audio-2', name: 'Audio 2 (SFX & Voice)', type: 'audio', locked: false, muted: false, visible: true, color: '#f59e0b' },
  ],
  clips: [
    {
      id: 'clip-base-1',
      trackId: 'track-video-1',
      mediaId: 'sample-video-1',
      name: 'Cyberpunk Neon City 4K.mp4',
      type: 'video',
      start: 0,
      duration: 7.5,
      mediaOffset: 0,
      speed: 1.0,
      volume: 1.0,
      muted: false,
      opacity: 1.0,
      blendMode: 'normal',
      transform: { x: 0, y: 0, scale: 1.0, rotation: 0, crop: { top: 0, bottom: 0, left: 0, right: 0 } },
      colorGrading: { brightness: 5, contrast: 15, saturation: 20, temperature: -10, tint: 5, exposure: 5, highlights: 5, shadows: -5, lut: 'cyberpunk' },
      chromaKey: { enabled: false, color: '#00FF00', tolerance: 30, smoothness: 10 },
      reverse: false,
      keyframes: [],
      effects: [{ id: 'eff-glow', type: 'glow', intensity: 0.5, params: {} }],
      color: '#8b5cf6',
    },
    {
      id: 'clip-base-2',
      trackId: 'track-video-1',
      mediaId: 'sample-video-2',
      name: 'Aesthetic Coastal Waves.mp4',
      type: 'video',
      start: 7.5,
      duration: 7.5,
      mediaOffset: 0,
      speed: 1.0,
      volume: 1.0,
      muted: false,
      opacity: 1.0,
      blendMode: 'normal',
      transform: { x: 0, y: 0, scale: 1.0, rotation: 0, crop: { top: 0, bottom: 0, left: 0, right: 0 } },
      colorGrading: { brightness: 5, contrast: 10, saturation: 15, temperature: 5, tint: 0, exposure: 0, highlights: 0, shadows: 0, lut: 'teal-orange' },
      chromaKey: { enabled: false, color: '#00FF00', tolerance: 30, smoothness: 10 },
      reverse: false,
      transitionIn: { type: 'dissolve', duration: 0.6 },
      keyframes: [],
      effects: [{ id: 'eff-vignette', type: 'vignette', intensity: 0.4, params: {} }],
      color: '#8b5cf6',
    },
    {
      id: 'clip-text-hero',
      trackId: 'track-text-1',
      name: 'NEXORA STUDIO 4K',
      type: 'text',
      start: 1.0,
      duration: 5.5,
      mediaOffset: 0,
      speed: 1.0,
      volume: 1.0,
      muted: false,
      opacity: 1.0,
      blendMode: 'normal',
      transform: { x: 0, y: -20, scale: 1.0, rotation: 0, crop: { top: 0, bottom: 0, left: 0, right: 0 } },
      colorGrading: { brightness: 0, contrast: 0, saturation: 0, temperature: 0, tint: 0, exposure: 0, highlights: 0, shadows: 0 },
      chromaKey: { enabled: false, color: '#00FF00', tolerance: 0, smoothness: 0 },
      reverse: false,
      keyframes: [],
      effects: [],
      textProps: {
        text: 'NEXORA STUDIO',
        fontSize: 52,
        fontFamily: 'Plus Jakarta Sans',
        color: '#ffffff',
        bold: true,
        italic: false,
        align: 'center',
        animationStyle: 'bounce',
        strokeColor: '#7c3aed',
        strokeWidth: 2,
      },
      color: '#ec4899',
    },
    {
      id: 'clip-audio-main',
      trackId: 'track-audio-1',
      mediaId: 'sample-audio-1',
      name: 'Synthwave Midnight Drift (128 BPM).mp3',
      type: 'audio',
      start: 0,
      duration: 15.0,
      mediaOffset: 0,
      speed: 1.0,
      volume: 0.9,
      muted: false,
      opacity: 1.0,
      blendMode: 'normal',
      transform: { x: 0, y: 0, scale: 1.0, rotation: 0, crop: { top: 0, bottom: 0, left: 0, right: 0 } },
      colorGrading: { brightness: 0, contrast: 0, saturation: 0, temperature: 0, tint: 0, exposure: 0, highlights: 0, shadows: 0 },
      chromaKey: { enabled: false, color: '#00FF00', tolerance: 0, smoothness: 0 },
      reverse: false,
      keyframes: [],
      effects: [],
      color: '#10b981',
    }
  ],
  mediaPool: SAMPLE_MEDIA,
  beatMarkers: [1.875, 3.75, 5.625, 7.5, 9.375, 11.25, 13.125],
  subtitleCues: [
    { id: 'sub-1', start: 1.0, end: 4.0, text: 'Welcome to Nexora Studio' },
    { id: 'sub-2', start: 4.5, end: 7.5, text: 'Professional Multi-Track 4K Editing' },
    { id: 'sub-3', start: 8.0, end: 12.0, text: 'Real-time Preview with Intel Hardware Acceleration' },
  ]
};

const DEFAULT_PHOTO_ADJUSTMENTS: PhotoAdjustments = {
  brightness: 0,
  contrast: 0,
  saturation: 0,
  exposure: 0,
  highlights: 0,
  shadows: 0,
  temperature: 0,
  tint: 0,
  sharpen: 0,
  blur: 0,
  vignette: 0,
};

const DEFAULT_PHOTO_CROP: PhotoCrop = {
  x: 0,
  y: 0,
  width: 100,
  height: 100,
  aspect: 'free',
};

export const useStudioStore = create<StudioState>((set, get) => ({
  project: DEFAULT_PROJECT,
  currentTime: 0,
  isPlaying: false,
  volume: 1.0,
  isMuted: false,
  zoomLevel: 45, // 45px per second
  snapToGrid: true,
  activeTool: 'select',
  selectedClipId: 'clip-base-1',
  selectedTrackId: 'track-video-1',
  selectedKeyframeId: null,
  activeTab: 'media',
  activeMode: 'video',
  previewResolution: '720p',
  lowPerformanceMode: false,
  showSafeGuides: false,
  isFullscreenPreview: false,
  undoStack: [],
  redoStack: [],
  isDetectingBeats: false,

  photoImageSrc: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=1920&q=80',
  photoAdjustments: DEFAULT_PHOTO_ADJUSTMENTS,
  photoCrop: DEFAULT_PHOTO_CROP,
  photoLayers: [],
  selectedPhotoLayerId: null,

  isExportModalOpen: false,
  isExporting: false,
  exportProgress: 0,
  exportStage: 'Idle',
  exportedBlobUrl: null,

  isDesktopModalOpen: false,

  // Actions
  setCurrentTime: (time: number) => {
    const totalDuration = get().project.duration;
    const clamped = Math.max(0, Math.min(time, totalDuration));
    set({ currentTime: clamped });
  },

  setIsPlaying: (playing: boolean) => set({ isPlaying: playing }),

  togglePlayPause: () => {
    const isPlaying = get().isPlaying;
    const currentTime = get().currentTime;
    const totalDuration = get().project.duration;

    if (!isPlaying && currentTime >= totalDuration) {
      set({ currentTime: 0, isPlaying: true });
    } else {
      set({ isPlaying: !isPlaying });
    }
  },

  stepFrame: (direction: 'forward' | 'backward', fps = 30) => {
    const delta = 1 / fps;
    const current = get().currentTime;
    const target = direction === 'forward' ? current + delta : current - delta;
    get().setCurrentTime(target);
  },

  setVolume: (volume: number) => set({ volume: Math.max(0, Math.min(volume, 1)), isMuted: false }),
  toggleMute: () => set((state) => ({ isMuted: !state.isMuted })),
  setZoomLevel: (zoom: number) => set({ zoomLevel: Math.max(15, Math.min(zoom, 180)) }),
  setSnapToGrid: (snap: boolean) => set({ snapToGrid: snap }),
  setActiveTool: (tool) => set({ activeTool: tool }),
  setSelectedClipId: (id) => set({ selectedClipId: id }),
  setSelectedTrackId: (id) => set({ selectedTrackId: id }),
  setActiveTab: (tab) => set({ activeTab: tab }),
  setActiveMode: (mode) => set({ activeMode: mode }),
  setPreviewResolution: (res) => set({ previewResolution: res }),
  setLowPerformanceMode: (enabled) => set({ lowPerformanceMode: enabled }),
  setShowSafeGuides: (show) => set({ showSafeGuides: show }),
  setIsFullscreenPreview: (fullscreen) => set({ isFullscreenPreview: fullscreen }),
  setIsExportModalOpen: (open) => set({ isExportModalOpen: open }),
  setIsDesktopModalOpen: (open) => set({ isDesktopModalOpen: open }),

  pushHistory: () => {
    const currentProject = JSON.parse(JSON.stringify(get().project));
    set((state) => ({
      undoStack: [...state.undoStack.slice(-25), currentProject],
      redoStack: [],
    }));
  },

  undo: () => {
    const { undoStack, project, redoStack } = get();
    if (undoStack.length === 0) return;
    const previous = undoStack[undoStack.length - 1];
    set({
      undoStack: undoStack.slice(0, -1),
      redoStack: [JSON.parse(JSON.stringify(project)), ...redoStack],
      project: previous,
    });
  },

  redo: () => {
    const { redoStack, project, undoStack } = get();
    if (redoStack.length === 0) return;
    const next = redoStack[0];
    set({
      redoStack: redoStack.slice(1),
      undoStack: [...undoStack, JSON.parse(JSON.stringify(project))],
      project: next,
    });
  },

  setProjectName: (name: string) => {
    get().pushHistory();
    set((state) => ({
      project: { ...state.project, name, updatedAt: new Date().toISOString() },
    }));
  },

  setAspectRatio: (aspect: AspectRatio) => {
    get().pushHistory();
    let width = 1920;
    let height = 1080;
    if (aspect === '9:16') {
      width = 1080;
      height = 1920;
    } else if (aspect === '1:1') {
      width = 1080;
      height = 1080;
    } else if (aspect === '4:5') {
      width = 1080;
      height = 1350;
    } else if (aspect === '21:9') {
      width = 2560;
      height = 1080;
    }
    set((state) => ({
      project: { ...state.project, aspectRatio: aspect, width, height, updatedAt: new Date().toISOString() },
    }));
  },

  newProject: () => {
    get().pushHistory();
    const blankProject: Project = {
      id: `nexora-proj-${Date.now()}`,
      name: 'Untitled Masterpiece',
      version: '2.0.0',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      aspectRatio: '16:9',
      width: 1920,
      height: 1080,
      fps: 30,
      duration: 10.0,
      tracks: [
        { id: 'track-text-1', name: 'Text & Titles', type: 'text', locked: false, muted: false, visible: true, color: '#ec4899' },
        { id: 'track-video-1', name: 'Video 1 (Base)', type: 'video', locked: false, muted: false, visible: true, color: '#8b5cf6' },
        { id: 'track-audio-1', name: 'Audio 1 (Music)', type: 'audio', locked: false, muted: false, visible: true, color: '#10b981' },
      ],
      clips: [],
      mediaPool: SAMPLE_MEDIA,
      beatMarkers: [],
      subtitleCues: [],
    };
    set({ project: blankProject, currentTime: 0, selectedClipId: null });
  },

  loadProject: (project: Project) => {
    get().pushHistory();
    set({ project, currentTime: 0, selectedClipId: project.clips[0]?.id || null });
  },

  saveProjectLocally: () => {
    const project = get().project;
    try {
      localStorage.setItem(`nexora_project_${project.id}`, JSON.stringify(project));
      localStorage.setItem('nexora_last_active_project_id', project.id);
    } catch {
      // LocalStorage quota fallback
    }
  },

  applyTemplate: (templateId: string) => {
    const found = TEMPLATES.find((t) => t.id === templateId);
    if (!found || !found.projectData) return;
    get().pushHistory();

    const currentMedia = get().project.mediaPool;
    const newProj: Project = {
      ...DEFAULT_PROJECT,
      ...found.projectData,
      id: `project-template-${Date.now()}`,
      name: found.title,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      mediaPool: currentMedia.length > 0 ? currentMedia : SAMPLE_MEDIA,
      clips: (found.projectData.clips || []).map((c) => ({ ...c })),
      tracks: (found.projectData.tracks || []).map((t) => ({ ...t })),
      beatMarkers: found.projectData.beatMarkers || [],
      subtitleCues: found.projectData.subtitleCues || [],
    } as Project;

    set({
      project: newProj,
      currentTime: 0,
      selectedClipId: newProj.clips[0]?.id || null,
      activeMode: 'video',
    });
  },

  addMediaItem: (item: MediaItem) => {
    get().pushHistory();
    set((state) => ({
      project: {
        ...state.project,
        mediaPool: [item, ...state.project.mediaPool],
      },
    }));
  },

  removeMediaItem: (mediaId: string) => {
    get().pushHistory();
    set((state) => ({
      project: {
        ...state.project,
        mediaPool: state.project.mediaPool.filter((m) => m.id !== mediaId),
      },
    }));
  },

  addClipToTimeline: (clipData: Partial<TimelineClip>, targetTime?: number, targetTrackId?: string) => {
    get().pushHistory();
    const state = get();
    const tracks = state.project.tracks;
    
    // Choose track
    let trackId = targetTrackId || state.selectedTrackId;
    if (!trackId || !tracks.find((t) => t.id === trackId)) {
      const matchTrack = tracks.find((t) => t.type === (clipData.type === 'audio' ? 'audio' : 'video'));
      trackId = matchTrack ? matchTrack.id : tracks[0].id;
    }

    const startPos = targetTime !== undefined ? targetTime : state.currentTime;
    const duration = clipData.duration || 4.0;

    const newClip: TimelineClip = {
      id: `clip-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      trackId,
      mediaId: clipData.mediaId,
      name: clipData.name || 'New Clip',
      type: clipData.type || 'video',
      start: startPos,
      duration,
      mediaOffset: clipData.mediaOffset || 0,
      speed: clipData.speed || 1.0,
      volume: clipData.volume !== undefined ? clipData.volume : 1.0,
      muted: clipData.muted || false,
      opacity: clipData.opacity !== undefined ? clipData.opacity : 1.0,
      blendMode: clipData.blendMode || 'normal',
      transform: clipData.transform || { x: 0, y: 0, scale: 1.0, rotation: 0, crop: { top: 0, bottom: 0, left: 0, right: 0 } },
      colorGrading: clipData.colorGrading || { brightness: 0, contrast: 0, saturation: 0, temperature: 0, tint: 0, exposure: 0, highlights: 0, shadows: 0 },
      chromaKey: clipData.chromaKey || { enabled: false, color: '#00FF00', tolerance: 30, smoothness: 10 },
      reverse: clipData.reverse || false,
      keyframes: clipData.keyframes || [],
      effects: clipData.effects || [],
      textProps: clipData.textProps,
      color: clipData.color || (clipData.type === 'audio' ? '#10b981' : clipData.type === 'text' ? '#ec4899' : '#8b5cf6'),
    };

    const newClips = [...state.project.clips, newClip];
    const maxEnd = Math.max(...newClips.map((c) => c.start + c.duration), state.project.duration);

    set({
      project: {
        ...state.project,
        clips: newClips,
        duration: Math.max(state.project.duration, maxEnd),
      },
      selectedClipId: newClip.id,
    });
  },

  updateClip: (clipId: string, updates: Partial<TimelineClip>) => {
    get().pushHistory();
    set((state) => {
      const updatedClips = state.project.clips.map((c) => (c.id === clipId ? { ...c, ...updates } : c));
      const maxEnd = Math.max(...updatedClips.map((c) => c.start + c.duration), 10);
      return {
        project: {
          ...state.project,
          clips: updatedClips,
          duration: Math.max(state.project.duration, maxEnd),
        },
      };
    });
  },

  splitClipAtPlayhead: (specificClipId?: string) => {
    const state = get();
    const clipId = specificClipId || state.selectedClipId;
    if (!clipId) return;

    const clip = state.project.clips.find((c) => c.id === clipId);
    if (!clip) return;

    const splitTime = state.currentTime;
    if (splitTime <= clip.start || splitTime >= clip.start + clip.duration) return;

    get().pushHistory();

    const firstDuration = splitTime - clip.start;
    const secondDuration = clip.duration - firstDuration;
    const secondOffset = clip.mediaOffset + firstDuration * clip.speed;

    const firstClip: TimelineClip = {
      ...clip,
      duration: firstDuration,
    };

    const secondClip: TimelineClip = {
      ...JSON.parse(JSON.stringify(clip)),
      id: `clip-split-${Date.now()}`,
      start: splitTime,
      duration: secondDuration,
      mediaOffset: secondOffset,
    };

    const newClips = state.project.clips.map((c) => (c.id === clipId ? firstClip : c)).concat(secondClip);

    set({
      project: {
        ...state.project,
        clips: newClips,
      },
      selectedClipId: secondClip.id,
    });
  },

  trimClip: (clipId: string, newStart: number, newDuration: number, newMediaOffset?: number) => {
    get().pushHistory();
    set((state) => {
      const updatedClips = state.project.clips.map((c) => {
        if (c.id === clipId) {
          return {
            ...c,
            start: Math.max(0, newStart),
            duration: Math.max(0.1, newDuration),
            mediaOffset: newMediaOffset !== undefined ? Math.max(0, newMediaOffset) : c.mediaOffset,
          };
        }
        return c;
      });
      const maxEnd = Math.max(...updatedClips.map((c) => c.start + c.duration), 10);
      return {
        project: {
          ...state.project,
          clips: updatedClips,
          duration: Math.max(state.project.duration, maxEnd),
        },
      };
    });
  },

  moveClip: (clipId: string, newStart: number, newTrackId?: string) => {
    get().pushHistory();
    set((state) => {
      const updatedClips = state.project.clips.map((c) => {
        if (c.id === clipId) {
          return {
            ...c,
            start: Math.max(0, newStart),
            trackId: newTrackId || c.trackId,
          };
        }
        return c;
      });
      const maxEnd = Math.max(...updatedClips.map((c) => c.start + c.duration), 10);
      return {
        project: {
          ...state.project,
          clips: updatedClips,
          duration: Math.max(state.project.duration, maxEnd),
        },
      };
    });
  },

  duplicateClip: (clipId: string) => {
    const state = get();
    const clip = state.project.clips.find((c) => c.id === clipId);
    if (!clip) return;
    get().pushHistory();

    const duplicated: TimelineClip = {
      ...JSON.parse(JSON.stringify(clip)),
      id: `clip-dup-${Date.now()}`,
      name: `${clip.name} (Copy)`,
      start: clip.start + clip.duration + 0.1,
    };

    set({
      project: {
        ...state.project,
        clips: [...state.project.clips, duplicated],
        duration: Math.max(state.project.duration, duplicated.start + duplicated.duration),
      },
      selectedClipId: duplicated.id,
    });
  },

  deleteClip: (clipId: string) => {
    get().pushHistory();
    set((state) => ({
      project: {
        ...state.project,
        clips: state.project.clips.filter((c) => c.id !== clipId),
      },
      selectedClipId: state.selectedClipId === clipId ? null : state.selectedClipId,
    }));
  },

  addTrack: (type: 'video' | 'audio' | 'text' | 'overlay') => {
    get().pushHistory();
    const state = get();
    const trackCount = state.project.tracks.filter((t) => t.type === type).length + 1;
    const newTrack: TimelineTrack = {
      id: `track-${type}-${Date.now()}`,
      name: `${type.toUpperCase()} ${trackCount}`,
      type,
      locked: false,
      muted: false,
      visible: true,
      color: type === 'audio' ? '#10b981' : type === 'text' ? '#ec4899' : '#8b5cf6',
    };
    set({
      project: {
        ...state.project,
        tracks: [...state.project.tracks, newTrack],
      },
    });
  },

  removeTrack: (trackId: string) => {
    get().pushHistory();
    set((state) => ({
      project: {
        ...state.project,
        tracks: state.project.tracks.filter((t) => t.id !== trackId),
        clips: state.project.clips.filter((c) => c.trackId !== trackId),
      },
    }));
  },

  toggleTrackLock: (trackId: string) => {
    set((state) => ({
      project: {
        ...state.project,
        tracks: state.project.tracks.map((t) => (t.id === trackId ? { ...t, locked: !t.locked } : t)),
      },
    }));
  },

  toggleTrackMute: (trackId: string) => {
    set((state) => ({
      project: {
        ...state.project,
        tracks: state.project.tracks.map((t) => (t.id === trackId ? { ...t, muted: !t.muted } : t)),
      },
    }));
  },

  toggleTrackVisibility: (trackId: string) => {
    set((state) => ({
      project: {
        ...state.project,
        tracks: state.project.tracks.map((t) => (t.id === trackId ? { ...t, visible: !t.visible } : t)),
      },
    }));
  },

  addKeyframe: (clipId: string, keyframe: Omit<Keyframe, 'id'>) => {
    get().pushHistory();
    const newKf: Keyframe = {
      ...keyframe,
      id: `kf-${Date.now()}-${Math.floor(Math.random() * 100)}`,
    };
    set((state) => ({
      project: {
        ...state.project,
        clips: state.project.clips.map((c) => (c.id === clipId ? { ...c, keyframes: [...c.keyframes, newKf] } : c)),
      },
    }));
  },

  updateKeyframe: (clipId: string, keyframeId: string, updates: Partial<Keyframe>) => {
    get().pushHistory();
    set((state) => ({
      project: {
        ...state.project,
        clips: state.project.clips.map((c) => {
          if (c.id === clipId) {
            return {
              ...c,
              keyframes: c.keyframes.map((k) => (k.id === keyframeId ? { ...k, ...updates } : k)),
            };
          }
          return c;
        }),
      },
    }));
  },

  removeKeyframe: (clipId: string, keyframeId: string) => {
    get().pushHistory();
    set((state) => ({
      project: {
        ...state.project,
        clips: state.project.clips.map((c) => (c.id === clipId ? { ...c, keyframes: c.keyframes.filter((k) => k.id !== keyframeId) } : c)),
      },
    }));
  },

  setBeatMarkers: (markers: number[]) => {
    set((state) => ({
      project: {
        ...state.project,
        beatMarkers: markers,
      },
    }));
  },

  autoCutToBeats: () => {
    const state = get();
    const beats = state.project.beatMarkers;
    if (beats.length === 0) return;
    get().pushHistory();

    const videoClips = state.project.clips.filter((c) => c.type === 'video');
    if (videoClips.length === 0) return;

    // Rescale clips to snap exactly onto beat intervals
    let curTime = 0;
    const updatedClips = videoClips.map((c, idx) => {
      const nextBeat = beats[idx] || (curTime + 2.0);
      const duration = Math.max(0.5, nextBeat - curTime);
      const clipUpdate = {
        ...c,
        start: curTime,
        duration,
      };
      curTime = nextBeat;
      return clipUpdate;
    });

    const otherClips = state.project.clips.filter((c) => c.type !== 'video');
    set({
      project: {
        ...state.project,
        clips: [...updatedClips, ...otherClips],
        duration: Math.max(state.project.duration, curTime + 2.0),
      },
    });
  },

  slideshowToBeats: () => {
    const state = get();
    const images = state.project.mediaPool.filter((m) => m.type === 'image');
    if (images.length === 0) return;
    get().pushHistory();

    const beats = state.project.beatMarkers.length > 0 
      ? state.project.beatMarkers 
      : [1.5, 3.0, 4.5, 6.0, 7.5, 9.0];

    const tracks = state.project.tracks;
    const targetTrack = tracks.find((t) => t.type === 'video') || tracks[0];

    let t = 0;
    const newClips: TimelineClip[] = images.map((img, idx) => {
      const beatEnd = beats[idx] || (t + 1.8);
      const duration = beatEnd - t;
      const clip: TimelineClip = {
        id: `slideshow-clip-${idx}-${Date.now()}`,
        trackId: targetTrack.id,
        mediaId: img.id,
        name: img.name,
        type: 'video',
        start: t,
        duration,
        mediaOffset: 0,
        speed: 1.0,
        volume: 1.0,
        muted: false,
        opacity: 1.0,
        blendMode: 'normal',
        transform: { x: 0, y: 0, scale: 1.0 + (idx % 2 === 0 ? 0.08 : 0.02), rotation: 0, crop: { top: 0, bottom: 0, left: 0, right: 0 } },
        colorGrading: { brightness: 5, contrast: 10, saturation: 15, temperature: 0, tint: 0, exposure: 0, highlights: 0, shadows: 0, lut: 'teal-orange' },
        chromaKey: { enabled: false, color: '#00FF00', tolerance: 0, smoothness: 0 },
        reverse: false,
        transitionIn: { type: 'zoom-in', duration: 0.35 },
        keyframes: [],
        effects: [{ id: `eff-shake-${idx}`, type: 'shake', intensity: 0.4, params: {} }],
        color: '#8b5cf6',
      };
      t = beatEnd;
      return clip;
    });

    const otherClips = state.project.clips.filter((c) => c.trackId !== targetTrack.id);
    set({
      project: {
        ...state.project,
        clips: [...newClips, ...otherClips],
        duration: Math.max(state.project.duration, t + 2),
      },
    });
  },

  addSubtitleCue: (cue: Omit<SubtitleCue, 'id'>) => {
    const newCue: SubtitleCue = {
      ...cue,
      id: `cue-${Date.now()}-${Math.floor(Math.random() * 100)}`,
    };
    set((state) => ({
      project: {
        ...state.project,
        subtitleCues: [...state.project.subtitleCues, newCue],
      },
    }));
  },

  updateSubtitleCue: (id: string, updates: Partial<SubtitleCue>) => {
    set((state) => ({
      project: {
        ...state.project,
        subtitleCues: state.project.subtitleCues.map((c) => (c.id === id ? { ...c, ...updates } : c)),
      },
    }));
  },

  removeSubtitleCue: (id: string) => {
    set((state) => ({
      project: {
        ...state.project,
        subtitleCues: state.project.subtitleCues.filter((c) => c.id !== id),
      },
    }));
  },

  setPhotoImageSrc: (src: string) => set({ photoImageSrc: src }),
  setPhotoAdjustments: (adjustments: Partial<PhotoAdjustments>) => {
    set((state) => ({
      photoAdjustments: { ...state.photoAdjustments, ...adjustments },
    }));
  },
  resetPhotoAdjustments: () => set({ photoAdjustments: DEFAULT_PHOTO_ADJUSTMENTS }),
  setPhotoCrop: (crop: Partial<PhotoCrop>) => {
    set((state) => ({
      photoCrop: { ...state.photoCrop, ...crop },
    }));
  },
  addPhotoLayer: (layer: Partial<PhotoLayer>) => {
    const newLayer: PhotoLayer = {
      id: `layer-${Date.now()}`,
      type: layer.type || 'text',
      x: layer.x || 50,
      y: layer.y || 50,
      width: layer.width || 200,
      height: layer.height || 60,
      rotation: layer.rotation || 0,
      opacity: layer.opacity !== undefined ? layer.opacity : 1,
      visible: true,
      textProps: layer.textProps,
      src: layer.src,
    };
    set((state) => ({
      photoLayers: [...state.photoLayers, newLayer],
      selectedPhotoLayerId: newLayer.id,
    }));
  },
  updatePhotoLayer: (layerId: string, updates: Partial<PhotoLayer>) => {
    set((state) => ({
      photoLayers: state.photoLayers.map((l) => (l.id === layerId ? { ...l, ...updates } : l)),
    }));
  },
  removePhotoLayer: (layerId: string) => {
    set((state) => ({
      photoLayers: state.photoLayers.filter((l) => l.id !== layerId),
      selectedPhotoLayerId: state.selectedPhotoLayerId === layerId ? null : state.selectedPhotoLayerId,
    }));
  },

  setExportProgress: (progress: number, stage: string) => set({ exportProgress: progress, exportStage: stage }),
  setExportedBlobUrl: (url: string | null) => set({ exportedBlobUrl: url }),
  cancelExport: () => set({ isExporting: false, exportStage: 'Cancelled', exportProgress: 0 }),
}));
