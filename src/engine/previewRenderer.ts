import { Project, TimelineClip, Keyframe, EasingFunction } from '../types/studio';

// Video and Image DOM elements pool
const videoPool = new Map<string, HTMLVideoElement>();
const imagePool = new Map<string, HTMLImageElement>();

export function getOrCreateVideo(mediaId: string, src: string): HTMLVideoElement {
  if (videoPool.has(mediaId)) {
    return videoPool.get(mediaId)!;
  }
  const video = document.createElement('video');
  video.src = src;
  video.crossOrigin = 'anonymous';
  video.preload = 'auto';
  video.muted = true;
  video.playsInline = true;
  videoPool.set(mediaId, video);
  return video;
}

export function getOrCreateImage(mediaId: string, src: string): HTMLImageElement {
  if (imagePool.has(mediaId)) {
    return imagePool.get(mediaId)!;
  }
  const img = new Image();
  img.src = src;
  img.crossOrigin = 'anonymous';
  imagePool.set(mediaId, img);
  return img;
}

// Calculate interpolated keyframe value
export function interpolateKeyframe(
  keyframes: Keyframe[],
  clipTime: number,
  property: 'x' | 'y' | 'scale' | 'rotation' | 'opacity' | 'blur',
  defaultValue: number
): number {
  const filtered = keyframes
    .filter((k) => k.property === property)
    .sort((a, b) => a.time - b.time);

  if (filtered.length === 0) return defaultValue;
  if (clipTime <= filtered[0].time) return filtered[0].value;
  if (clipTime >= filtered[filtered.length - 1].time) return filtered[filtered.length - 1].value;

  // Find surrounding pair
  for (let i = 0; i < filtered.length - 1; i++) {
    const k1 = filtered[i];
    const k2 = filtered[i + 1];
    if (clipTime >= k1.time && clipTime <= k2.time) {
      const duration = k2.time - k1.time;
      if (duration === 0) return k1.value;
      const progress = (clipTime - k1.time) / duration;
      const easedProgress = applyEasing(progress, k1.easing);
      return k1.value + (k2.value - k1.value) * easedProgress;
    }
  }

  return defaultValue;
}

export function applyEasing(t: number, easing: EasingFunction): number {
  switch (easing) {
    case 'linear':
      return t;
    case 'ease-in':
      return t * t;
    case 'ease-out':
      return t * (2 - t);
    case 'ease-in-out':
      return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
    case 'bounce':
      if (t < 1 / 2.75) return 7.5625 * t * t;
      if (t < 2 / 2.75) return 7.5625 * (t -= 1.5 / 2.75) * t + 0.75;
      if (t < 2.5 / 2.75) return 7.5625 * (t -= 2.25 / 2.75) * t + 0.9375;
      return 7.5625 * (t -= 2.625 / 2.75) * t + 0.984375;
    case 'elastic':
      return t === 0 ? 0 : t === 1 ? 1 : -Math.pow(2, 10 * (t - 1)) * Math.sin(((t - 1.1) * 5 * Math.PI) / 0.4);
    default:
      return t;
  }
}

// Master Canvas Rendering function
export function renderCanvasFrame(
  canvas: HTMLCanvasElement,
  project: Project,
  currentTime: number,
  options: {
    lowPerformanceMode?: boolean;
    previewQuality?: string;
    isPlaying?: boolean;
  } = {}
) {
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return;

  const width = canvas.width;
  const height = canvas.height;

  // Clear canvas background
  ctx.save();
  ctx.fillStyle = '#0a0a0f';
  ctx.fillRect(0, 0, width, height);
  ctx.restore();

  // Find all active clips at currentTime
  const activeClips = project.clips.filter((clip) => {
    // Check if parent track is visible
    const track = project.tracks.find((t) => t.id === clip.trackId);
    if (track && !track.visible) return false;
    return currentTime >= clip.start && currentTime < clip.start + clip.duration;
  });

  // Sort by track order (tracks render bottom to top)
  const trackOrder = project.tracks.map((t) => t.id);
  activeClips.sort((a, b) => {
    const trackA = trackOrder.indexOf(a.trackId);
    const trackB = trackOrder.indexOf(b.trackId);
    return trackB - trackA; // Reverse order so earlier tracks in list render above or below
  });

  // Render each clip
  for (const clip of activeClips) {
    renderClip(ctx, clip, project, currentTime, width, height, options);
  }

  // Render active Subtitle Cue if available
  const activeSubtitle = project.subtitleCues.find(
    (cue) => currentTime >= cue.start && currentTime <= cue.end
  );
  if (activeSubtitle) {
    renderSubtitleOverlay(ctx, activeSubtitle.text, width, height);
  }
}

