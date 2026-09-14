import React, { useState } from 'react';
import { Play } from 'lucide-react';
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function ExerciseVideoCard({ exercise }) {
  const [showVideo, setShowVideo] = useState(false);

  const getVideoEmbedUrl = (url) => {
    if (!url) return null;
    
    // YouTube
    if (url.includes('youtube.com') || url.includes('youtu.be')) {
      const videoId = url.includes('youtu.be') 
        ? url.split('youtu.be/')[1]?.split('?')[0]
        : url.split('v=')[1]?.split('&')[0];
      return `https://www.youtube.com/embed/${videoId}`;
    }
    
    // Vimeo
    if (url.includes('vimeo.com')) {
      const videoId = url.split('vimeo.com/')[1]?.split('?')[0];
      return `https://player.vimeo.com/video/${videoId}`;
    }
    
    return url;
  };

  const embedUrl = getVideoEmbedUrl(exercise.video_url);

  return (
    <>
      <div 
        onClick={() => embedUrl && setShowVideo(true)}
        className={cn(
          "bg-white rounded-2xl border border-slate-200 overflow-hidden transition-all",
          embedUrl && "cursor-pointer hover:shadow-lg hover:border-purple-200"
        )}
      >
        {/* Thumbnail */}
        <div className="relative aspect-video bg-slate-100 flex items-center justify-center">
          {exercise.thumbnail_url ? (
            <img 
              src={exercise.thumbnail_url} 
              alt={exercise.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="text-slate-300">
              {exercise.name.charAt(0).toUpperCase()}
            </div>
          )}
          {embedUrl && (
            <div className="absolute inset-0 bg-black/20 flex items-center justify-center group-hover:bg-black/30 transition-all">
              <div className="w-14 h-14 rounded-full bg-white/90 flex items-center justify-center">
                <Play className="w-6 h-6 text-purple-600 ml-1" />
              </div>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-4">
          <h3 className="font-semibold text-slate-800 mb-2">{exercise.name}</h3>
          <p className="text-sm text-slate-500 line-clamp-2 mb-3">
            {exercise.description}
          </p>
          
          <div className="flex flex-wrap gap-2">
            <span className="px-2 py-1 bg-purple-50 text-purple-600 text-xs rounded-full">
              {exercise.category}
            </span>
            <span className="px-2 py-1 bg-slate-100 text-slate-600 text-xs rounded-full">
              {exercise.body_part}
            </span>
            <span className="px-2 py-1 bg-emerald-50 text-emerald-600 text-xs rounded-full">
              {exercise.difficulty_level}
            </span>
          </div>

          {exercise.equipment_needed && exercise.equipment_needed.length > 0 && (
            <div className="mt-3 text-xs text-slate-400">
              Equipment: {exercise.equipment_needed.join(', ')}
            </div>
          )}
        </div>
      </div>

      {/* Video Dialog */}
      <Dialog open={showVideo} onOpenChange={setShowVideo}>
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>{exercise.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {embedUrl && (
              <div className="aspect-video w-full">
                <iframe
                  src={embedUrl}
                  className="w-full h-full rounded-lg"
                  allowFullScreen
                  title={exercise.name}
                />
              </div>
            )}
            <div>
              <h4 className="font-medium text-slate-700 mb-2">Instructions</h4>
              <p className="text-sm text-slate-600">{exercise.description}</p>
            </div>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-slate-500">Sets:</span>
                <span className="ml-2 font-medium">{exercise.default_sets}</span>
              </div>
              <div>
                <span className="text-slate-500">Reps:</span>
                <span className="ml-2 font-medium">{exercise.default_reps}</span>
              </div>
              <div>
                <span className="text-slate-500">Frequency:</span>
                <span className="ml-2 font-medium">{exercise.default_frequency}</span>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}