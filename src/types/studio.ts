export type MediaType = 'video' | 'audio' | 'image';

export type AspectRatio = '16:9' | '9:16' | '1:1' | '4:5' | '21:9';

export type PreviewResolution = '360p' | '480p' | '720p' | 'original';

export type ExportResolution = '720p' | '1080p' | '1440p' | '4K';

export type ExportFormat = 'mp4' | 'webm' | 'gif' | 'png_sequence';

export type StudioTab = 
  | 'media' 
  | 'audio' 
  | 'text' 
  | 'transitions' 
  | 'effects' 
  | 'filters' 
  | 'stickers' 
  | 'templates' 
  | 'ai' 
  | 'export';

export type StudioMode = 'video' | 'photo' | 'templates' | 'ai_tools';

export type BlendMode = 
  | 'normal' 
  | 'screen' 
  | 'multiply' 
  | 'overlay' 
  | 'darken' 
  | 'lighten' 
  | 'color-dodge';

export type EasingFunction = 
  | 'linear' 
  | 'ease-in' 
  | 'ease-out' 
  | 'ease-in-out' 
  | 'bounce' 
  | 'elastic';

export interface Keyframe {
  id: string;
  time: number; // Seconds relative to clip start
  property: 'x' | 'y' | 'scale' | 'rotation' | 'opacity' | 'blur';
  value: number;
  easing: EasingFunction;
}

export interface ClipEffect {
  id: string;
  type: 
    | 'motion-blur'
    | 'glow'
    | 'neon'
    | 'rgb-split'
    | 'glitch'
    | 'shake'
    | 'film-grain'
    | 'vignette'
    | 'chromatic-aberration'
    | 'vhs'
    | 'light-leaks'
    | 'zoom-blur';
  intensity: number; // 0 to 1
  params: Record<string, number | string | boolean>;
}

export interface Transition {
  type: 
    | 'fade' 
    | 'dissolve' 
    | 'wipe-left' 
    | 'wipe-right' 
    | 'slide-left' 
    | 'push-up' 
    | 'zoom-in' 
    | 'spin' 
    | 'flash' 
    | 'rgb-glitch';
  duration: number; // in seconds, e.g. 0.5
}

export interface TextProperties {
  text: string;
  fontSize: number;
  fontFamily: string;
  color: string;
  backgroundColor?: string;
  bold: boolean;
  italic: boolean;
  align: 'left' | 'center' | 'right';
  animationStyle: 'none' | 'fade' | 'typewriter' | 'bounce' | 'slide-up' | 'neon-glow' | 'karaoke';
  strokeColor?: string;
  strokeWidth?: number;
}

export interface ChromaKeySettings {
  enabled: boolean;
  color: string; // Hex color to key out (e.g. #00FF00)
  tolerance: number; // 0 to 100
  smoothness: number; // 0 to 100
}

export interface TransformSettings {
  x: number; // Percentage or offset (-100 to 100)
  y: number;
  scale: number; // 1 = 100%
  rotation: number; // Degrees
  crop: {
    top: number;
    bottom: number;
    left: number;
    right: number;
  };
}

export interface ColorGrading {
  brightness: number; // -100 to 100 (0 default)
  contrast: number;   // -100 to 100 (0 default)
  saturation: number; // -100 to 100 (0 default)
  temperature: number;// -100 to 100 (0 default)
  tint: number;       // -100 to 100 (0 default)
  exposure: number;   // -100 to 100 (0 default)
  highlights: number; // -100 to 100 (0 default)
  shadows: number;    // -100 to 100 (0 default)
  lut?: string;       // Cinematic LUT name (e.g. 'teal-orange', 'cyberpunk', etc.)
}

export interface MediaItem {
  id: string;
  name: string;
  type: MediaType;
  src: string;
  proxySrc?: string;
  duration: number; // In seconds
  width: number;
  height: number;
  size: number; // Bytes
  thumbnailUrl?: string;
  waveformData?: number[]; // Audio peak array
  format: string;
  fps?: number;
  isProxyReady?: boolean;
}

export interface TimelineClip {
  id: string;
  trackId: string;
  mediaId?: string; // Optional if text/shape clip
  name: string;
  type: 'video' | 'audio' | 'text' | 'overlay' | 'sticker';
  start: number; // Timeline position in seconds
  duration: number; // Duration on timeline in seconds
  mediaOffset: number; // Start offset into source media in seconds
  speed: number; // Playback rate, e.g. 1.0 (0.25 to 4.0)
  volume: number; // 0 to 2 (1 = 100%)
  muted: boolean;
  opacity: number; // 0 to 1
  blendMode: BlendMode;
  transform: TransformSettings;
  colorGrading: ColorGrading;
  chromaKey: ChromaKeySettings;
  reverse: boolean;
  freezeFrame?: boolean;
  transitionIn?: Transition;
  transitionOut?: Transition;
  keyframes: Keyframe[];
  effects: ClipEffect[];
  textProps?: TextProperties;
  color?: string; // Timeline display color tag
}

export interface TimelineTrack {
  id: string;
  name: string;
  type: 'video' | 'audio' | 'text' | 'overlay';
  locked: boolean;
  muted: boolean;
  visible: boolean;
  color: string;
}

export interface SubtitleCue {
  id: string;
  start: number; // in seconds
  end: number;   // in seconds
  text: string;
}

export interface Project {
  id: string;
  name: string;
  version: string;
  createdAt: string;
  updatedAt: string;
  aspectRatio: AspectRatio;
  width: number;
  height: number;
  fps: number;
  duration: number; // Total project duration in seconds
  tracks: TimelineTrack[];
  clips: TimelineClip[];
  mediaPool: MediaItem[];
  beatMarkers: number[]; // Array of timestamps in seconds where beats occur
  subtitleCues: SubtitleCue[];
}

export interface ExportSettings {
  resolution: ExportResolution;
  format: ExportFormat;
  fps: 24 | 30 | 60;
  bitrate: 'standard' | 'high' | 'ultra';
  useHardwareAccel: boolean;
  useProxiesForExport: boolean; // Default false (4K/HQ uses original media)
}

export interface PhotoAdjustments {
  brightness: number; // -100 to 100
  contrast: number;
  saturation: number;
  exposure: number;
  highlights: number;
  shadows: number;
  temperature: number;
  tint: number;
  sharpen: number; // 0 to 100
  blur: number;    // 0 to 100
  vignette: number;// 0 to 100
}

export interface PhotoCrop {
  x: number;
  y: number;
  width: number;
  height: number;
  aspect: 'free' | '1:1' | '4:5' | '16:9' | '9:16' | 'circle';
}

export interface PhotoLayer {
  id: string;
  type: 'image' | 'text' | 'shape';
  src?: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  opacity: number;
  visible: boolean;
  textProps?: TextProperties;
}

export interface HardwareInfo {
  cpu: string;
  cores: number;
  gpu: string;
  ram: string;
  quickSyncAvailable: boolean;
  lowPerformanceMode: boolean;
}
