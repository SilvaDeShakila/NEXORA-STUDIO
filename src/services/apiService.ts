/**
 * NEXORA STUDIO — Backend API Service Client
 * Provides seamless communication with the Python FastAPI engine.
 * Automatically checks connection and degrades gracefully to in-browser rendering
 * when the Python service is offline.
 */

const resolveApiBaseUrl = (rawUrl?: string): string => {
  const url = (rawUrl || 'http://127.0.0.1:8000').trim().replace(/\/+$/, '');
  return url.endsWith('/api') ? url : `${url}/api`;
};

const API_BASE_URL = resolveApiBaseUrl(import.meta.env.VITE_API_URL);

export interface SystemHealthResponse {
  status: string;
  app_name: string;
  version: string;
  ffmpeg_available: boolean;
  ffprobe_available: boolean;
  quicksync_hardware_accel: boolean;
  recommended_encoder: string;
  database: string;
  hardware_target: string;
}

export interface MediaMetadataResponse {
  filename: string;
  duration: number;
  size_bytes: number;
  bitrate: number;
  format_name: string;
  has_video: boolean;
  has_audio: boolean;
  width: number;
  height: number;
  video_codec?: string;
  audio_codec?: string;
  frame_rate: number;
}

export interface ExportJobResponse {
  job_id: string;
  status: 'queued' | 'processing' | 'completed' | 'failed' | 'cancelled';
  progress: number;
  resolution?: string;
  output_filename?: string;
  error_message?: string;
}

export const apiService = {
  /**
   * Ping backend health endpoint
   */
  async checkHealth(): Promise<{ isOnline: boolean; health?: SystemHealthResponse }> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000);
      
      const res = await fetch(`${API_BASE_URL}/health`, {
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        return { isOnline: true, health: data };
      }
      return { isOnline: false };
    } catch {
      return { isOnline: false };
    }
  },

  /**
   * Probe uploaded media file using FFprobe
   */
  async getMetadata(file: File): Promise<MediaMetadataResponse> {
    const formData = new FormData();
    formData.append('file', file);

    const res = await fetch(`${API_BASE_URL}/media/metadata`, {
      method: 'POST',
      body: formData,
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Failed to extract metadata' }));
      throw new Error(err.detail || 'Metadata extraction failed');
    }
    return res.json();
  },

  /**
   * Generate video thumbnail using backend FFmpeg
   */
  async generateThumbnail(file: File, timestamp = 1.0): Promise<string> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('timestamp', timestamp.toString());

    const res = await fetch(`${API_BASE_URL}/media/thumbnail`, {
      method: 'POST',
      body: formData,
    });

    if (!res.ok) {
      throw new Error('Thumbnail generation failed');
    }
    const blob = await res.blob();
    return URL.createObjectURL(blob);
  },

  /**
   * Extract audio using backend FFmpeg
   */
  async extractAudio(file: File, format = 'mp3'): Promise<Blob> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('audio_format', format);

    const res = await fetch(`${API_BASE_URL}/media/extract-audio`, {
      method: 'POST',
      body: formData,
    });

    if (!res.ok) {
      throw new Error('Audio extraction failed');
    }
    return res.blob();
  },

  /**
   * Queue backend video export job
   */
  async createExportJob(file: File, resolution = '1080p', fps = 30, bitrate = 'high'): Promise<ExportJobResponse> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('resolution', resolution);
    formData.append('fps', fps.toString());
    formData.append('bitrate', bitrate);

    const res = await fetch(`${API_BASE_URL}/jobs/export`, {
      method: 'POST',
      body: formData,
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Export job creation failed' }));
      throw new Error(err.detail || 'Export failed');
    }
    return res.json();
  },

  /**
   * Poll export job status
   */
  async getJobStatus(jobId: string): Promise<ExportJobResponse> {
    const res = await fetch(`${API_BASE_URL}/jobs/${jobId}`);
    if (!res.ok) {
      throw new Error('Job not found');
    }
    return res.json();
  },

  /**
   * Cancel in-progress export job
   */
  async cancelJob(jobId: string): Promise<void> {
    await fetch(`${API_BASE_URL}/jobs/${jobId}/cancel`, { method: 'POST' });
  },

  /**
   * Download completed export job video
   */
  async downloadJob(jobId: string): Promise<Blob> {
    const res = await fetch(`${API_BASE_URL}/jobs/${jobId}/download`);
    if (!res.ok) {
      throw new Error('Unable to download completed export');
    }
    return res.blob();
  }
};
