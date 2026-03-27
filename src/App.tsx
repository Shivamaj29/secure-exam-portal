/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Proctor } from './components/Proctor';
import { Exam } from './components/Exam';
import { Report } from './components/Report';
import { motion, AnimatePresence } from 'motion/react';
import { AlertCircle, ShieldAlert, Shield, ArrowRight, X, AlertTriangle, CheckCircle2, Camera } from 'lucide-react';

type AppState = 'START' | 'SETUP' | 'EXAM' | 'REPORT';

export default function App() {
  const [appState, setAppState] = useState<AppState>('START');
  const [suspiciousScore, setSuspiciousScore] = useState(0);
  const [scoreHistory, setScoreHistory] = useState<number[]>([]);
  const [activityCounts, setActivityCounts] = useState({
    looking_away: 0,
    face_missing: 0,
    tab_switch: 0,
    multiple_faces: 0,
  });
  const [normalCount, setNormalCount] = useState(0);
  const [alert, setAlert] = useState<{ message: string; type: 'warning' | 'danger' } | null>(null);
  const [currentFaceCount, setCurrentFaceCount] = useState(0);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Initialize beep sound
    audioRef.current = new Audio('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
  }, []);

  const playBeep = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.play().catch(() => {});
    }
  }, []);

  const handleSuspiciousEvent = useCallback((type: 'looking_away' | 'face_missing' | 'tab_switch' | 'multiple_faces') => {
    setActivityCounts((prev) => ({ ...prev, [type]: prev[type] + 1 }));
    
    const increment = type === 'looking_away' ? 1 : (type === 'multiple_faces' ? 3 : 2);
    setSuspiciousScore((prev) => {
      const next = prev + increment;
      
      // Alert logic
      if (next >= 8) {
        setAlert({ message: 'CRITICAL: High suspicious activity detected. Auto-submitting exam.', type: 'danger' });
        playBeep();
      } else if (next >= 4) {
        const warningMsg = type === 'multiple_faces' 
          ? 'WARNING: Multiple people detected in frame!' 
          : 'WARNING: Suspicious behavior detected. Please stay focused.';
        setAlert({ message: warningMsg, type: 'warning' });
        playBeep();
      }
      
      return next;
    });
  }, [playBeep]);

  // Auto-submit logic
  useEffect(() => {
    if (suspiciousScore >= 10 && appState === 'EXAM') {
      setTimeout(() => {
        setAppState('REPORT');
        setAlert(null);
      }, 3000);
    }
  }, [suspiciousScore, appState]);

  // Track score history and normal activity
  useEffect(() => {
    if (appState !== 'EXAM') return;

    const interval = setInterval(() => {
      setScoreHistory((prev) => [...prev, suspiciousScore]);
      setNormalCount((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [appState, suspiciousScore]);

  // Auto-hide alerts
  useEffect(() => {
    if (alert) {
      const timer = setTimeout(() => setAlert(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [alert]);

  const startSetup = () => {
    setAppState('SETUP');
  };

  const startExam = () => {
    if (currentFaceCount !== 1) return;
    setAppState('EXAM');
    setSuspiciousScore(0);
    setScoreHistory([]);
    setActivityCounts({ looking_away: 0, face_missing: 0, tab_switch: 0, multiple_faces: 0 });
    setNormalCount(0);
  };

  const finishExam = () => {
    setAppState('REPORT');
  };

  return (
    <div className="min-h-screen bg-zinc-50 font-sans selection:bg-zinc-900 selection:text-white">
      <AnimatePresence>
        {alert && (
          <motion.div
            initial={{ opacity: 0, y: -100 }}
            animate={{ opacity: 1, y: 20 }}
            exit={{ opacity: 0, y: -100 }}
            className={`fixed top-4 left-1/2 -translate-x-1/2 z-[100] px-8 py-4 rounded-2xl shadow-2xl flex items-center gap-4 border-2 ${
              alert.type === 'danger' 
                ? 'bg-red-500 border-red-400 text-white' 
                : 'bg-amber-500 border-amber-400 text-white'
            }`}
          >
            {alert.type === 'danger' ? <ShieldAlert className="w-6 h-6" /> : <AlertCircle className="w-6 h-6" />}
            <span className="font-bold uppercase tracking-tight text-sm">{alert.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {appState === 'START' && (
        <div className="min-h-screen flex flex-col items-center justify-center p-8 bg-white">
          <div className="max-w-2xl w-full text-center">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="w-24 h-24 bg-zinc-900 rounded-3xl flex items-center justify-center text-white text-4xl font-black mb-12 mx-auto shadow-2xl shadow-zinc-200"
            >
              AI
            </motion.div>
            
            <h1 className="text-6xl font-black text-zinc-900 mb-6 tracking-tighter leading-none">
              AI PROCTORING <br />
              <span className="text-zinc-400">EXAM SYSTEM</span>
            </h1>
            
            <p className="text-xl text-zinc-500 mb-12 leading-relaxed">
              A production-grade, browser-based exam proctoring solution powered by real-time TensorFlow.js face detection and behavior analysis.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12 text-left">
              <div className="p-6 bg-zinc-50 rounded-2xl border border-zinc-100">
                <h3 className="font-bold text-zinc-900 mb-2 uppercase tracking-tight text-xs">AI Monitoring</h3>
                <p className="text-zinc-500 text-sm">Real-time face and head pose tracking using MediaPipe.</p>
              </div>
              <div className="p-6 bg-zinc-50 rounded-2xl border border-zinc-100">
                <h3 className="font-bold text-zinc-900 mb-2 uppercase tracking-tight text-xs">Event Tracking</h3>
                <p className="text-zinc-500 text-sm">Detects tab switching, window focus loss, and absence.</p>
              </div>
              <div className="p-6 bg-zinc-50 rounded-2xl border border-zinc-100">
                <h3 className="font-bold text-zinc-900 mb-2 uppercase tracking-tight text-xs">Auto-Submit</h3>
                <p className="text-zinc-500 text-sm">Automatic exam termination upon high suspicious activity.</p>
              </div>
            </div>

            <button
              onClick={startSetup}
              className="bg-zinc-900 text-white px-12 py-5 rounded-2xl font-bold uppercase tracking-widest text-sm hover:bg-zinc-800 transition-all shadow-2xl shadow-zinc-200 hover:scale-[1.02] active:scale-[0.98] flex items-center gap-3 mx-auto"
            >
              <Shield className="w-4 h-4" />
              Initialize Verification
            </button>
          </div>
        </div>
      )}

      {appState === 'SETUP' && (
        <div className="min-h-screen flex flex-col items-center justify-center p-8 bg-zinc-50">
          <div className="max-w-5xl w-full grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-8"
            >
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-900 text-white text-[10px] font-black uppercase tracking-widest mb-4">
                  <Camera className="w-3 h-3" />
                  Pre-Exam Verification
                </div>
                <h2 className="text-5xl font-black text-zinc-900 tracking-tighter leading-none uppercase">
                  System <br />
                  <span className="text-zinc-400">Checklist</span>
                </h2>
              </div>

              <div className="space-y-4">
                {[
                  { title: "Camera Access", desc: "Ensure your webcam is enabled and functional." },
                  { title: "Face Detection", desc: "Position yourself clearly in the center of the frame." },
                  { title: "Lighting", desc: "Make sure your room is well-lit for accurate AI tracking." },
                  { title: "Environment", desc: "Ensure no other people are visible in the camera frame." },
                  { title: "Browser Focus", desc: "Do not switch tabs or minimize the window during the exam." }
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-4 p-4 bg-white rounded-2xl border border-zinc-200 shadow-sm">
                    <div className="w-8 h-8 rounded-xl bg-zinc-900 flex items-center justify-center text-white font-bold text-xs shrink-0">
                      {i + 1}
                    </div>
                    <div>
                      <h4 className="font-bold text-zinc-900 text-sm uppercase tracking-tight">{item.title}</h4>
                      <p className="text-zinc-500 text-xs leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-4">
                <button
                  onClick={startExam}
                  disabled={currentFaceCount !== 1}
                  className={`w-full py-5 rounded-2xl font-black uppercase tracking-[0.2em] text-sm transition-all shadow-2xl flex items-center justify-center gap-3 ${
                    currentFaceCount === 1 
                      ? 'bg-zinc-900 text-white hover:bg-zinc-800 hover:scale-[1.02] active:scale-[0.98] shadow-zinc-200' 
                      : 'bg-zinc-200 text-zinc-400 cursor-not-allowed shadow-none'
                  }`}
                >
                  {currentFaceCount === 1 ? (
                    <>
                      <CheckCircle2 className="w-5 h-5" />
                      Start Exam Now
                    </>
                  ) : (
                    <>
                      <ShieldAlert className="w-5 h-5" />
                      {currentFaceCount === 0 ? "Face Not Detected" : "Multiple People Detected"}
                    </>
                  )}
                </button>
                {currentFaceCount !== 1 && (
                  <p className="text-center mt-4 text-[10px] font-black text-red-500 uppercase tracking-widest animate-pulse">
                    Verification Required to Proceed
                  </p>
                )}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex justify-center"
            >
              <Proctor 
                onSuspiciousEvent={() => {}}
                onFaceCountChange={setCurrentFaceCount}
                suspiciousCount={0}
                normalCount={0}
                isExamActive={false}
                isSetup={true}
              />
            </motion.div>
          </div>
        </div>
      )}

      {appState === 'EXAM' && (
        <>
          <Proctor 
            onSuspiciousEvent={handleSuspiciousEvent}
            suspiciousCount={suspiciousScore}
            normalCount={normalCount}
            isExamActive={appState === 'EXAM'}
          />
          <Exam 
            onComplete={finishExam}
            suspiciousScore={suspiciousScore}
          />
        </>
      )}

      {appState === 'REPORT' && (
        <Report 
          finalScore={suspiciousScore}
          scoreHistory={scoreHistory}
          activityCounts={activityCounts}
          onRestart={() => setAppState('START')}
        />
      )}
    </div>
  );
}
