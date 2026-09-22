import React, { useState } from 'react';
import { Play } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

function getEmbedUrl(url) {
  if (!url) return null;
  const ytMatch = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}?autoplay=1`;
  const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
  if (vimeoMatch) return `https://player.vimeo.com/video/${vimeoMatch[1]}?autoplay=1`;
  return null;
}

// inline=true: renders the video player directly (no thumbnail/modal wrapper)
export default function ExerciseVideoPreview({ videoUrl, thumbnailUrl, exerciseName, inline = false, variant = 'thumbnail' }) {
  const [showModal, setShowModal] = useState(false);

  if (!videoUrl) return null;

  const embedUrl = getEmbedUrl(videoUrl);

  const VideoPlayer = () => embedUrl ? (
    <iframe
      src={embedUrl}
      className="w-full aspect-video rounded-lg bg-black"
      allow="autoplay; fullscreen"
      allowFullScreen
      frameBorder="0"
      referrerPolicy="strict-origin-when-cross-origin"
    />
  ) : (
    <video
      className="w-full aspect-video rounded-lg bg-black"
      controls
      autoPlay
      src={videoUrl}
    />
  );

  if (inline) {
    return <VideoPlayer />;
  }

  return (
    <>
      {variant === 'button' ? (
        <button
          type="button"
          onClick={() => setShowModal(true)}
          className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-[#d7ff3f]/25 bg-[#1b1d22] px-3 py-2 text-sm font-semibold text-[#d7ff3f] transition-colors hover:bg-[#25282e] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d7ff3f] focus-visible:ring-offset-2"
          aria-label={`Watch ${exerciseName || 'exercise'} demonstration`}
        >
          <Play className="h-4 w-4 fill-current" aria-hidden="true" />
          Watch video
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setShowModal(true)}
          className="relative group cursor-pointer rounded-lg overflow-hidden bg-slate-100 aspect-video w-full flex items-center justify-center hover:opacity-90 transition-opacity"
          aria-label={`Watch ${exerciseName || 'exercise'} demonstration`}
        >
          {thumbnailUrl ? (
            <img src={thumbnailUrl} alt={exerciseName} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-slate-300 to-slate-400" />
          )}
          <div className="absolute inset-0 bg-black/20 group-hover:bg-black/30 transition-all flex items-center justify-center">
            <div className="bg-white/90 p-3 rounded-full">
              <Play className="w-6 h-6 text-slate-800 fill-slate-800" />
            </div>
          </div>
        </button>
      )}

      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="sm:max-w-3xl p-0 overflow-hidden">
          <DialogHeader className="p-4 pb-0">
            <DialogTitle>{exerciseName}</DialogTitle>
          </DialogHeader>
          <div className="p-4 pt-3">
            <VideoPlayer />
            <p className="mt-3 text-center text-xs text-slate-500">
              Close this window to return to your plan.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}