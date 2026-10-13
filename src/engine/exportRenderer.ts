import { Project, ExportSettings } from '../types/studio';
import { renderCanvasFrame } from './previewRenderer';

export interface ExportProgressCallback {
  (progress: number, stage: string, previewCanvas?: HTMLCanvasElement): void;
}

export async function exportVideo(
  project: Project,
  settings: ExportSettings,
  onProgress: ExportProgressCallback,
  isCancelledRef: { current: boolean }
): Promise<Blob> {
  // Determine output resolution based on settings and aspect ratio
  let targetWidth = 1920;
  let targetHeight = 1080;

  if (settings.resolution === '720p') {
    targetWidth = 1280;
    targetHeight = 720;
  } else if (settings.resolution === '1080p') {
    targetWidth = 1920;
    targetHeight = 1080;
  } else if (settings.resolution === '1440p') {
    targetWidth = 2560;
    targetHeight = 1440;
  } else if (settings.resolution === '4K') {
    targetWidth = 3840;
    targetHeight = 2160;
  }

  // Adjust for vertical or square aspect ratio
  if (project.aspectRatio === '9:16') {
    const temp = targetWidth;
    targetWidth = targetHeight;
    targetHeight = temp;
  } else if (project.aspectRatio === '1:1') {
    targetHeight = targetWidth;
  } else if (project.aspectRatio === '4:5') {
    targetHeight = Math.round((targetWidth * 5) / 4);
  }

  const exportCanvas = document.createElement('canvas');
  exportCanvas.width = targetWidth;
  exportCanvas.height = targetHeight;

  const fps = settings.fps;
  const totalDuration = project.duration;
  const totalFrames = Math.ceil(totalDuration * fps);
  const timeStep = 1 / fps;

  // Setup Canvas Stream & MediaRecorder
  const mimeType = MediaRecorder.isTypeSupported('video/mp4;codecs=avc1')
    ? 'video/mp4;codecs=avc1'
    : MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
    ? 'video/webm;codecs=vp9'
    : 'video/webm';

  let videoBitsPerSecond = 8000000; // 8 Mbps default
  if (settings.bitrate === 'high') videoBitsPerSecond = 16000000;
  if (settings.bitrate === 'ultra') videoBitsPerSecond = 35000000;

  const stream = exportCanvas.captureStream(fps);
  const recorder = new MediaRecorder(stream, {
    mimeType,
    videoBitsPerSecond,
  });

  const chunks: Blob[] = [];
  recorder.ondataavailable = (e) => {
    if (e.data && e.data.size > 0) {
      chunks.push(e.data);
    }
  };

  recorder.start();

  onProgress(5, `Initializing ${settings.resolution} render pipeline...`, exportCanvas);

  // Render loop
  for (let frame = 0; frame < totalFrames; frame++) {
    if (isCancelledRef.current) {
      recorder.stop();
      throw new Error('Export cancelled by user');
    }

    const frameTime = frame * timeStep;

    // Render exact composition frame
    renderCanvasFrame(exportCanvas, project, frameTime, {
      lowPerformanceMode: false,
      previewQuality: 'original',
      isPlaying: false,
    });

    const progressPct = Math.round(10 + (frame / totalFrames) * 85);
    if (frame % 3 === 0 || frame === totalFrames - 1) {
      onProgress(
        progressPct,
        `Rendering frame ${frame + 1} of ${totalFrames} (${frameTime.toFixed(1)}s / ${totalDuration.toFixed(1)}s)`,
        exportCanvas
      );
    }

    // Small delay to allow browser thread to encode frame without freezing
    await new Promise((resolve) => setTimeout(resolve, 8));
  }

  onProgress(96, 'Finalizing video stream container and headers...');
  recorder.stop();

  return new Promise<Blob>((resolve) => {
    recorder.onstop = () => {
      const finalBlob = new Blob(chunks, { type: mimeType });
      onProgress(100, 'Export complete!');
      resolve(finalBlob);
    };
  });
}