function renderClip(
  ctx: CanvasRenderingContext2D,
  clip: TimelineClip,
  project: Project,
  currentTime: number,
  canvasWidth: number,
  canvasHeight: number,
  options: { lowPerformanceMode?: boolean; previewQuality?: string; isPlaying?: boolean }
) {
  const clipTime = (currentTime - clip.start) * clip.speed;

  // Evaluate keyframes
  const keyX = interpolateKeyframe(clip.keyframes, clipTime, 'x', clip.transform.x);
  const keyY = interpolateKeyframe(clip.keyframes, clipTime, 'y', clip.transform.y);
  const keyScale = interpolateKeyframe(clip.keyframes, clipTime, 'scale', clip.transform.scale);
  const keyRotation = interpolateKeyframe(clip.keyframes, clipTime, 'rotation', clip.transform.rotation);
  const keyOpacity = interpolateKeyframe(clip.keyframes, clipTime, 'opacity', clip.opacity);

  // Transition calculation
  let transitionAlpha = 1.0;
  let transitionScale = 1.0;
  let transitionOffsetX = 0;

  if (clip.transitionIn && clipTime < clip.transitionIn.duration) {
    const t = clipTime / clip.transitionIn.duration;
    if (clip.transitionIn.type === 'fade' || clip.transitionIn.type === 'dissolve') {
      transitionAlpha = t;
    } else if (clip.transitionIn.type === 'zoom-in') {
      transitionScale = 0.5 + t * 0.5;
      transitionAlpha = t;
    } else if (clip.transitionIn.type === 'slide-left') {
      transitionOffsetX = (1 - t) * canvasWidth;
    } else if (clip.transitionIn.type === 'flash') {
      transitionAlpha = 1;
    }
  }

  const finalOpacity = Math.max(0, Math.min(1, keyOpacity * transitionAlpha));
  if (finalOpacity <= 0) return;

  ctx.save();
  ctx.globalAlpha = finalOpacity;
  if (clip.blendMode && clip.blendMode !== 'normal') {
    ctx.globalCompositeOperation = clip.blendMode;
  }

  // Camera Shake Effect calculation
  let shakeX = 0;
  let shakeY = 0;
  const shakeEff = clip.effects.find((e) => e.type === 'shake');
  if (shakeEff && !options.lowPerformanceMode) {
    const shakeMag = shakeEff.intensity * 12;
    shakeX = (Math.sin(currentTime * 45) * shakeMag);
    shakeY = (Math.cos(currentTime * 38) * shakeMag);
  }

  // Transform Center
  const centerX = canvasWidth / 2 + (keyX / 100) * canvasWidth + transitionOffsetX + shakeX;
  const centerY = canvasHeight / 2 + (keyY / 100) * canvasHeight + shakeY;
  ctx.translate(centerX, centerY);

  const finalScale = keyScale * transitionScale;
  ctx.scale(finalScale, finalScale);
  if (keyRotation !== 0) {
    ctx.rotate((keyRotation * Math.PI) / 180);
  }

  // Media Rendering
  const media = project.mediaPool.find((m) => m.id === clip.mediaId);

  if (clip.type === 'text' && clip.textProps) {
    renderTextClip(ctx, clip, clipTime, canvasWidth, canvasHeight);
  } else if (media && media.type === 'image') {
    renderImageClip(ctx, media.src, canvasWidth, canvasHeight, clip, options);
  } else if (media && media.type === 'video') {
    renderVideoClip(ctx, media, clip, currentTime, canvasWidth, canvasHeight, options);
  }

  ctx.restore();

  // Screen-space Effects (Vignette, Film Grain, CRT scanlines, RGB split)
  if (!options.lowPerformanceMode) {
    renderPostEffects(ctx, clip, canvasWidth, canvasHeight, currentTime);
  }
}

