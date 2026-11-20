import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Camera,
  CheckCircle2,
  CircleDot,
  ImagePlus,
  RefreshCw,
  Square,
  Upload,
  Video,
  X,
} from 'lucide-react';
import { useVibe } from '../context/VibeContext';
import type { MediaAttachment } from '../types';
import { uploadMediaWithProgress } from '../utils/api';

function formatBytes(bytes: number): string {
  if (bytes < 1024 * 1024) {
    return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDuration(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export function MediaDisplay({
  media,
  alt = 'Uploaded vibe media',
  compact = false,
}: {
  media: MediaAttachment;
  alt?: string;
  compact?: boolean;
}) {
  const [broken, setBroken] = useState(false);

  if (broken) {
    return (
      <div className="rounded-2xl border border-slate-200/80 dark:border-white/10 bg-slate-100 dark:bg-white/5 p-4 text-xs text-slate-500 dark:text-slate-400 text-center">
        Media unavailable
      </div>
    );
  }

  if (media.mediaType === 'video') {
    return (
      <div className="rounded-2xl overflow-hidden border border-slate-200/80 dark:border-white/10 bg-black/90">
        <video
          src={media.url}
          controls
          playsInline
          preload="metadata"
          onError={() => setBroken(true)}
          className={`w-full object-cover ${compact ? 'max-h-52' : 'max-h-80'}`}
        />
      </div>
    );
  }

  return (
    <div className="rounded-2xl overflow-hidden border border-slate-200/80 dark:border-white/10 bg-slate-100 dark:bg-white/5">
      <img
        src={media.url}
        alt={alt}
        referrerPolicy="no-referrer"
        onError={() => setBroken(true)}
        className={`w-full object-cover ${compact ? 'max-h-52' : 'max-h-80'}`}
      />
    </div>
  );
}

export function MediaUploader({
  value,
  onChange,
  variant = 'default',
}: {
  value: MediaAttachment | null;
  onChange: (media: MediaAttachment | null) => void;
  variant?: 'default' | 'compact';
}) {
  const { showToast } = useVibe();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const nativeCameraPhotoRef = useRef<HTMLInputElement>(null);
  const nativeCameraVideoRef = useRef<HTMLInputElement>(null);

  // Upload & local preview thumbnail state
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [localPreview, setLocalPreview] = useState<{
    objectUrl: string;
    mediaType: 'image' | 'video';
    fileName: string;
    fileSize: number;
  } | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const latestObjectUrlRef = useRef<string | null>(null);

  // Live Camera Modal state
  const [cameraOpen, setCameraOpen] = useState(false);
  const [cameraMode, setCameraMode] = useState<'photo' | 'video'>('photo');
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [recording, setRecording] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);

  const stopCameraStream = useCallback(() => {
    if (timerRef.current) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (recorderRef.current && recorderRef.current.state !== 'inactive') {
      recorderRef.current.stop();
    }
    recorderRef.current = null;
    setRecording(false);
    setRecordSeconds(0);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      stopCameraStream();
      if (latestObjectUrlRef.current) {
        URL.revokeObjectURL(latestObjectUrlRef.current);
        latestObjectUrlRef.current = null;
      }
    };
  }, [stopCameraStream]);

  const startCamera = useCallback(
    async (mode: 'photo' | 'video', facing: 'user' | 'environment') => {
      stopCameraStream();
      setCameraError(null);

      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setCameraError(
          'Live camera preview is unavailable in this browser. Use Upload File or native mobile camera below.'
        );
        return;
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: facing, width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: mode === 'video',
        });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play().catch(() => {});
        }
      } catch (err) {
        const msg =
          err instanceof Error && err.name === 'NotAllowedError'
            ? 'Camera permission was denied. Allow camera access in your browser or choose a file instead.'
            : 'Could not access your device camera. You can still upload a photo or video file directly.';
        setCameraError(msg);
      }
    },
    [stopCameraStream]
  );

  useEffect(() => {
    if (cameraOpen) {
      startCamera(cameraMode, facingMode);
    } else {
      stopCameraStream();
    }
  }, [cameraOpen, cameraMode, facingMode, startCamera, stopCameraStream]);

  const processUploadFile = useCallback(
    async (file: File) => {
      const mediaType: 'image' | 'video' = file.type.toLowerCase().startsWith('video')
        ? 'video'
        : 'image';
      const objectUrl = URL.createObjectURL(file);

      if (latestObjectUrlRef.current) {
        URL.revokeObjectURL(latestObjectUrlRef.current);
      }
      latestObjectUrlRef.current = objectUrl;

      setLocalPreview({
        objectUrl,
        mediaType,
        fileName: file.name || (mediaType === 'image' ? 'camera-photo.jpg' : 'camera-video.webm'),
        fileSize: file.size,
      });
      setUploading(true);
      setProgress(5);

      const controller = new AbortController();
      abortControllerRef.current = controller;

      try {
        const uploaded = await uploadMediaWithProgress(
          file,
          (pct) => setProgress(pct),
          controller.signal
        );
        onChange(uploaded);
        showToast(
          uploaded.mediaType === 'image' ? 'Photo attached' : 'Video attached',
          'success'
        );
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Upload failed.';
        if (message !== 'Upload cancelled.') {
          showToast(message, 'error');
        }
        URL.revokeObjectURL(objectUrl);
        if (latestObjectUrlRef.current === objectUrl) {
          latestObjectUrlRef.current = null;
        }
        setLocalPreview(null);
      } finally {
        setUploading(false);
        setProgress(0);
        abortControllerRef.current = null;
      }
    },
    [onChange, showToast]
  );

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (file) {
      processUploadFile(file);
    }
  };

  const handleCancelUpload = () => {
    abortControllerRef.current?.abort();
  };

  const handleClearMedia = () => {
    if (latestObjectUrlRef.current) {
      URL.revokeObjectURL(latestObjectUrlRef.current);
      latestObjectUrlRef.current = null;
    }
    setLocalPreview(null);
    onChange(null);
  };

  const handleSnapPhoto = () => {
    const videoEl = videoRef.current;
    if (!videoEl || videoEl.videoWidth === 0) return;

    const canvas = document.createElement('canvas');
    canvas.width = videoEl.videoWidth;
    canvas.height = videoEl.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (facingMode === 'user') {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(videoEl, 0, 0, canvas.width, canvas.height);

    canvas.toBlob(
      (blob) => {
        if (!blob) {
          showToast('Failed to capture photo frame.', 'error');
          return;
        }
        const photoFile = new File([blob], `vibe-snap-${Date.now()}.jpg`, {
          type: 'image/jpeg',
        });
        setCameraOpen(false);
        processUploadFile(photoFile);
      },
      'image/jpeg',
      0.92
    );
  };

  const stopRecording = useCallback(() => {
    if (timerRef.current) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (recorderRef.current && recorderRef.current.state !== 'inactive') {
      recorderRef.current.stop();
    }
    setRecording(false);
  }, []);

  const startRecording = () => {
    if (!streamRef.current) return;
    if (typeof MediaRecorder === 'undefined') {
      showToast('Video recording is not supported in this browser.', 'error');
      return;
    }
    chunksRef.current = [];

    const preferredTypes = [
      'video/webm;codecs=vp9,opus',
      'video/webm;codecs=vp8,opus',
      'video/webm',
      'video/mp4',
    ];
    const supportedType =
      typeof MediaRecorder.isTypeSupported === 'function'
        ? preferredTypes.find((t) => MediaRecorder.isTypeSupported(t)) || ''
        : '';

    try {
      const recorder = supportedType
        ? new MediaRecorder(streamRef.current, { mimeType: supportedType })
        : new MediaRecorder(streamRef.current);

      recorder.ondataavailable = (ev) => {
        if (ev.data && ev.data.size > 0) {
          chunksRef.current.push(ev.data);
        }
      };

      recorder.onstop = () => {
        const rawMime = recorder.mimeType || supportedType || 'video/webm';
        const baseMime = rawMime.split(';')[0].trim().toLowerCase();
        const ext = baseMime.includes('mp4') ? 'mp4' : 'webm';
        const blob = new Blob(chunksRef.current, { type: baseMime });
        if (blob.size > 0) {
          const videoFile = new File([blob], `vibe-clip-${Date.now()}.${ext}`, {
            type: baseMime,
          });
          setCameraOpen(false);
          processUploadFile(videoFile);
        }
      };

      recorderRef.current = recorder;
      recorder.start(250);
      setRecording(true);
      setRecordSeconds(0);

      timerRef.current = window.setInterval(() => {
        setRecordSeconds((prev) => {
          if (prev + 1 >= 30) {
            stopRecording();
            return 30;
          }
          return prev + 1;
        });
      }, 1000);
    } catch {
      showToast('Video recording is not supported on this device.', 'error');
    }
  };

  const openCamera = (mode: 'photo' | 'video') => {
    setCameraMode(mode);
    setCameraOpen(true);
  };

  const previewSrc = value?.url || localPreview?.objectUrl || '';
  const previewType = value?.mediaType || localPreview?.mediaType;

  return (
    <div className="space-y-3">
      {/* Hidden File Inputs */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif,video/mp4,video/webm,video/quicktime"
        onChange={handleFileInput}
        className="hidden"
      />
      <input
        ref={nativeCameraPhotoRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileInput}
        className="hidden"
      />
      <input
        ref={nativeCameraVideoRef}
        type="file"
        accept="video/*"
        capture="environment"
        onChange={handleFileInput}
        className="hidden"
      />

      {/* Action Buttons when no media is attached or uploading */}
      {!value && !uploading && (
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => openCamera('photo')}
            className={`${
              variant === 'compact' ? 'px-3 py-1.5 text-xs' : 'px-3.5 py-2 text-xs'
            } min-h-[38px] rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-slate-800 dark:text-slate-100 font-semibold inline-flex items-center gap-1.5 hover:border-violet-400 dark:hover:border-violet-400/50 transition-colors cursor-pointer`}
          >
            <Camera className="w-3.5 h-3.5 text-violet-600 dark:text-violet-300" />
            <span>Capture Photo</span>
          </button>

          <button
            type="button"
            onClick={() => openCamera('video')}
            className={`${
              variant === 'compact' ? 'px-3 py-1.5 text-xs' : 'px-3.5 py-2 text-xs'
            } min-h-[38px] rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-slate-800 dark:text-slate-100 font-semibold inline-flex items-center gap-1.5 hover:border-pink-400 dark:hover:border-pink-400/50 transition-colors cursor-pointer`}
          >
            <Video className="w-3.5 h-3.5 text-pink-600 dark:text-pink-400" />
            <span>Record Video</span>
          </button>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className={`${
              variant === 'compact' ? 'px-3 py-1.5 text-xs' : 'px-3.5 py-2 text-xs'
            } min-h-[38px] rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-slate-700 dark:text-slate-300 font-semibold inline-flex items-center gap-1.5 hover:border-sky-400 dark:hover:border-sky-400/50 transition-colors cursor-pointer`}
          >
            <ImagePlus className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
            <span>Upload File</span>
          </button>
        </div>
      )}

      {/* Preview Thumbnail + Progress Indicator Card */}
      {(uploading || value) && previewSrc && previewType && (
        <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50/80 dark:bg-white/[0.04] p-3 flex items-center gap-3.5">
          {/* Square Preview Thumbnail */}
          <div className="relative w-20 h-20 rounded-xl overflow-hidden shrink-0 bg-slate-900 border border-slate-200/70 dark:border-white/10">
            {previewType === 'video' ? (
              <video
                src={previewSrc}
                muted
                playsInline
                preload="metadata"
                className="w-full h-full object-cover"
              />
            ) : (
              <img
                src={previewSrc}
                alt="Media preview thumbnail"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
            )}
            {uploading && (
              <div className="absolute inset-0 bg-black/55 flex items-center justify-center">
                <span className="text-xs font-mono font-bold text-white tabular-nums">
                  {progress}%
                </span>
              </div>
            )}
          </div>

          {/* Status & Progress Bar */}
          <div className="min-w-0 flex-1 space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                {localPreview?.fileName ||
                  (previewType === 'video' ? 'Attached Video Clip' : 'Attached Photo')}
              </p>
              {uploading ? (
                <button
                  type="button"
                  onClick={handleCancelUpload}
                  className="text-xs font-semibold text-rose-600 dark:text-rose-400 hover:underline shrink-0 cursor-pointer"
                >
                  Cancel
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleClearMedia}
                  aria-label="Remove attached media"
                  className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors shrink-0 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {uploading ? (
              <div className="space-y-1">
                <div className="h-2 w-full rounded-full bg-slate-200 dark:bg-white/10 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-violet-600 via-fuchsia-500 to-pink-500 transition-all duration-150"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono tabular-nums">
                  Uploading {previewType === 'video' ? 'video' : 'photo'} · {progress}%
                  {localPreview ? ` · ${formatBytes(localPreview.fileSize)}` : ''}
                </p>
              </div>
            ) : (
              <div className="flex items-center justify-between gap-2 text-xs text-slate-600 dark:text-slate-300">
                <span className="inline-flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>
                    {previewType === 'video' ? 'Video ready' : 'Photo ready'}
                    {localPreview ? ` · ${formatBytes(localPreview.fileSize)}` : ''}
                  </span>
                </span>
                <button
                  type="button"
                  onClick={() => openCamera(previewType === 'video' ? 'video' : 'photo')}
                  className="text-xs font-semibold text-violet-700 dark:text-violet-300 hover:underline cursor-pointer"
                >
                  Retake
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Live Device Camera Capture Modal */}
      {cameraOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md"
          role="dialog"
          aria-modal="true"
          aria-label="Camera capture"
        >
          <div className="w-full max-w-lg rounded-3xl bg-[#120F1D] text-white border border-white/15 shadow-2xl overflow-hidden">
            {/* Modal Top Bar */}
            <div className="px-5 py-4 flex items-center justify-between border-b border-white/10">
              <div className="flex items-center gap-1 p-1 rounded-xl bg-white/10">
                <button
                  type="button"
                  disabled={recording}
                  onClick={() => setCameraMode('photo')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                    cameraMode === 'photo'
                      ? 'bg-white text-slate-950'
                      : 'text-white/75 hover:text-white'
                  }`}
                >
                  Photo
                </button>
                <button
                  type="button"
                  disabled={recording}
                  onClick={() => setCameraMode('video')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                    cameraMode === 'video'
                      ? 'bg-white text-slate-950'
                      : 'text-white/75 hover:text-white'
                  }`}
                >
                  Video
                </button>
              </div>

              <div className="flex items-center gap-2">
                {recording && (
                  <span className="text-xs font-mono tabular-nums text-rose-400 font-semibold">
                    REC {formatDuration(recordSeconds)} / 00:30
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => setCameraOpen(false)}
                  aria-label="Close camera"
                  className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Viewfinder */}
            <div className="relative aspect-[4/3] bg-black flex items-center justify-center">
              {cameraError ? (
                <div className="p-6 text-center space-y-4 max-w-sm">
                  <p className="text-sm text-white/85 leading-relaxed">{cameraError}</p>
                  <div className="flex flex-wrap items-center justify-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setCameraOpen(false);
                        if (cameraMode === 'photo') {
                          nativeCameraPhotoRef.current?.click();
                        } else {
                          nativeCameraVideoRef.current?.click();
                        }
                      }}
                      className="px-4 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
                    >
                      <Camera className="w-3.5 h-3.5" />
                      <span>Device Camera App</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setCameraOpen(false);
                        fileInputRef.current?.click();
                      }}
                      className="px-4 py-2.5 rounded-xl bg-white/15 hover:bg-white/25 text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>Choose File</span>
                    </button>
                  </div>
                </div>
              ) : (
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className={`w-full h-full object-cover ${
                    facingMode === 'user' ? '-scale-x-100' : ''
                  }`}
                />
              )}
            </div>

            {/* Bottom Controls */}
            {!cameraError && (
              <div className="px-6 py-5 flex items-center justify-between gap-4 border-t border-white/10">
                <button
                  type="button"
                  disabled={recording}
                  onClick={() =>
                    setFacingMode((f) => (f === 'environment' ? 'user' : 'environment'))
                  }
                  className="px-3.5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 disabled:opacity-40 text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Flip</span>
                </button>

                {cameraMode === 'photo' ? (
                  <button
                    type="button"
                    onClick={handleSnapPhoto}
                    className="px-6 py-3 rounded-2xl bg-gradient-to-r from-violet-600 via-fuchsia-600 to-pink-500 hover:brightness-110 text-sm font-semibold inline-flex items-center gap-2 cursor-pointer"
                  >
                    <Camera className="w-4 h-4" />
                    <span>Take Photo</span>
                  </button>
                ) : !recording ? (
                  <button
                    type="button"
                    onClick={startRecording}
                    className="px-6 py-3 rounded-2xl bg-rose-600 hover:bg-rose-500 text-sm font-semibold inline-flex items-center gap-2 cursor-pointer"
                  >
                    <CircleDot className="w-4 h-4" />
                    <span>Start Recording</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={stopRecording}
                    className="px-6 py-3 rounded-2xl bg-white text-slate-950 hover:bg-white/90 text-sm font-bold inline-flex items-center gap-2 cursor-pointer"
                  >
                    <Square className="w-4 h-4 fill-current" />
                    <span>Stop &amp; Attach</span>
                  </button>
                )}

                <button
                  type="button"
                  disabled={recording}
                  onClick={() => {
                    setCameraOpen(false);
                    fileInputRef.current?.click();
                  }}
                  className="px-3.5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 disabled:opacity-40 text-xs font-semibold cursor-pointer"
                >
                  Gallery
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
