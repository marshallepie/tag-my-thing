import React, { useRef, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Camera, Video, RotateCcw, Check, X } from 'lucide-react';
import { Button } from '../ui/Button';

interface CameraCaptureProps {
  onCapture: (file: File, type: 'photo' | 'video') => void;
  onCancel: () => void;
}

export const CameraCapture: React.FC<CameraCaptureProps> = ({ onCapture, onCancel }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [mode, setMode] = useState<'photo' | 'video'>('photo');
  const [capturedMedia, setCapturedMedia] = useState<{ url: string; type: 'photo' | 'video' } | null>(null);

  React.useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
    };
  }, []);

  React.useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRecording) {
      interval = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
        audio: mode === 'video',
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setStream(mediaStream);
    } catch (error) {
      console.error('Error accessing camera:', error);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const video = videoRef.current;
    const context = canvas.getContext('2d');

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    context?.drawImage(video, 0, 0);

    canvas.toBlob((blob) => {
      if (blob) {
        const url = URL.createObjectURL(blob);
        setCapturedMedia({ url, type: 'photo' });
      }
    }, 'image/jpeg', 0.8);
  }, []);

  const startVideoRecording = useCallback(() => {
    if (!stream) return;

    const mediaRecorder = new MediaRecorder(stream);
    const chunks: Blob[] = [];

    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        chunks.push(event.data);
      }
    };

    mediaRecorder.onstop = () => {
      const blob = new Blob(chunks, { type: 'video/webm' });
      const url = URL.createObjectURL(blob);
      setCapturedMedia({ url, type: 'video' });
    };

    mediaRecorderRef.current = mediaRecorder;
    mediaRecorder.start();
    setIsRecording(true);
    setRecordingTime(0);
  }, [stream]);

  const stopVideoRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  }, [isRecording]);

  const handleCapture = () => {
    if (mode === 'photo') {
      capturePhoto();
    } else {
      if (isRecording) {
        stopVideoRecording();
      } else {
        startVideoRecording();
      }
    }
  };

  const confirmCapture = () => {
    if (capturedMedia) {
      // Convert blob URL to File
      fetch(capturedMedia.url)
        .then(res => res.blob())
        .then(blob => {
          const file = new File([blob], `capture.${capturedMedia.type === 'photo' ? 'jpg' : 'webm'}`, {
            type: capturedMedia.type === 'photo' ? 'image/jpeg' : 'video/webm',
          });
          onCapture(file, capturedMedia.type);
        });
    }
  };

  const retake = () => {
    setCapturedMedia(null);
    if (mode === 'video') {
      startCamera();
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      {/* Camera View */}
      <div className="flex-1 relative overflow-hidden">
        {capturedMedia ? (
          <div className="w-full h-full flex items-center justify-center bg-black">
            {capturedMedia.type === 'photo' ? (
              <img
                src={capturedMedia.url}
                alt="Captured"
                className="max-w-full max-h-full object-contain"
              />
            ) : (
              <video
                src={capturedMedia.url}
                controls
                className="max-w-full max-h-full object-contain"
              />
            )}
          </div>
        ) : (
          <>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
            <canvas ref={canvasRef} className="hidden" />
          </>
        )}

        {/* Recording indicator */}
        {isRecording && (
          <motion.div
            animate={{ opacity: [1, 0.5, 1] }}
            transition={{ repeat: Infinity, duration: 1 }}
            className="absolute top-4 left-4 bg-error-600 text-white px-3 py-1 rounded-full flex items-center space-x-2"
          >
            <div className="w-2 h-2 bg-white rounded-full" />
            <span className="text-sm font-medium">REC {formatTime(recordingTime)}</span>
          </motion.div>
        )}

        {/* Mode indicator */}
        <div className="absolute top-4 right-4 bg-black bg-opacity-50 text-white px-3 py-1 rounded-full">
          <span className="text-sm font-medium capitalize">{mode}</span>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-black bg-opacity-90 p-4 space-y-4">
        {capturedMedia ? (
          <div className="flex justify-center space-x-4">
            <Button
              variant="outline"
              onClick={retake}
              className="bg-white text-black border-white hover:bg-gray-100"
            >
              <RotateCcw className="h-5 w-5 mr-2" />
              Retake
            </Button>
            <Button
              onClick={confirmCapture}
              className="bg-primary-600 hover:bg-primary-700"
            >
              <Check className="h-5 w-5 mr-2" />
              Use This
            </Button>
          </div>
        ) : (
          <>
            {/* Mode Toggle */}
            <div className="flex justify-center">
              <div className="bg-gray-800 rounded-lg p-1 flex">
                <Button
                  variant={mode === 'photo' ? 'primary' : 'ghost'}
                  size="sm"
                  onClick={() => setMode('photo')}
                  className={mode === 'photo' ? '' : 'text-white hover:bg-gray-700'}
                >
                  <Camera className="h-4 w-4 mr-1" />
                  Photo
                </Button>
                <Button
                  variant={mode === 'video' ? 'primary' : 'ghost'}
                  size="sm"
                  onClick={() => setMode('video')}
                  className={mode === 'video' ? '' : 'text-white hover:bg-gray-700'}
                >
                  <Video className="h-4 w-4 mr-1" />
                  Video
                </Button>
              </div>
            </div>

            {/* Capture Controls */}
            <div className="flex justify-center items-center space-x-8">
              <Button
                variant="ghost"
                onClick={onCancel}
                className="text-white hover:bg-gray-800"
              >
                <X className="h-6 w-6" />
              </Button>

              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={handleCapture}
                className={`
                  w-16 h-16 rounded-full border-4 border-white flex items-center justify-center
                  ${isRecording ? 'bg-error-600' : 'bg-transparent hover:bg-white hover:bg-opacity-20'}
                  transition-colors
                `}
              >
                {mode === 'photo' ? (
                  <div className="w-10 h-10 bg-white rounded-full" />
                ) : isRecording ? (
                  <div className="w-6 h-6 bg-white rounded-sm" />
                ) : (
                  <div className="w-10 h-10 bg-error-600 rounded-full" />
                )}
              </motion.button>

              <div className="w-12" /> {/* Spacer */}
            </div>
          </>
        )}
      </div>
    </div>
  );
};