function renderTextClip(
  ctx: CanvasRenderingContext2D,
  clip: TimelineClip,
  clipTime: number,
  canvasWidth: number,
  canvasHeight: number
) {
  const props = clip.textProps!;
  ctx.font = `${props.bold ? 'bold ' : ''}${props.italic ? 'italic ' : ''}${props.fontSize}px "${props.fontFamily || 'Plus Jakarta Sans'}", sans-serif`;
  ctx.textAlign = props.align || 'center';
  ctx.textBaseline = 'middle';

  let textToDraw = props.text;

  // Kinetic Typography Animation
  if (props.animationStyle === 'typewriter') {
    const charsToShow = Math.floor(clipTime * 12);
    textToDraw = props.text.slice(0, Math.min(props.text.length, charsToShow));
  } else if (props.animationStyle === 'bounce') {
    const bounceScale = 1.0 + Math.sin(clipTime * 8) * 0.04;
    ctx.scale(bounceScale, bounceScale);
  } else if (props.animationStyle === 'neon-glow') {
    ctx.shadowColor = props.strokeColor || '#06b6d4';
    ctx.shadowBlur = 18;
  }

  // Optional background pill/box
  if (props.backgroundColor) {
    const metrics = ctx.measureText(textToDraw);
    const textWidth = metrics.width + 30;
    const textHeight = props.fontSize + 20;
    ctx.fillStyle = props.backgroundColor;
    ctx.fillRect(-textWidth / 2, -textHeight / 2, textWidth, textHeight);
  }

  // Stroke outline
  if (props.strokeColor && props.strokeWidth) {
    ctx.strokeStyle = props.strokeColor;
    ctx.lineWidth = props.strokeWidth;
    ctx.strokeText(textToDraw, 0, 0);
  }

  // Main text fill
  ctx.fillStyle = props.color;
  ctx.fillText(textToDraw, 0, 0);
}

function renderImageClip(
  ctx: CanvasRenderingContext2D,
  src: string,
  canvasWidth: number,
  canvasHeight: number,
  clip: TimelineClip,
  options: { lowPerformanceMode?: boolean }
) {
  const img = getOrCreateImage(clip.id, src);
  if (!img.complete || img.naturalWidth === 0) return;

  // Color grading filter
  if (!options.lowPerformanceMode) {
    applyCanvasFilters(ctx, clip.colorGrading);
  }

  // Aspect fit/cover drawing
  const imgW = img.naturalWidth;
  const imgH = img.naturalHeight;
  const scale = Math.max(canvasWidth / imgW, canvasHeight / imgH);
  const drawW = imgW * scale;
  const drawH = imgH * scale;

  ctx.drawImage(img, -drawW / 2, -drawH / 2, drawW, drawH);
}

function renderVideoClip(
  ctx: CanvasRenderingContext2D,
  media: any,
  clip: TimelineClip,
  currentTime: number,
  canvasWidth: number,
  canvasHeight: number,
  options: { lowPerformanceMode?: boolean; isPlaying?: boolean; previewQuality?: string }
) {
  const videoSrc = (options.previewQuality === '360p' || options.previewQuality === '480p') && media.proxySrc 
    ? media.proxySrc 
    : media.src;

  const video = getOrCreateVideo(media.id, videoSrc);

  // Sync video time
  const targetMediaTime = clip.mediaOffset + (currentTime - clip.start) * clip.speed;
  if (Math.abs(video.currentTime - targetMediaTime) > 0.15) {
    video.currentTime = Math.max(0, Math.min(targetMediaTime, video.duration || 100));
  }

  if (options.isPlaying && video.paused) {
    video.play().catch(() => {});
  } else if (!options.isPlaying && !video.paused) {
    video.pause();
  }

  if (!options.lowPerformanceMode) {
    applyCanvasFilters(ctx, clip.colorGrading);
  }

  const vW = video.videoWidth || canvasWidth;
  const vH = video.videoHeight || canvasHeight;
  const scale = Math.max(canvasWidth / vW, canvasHeight / vH);
  const drawW = vW * scale;
  const drawH = vH * scale;

  // Check Chroma Key
  if (clip.chromaKey?.enabled && !options.lowPerformanceMode) {
    renderWithChromaKey(ctx, video, -drawW / 2, -drawH / 2, drawW, drawH, clip.chromaKey);
  } else {
    try {
      ctx.drawImage(video, -drawW / 2, -drawH / 2, drawW, drawH);
    } catch {
      // Fallback placeholder during video buffer
      ctx.fillStyle = '#1e1b4b';
      ctx.fillRect(-drawW / 2, -drawH / 2, drawW, drawH);
    }
  }
}

