import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { 
  CheckCircle, 
  Activity, 
  Calendar, 
  ClipboardCheck, 
  MessageSquare,
  ChevronRight,
  Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const steps = [
  {
    title: "Welcome to Your Rehabilitation Portal",
    description: "We're excited to support you on your recovery journey. Let's take a quick tour of what you can do here.",
    icon: Sparkles,
    color: "purple"
  },
  {
    title: "View Your Daily Exercise Plan",
    description: "Access your personalized rehabilitation exercises with video demonstrations. Track your progress by logging completed sets, reps, and how you felt.",
    icon: Activity,
    color: "teal"
  },
  {
    title: "Track Your Pain Levels",
    description: "Log your pain throughout the recovery process. This helps your clinician understand your progress and adjust your treatment plan if needed.",
    icon: Calendar,
    color: "rose"
  },
  {
    title: "Complete Questionnaires",
    description: "Your clinician may send outcome measure questionnaires to assess your progress. Complete these to provide valuable feedback on your recovery.",
    icon: ClipboardCheck,
    color: "blue"
  },
  {
    title: "Daily Check-Ins",
    description: "Share how you're feeling with daily notes about your mood, energy, sleep quality, and overall experience. This helps your clinician provide better support.",
    icon: MessageSquare,
    color: "amber"
  }
];

export default function PatientOnboarding({ onComplete }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [completing, setCompleting] = useState(false);

  const currentStepData = steps[currentStep];
  const Icon = currentStepData.icon;
  const isLastStep = currentStep === steps.length - 1;

  const colorClasses = {
    purple: { bg: 'bg-purple-100', text: 'text-purple-600', button: 'bg-purple-600 hover:bg-purple-700' },
    teal: { bg: 'bg-teal-100', text: 'text-teal-600', button: 'bg-teal-600 hover:bg-teal-700' },
    rose: { bg: 'bg-rose-100', text: 'text-rose-600', button: 'bg-rose-600 hover:bg-rose-700' },
    blue: { bg: 'bg-blue-100', text: 'text-blue-600', button: 'bg-blue-600 hover:bg-blue-700' },
    amber: { bg: 'bg-amber-100', text: 'text-amber-600', button: 'bg-amber-600 hover:bg-amber-700' }
  };

  const colors = colorClasses[currentStepData.color];

  const completeOnboarding = async () => {
    setCompleting(true);
    try {
      // Only mark onboarding as completed - do NOT create Patient record here
      // Patient record should have been created during invite acceptance flow
      await base44.auth.updateMe({ onboarding_completed: true });
      onComplete();
    } catch (error) {
      console.error('Error completing onboarding:', error);
      setCompleting(false);
    }
  };

  const handleNext = () => {
    if (isLastStep) {
      completeOnboarding();
    } else {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleSkip = () => {
    completeOnboarding();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full p-8 relative"
      >
        {/* Progress Indicators */}
        <div className="flex justify-center gap-2 mb-8">
          {steps.map((_, index) => (
            <div
              key={index}
              className={`h-2 rounded-full transition-all ${
                index === currentStep
                  ? 'w-8 bg-purple-600'
                  : index < currentStep
                  ? 'w-2 bg-purple-400'
                  : 'w-2 bg-slate-200'
              }`}
            />
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            {/* Icon */}
            <div className={`w-20 h-20 rounded-2xl ${colors.bg} flex items-center justify-center mx-auto mb-6`}>
              <Icon className={`w-10 h-10 ${colors.text}`} />
            </div>

            {/* Content */}
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-slate-800 mb-3">
                {currentStepData.title}
              </h2>
              <p className="text-slate-600 text-lg leading-relaxed">
                {currentStepData.description}
              </p>
            </div>

            {/* Step Counter */}
            <div className="text-center mb-6">
              <span className="text-sm text-slate-400">
                Step {currentStep + 1} of {steps.length}
              </span>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Actions */}
        <div className="flex gap-3">
          <Button
            onClick={handleSkip}
            variant="ghost"
            disabled={completing}
            className="flex-1 rounded-xl text-slate-600"
          >
            Skip Tour
          </Button>
          <Button
            onClick={handleNext}
            disabled={completing}
            className={`flex-1 rounded-xl text-white ${colors.button}`}
          >
            {completing ? (
              <>
                <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                Loading...
              </>
            ) : isLastStep ? (
              <>
                <CheckCircle className="w-4 h-4 mr-2" />
                Get Started
              </>
            ) : (
              <>
                Next
                <ChevronRight className="w-4 h-4 ml-2" />
              </>
            )}
          </Button>
        </div>
      </motion.div>
    </div>
  );
}