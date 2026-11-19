import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Camera, Upload, RotateCcw, Trash2, MapPin, RefreshCw, X } from 'lucide-react';
import { GeotaggedImage } from '../types';

interface GeotaggedCameraProps {
  value: GeotaggedImage | null;
  onChange: (image: GeotaggedImage | null) => void;
  label?: string;
}

type GpsState =
  | { status: 'idle' }
  | { status: 'acquiring' }
  | { status: 'ready'; latitude: number; longitude: number; accuracy: number | null }
  | { status: 'unavailable'; reason: string };

export function formatCoordinates(lat: number, lng: number): string {
  const latDir = lat >= 0 ? 'N' : 'S';
  const lngDir = lng >= 0 ? 'E' : 'W';
  return `${Math.abs(lat).toFixed(5)}° ${latDir}, ${Math.abs(lng).toFixed(5)}° ${lngDir}`;
}

export const GeotaggedCamera: React.FC<GeotaggedCameraProps> = ({
  value,
  onChange,
  label = 'Item Image (Optional)'
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [gpsState, setGpsState] = useState<GpsState>({ status: 'idle' });

  const stopCameraStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      stopCameraStream();
    };
  }, [stopCameraStream]);

  const requestGpsFix = useCallback((): Promise<{
    latitude: number | null;
    longitude: number | null;
    accuracy: number | null;
  }> => {
    return new Promise((resolve) => {
      if (!('geolocation' in navigator)) {
        setGpsState({
          status: 'unavailable',
          reason: 'Geolocation is not supported by this browser.'
        });
        resolve({ latitude: null, longitude: null, accuracy: null });
        return;
      }

      setGpsState({ status: 'acquiring' });
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const coords = {
            latitude: Number(pos.coords.latitude.toFixed(6)),
            longitude: Number(pos.coords.longitude.toFixed(6)),
            accuracy: pos.coords.accuracy ? Math.round(pos.coords.accuracy) : null
          };
          setGpsState({
            status: 'ready',
            latitude: coords.latitude,
            longitude: coords.longitude,
            accuracy: coords.accuracy
          });
          resolve(coords);
        },
        () => {
          setGpsState({
            status: 'unavailable',
            reason: 'Location permission denied or unavailable — continuing without geotag.'
          });
          resolve({ latitude: null, longitude: null, accuracy: null });
        },
        {
          enableHighAccuracy: true,
          timeout: 6500,
          maximumAge: 15000
        }
      );
    });
  }, []);

  const startCamera = useCallback(
    async (preferredFacing: 'environment' | 'user' = facingMode) => {
      setCameraError(null);
      stopCameraStream();

      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setCameraError('Camera access is not supported in this browser.');
        return;
      }

      try {
        let mediaStream: MediaStream;
        try {
          mediaStream = await navigator.mediaDevices.getUserMedia({
            video: {
              facingMode: { ideal: preferredFacing },
              width: { ideal: 1280 },
              height: { ideal: 720 }
            },
            audio: false
          });
        } catch {
          mediaStream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: false
          });
        }

        streamRef.current = mediaStream;
        setIsCameraOpen(true);

        // Request location permission concurrently without blocking camera startup
        void requestGpsFix();

        requestAnimationFrame(() => {
          if (videoRef.current && streamRef.current) {
            videoRef.current.srcObject = streamRef.current;
            void videoRef.current.play().catch(() => {});
          }
        });
      } catch {
        setIsCameraOpen(false);
        setCameraError(
          'Unable to access camera. Please allow camera permission in your browser or upload a photo from your device.'
        );
      }
    },
    [facingMode, requestGpsFix, stopCameraStream]
  );

  const handleCloseCamera = () => {
    stopCameraStream();
    setIsCameraOpen(false);
  };

  const handleSwitchCamera = () => {
    const nextMode = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(nextMode);
    void startCamera(nextMode);
  };

  const handleCapturePhoto = async () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    setIsCapturing(true);

    // Ensure canvas matches video feed dimensions
    const width = video.videoWidth || 1280;
    const height = video.videoHeight || 720;
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      setIsCapturing(false);
      return;
    }

    ctx.drawImage(video, 0, 0, width, height);
    const imageUrl = canvas.toDataURL('image/jpeg', 0.88);
    const capturedAt = new Date().toISOString();

    // Use already acquired GPS fix if ready, otherwise try quick lookup
    let latitude: number | null = null;
    let longitude: number | null = null;
    let accuracy: number | null = null;

    if (gpsState.status === 'ready') {
      latitude = gpsState.latitude;
      longitude = gpsState.longitude;
      accuracy = gpsState.accuracy;
    } else if (gpsState.status !== 'unavailable') {
      const fix = await requestGpsFix();
      latitude = fix.latitude;
      longitude = fix.longitude;
      accuracy = fix.accuracy;
    }

    stopCameraStream();
    setIsCameraOpen(false);
    setIsCapturing(false);

    onChange({
      imageUrl,
      latitude,
      longitude,
      accuracy,
      capturedAt,
      source: 'camera'
    });
  };

  const handleRetake = () => {
    onChange(null);
    void startCamera(facingMode);
  };

  const handleDiscard = () => {
    stopCameraStream();
    setIsCameraOpen(false);
    onChange(null);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async () => {
      if (typeof reader.result === 'string') {
        const imageData = reader.result;
        const fix = await requestGpsFix();
        onChange({
          imageUrl: imageData,
          latitude: fix.latitude,
          longitude: fix.longitude,
          accuracy: fix.accuracy,
          capturedAt: new Date().toISOString(),
          source: 'upload'
        });
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-2">
      <span className="block text-xs sm:text-sm font-medium text-[#191816]">
        {label}
      </span>

      <canvas ref={canvasRef} className="hidden" aria-hidden="true" />

      {/* State 1: Live Built-in Camera Viewfinder */}
      {isCameraOpen && (
        <div className="rounded-xl overflow-hidden border border-[#E5DFD6] bg-[#191816] text-white">
          <div className="relative aspect-video w-full bg-black flex items-center justify-center overflow-hidden">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />

            {/* Top Camera Overlay Controls */}
            <div className="absolute top-3 inset-x-3 flex items-center justify-between gap-2">
              <div className="px-2.5 py-1 rounded-md bg-black/65 backdrop-blur-xs text-[11px] font-mono tabular-nums text-white flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-[#DF6A18] shrink-0" />
                {gpsState.status === 'acquiring' && <span>Acquiring GPS...</span>}
                {gpsState.status === 'ready' && (
                  <span>{formatCoordinates(gpsState.latitude, gpsState.longitude)}</span>
                )}
                {(gpsState.status === 'unavailable' || gpsState.status === 'idle') && (
                  <span>No GPS fix (optional)</span>
                )}
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handleSwitchCamera}
                  aria-label="Switch camera"
                  className="p-2 rounded-md bg-black/65 hover:bg-black/80 text-white transition-colors cursor-pointer"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={handleCloseCamera}
                  aria-label="Close camera"
                  className="p-2 rounded-md bg-black/65 hover:bg-black/80 text-white transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          <div className="p-3.5 bg-[#232220] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <p className="text-xs text-[#D6D0C6]">
              {gpsState.status === 'unavailable'
                ? gpsState.reason
                : 'Photo will automatically include campus GPS coordinates if available.'}
            </p>
            <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
              <button
                type="button"
                onClick={handleCloseCamera}
                className="px-3.5 py-2 text-xs font-medium text-[#D6D0C6] hover:text-white cursor-pointer whitespace-nowrap shrink-0"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isCapturing}
                onClick={handleCapturePhoto}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#146B32] hover:bg-[#0E4F24] disabled:opacity-60 rounded-lg transition-colors cursor-pointer whitespace-nowrap shrink-0"
              >
                <Camera className="w-3.5 h-3.5" />
                <span>{isCapturing ? 'Capturing...' : 'Capture Photo'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* State 2: Captured / Attached Image Preview with Retake & Discard */}
      {!isCameraOpen && value && (
        <div className="rounded-xl overflow-hidden border border-[#E5DFD6] bg-[#FAF8F5]">
          <div className="relative h-52 w-full bg-[#EFECE5]">
            <img
              src={value.imageUrl}
              alt="Captured item preview"
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
            />
          </div>

          <div className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-[#E5DFD6] bg-white">
            <div className="text-xs text-[#625D55] space-y-0.5">
              {value.latitude !== null && value.longitude !== null ? (
                <p className="font-mono tabular-nums text-[#146B32] font-medium flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 shrink-0" />
                  <span>
                    Geotagged: {formatCoordinates(value.latitude, value.longitude)}
                    {value.accuracy ? ` (±${value.accuracy}m)` : ''}
                  </span>
                </p>
              ) : (
                <p className="text-[#625D55]">Attached without GPS coordinates</p>
              )}
              <p className="tabular-nums text-[11px] text-[#625D55]">
                Captured {new Date(value.capturedAt).toLocaleString('en-IN')}
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {value.source === 'camera' && (
                <button
                  type="button"
                  onClick={handleRetake}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#191816] bg-[#FAF8F5] hover:bg-[#EFECE5] border border-[#E5DFD6] rounded-lg transition-colors cursor-pointer whitespace-nowrap shrink-0"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Retake</span>
                </button>
              )}
              <button
                type="button"
                onClick={handleDiscard}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#B8520D] bg-[#FDF3EB] hover:bg-[#F9E5D4] border border-[#DF6A18]/30 rounded-lg transition-colors cursor-pointer whitespace-nowrap shrink-0"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Discard</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* State 3: Initial Trigger Controls (Built-in Geotagged Camera or File Upload) */}
      {!isCameraOpen && !value && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => void startCamera(facingMode)}
            className="flex items-center justify-center gap-2 py-3.5 px-4 rounded-lg border border-[#E5DFD6] bg-[#FAF8F5] hover:bg-[#EFECE5] hover:border-[#146B32] text-xs sm:text-sm font-medium text-[#191816] transition-colors cursor-pointer whitespace-nowrap shrink-0"
          >
            <Camera className="w-4 h-4 text-[#146B32] shrink-0" />
            <span>Open Geotagged Camera</span>
          </button>

          <label className="flex items-center justify-center gap-2 py-3.5 px-4 rounded-lg border border-dashed border-[#CFC7B8] bg-[#FAF8F5] hover:bg-[#EFECE5] hover:border-[#146B32] text-xs sm:text-sm font-medium text-[#625D55] hover:text-[#191816] transition-colors cursor-pointer whitespace-nowrap shrink-0">
            <Upload className="w-4 h-4 text-[#DF6A18] shrink-0" />
            <span>Upload Image from Device</span>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => void handleFileUpload(e)}
              className="sr-only"
            />
          </label>
        </div>
      )}

      {cameraError && (
        <p className="text-xs text-[#B8520D] mt-1">{cameraError}</p>
      )}
    </div>
  );
};
