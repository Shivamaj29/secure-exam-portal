import React, { useEffect, useRef, useState } from 'react';
import * as tf from '@tensorflow/tfjs';
import * as faceDetection from '@tensorflow-models/face-detection';
import { Bar } from 'react-chartjs-2';
import { motion } from 'motion/react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface ProctorProps {
  onSuspiciousEvent: (type: 'looking_away' | 'face_missing' | 'tab_switch' | 'multiple_faces') => void;
  onFaceCountChange?: (count: number) => void;
  suspiciousCount: number;
  normalCount: number;
  isExamActive: boolean;
  isSetup?: boolean;
}

export const Proctor: React.FC<ProctorProps> = ({ 
  onSuspiciousEvent, 
  onFaceCountChange,
  suspiciousCount, 
  normalCount,
  isExamActive,
  isSetup = false
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const detectorRef = useRef<faceDetection.FaceDetector | null>(null);
  const [isModelLoading, setIsModelLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadModel = async () => {
      try {
        await tf.ready();
        const model = faceDetection.SupportedModels.MediaPipeFaceDetector;
        const detectorConfig: any = {
          runtime: 'tfjs',
          maxFaces: 5, // Detect up to 5 faces for multiple person detection
        };
        detectorRef.current = await faceDetection.createDetector(model, detectorConfig);
        setIsModelLoading(false);
      } catch (err) {
        console.error('Error loading face detection model:', err);
        setError('Failed to load AI model. Please check your connection.');
      }
    };

    loadModel();
  }, []);

  useEffect(() => {
    if (!isExamActive && !isSetup) return;

    const startWebcam = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { width: 640, height: 480, frameRate: { ideal: 30 } },
          audio: false 
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.error('Error accessing webcam:', err);
        setError('Webcam access denied. Please enable camera permissions.');
      }
    };

    startWebcam();

    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [isExamActive, isSetup]);

  const [facesDetected, setFacesDetected] = useState(0);
  const headTurnCounterRef = useRef(0);

  useEffect(() => {
    if ((!isExamActive && !isSetup) || isModelLoading || !detectorRef.current) return;

    let intervalId: any;
    const detect = async () => {
      if (!videoRef.current || videoRef.current.readyState < 2) return;

      try {
        const faces = await detectorRef.current!.estimateFaces(videoRef.current);
        setFacesDetected(faces.length);
        if (onFaceCountChange) onFaceCountChange(faces.length);
        
        if (isSetup) return; // Don't trigger suspicious events in setup mode

        if (faces.length === 0) {
          onSuspiciousEvent('face_missing');
          headTurnCounterRef.current = 0;
        } else if (faces.length > 1) {
          // Robust Multiple People Detection
          onSuspiciousEvent('multiple_faces');
          headTurnCounterRef.current = 0;
        } else {
          const face = faces[0];
          // Keypoints: 0: left eye, 1: right eye, 2: nose tip, 3: mouth center, 4: left ear tragion, 5: right ear tragion
          if (face.keypoints) {
            const leftEye = face.keypoints[0];
            const rightEye = face.keypoints[1];
            const nose = face.keypoints[2];
            
            // 1. Horizontal Turn Detection (Yaw)
            const eyeDistance = Math.sqrt(
              Math.pow(rightEye.x - leftEye.x, 2) + 
              Math.pow(rightEye.y - leftEye.y, 2)
            );
            const eyeCenter = (leftEye.x + rightEye.x) / 2;
            const horizontalTurn = (nose.x - eyeCenter) / eyeDistance;

            // 2. Vertical Movement Detection (Pitch)
            const eyeYCenter = (leftEye.y + rightEye.y) / 2;
            const verticalMovement = (nose.y - eyeYCenter) / eyeDistance;
            
            // Refined sensitivity thresholds
            const isLookingAwayHorizontally = Math.abs(horizontalTurn) > 0.32;
            const isLookingAwayVertically = verticalMovement > 0.6 || verticalMovement < 0.1; // Looking down or up

            if (isLookingAwayHorizontally || isLookingAwayVertically) {
              headTurnCounterRef.current += 1;
              // Trigger if turned for more than 3 seconds
              if (headTurnCounterRef.current >= 3) {
                onSuspiciousEvent('looking_away');
              }
            } else {
              headTurnCounterRef.current = 0;
            }
          }
        }
      } catch (err) {
        console.error('Detection error:', err);
      }
    };

    intervalId = setInterval(detect, 1000);

    return () => clearInterval(intervalId);
  }, [isExamActive, isSetup, isModelLoading, onSuspiciousEvent, onFaceCountChange]);

  // Tab visibility detection
  useEffect(() => {
    if (!isExamActive) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        onSuspiciousEvent('tab_switch');
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [isExamActive, onSuspiciousEvent]);

  const chartData = {
    labels: ['Normal', 'Suspicious'],
    datasets: [
      {
        data: [normalCount, suspiciousCount],
        backgroundColor: ['rgba(34, 197, 94, 0.6)', 'rgba(239, 68, 68, 0.6)'],
        borderColor: ['rgb(34, 197, 94)', 'rgb(239, 68, 68)'],
        borderWidth: 1,
      },
    ],
  };

  const chartOptions: any = {
    indexAxis: 'y',
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: { enabled: false },
    },
    scales: {
      y: { display: false },
      x: { display: false, beginAtZero: true },
    },
  };

  if (isSetup) {
    return (
      <div className="flex flex-col gap-4 items-center">
        <div className="relative w-[320px] h-[240px] bg-black rounded-2xl overflow-hidden shadow-2xl border-4 border-zinc-100">
          {isModelLoading && !error && (
            <div className="absolute inset-0 flex items-center justify-center bg-zinc-900 text-white text-sm font-medium">
              Initializing AI Proctor...
            </div>
          )}
          {error && (
            <div className="absolute inset-0 flex items-center justify-center bg-red-900/90 text-white text-xs p-4 text-center font-bold">
              {error}
            </div>
          )}
          <video
            ref={videoRef}
            autoPlay
            muted
            playsInline
            className="w-full h-full object-cover"
          />
          
          <div className="absolute top-3 left-3 flex flex-col gap-2">
            {facesDetected === 1 && (
              <div className="bg-green-500 text-white text-[10px] font-black px-2 py-1 rounded-full uppercase tracking-widest shadow-lg">
                Face Verified
              </div>
            )}
            {facesDetected > 1 && (
              <div className="bg-red-500 text-white text-[10px] font-black px-2 py-1 rounded-full uppercase tracking-widest shadow-lg animate-pulse">
                Multiple People!
              </div>
            )}
            {facesDetected === 0 && !isModelLoading && (
              <div className="bg-amber-500 text-white text-[10px] font-black px-2 py-1 rounded-full uppercase tracking-widest shadow-lg">
                No Face Detected
              </div>
            )}
          </div>
        </div>
        <p className="text-xs text-zinc-400 font-medium uppercase tracking-widest">
          {facesDetected === 1 ? "Ready to start" : "Position yourself in front of the camera"}
        </p>
      </div>
    );
  }

  return (
    <motion.div 
      drag
      dragMomentum={false}
      className="fixed top-4 right-4 z-50 flex flex-col gap-2 cursor-move active:cursor-grabbing"
    >
      <div className="relative w-[200px] h-[150px] bg-black rounded-lg overflow-hidden shadow-xl border-2 border-white/20 pointer-events-none">
        {isModelLoading && !error && (
          <div className="absolute inset-0 flex items-center justify-center bg-zinc-900 text-white text-xs">
            Loading AI...
          </div>
        )}
        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-red-900/80 text-white text-[10px] p-2 text-center">
            {error}
          </div>
        )}
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          className="w-full h-full object-cover"
        />
        
        {/* Real-time Indicators */}
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          {facesDetected > 1 && (
            <div className="bg-red-500 text-white text-[8px] font-bold px-1.5 py-0.5 rounded uppercase animate-pulse">
              Multiple People
            </div>
          )}
          {facesDetected === 0 && !isModelLoading && (
            <div className="bg-amber-500 text-white text-[8px] font-bold px-1.5 py-0.5 rounded uppercase">
              No Face Detected
            </div>
          )}
        </div>

        <div className="absolute bottom-1 left-1 bg-black/50 px-1 rounded text-[8px] text-white uppercase tracking-widest">
          Live Proctoring
        </div>
      </div>
      
      <div className="w-[200px] h-[40px] bg-white/90 backdrop-blur rounded-lg shadow-lg p-2 flex flex-col gap-1 pointer-events-none">
        <div className="flex justify-between text-[8px] font-bold uppercase tracking-tighter text-zinc-500">
          <span>Activity</span>
          <span className={suspiciousCount > 5 ? 'text-red-500' : 'text-green-500'}>
            Score: {suspiciousCount}
          </span>
        </div>
        <div className="flex-1">
          <Bar data={chartData} options={chartOptions} />
        </div>
      </div>
    </motion.div>
  );
};
