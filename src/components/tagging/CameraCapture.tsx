import React, { useRef, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Camera, Video, RotateCcw, Check, X, Upload, Plus, Trash2, FileText, Image, Film } from 'lucide-react';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { getMediaTypeFromFile, getVideoDuration, formatFileSize, formatDuration } from '../../lib/tokenCalculator';

interface MediaFile {
  file: File;
  type: 'photo' | 'video' | 'pdf';
  duration?: number;
  preview?: string;
}

interface CameraCaptureProps {
  onCapture: (files: MediaFile[]) => void;
  onCancel: () => void;
}

export const CameraCapture: React.FC<CameraCaptureProps> = ({ onCapture, onCancel }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [mode, setMode] = useState<'camera' | 'upload'>('camera');
  const [cameraMode, setCameraMode] = useState<'photo' | 'video'>('photo');
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([]);
  const [capturedMedia, setCapturedMedia] = useState<{ url: string; type: 'photo' | 'video' } | null>(null);
  const [loading, setLoading] = useState(false);

  React.useEffect(() => {
    if (mode === 'camera') {
      startCamera();
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [mode, cameraMode]);

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
        audio: cameraMode === 'video',
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

  const handleCameraCapture = () => {
    if (cameraMode === 'photo') {
      capturePhoto();
    } else {
      if (isRecording) {
        stopVideoRecording();
      } else {
        startVideoRecording();
      }
    }
  };

  const confirmCameraCapture = async () => {
    if (capturedMedia) {
      setLoading(true);
      try {
        // Convert blob URL to File
        const response = await fetch(capturedMedia.url);
        const blob = await response.blob();
        const file = new File([blob], `capture.${capturedMedia.type === 'photo' ? 'jpg' : 'webm'}`, {
          type: capturedMedia.type === 'photo' ? 'image/jpeg' : 'video/webm',
        });

        const mediaFile: MediaFile = {
          file,
          type: capturedMedia.type,
          preview: capturedMedia.url,
        };

        // Get duration for videos
        if (capturedMedia.type === 'video') {
          try {
            mediaFile.duration = await getVideoDuration(file);
          } catch (error) {
            console.error('Error getting video duration:', error);
          }
        }

        setMediaFiles([mediaFile]);
        setCapturedMedia(null);
      } catch (error) {
        console.error('Error processing captured media:', error);
      } finally {
        setLoading(false);
      }
    }
  };

  const retake = () => {
    setCapturedMedia(null);
    if (cameraMode === 'video') {
      startCamera();
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;

    setLoading(true);
    const newMediaFiles: MediaFile[] = [];

    for (const file of files) {
      const mediaType = getMediaTypeFromFile(file);
      if (!mediaType) continue;

      const mediaFile: MediaFile = {
        file,
        type: mediaType,
        preview: URL.createObjectURL(file),
      };

      // Get duration for videos
      if (mediaType === 'video') {
        try {
          mediaFile.duration = await getVideoDuration(file);
        } catch (error) {
          console.error('Error getting video duration:', error);
        }
      }

      newMediaFiles.push(mediaFile);
    }

    setMediaFiles(prev => [...prev, ...newMediaFiles]);
    setLoading(false);

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeMediaFile = (index: number) => {
    setMediaFiles(prev => {
      const newFiles = [...prev];
      // Revoke object URL to prevent memory leaks
      if (newFiles[index].preview) {
        URL.revokeObjectURL(newFiles[index].preview!);
      }
      newFiles.splice(index, 1);
      return newFiles;
    });
  };

  const handleProceed = () => {
    if (mediaFiles.length > 0) {
      onCapture(mediaFiles);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getMediaIcon = (type: string) => {
    switch (type) {
      case 'photo': return <Image className="h-4 w-4" />;
      case 'video': return <Film className="h-4 w-4" />;
      case 'pdf': return <FileText className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  // If we have captured media from camera, show preview
  if (capturedMedia) {
    return (
      <div className="fixed inset-0 bg-black z-50 flex flex-col">
        <div className="flex-1 relative overflow-hidden">
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
        </div>

        <div className="bg-black bg-opacity-90 p-4">
          <div className="flex justify-center space-x-4">
            <Button
              variant="outline"
              onClick={retake}
              className="bg-white text-black border-white hover:bg-gray-100"
              disabled={loading}
            >
              <RotateCcw className="h-5 w-5 mr-2" />
              Retake
            </Button>
            <Button
              onClick={confirmCameraCapture}
              className="bg-primary-600 hover:bg-primary-700"
              loading={loading}
            >
              <Check className="h-5 w-5 mr-2" />
              Use This
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // If we have media files selected, show them with option to proceed
  if (mediaFiles.length > 0) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Selected Media</h1>
            <p className="text-gray-600">
              Review your selected media files before proceeding to tag your asset
            </p>
          </div>

          {/* Media Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {mediaFiles.map((mediaFile, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="relative overflow-hidden">
                  <div className="aspect-video bg-gray-100 overflow-hidden">
                    {mediaFile.type === 'photo' ? (
                      <img
                        src={mediaFile.preview}
                        alt={`Media ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    ) : mediaFile.type === 'video' ? (
                      <video
                        src={mediaFile.preview}
                        className="w-full h-full object-cover"
                        muted
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gray-200">
                        <FileText className="h-16 w-16 text-gray-400" />
                      </div>
                    )}
                  </div>

                  {/* Media Type Badge */}
                  <div className="absolute top-2 left-2">
                    <div className="bg-black bg-opacity-75 text-white px-2 py-1 rounded-full text-xs flex items-center">
                      {getMediaIcon(mediaFile.type)}
                      <span className="ml-1 capitalize">{mediaFile.type}</span>
                    </div>
                  </div>

                  {/* Remove Button */}
                  <button
                    onClick={() => removeMediaFile(index)}
                    className="absolute top-2 right-2 bg-error-600 text-white p-1 rounded-full hover:bg-error-700 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>

                  {/* File Info */}
                  <div className="p-4">
                    <h3 className="font-medium text-gray-900 mb-2 truncate">
                      {mediaFile.file.name}
                    </h3>
                    <div className="space-y-1 text-sm text-gray-600">
                      <div>Size: {formatFileSize(mediaFile.file.size)}</div>
                      {mediaFile.duration && (
                        <div>Duration: {formatDuration(mediaFile.duration)}</div>
                      )}
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}

            {/* Add More Button */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: mediaFiles.length * 0.1 }}
            >
              <Card className="aspect-video flex items-center justify-center border-2 border-dashed border-gray-300 hover:border-primary-400 transition-colors cursor-pointer">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex flex-col items-center space-y-2 text-gray-500 hover:text-primary-600 transition-colors"
                >
                  <Plus className="h-12 w-12" />
                  <span className="text-sm font-medium">Add More Media</span>
                </button>
              </Card>
            </motion.div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-4 justify-center">
            <Button
              variant="outline"
              onClick={() => {
                // Clean up preview URLs
                mediaFiles.forEach(file => {
                  if (file.preview) {
                    URL.revokeObjectURL(file.preview);
                  }
                });
                setMediaFiles([]);
                onCancel();
              }}
              className="flex-1 max-w-xs"
            >
              <X className="h-5 w-5 mr-2" />
              Cancel
            </Button>
            <Button
              onClick={handleProceed}
              className="flex-1 max-w-xs"
              disabled={mediaFiles.length === 0}
            >
              <Check className="h-5 w-5 mr-2" />
              Continue to Form
            </Button>
          </div>

          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*,video/*,.pdf"
            onChange={handleFileUpload}
            className="hidden"
          />
        </div>
      </div>
    );
  }

  // Main capture interface
  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      {/* Header */}
      <div className="bg-black bg-opacity-90 p-4">
        <div className="flex items-center justify-between">
          <h1 className="text-white text-lg font-semibold">Tag Your Asset</h1>
          <Button
            variant="ghost"
            onClick={onCancel}
            className="text-white hover:bg-gray-800"
          >
            <X className="h-6 w-6" />
          </Button>
        </div>
      </div>

      {/* Mode Selection */}
      <div className="bg-black bg-opacity-90 p-4">
        <div className="flex justify-center">
          <div className="bg-gray-800 rounded-lg p-1 flex">
            <Button
              variant={mode === 'camera' ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => setMode('camera')}
              className={mode === 'camera' ? '' : 'text-white hover:bg-gray-700'}
            >
              <Camera className="h-4 w-4 mr-1" />
              Camera
            </Button>
            <Button
              variant={mode === 'upload' ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => setMode('upload')}
              className={mode === 'upload' ? '' : 'text-white hover:bg-gray-700'}
            >
              <Upload className="h-4 w-4 mr-1" />
              Upload Files
            </Button>
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 relative overflow-hidden">
        {mode === 'camera' ? (
          <>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
            <canvas ref={canvasRef} className="hidden" />

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

            {/* Camera mode indicator */}
            <div className="absolute top-4 right-4 bg-black bg-opacity-50 text-white px-3 py-1 rounded-full">
              <span className="text-sm font-medium capitalize">{cameraMode}</span>
            </div>
          </>
        ) : (
          /* Upload Interface */
          <div className="w-full h-full flex items-center justify-center bg-gray-900">
            <div className="text-center max-w-md mx-auto p-8">
              <Upload className="h-24 w-24 text-gray-400 mx-auto mb-6" />
              <h2 className="text-2xl font-bold text-white mb-4">Upload Media Files</h2>
              <p className="text-gray-300 mb-8">
                Select photos, videos, or PDF documents to tag as your asset
              </p>
              
              <div className="space-y-4">
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  size="lg"
                  className="w-full"
                  loading={loading}
                >
                  <Upload className="h-5 w-5 mr-2" />
                  Choose Files
                </Button>
                
                <div className="text-xs text-gray-400 space-y-1">
                  <p>• Photos: JPG, PNG, WebP</p>
                  <p>• Videos: MP4, WebM, MOV, AVI (max 2, ≤120s, ≤60MB)</p>
                  <p>• PDFs: Documents (≤2MB)</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Controls */}
      {mode === 'camera' && (
        <div className="bg-black bg-opacity-90 p-4 space-y-4">
          {/* Camera Mode Toggle */}
          <div className="flex justify-center">
            <div className="bg-gray-800 rounded-lg p-1 flex">
              <Button
                variant={cameraMode === 'photo' ? 'primary' : 'ghost'}
                size="sm"
                onClick={() => setCameraMode('photo')}
                className={cameraMode === 'photo' ? '' : 'text-white hover:bg-gray-700'}
              >
                <Camera className="h-4 w-4 mr-1" />
                Photo
              </Button>
              <Button
                variant={cameraMode === 'video' ? 'primary' : 'ghost'}
                size="sm"
                onClick={() => setCameraMode('video')}
                className={cameraMode === 'video' ? '' : 'text-white hover:bg-gray-700'}
              >
                <Video className="h-4 w-4 mr-1" />
                Video
              </Button>
            </div>
          </div>

          {/* Capture Button */}
          <div className="flex justify-center">
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={handleCameraCapture}
              className={`
                w-16 h-16 rounded-full border-4 border-white flex items-center justify-center
                ${isRecording ? 'bg-error-600' : 'bg-transparent hover:bg-white hover:bg-opacity-20'}
                transition-colors
              `}
            >
              {cameraMode === 'photo' ? (
                <div className="w-10 h-10 bg-white rounded-full" />
              ) : isRecording ? (
                <div className="w-6 h-6 bg-white rounded-sm" />
              ) : (
                <div className="w-10 h-10 bg-error-600 rounded-full" />
              )}
            </motion.button>
          </div>
        </div>
      )}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*,video/*,.pdf"
        onChange={handleFileUpload}
        className="hidden"
      />
    </div>
  );
};