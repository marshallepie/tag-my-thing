import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Volume2, VolumeX } from 'lucide-react';

interface VideoConfig {
  videoId: string;
  posterUrl: string;
}

interface HeroExplainerVideoProps {
  className?: string;
}

// Cloudflare Stream video IDs and poster URLs per language
const VIDEO_CONFIG: Record<string, VideoConfig> = {
  en: {
    videoId: '7d3daa9da4c8541d58084b8831d4a8e5',
    posterUrl: '/posters/explainer-en.jpg'
  },
  fr: {
    videoId: 'f0295df4bddc6bf3d703c447f2301266',
    posterUrl: '/posters/explainer-fr.jpg'
  }
};

export const HeroExplainerVideo: React.FC<HeroExplainerVideoProps> = ({ className = '' }) => {
  const { i18n } = useTranslation();
  const [isMobile, setIsMobile] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const videoRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Detect mobile on mount and window resize
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);

    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Get video config based on current language
  const currentLang = i18n.language.startsWith('fr') ? 'fr' : 'en';
  const videoConfig = VIDEO_CONFIG[currentLang];

  // Toggle mute/unmute by toggling controls visibility
  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  // Lazy load video using Intersection Observer
  useEffect(() => {
    if (!videoRef.current || isMobile) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setIsLoaded(true);
          observer.disconnect();
        }
      },
      {
        rootMargin: '50px' // Start loading slightly before video enters viewport
      }
    );

    observer.observe(videoRef.current);

    return () => observer.disconnect();
  }, [isMobile]);

  // Mobile: Show poster only
  if (isMobile) {
    return (
      <div
        ref={videoRef}
        className={`relative w-full aspect-video rounded-lg overflow-hidden shadow-xl ${className}`}
      >
        <img
          src={videoConfig.posterUrl}
          alt="Explainer video thumbnail"
          className="w-full h-full object-cover"
          loading="lazy"
        />
        {/* Optional: Tap-to-play overlay (commented out for poster-only approach)
        <button
          className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30 hover:bg-opacity-40 transition-opacity group"
          onClick={() => {
            // Handle tap-to-play if needed
          }}
        >
          <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
            <div className="w-0 h-0 border-t-8 border-t-transparent border-l-12 border-l-black border-b-8 border-b-transparent ml-1" />
          </div>
        </button>
        */}
      </div>
    );
  }

  // Desktop/Tablet: Autoplay video
  return (
    <div
      ref={videoRef}
      className={`relative w-full aspect-video rounded-lg overflow-hidden shadow-xl ${className}`}
    >
      {isLoaded ? (
        <>
          <iframe
            ref={iframeRef}
            src={`https://customer-${import.meta.env.VITE_CLOUDFLARE_CUSTOMER_CODE || 'CUSTOMER_CODE'}.cloudflarestream.com/${videoConfig.videoId}/iframe?autoplay=true&muted=true&loop=true&controls=true&preload=auto&defaultTextTrack=false`}
            style={{
              border: 'none',
              position: 'absolute',
              top: 0,
              left: 0,
              height: '100%',
              width: '100%'
            }}
            allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture;"
            allowFullScreen={false}
            loading="lazy"
            title={currentLang === 'fr' ? 'Vidéo explicative' : 'Explainer video'}
          />
        </>
      ) : (
        // Show poster while video is loading
        <img
          src={videoConfig.posterUrl}
          alt="Loading video..."
          className="w-full h-full object-cover"
        />
      )}
    </div>
  );
};