function applyCanvasFilters(ctx: CanvasRenderingContext2D, grading: any) {
  if (!grading) return;
  const b = 100 + (grading.brightness || 0);
  const c = 100 + (grading.contrast || 0);
  const s = 100 + (grading.saturation || 0);
  const filters: string[] = [`brightness(${b}%)`, `contrast(${c}%)`, `saturate(${s}%)`];
  
  if (grading.lut === 'teal-orange') {
    filters.push('hue-rotate(-15deg)', 'contrast(115%)');
  } else if (grading.lut === 'cyberpunk') {
    filters.push('hue-rotate(35deg)', 'saturate(130%)');
  } else if (grading.lut === 'monochrome-noir') {
    filters.push('grayscale(100%)', 'contrast(130%)');
  } else if (grading.lut === 'vintage-warm') {
    filters.push('sepia(25%)', 'brightness(105%)');
  }

  ctx.filter = filters.join(' ');
}

function renderWithChromaKey(
  ctx: CanvasRenderingContext2D,
  video: HTMLVideoElement,
  x: number,
  y: number,
  w: number,
  h: number,
  chroma: { color: string; tolerance: number; smoothness: number }
) {
  const offscreen = document.createElement('canvas');
  offscreen.width = Math.min(640, w);
  offscreen.height = Math.min(360, h);
  const offCtx = offscreen.getContext('2d');
  if (!offCtx) {
    ctx.drawImage(video, x, y, w, h);
    return;
  }

  offCtx.drawImage(video, 0, 0, offscreen.width, offscreen.height);
  const frame = offCtx.getImageData(0, 0, offscreen.width, offscreen.height);
  const data = frame.data;

  // Key color parse (default green #00FF00)
  const keyR = 0;
  const keyG = 255;
  const keyB = 0;
  const tol = (chroma.tolerance / 100) * 180;

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const dist = Math.sqrt((r - keyR) ** 2 + (g - keyG) ** 2 + (b - keyB) ** 2);
    if (dist < tol) {
      data[i + 3] = 0; // Alpha transparent
    }
  }

  offCtx.putImageData(frame, 0, 0);
  ctx.drawImage(offscreen, x, y, w, h);
}

function renderPostEffects(
  ctx: CanvasRenderingContext2D,
  clip: TimelineClip,
  width: number,
  height: number,
  currentTime: number
) {
  for (const eff of clip.effects) {
    if (eff.type === 'vignette') {
      const grad = ctx.createRadialGradient(width / 2, height / 2, width * 0.3, width / 2, height / 2, width * 0.7);
      grad.addColorStop(0, 'rgba(0,0,0,0)');
      grad.addColorStop(1, `rgba(0,0,0,${eff.intensity * 0.85})`);
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);
    } else if (eff.type === 'film-grain') {
      // Subtle fast film grain simulation
      ctx.fillStyle = `rgba(255,255,255,${eff.intensity * 0.04})`;
      for (let i = 0; i < 40; i++) {
        const gx = Math.random() * width;
        const gy = Math.random() * height;
        ctx.fillRect(gx, gy, 2, 2);
      }
    } else if (eff.type === 'vhs') {
      // VHS scanlines
      ctx.fillStyle = 'rgba(0,0,0,0.12)';
      for (let y = 0; y < height; y += 4) {
        ctx.fillRect(0, y, width, 1);
      }
    }
  }
}

function renderSubtitleOverlay(
  ctx: CanvasRenderingContext2D,
  text: string,
  canvasWidth: number,
  canvasHeight: number
) {
  ctx.save();
  ctx.font = `600 ${Math.round(canvasHeight * 0.045)}px "Plus Jakarta Sans", sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  const posY = canvasHeight * 0.86;
  const metrics = ctx.measureText(text);
  const bgW = metrics.width + 40;
  const bgH = canvasHeight * 0.07;

  // Subtitle dark backdrop
  ctx.fillStyle = 'rgba(15, 17, 26, 0.85)';
  ctx.beginPath();
  ctx.roundRect(canvasWidth / 2 - bgW / 2, posY - bgH / 2, bgW, bgH, 8);
  ctx.fill();

  // Subtitle text
  ctx.fillStyle = '#ffffff';
  ctx.fillText(text, canvasWidth / 2, posY);
  ctx.restore();
}
