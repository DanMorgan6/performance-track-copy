import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { CheckCircle2, Play, ChevronDown, ChevronUp, Dumbbell } from 'lucide-react';
import { cn } from "@/lib/utils";
import PainSlider from "@/components/ui/PainSlider";

function VideoPlayer({ videoUrl, exerciseName }) {
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

  const embedUrl = getVideoEmbedUrl(videoUrl);

  if (!embedUrl) return null;

  return (
    <>
      <button
        onClick={() => setShowVideo(!showVideo)}
        className="flex items-center gap-2 text-teal-600 text-sm font-medium hover:text-teal-700 w-full"
      >
        <Play className="w-4 h-4" />
        {showVideo ? 'Hide' : 'Watch'} demonstration
      </button>
      {showVideo && (
        <div className="mt-3 rounded-lg overflow-hidden bg-slate-900">
          {embedUrl.includes('youtube.com') || embedUrl.includes('vimeo.com') ? (
            <iframe
              src={embedUrl}
              className="w-full aspect-video"
              allowFullScreen
              title={exerciseName}
            />
          ) : (
            <video 
              src={embedUrl} 
              controls 
              className="w-full"
              preload="metadata"
            >
              Your browser does not support video playback.
            </video>
          )}
        </div>
      )}
    </>
  );
}

export default function ExerciseCard({ exercise, onComplete, isCompleted }) {
  const [expanded, setExpanded] = useState(false);
  const [painDuring, setPainDuring] = useState(0);
  const [painAfter, setPainAfter] = useState(0);
  const [difficulty, setDifficulty] = useState('appropriate');
  const [notes, setNotes] = useState('');
  const [weight, setWeight] = useState('');

  const calculateLoad = () => {
    const sets = exercise.sets || 0;
    const reps = parseInt(exercise.reps) || 0;
    const w = parseFloat(weight) || 0;
    return sets * reps * w;
  };

  const handleComplete = () => {
    onComplete({
      exercise_name: exercise.name,
      sets_completed: exercise.sets,
      reps_completed: exercise.reps,
      weight: parseFloat(weight) || 0,
      pain_during: painDuring,
      pain_after: painAfter,
      difficulty,
      notes,
      completed: true
    });
    setExpanded(false);
  };

  return (
    <div className={cn(
      "rounded-2xl border transition-all overflow-hidden",
      isCompleted 
        ? "bg-emerald-50 border-emerald-100" 
        : "bg-white border-slate-100 hover:shadow-md"
    )}>
      <div 
        className="p-5 cursor-pointer"
        onClick={() => !isCompleted && setExpanded(!expanded)}
      >
        <div className="flex items-center gap-4">
          <div className={cn(
            "w-12 h-12 rounded-xl flex items-center justify-center",
            isCompleted ? "bg-emerald-100" : "bg-slate-100"
          )}>
            {isCompleted ? (
              <CheckCircle2 className="w-6 h-6 text-emerald-500" />
            ) : (
              <Dumbbell className="w-6 h-6 text-slate-400" />
            )}
          </div>
          
          <div className="flex-1 min-w-0">
            <h4 className={cn(
              "font-semibold",
              isCompleted ? "text-emerald-700" : "text-slate-700"
            )}>
              {exercise.name}
            </h4>
            <p className="text-sm text-slate-400 mt-0.5">
              {exercise.sets} sets × {exercise.reps} • {exercise.frequency}
            </p>
          </div>

          {!isCompleted && (
            <div className="text-slate-400">
              {expanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </div>
          )}
        </div>
      </div>

      {expanded && !isCompleted && (
        <div className="px-5 pb-5 space-y-5 border-t border-slate-100 pt-5">
          {exercise.description && (
            <p className="text-sm text-slate-600">{exercise.description}</p>
          )}

          {exercise.video_url && (
            <VideoPlayer videoUrl={exercise.video_url} exerciseName={exercise.name} />
          )}

          <div className="space-y-4 p-4 bg-slate-50 rounded-xl">
            <div>
              <label className="text-sm font-medium text-slate-600 mb-2 block">
                Weight (kg/lbs)
              </label>
              <input
                type="number"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                placeholder="Enter weight"
                className="w-full p-2 border border-slate-200 rounded-lg text-sm"
                step="0.5"
                min="0"
              />
              {weight && (
                <p className="text-xs text-purple-600 mt-2 font-medium">
                  Session Load: {calculateLoad().toFixed(1)} ({exercise.sets} sets × {exercise.reps} reps × {weight} kg/lbs)
                </p>
              )}
            </div>
            <div>
              <label className="text-sm font-medium text-slate-600 mb-3 block">
                Pain during exercise
              </label>
              <PainSlider value={painDuring} onChange={setPainDuring} />
            </div>

            <div>
              <label className="text-sm font-medium text-slate-600 mb-3 block">
                Pain after exercise
              </label>
              <PainSlider value={painAfter} onChange={setPainAfter} />
            </div>

            <div>
              <label className="text-sm font-medium text-slate-600 mb-2 block">
                How did it feel?
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { value: 'too_easy', label: 'Too Easy' },
                  { value: 'appropriate', label: 'Just Right' },
                  { value: 'challenging', label: 'Challenging' },
                  { value: 'too_hard', label: 'Too Hard' }
                ].map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setDifficulty(opt.value)}
                    className={cn(
                      "py-2 px-3 rounded-lg text-sm font-medium transition-all",
                      difficulty === opt.value
                        ? "bg-purple-600 text-white"
                        : "bg-white border border-slate-200 text-slate-600 hover:border-purple-300"
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <textarea
              placeholder="Any notes about this exercise..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full p-3 border border-slate-200 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              rows={2}
            />
          </div>

          <Button 
            onClick={handleComplete}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white rounded-xl py-3"
          >
            <CheckCircle2 className="w-4 h-4 mr-2" />
            Mark Complete
          </Button>
        </div>
      )}
    </div>
  );
}