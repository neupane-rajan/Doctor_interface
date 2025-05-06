import React, { useState, useEffect, useRef } from 'react';
import Lottie from 'lottie-react';
import doctorAnimation from '../../assets/doctor-animation.json';

const DoctorAvatar = ({ isSpeaking, text }) => {
  const lottieRef = useRef(null);
  const [lipSyncState, setLipSyncState] = useState('idle');
  const intervalRef = useRef(null);
  const timerRef = useRef(null);
  
  // Clean up function to clear any running timers
  const cleanupTimers = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };
  
  useEffect(() => {
    // Clean up previous timers to avoid memory leaks
    cleanupTimers();
    
    if (isSpeaking && text) {
      // Basic lip sync timing based on word count
      const words = text.split(' ').length;
      const duration = Math.max(2, words * 0.3); // Minimum 2 seconds
      
      setLipSyncState('speaking');
      
      // Safe access to Lottie methods
      const animationInstance = lottieRef.current?.animationItem;
      
      if (animationInstance) {
        // Ensure animation is playing
        animationInstance.play();
        
        // Vary the animation speed slightly for more natural movement
        intervalRef.current = setInterval(() => {
          if (lottieRef.current?.animationItem) {
            const randomSpeed = Math.random() * 0.3 + 0.85; // Speed between 0.85 and 1.15
            lottieRef.current.animationItem.setSpeed(randomSpeed);
          }
        }, 300);
        
        // Stop animation after the calculated duration
        timerRef.current = setTimeout(() => {
          cleanupTimers();
          
          if (lottieRef.current?.animationItem) {
            // Reset to first frame and stop
            lottieRef.current.animationItem.goToAndStop(0, true);
          }
          
          setLipSyncState('idle');
        }, duration * 1000);
      }
    } else {
      // Not speaking - reset to idle state
      setLipSyncState('idle');
      
      if (lottieRef.current?.animationItem) {
        // Reset to first frame and stop
        lottieRef.current.animationItem.goToAndStop(0, true);
      }
    }
    
    // Cleanup on component unmount or when dependencies change
    return () => {
      cleanupTimers();
    };
  }, [isSpeaking, text]);
  
  return (
    <div className="doctor-avatar relative w-64 h-64 mx-auto">
      <div className={`avatar-container ${isSpeaking ? 'speaking' : 'idle'}`}>
        <Lottie
          lottieRef={lottieRef}
          animationData={doctorAnimation}
          className="w-full h-full"
          loop={isSpeaking}
          autoplay={false}
          rendererSettings={{
            preserveAspectRatio: 'xMidYMid slice'
          }}
        />
      </div>
      
      {/* Speaking indicator */}
      <div className="absolute bottom-2 right-2">
        <div className={`h-3 w-3 rounded-full ${isSpeaking ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></div>
      </div>
      
      {/* Status text - optional */}
      {isSpeaking && (
        <div className="absolute -bottom-6 left-0 right-0 text-center">
          <span className="text-xs font-medium text-primary-600">Speaking...</span>
        </div>
      )}
    </div>
  );
};

export default DoctorAvatar;