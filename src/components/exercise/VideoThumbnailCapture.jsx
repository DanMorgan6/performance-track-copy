import React, { useEffect, useRef, useState } from 'react';
import { base44 } from '@/api/base44Client';

/**
 * Attempts to extract a thumbnail from a video URL.
 * - YouTube: fetches from img.youtube.com
 * - Vimeo: fetches via oEmbed
 * - Direct video: draws to canvas
 *
 * Calls onCapture(thumbnailUrl) when done, or onError() if it fails.
 */
export default function VideoThumbnailCapture({ videoUrl, onCapture, onError }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [status, setStatus] = useState('idle');

  useEffect(() => {
    if (!videoUrl) return;
    captureThumb(videoUrl);
  }, [videoUrl]);

  const captureThumb = async (url) => {
    setStatus('loading');

    // YouTube
    const ytMatch = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
    if (ytMatch) {
      const videoId = ytMatch[1];
      // Try maxresdefault, fall back to hqdefault
      const thumbUrl = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
      onCapture(thumbUrl);
      setStatus('done');
      return;
    }

    // Vimeo
    const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
    if (vimeoMatch) {
      try {
        const res = await fetch(`https://vimeo.com/api/oembed.json?url=${encodeURIComponent(url)}`);
        const data = await res.json();
        if (data.thumbnail_url) {
          onCapture(data.thumbnail_url);
          setStatus('done');
          return;
        }
      } catch {
        // fall through
      }
      onError?.();
      setStatus('error');
      return;
    }

    // Direct video file - try canvas capture
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) {
      onError?.();
      setStatus('error');
      return;
    }

    video.src = url;
    video.crossOrigin = 'anonymous';
    video.currentTime = 1;

    video.onseeked = async () => {
      try {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        canvas.getContext('2d').drawImage(video, 0, 0);
        canvas.toBlob(async (blob) => {
          if (!blob) { onError?.(); setStatus('error'); return; }
          const file = new File([blob], 'thumbnail.jpg', { type: 'image/jpeg' });
          const result = await base44.integrations.Core.UploadFile({ file });
          onCapture(result.file_url);
          setStatus('done');
        }, 'image/jpeg', 0.85);
      } catch {
        onError?.();
        setStatus('error');
      }
    };

    video.onerror = () => { onError?.(); setStatus('error'); };
  };

  return (
    <div style={{ display: 'none' }}>
      <video ref={videoRef} muted playsInline />
      <canvas ref={canvasRef} />
    </div>
  );
}