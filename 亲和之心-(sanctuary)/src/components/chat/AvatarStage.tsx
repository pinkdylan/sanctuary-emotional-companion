import { useChatStore } from '../../store/useChatStore';
import { motion } from 'framer-motion';
import { lazy, Suspense } from 'react';

const Live2DCanvas = lazy(() => import('../../live2d/Live2DCanvas'));

export default function AvatarStage() {
  const sessionState = useChatStore((state) => state.sessionState);

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center overflow-hidden rounded-[2rem] bg-surface-container-lowest shadow-sm border border-outline-variant/10">
      <div className="absolute inset-0 z-0">
        <img 
          src="https://lh3.googleusercontent.com/aida-public/AB6AXuBBBxRjBV8MZck1AKAzRfa8iBo_MDcSyfh3MHaeZzULvAV05l9JBqo0UX6jS9O7PrmxWG8G4m1BalB8kbSHLNPyQ3t2XlbPa4r2S0o07zhZv79tI2SKp0smZ_YzRCE1zHYLaWBJJIZFtekL_Rw3FU7TyMwikaWSUrSb5y5QeFjOKMgwVx2efg0fWLWAufKf_Z1vHIUrt2GFoIhRhv7hwca3D-Ho08Je5qjYvQJx7Zz0QUR3I--7zLEu62cArRI2N08HUekL_zDKw7g" 
          alt="温馨室内背景" 
          className="w-full h-full object-cover blur-sm opacity-40" 
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-surface/20 to-surface"></div>
      </div>
      
      <div className="relative z-10 flex-grow flex items-end justify-center px-0 overflow-hidden h-full w-full">
        <motion.div 
          className="w-full h-full max-w-none flex items-end justify-center"
          animate={{
            y: sessionState === 'speaking' ? [0, -6, 0] : 0,
          }}
          transition={{
            duration: 2,
            repeat: sessionState === 'speaking' ? Infinity : 0,
            ease: "easeInOut"
          }}
        >
          <Suspense fallback={<div className="h-full min-h-[240px] w-full animate-pulse bg-surface-container-low/50 rounded-xl" />}>
            <Live2DCanvas className="h-full min-h-[240px] w-full" />
          </Suspense>
        </motion.div>
      </div>
    </div>
  );
}
