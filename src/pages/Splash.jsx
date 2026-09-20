import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Activity } from 'lucide-react';
import { createPageUrl } from '@/utils';

const SPLASH_DURATION = 2200;

export default function Splash() {
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => navigate(createPageUrl('Home'), { replace: true }), SPLASH_DURATION);
    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="performance-shell relative min-h-screen overflow-hidden bg-[#171719] text-zinc-50 flex items-center justify-center">
      <div className="absolute top-1/4 left-[-12rem] w-[30rem] h-[30rem] rounded-full bg-[#c7f03d]/10 blur-3xl" />
      <div className="absolute bottom-[-10rem] right-[-8rem] w-[34rem] h-[34rem] rounded-full bg-emerald-500/10 blur-3xl" />

      <div className="relative flex flex-col items-center">
        <motion.div
          initial={{ scale: 0.7, opacity: 0, rotate: -8 }}
          animate={{ scale: 1, opacity: 1, rotate: 0 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="flex h-20 w-20 items-center justify-center rounded-2xl bg-[#c7f03d] shadow-[0_0_48px_rgba(199,240,61,0.35)]"
        >
          <Activity className="h-9 w-9 text-zinc-950" strokeWidth={2.4} />
        </motion.div>

        <motion.div
          initial={{ y: 14, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.25, duration: 0.6, ease: 'easeOut' }}
          className="mt-7 text-center"
        >
          <h1 className="text-3xl font-semibold tracking-tight">
            Performance Track<span className="text-[#c7f03d]">+</span>
          </h1>
          <p className="mt-2 text-sm uppercase tracking-[0.22em] text-zinc-500">
            Plan · Prove · Progress
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.4 }}
          className="mt-9 h-1 w-44 overflow-hidden rounded-full bg-white/10"
        >
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: '0%' }}
            transition={{ delay: 0.6, duration: SPLASH_DURATION - 600, ease: 'easeInOut' }}
            className="h-full w-full bg-[#c7f03d]"
          />
        </motion.div>
      </div>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1, duration: 0.5 }}
        className="absolute bottom-8 text-xs text-zinc-600"
      >
        Criteria-led rehabilitation
      </motion.p>
    </div>
  );
}