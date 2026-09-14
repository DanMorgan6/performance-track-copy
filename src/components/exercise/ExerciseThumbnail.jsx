import React, { useState, useRef, useEffect } from 'react';
import { Play, Dumbbell } from 'lucide-react';
import { cn } from "@/lib/utils";

export default function ExerciseThumbnail({ 
  exercise, 
  onClick,
  className = "" 
}) {
  const [showPreview, setShowPreview] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const containerRef = useRef(null);

  // Lazy load - only render video preview when in viewport
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
        }
      },
      { threshold: 0.1 }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => {
      if (containerRef.current) {
        observer.unobserve(containerRef.current);
      }
    };
  }, []);

  const hasVideo = exercise.video_url;
  const hasThumbnail = exercise.thumbnail_url;

  return (
    <div
      ref={containerRef}
      className={cn(
        "h-48 bg-slate-100 relative overflow-hidden group rounded-lg",
        className
      )}
      onClick={onClick}
    >
      {/* Thumbnail or placeholder */}
      {hasThumbnail ? (
        <img
          src={exercise.thumbnail_url}
          alt={exercise.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
          loading="lazy"
        />
      ) : (
        <div className="w-full h-full bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center">
          <Dumbbell className="w-16 h-16 text-slate-300" />
        </div>
      )}

      {/* Play button indicator for video card */}
      {hasVideo && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/30 transition-colors">
          <div className="w-10 h-10 rounded-full bg-white/90 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <Play className="w-5 h-5 text-slate-900 ml-0.5" />
          </div>
        </div>
      )}
    </div>
  );
}