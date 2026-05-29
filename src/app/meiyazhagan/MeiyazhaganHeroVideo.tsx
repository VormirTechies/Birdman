'use client';

import { useRef, useState } from 'react';
import { Volume2, VolumeX } from 'lucide-react';

const MEIYAZHAGAN_VIDEO_URL =
  'https://ympyaabsjfaoxvbtxbox.supabase.co/storage/v1/object/public/videos/Meiyazhagan_wide.mp4';

export function MeiyazhaganHeroVideo() {
  const [muted, setMuted] = useState(true);
  const [videoReady, setVideoReady] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const toggleMute = () => {
    if (!videoRef.current) return;
    const nextMuted = !videoRef.current.muted;
    videoRef.current.muted = nextMuted;
    setMuted(nextMuted);
  };

  return (
    <>
      <video
        ref={videoRef}
        src={MEIYAZHAGAN_VIDEO_URL}
        autoPlay
        muted={muted}
        loop
        playsInline
        preload="metadata"
        className={`absolute inset-0 h-full w-full object-cover opacity-45 transition-opacity duration-1000 ${
          videoReady ? 'opacity-45' : 'opacity-0'
        }`}
        aria-label="Meiyazhagan-inspired Birdman of Chennai parakeet gathering video"
        onCanPlay={() => setVideoReady(true)}
      />

      <button
        type="button"
        onClick={toggleMute}
        aria-label={muted ? 'Unmute video' : 'Mute video'}
        className="absolute top-24 right-5 z-20 w-10 h-10 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white border border-white/10 transition-all duration-200"
      >
        {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
      </button>
    </>
  );
}
