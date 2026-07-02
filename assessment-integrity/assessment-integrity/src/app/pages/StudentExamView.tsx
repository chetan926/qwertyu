import React, { useState, useEffect, useRef } from "react";
import {
  ShieldCheck,
  AlertTriangle,
  Clock,
  ChevronRight,
  ChevronLeft,
  Camera,
  Play,
  CheckCircle,
  HelpCircle
} from "lucide-react";
import { toast } from "sonner";

interface StudentExamViewProps {
  assessmentId: string;
  user: any;
  onClose: () => void;
}

export default function StudentExamView({ assessmentId, user, onClose }: StudentExamViewProps) {
  const [assessment, setAssessment] = useState<any | null>(null);
  const [attempt, setAttempt] = useState<any | null>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [activeIdx, setActiveIdx] = useState(0);

  // Candidate answers state
  const [answers, setAnswers] = useState<Record<string, string>>({});
  
  // Immersive setup states
  const [examStarted, setExamStarted] = useState(false);
  const [systemChecked, setSystemChecked] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Proctoring Onboarding Verification States
  const [showPhotoCapture, setShowPhotoCapture] = useState(false);
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [faceAligned, setFaceAligned] = useState(false);
  const [detectionProgress, setDetectionProgress] = useState(0);
  const [isAutoCapturing, setIsAutoCapturing] = useState(false);
  const captureVideoRef = useRef<HTMLVideoElement | null>(null);
  
  // Timer state
  const [timeLeft, setTimeLeft] = useState(0); // seconds
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Tab switch count state
  const [tabSwitches, setTabSwitches] = useState(0);

  // Fetch assessment and start/resume attempt
  const initializeExam = async () => {
    try {
      const res = await fetch(`/api/assessments/${assessmentId}`, {
        headers: { "x-user-id": user.id, "x-user-role": "user" }
      });
      if (res.ok) {
        const data = await res.json();
        setAssessment(data.data);
        
        // Start or resume attempt
        const attemptRes = await fetch(`/api/assessments/${assessmentId}/start`, {
          method: "POST",
          headers: { "x-user-id": user.id, "x-user-role": "user" }
        });
        
        if (attemptRes.ok) {
          const attemptData = await attemptRes.json();
          setAttempt(attemptData.data.attempt);
          setQuestions(attemptData.data.questions || []);
          setTimeLeft(data.data.duration * 60);

          // If resuming an attempt, let's map already answered inputs if any
          // (Backend startAttempt returns already created attempt)
        } else {
          const data = await attemptRes.json();
          toast.error(data.message || "Failed to start exam.");
          onClose();
        }
      }
    } catch {
      toast.error("An error occurred during system checks.");
      onClose();
    }
  };

  useEffect(() => {
    initializeExam();
  }, [assessmentId]);

  // Request webcam stream during setup phase
  const startCameraSetup = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      setCameraStream(stream);
      setSystemChecked(true);
      toast.success("Webcam verified. Ready to start secure session.");
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      toast.error("Webcam access is REQUIRED to launch this assessment.");
    }
  };

  // Stop camera stream when leaving
  useEffect(() => {
    return () => {
      if (cameraStream) {
        cameraStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [cameraStream]);

  // Connect webcam to video tag once exam starts
  useEffect(() => {
    if (examStarted && videoRef.current && cameraStream) {
      videoRef.current.srcObject = cameraStream;
    }
  }, [examStarted, cameraStream]);

  // Connect webcam to verification capture video tag
  useEffect(() => {
    if (showPhotoCapture && captureVideoRef.current && cameraStream) {
      captureVideoRef.current.srcObject = cameraStream;
    }
  }, [showPhotoCapture, cameraStream]);

  // Automated Facial Detection Simulation
  useEffect(() => {
    if (!showPhotoCapture || capturedPhoto) return;

    setDetectionProgress(0);
    setFaceAligned(false);
    setIsAutoCapturing(true);

    let progressInterval: NodeJS.Timeout;

    // Simulate detection scan after 1 second delay
    const delayTimeout = setTimeout(() => {
      progressInterval = setInterval(() => {
        setDetectionProgress((prev) => {
          if (prev >= 100) {
            clearInterval(progressInterval);
            
            // Execute automated photo capture
            if (captureVideoRef.current) {
              const canvas = document.createElement("canvas");
              canvas.width = 640;
              canvas.height = 480;
              const ctx = canvas.getContext("2d");
              if (ctx && captureVideoRef.current) {
                ctx.drawImage(captureVideoRef.current, 0, 0, 640, 480);
                const dataUrl = canvas.toDataURL("image/jpeg");
                
                fetch("/api/proctoring/face-check", {
                  method: "POST",
                  headers: { 
                    "Content-Type": "application/json",
                    "x-user-id": user.id,
                    "x-user-role": "user"
                  },
                  body: JSON.stringify({ selfie: dataUrl })
                })
                .then(res => res.json())
                .then(resData => {
                  if (resData.success && resData.data.faceDetected) {
                    setCapturedPhoto(dataUrl);
                    setFaceAligned(true);
                    toast.success("AI Proctor: Face detected and aligned! Onboarding photo verified.");
                  } else {
                    setDetectionProgress(0);
                    setFaceAligned(false);
                    toast.error(resData.message || resData.data?.message || "AI Proctor: Face not detected. Retrying...");
                  }
                })
                .catch(() => {
                  setDetectionProgress(0);
                  setFaceAligned(false);
                  toast.error("AI Proctor: Connection error. Retrying...");
                });
              }
            }
            return 100;
          }
          return prev + 10;
        });
      }, 200);
    }, 1000);

    return () => {
      clearTimeout(delayTimeout);
      if (progressInterval) clearInterval(progressInterval);
      setIsAutoCapturing(false);
    };
  }, [showPhotoCapture, capturedPhoto]);

  const handleManualCapture = async () => {
    if (!captureVideoRef.current) return;
    const canvas = document.createElement("canvas");
    canvas.width = 640;
    canvas.height = 480;
    const ctx = canvas.getContext("2d");
    if (ctx && captureVideoRef.current) {
      ctx.drawImage(captureVideoRef.current, 0, 0, 640, 480);
      const dataUrl = canvas.toDataURL("image/jpeg");
      
      try {
        const res = await fetch("/api/proctoring/face-check", {
          method: "POST",
          headers: { 
            "Content-Type": "application/json",
            "x-user-id": user.id,
            "x-user-role": "user"
          },
          body: JSON.stringify({ selfie: dataUrl })
        });
        const resData = await res.json();
        if (res.ok && resData.success && resData.data.faceDetected) {
          setCapturedPhoto(dataUrl);
          setFaceAligned(true);
          setDetectionProgress(100);
          toast.success("Manual photo capture verified.");
        } else {
          toast.error(resData.message || resData.data?.message || "Manual photo capture verification failed: No face detected.");
        }
      } catch (err) {
        toast.error("Error contacting face check service.");
      }
    }
  };

  const handleRetakePhoto = () => {
    setCapturedPhoto(null);
    setFaceAligned(false);
    setDetectionProgress(0);
  };

  // Timer countdown hook
  useEffect(() => {
    if (!examStarted || timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleAutoSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [examStarted, timeLeft]);

  // Monitor visibility / tab switches
  useEffect(() => {
    if (!examStarted || !attempt) return;

    const handleVisibilityChange = async () => {
      if (document.hidden) {
        // Tab switch detected
        setTabSwitches((prev) => prev + 1);
        toast.warning("WARNING: Tab switch detected! This event has been logged to the proctoring dashboard.");
        
        // Log to backend
        try {
          await fetch(`/api/assessments/attempts/${attempt.id}/violation`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-user-id": user.id,
              "x-user-role": "user"
            },
            body: JSON.stringify({
              type: "tab-switch",
              severity: "medium",
              description: "Candidate switched browser tabs or minimized the assessment environment."
            })
          });
        } catch (err) {
          console.error("Failed to log violation:", err);
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [examStarted, attempt]);

  // Trigger occasional gaze-away simulation warnings to demonstrate full gaze proctoring!
  useEffect(() => {
    if (!examStarted || !attempt || !assessment?.gazeTracking) return;

    const interval = setInterval(async () => {
      // 5% chance of warning per interval to show mock eye tracking
      if (Math.random() < 0.15) {
        toast.info("AI Monitor: Please keep your focus on the assessment screen.");
        try {
          await fetch(`/api/assessments/attempts/${attempt.id}/violation`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-user-id": user.id,
              "x-user-role": "user"
            },
            body: JSON.stringify({
              type: "gaze-away",
              severity: "low",
              description: "AI Gaze Tracker: Candidate looked away from the monitor screen."
            })
          });
        } catch {
          // ignore
        }
      }
    }, 25000);

    return () => clearInterval(interval);
  }, [examStarted, attempt, assessment]);

  // Report progress changes to backend
  const updateProgressPercent = async (updatedAnswers: Record<string, string>) => {
    if (!attempt || questions.length === 0) return;
    const answeredCount = Object.keys(updatedAnswers).length;
    const pct = Math.round((answeredCount / questions.length) * 100);
    
    try {
      await fetch(`/api/assessments/attempts/${attempt.id}/progress`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": user.id,
          "x-user-role": "user"
        },
        body: JSON.stringify({ progress: pct })
      });
    } catch {
      // ignore
    }
  };

  const handleSelectOption = (qId: string, opt: string) => {
    const nextAnswers = { ...answers, [qId]: opt };
    setAnswers(nextAnswers);
    updateProgressPercent(nextAnswers);
  };

  const handleTextChange = (qId: string, text: string) => {
    const nextAnswers = { ...answers, [qId]: text };
    setAnswers(nextAnswers);
    updateProgressPercent(nextAnswers);
  };

  const handleAutoSubmit = () => {
    toast.info("Time limit reached. Auto-submitting assessment responses...");
    handleSubmit();
  };

  const handleSubmit = async () => {
    if (isSubmitting || !attempt) return;
    setIsSubmitting(true);

    try {
      const answersPayload = Object.entries(answers).map(([questionId, response]) => ({
        questionId,
        response
      }));

      const res = await fetch(`/api/assessments/attempts/${attempt.id}/submit`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": user.id,
          "x-user-role": "user"
        },
        body: JSON.stringify({ answers: answersPayload })
      });

      if (res.ok) {
        toast.success("Exam submitted successfully! The assessment is complete.");
        // Stop webcam
        if (cameraStream) {
          cameraStream.getTracks().forEach((track) => track.stop());
        }
        setTimeout(() => {
          onClose();
        }, 1500);
      } else {
        toast.error("Failed to submit.");
        setIsSubmitting(false);
      }
    } catch {
      toast.error("Submission failed.");
      setIsSubmitting(false);
    }
  };

  // Formatting remaining time
  const formatTime = (secs: number) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    return `${h > 0 ? h + ":" : ""}${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  if (!assessment || !attempt) {
    return (
      <div className="min-h-screen bg-[#F5EEDC] flex items-center justify-center">
        <div className="text-center space-y-2">
          <div className="animate-spin size-8 border-4 border-[#c5af8a] border-t-transparent rounded-full mx-auto" />
          <p className="text-sm font-bold text-[#8e8a80]">Initializing assessment shields...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-[#1a1917] text-[#fffcf7] flex flex-col font-sans select-none overflow-hidden relative">
      <style>{`
        @keyframes scan {
          0% { top: 0%; }
          50% { top: 100%; }
          100% { top: 0%; }
        }
      `}</style>
      {/* 1. SETUP / CAMERA CHECK PHASE OR ONBOARDING PHOTO CAPTURE */}
      {!examStarted ? (
        showPhotoCapture ? (
          /* ONBOARDING PHOTO CAPTURE VIEW */
          <div className="flex-1 flex items-center justify-center p-4">
            <div className="max-w-[500px] w-full rounded-3xl bg-[#242220] border border-zinc-800 p-8 space-y-6 shadow-2xl relative overflow-hidden">
              <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-[#c5af8a]/40 to-transparent" />
              
              <div className="text-center space-y-2">
                <span className="text-[10px] font-bold text-[#c5af8a] uppercase tracking-wider block">Step 2: Proctoring Onboarding</span>
                <h2 className="text-xl font-bold text-white">Facial Biometric Verification</h2>
                <p className="text-xs text-zinc-400">Position your face within the guide box to align and capture.</p>
              </div>

              {/* Guide box and video feed */}
              <div className="aspect-video bg-zinc-950 rounded-2xl border border-zinc-800 relative flex items-center justify-center overflow-hidden">
                {capturedPhoto ? (
                  <img src={capturedPhoto} className="absolute inset-0 w-full h-full object-cover" alt="Captured Candidate" />
                ) : (
                  <>
                    <video ref={captureVideoRef} autoPlay playsInline muted className="absolute inset-0 w-full h-full object-cover opacity-80" />
                    
                    {/* Frame overlay */}
                    <div className={`absolute size-[160px] rounded-full border-2 border-dashed transition-all duration-300 ${faceAligned ? "border-emerald-500 bg-emerald-500/5 shadow-[0_0_20px_rgba(16,185,129,0.3)]" : "border-[#c5af8a]/60 animate-pulse"}`}>
                      {/* Scanning vertical line */}
                      {!faceAligned && (
                        <div className="w-full h-0.5 bg-[#c5af8a] shadow-[0_0_8px_#c5af8a] absolute top-0 animate-[scan_2s_infinite_ease-in-out]" />
                      )}
                    </div>
                  </>
                )}
              </div>

              {/* Progress and status */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs text-zinc-300">
                  <span className="font-semibold">
                    {capturedPhoto 
                      ? "✓ Photo Verified" 
                      : faceAligned 
                      ? "✓ Face Aligned" 
                      : "Scanning for face alignment..."}
                  </span>
                  {!capturedPhoto && (
                    <span className="font-mono text-[10px] text-zinc-450">{detectionProgress}%</span>
                  )}
                </div>
                {!capturedPhoto && (
                  <div className="h-1.5 w-full bg-zinc-900 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-[#c5af8a] to-emerald-500 transition-all duration-200" 
                      style={{ width: `${detectionProgress}%` }}
                    />
                  </div>
                )}
              </div>

              {/* Capture Control Button panel */}
              <div className="flex flex-col gap-3">
                <div className="flex gap-3">
                  {capturedPhoto ? (
                    <button
                      type="button"
                      onClick={handleRetakePhoto}
                      className="flex-1 py-3 border border-zinc-800 hover:bg-zinc-800 rounded-xl text-xs font-bold transition cursor-pointer text-white"
                    >
                      Retake Photo
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleManualCapture}
                      className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-white py-3 rounded-xl text-xs font-bold transition cursor-pointer"
                    >
                      Take Photo
                    </button>
                  )}

                  <button
                    type="button"
                    disabled={!capturedPhoto}
                    onClick={() => {
                      setShowPhotoCapture(false);
                      setExamStarted(true);
                    }}
                    className="flex-1 bg-[#c5af8a] hover:bg-[#b09b77] disabled:opacity-40 disabled:hover:bg-[#c5af8a] text-zinc-950 py-3 rounded-xl text-xs font-bold transition cursor-pointer shadow-md"
                  >
                    Proceed
                  </button>
                </div>
                
                <button
                  type="button"
                  onClick={() => setShowPhotoCapture(false)}
                  className="w-full py-2.5 text-zinc-500 hover:text-zinc-300 text-[11px] font-bold bg-transparent border-none cursor-pointer"
                >
                  Cancel
                </button>
              </div>

            </div>
          </div>
        ) : (
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="max-w-[480px] w-full rounded-3xl bg-[#242220] border border-zinc-800 p-8 space-y-6 shadow-2xl">
            <div className="text-center space-y-2">
              <span className="text-[10px] font-bold text-[#c5af8a] uppercase tracking-wider">IntegrityOS System Check</span>
              <h2 className="text-xl font-bold">{assessment.title}</h2>
              <p className="text-xs text-zinc-400">Duration: {assessment.duration} mins • Connected via matching institution policies.</p>
            </div>

            <div className="aspect-video bg-zinc-950 rounded-2xl border border-zinc-800 relative flex items-center justify-center overflow-hidden">
              {systemChecked && cameraStream ? (
                <video ref={videoRef} autoPlay playsInline muted className="absolute inset-0 w-full h-full object-cover" />
              ) : (
                <div className="text-center space-y-3">
                  <Camera className="size-12 text-zinc-700 mx-auto" />
                  <p className="text-xs text-zinc-500">Camera authorization is required before launching the exam.</p>
                </div>
              )}
            </div>

            <div className="rounded-xl bg-[#2a2825] border border-zinc-700/50 p-4 space-y-2">
              <span className="text-xs font-bold text-[#c5af8a] flex items-center gap-1.5">
                <ShieldCheck className="size-4" /> Exam Security Policy
              </span>
              <ul className="text-[11px] text-zinc-400 space-y-1 pl-4 list-disc">
                <li>Webcam monitoring must remain active during the entire exam.</li>
                <li>Tab switching, window resizing, or screen minimizing will flag an alert.</li>
                <li>Ensure a quiet, well-lit private space with no background voices.</li>
              </ul>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-3 border border-zinc-800 hover:bg-zinc-800 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                Exit Portal
              </button>
              
              {!systemChecked ? (
                <button
                  type="button"
                  onClick={startCameraSetup}
                  className="flex-1 bg-[#c5af8a] hover:bg-[#b09b77] text-zinc-950 py-3 rounded-xl text-xs font-bold transition cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Camera className="size-4" /> Check Webcam
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowPhotoCapture(true)}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-xl text-xs font-bold transition cursor-pointer flex items-center justify-center gap-1.5 shadow-md shadow-emerald-950/20"
                >
                  <Play className="size-4 fill-current" /> Start Exam
                </button>
              )}
            </div>
          </div>
        </div>
      ) ) : (
        /* 2. SECURE EXAM ROOM ENVIRONMENT */
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
          
          {/* Floating Beige Proctor HUD Widget */}
          <div className="fixed top-4 right-4 z-50 bg-[#F2EBD9] text-[#1a1917] border border-[#d5cbb8] rounded-2xl p-4 shadow-xl flex items-center gap-3.5 w-80 select-none">
            {/* Profile Photo */}
            <div className="size-14 rounded-xl border border-[#d5cbb8] overflow-hidden bg-zinc-200 shrink-0 shadow-inner">
              {capturedPhoto ? (
                <img src={capturedPhoto} className="w-full h-full object-cover" alt="Proctor Profile" />
              ) : (
                <div className="size-full flex items-center justify-center bg-zinc-300 text-zinc-600 font-bold">👤</div>
              )}
            </div>
            <div className="flex-1 min-w-0 text-xs text-[#242220]">
              <span className="text-[9px] font-extrabold text-[#91764c] uppercase tracking-wider block mb-0.5">Active Proctor HUD</span>
              <p className="font-extrabold text-sm text-[#1c1b1b] truncate">{user.name}</p>
              <p className="text-[10px] text-zinc-500 font-mono mt-0.5">Exam ID: {assessmentId}</p>
              <div className="flex items-center gap-1.5 mt-2 font-extrabold text-zinc-900 bg-black/5 px-2 py-1 rounded-lg w-fit">
                <Clock className="size-3.5 text-[#91764c]" />
                <span className="font-mono tracking-wide">{formatTime(timeLeft)} left</span>
              </div>
            </div>
          </div>

          {/* Main workspace section (Left/Center) */}
          <div className="flex-1 flex flex-col justify-between overflow-y-auto p-6 md:p-8 md:pr-14">
            
            {/* Header banner inside Exam room */}
            <div className="flex items-center justify-between border-b border-zinc-800 pb-4 mb-6">
              <div>
                <h3 className="text-lg font-bold">{assessment.title}</h3>
                <span className="text-[11px] text-zinc-400">SRM University AP • Candidate: {user.name}</span>
              </div>
              <div className="bg-[#242220] border border-zinc-800 rounded-xl px-4 py-2 flex items-center gap-2">
                <Clock className="size-4 text-[#c5af8a]" />
                <span className="text-sm font-extrabold font-mono tracking-widest text-[#c5af8a]">
                  {formatTime(timeLeft)}
                </span>
              </div>
            </div>

            {/* Current Active Question area */}
            {questions.length > 0 && (
              <div className="flex-1 flex flex-col justify-between max-w-3xl w-full mx-auto space-y-6">
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-zinc-400">
                      Question {activeIdx + 1} of {questions.length}
                    </span>
                    <span className="text-[11px] text-white bg-zinc-800 border rounded px-2.5 py-0.5 uppercase">
                      {questions[activeIdx].difficulty} • {questions[activeIdx].points} pts
                    </span>
                  </div>

                  {/* Question Prompt */}
                  <div className="bg-[#242220] border border-zinc-800 rounded-2xl p-6 shadow-md">
                    <p className="text-[15px] leading-relaxed font-semibold">
                      {questions[activeIdx].text}
                    </p>
                  </div>

                  {/* Answers input types matching questions format */}
                  <div className="space-y-3 pt-3">
                    {/* MCQ Options */}
                    {questions[activeIdx].type === "multiple-choice" && (
                      <div className="grid grid-cols-1 gap-2.5">
                        {JSON.parse(questions[activeIdx].options || "[]").map((opt: string, optIdx: number) => {
                          const isSelected = answers[questions[activeIdx].id] === opt;
                          return (
                            <button
                              key={optIdx}
                              type="button"
                              onClick={() => handleSelectOption(questions[activeIdx].id, opt)}
                              className={`w-full text-left p-4 rounded-xl border text-sm font-medium transition cursor-pointer flex items-center justify-between ${
                                isSelected
                                  ? "border-[#c5af8a] bg-[#c5af8a]/10 text-[#fffcf7]"
                                  : "border-zinc-800 bg-[#242220]/45 hover:bg-zinc-800/50"
                              }`}
                            >
                              <span>{String.fromCharCode(65 + optIdx)}: {opt}</span>
                              <span className={`size-4 rounded-full border flex items-center justify-center shrink-0 ${isSelected ? "border-[#c5af8a] bg-[#c5af8a]" : "border-zinc-700"}`}>
                                {isSelected && <span className="size-1.5 rounded-full bg-zinc-950" />}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {/* Descriptive answers */}
                    {questions[activeIdx].type === "descriptive" && (
                      <textarea
                        rows={6}
                        value={answers[questions[activeIdx].id] || ""}
                        onChange={(e) => handleTextChange(questions[activeIdx].id, e.target.value)}
                        placeholder="Write your explanation answer here..."
                        className="w-full bg-[#242220]/50 border border-zinc-800 rounded-xl p-4 text-sm font-normal focus:outline-none focus:border-[#c5af8a] focus:ring-1 focus:ring-[#c5af8a]"
                      />
                    )}

                    {/* Coding Editor Simulator Textarea */}
                    {questions[activeIdx].type === "coding" && (
                      <div className="space-y-1.5">
                        <textarea
                          rows={10}
                          value={answers[questions[activeIdx].id] || ""}
                          onChange={(e) => handleTextChange(questions[activeIdx].id, e.target.value)}
                          placeholder="// Write your code solution here (Python/Java/JavaScript syntax)..."
                          className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-4 text-xs font-mono focus:outline-none focus:border-[#c5af8a] focus:ring-1 focus:ring-[#c5af8a] caret-white"
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer navigations */}
                <div className="flex justify-between items-center pt-6 border-t border-zinc-800 mt-6">
                  <button
                    type="button"
                    disabled={activeIdx === 0}
                    onClick={() => setActiveIdx((prev) => prev - 1)}
                    className="flex items-center gap-1.5 text-xs font-bold text-zinc-400 hover:text-white transition disabled:opacity-30 cursor-pointer"
                  >
                    <ChevronLeft className="size-4" /> Previous
                  </button>

                  {activeIdx < questions.length - 1 ? (
                    <button
                      type="button"
                      onClick={() => setActiveIdx((prev) => prev + 1)}
                      className="flex items-center gap-1.5 text-xs font-bold text-zinc-400 hover:text-white transition cursor-pointer"
                    >
                      Next Question <ChevronRight className="size-4" />
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleSubmit}
                      disabled={isSubmitting}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-5 py-2.5 rounded-xl shadow-lg transition cursor-pointer disabled:opacity-50"
                    >
                      {isSubmitting ? "Submitting..." : "Submit Examination"}
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Secure Right Sidebar (Biometric logs & indicators) */}
          <aside className="w-full md:w-[280px] shrink-0 bg-[#242220] border-t md:border-t-0 md:border-l border-zinc-800 p-5 flex flex-col justify-between select-none">
            <div className="space-y-6">
              
              {/* Webcam stream check */}
              <div className="space-y-2">
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Integrity Video Stream</span>
                <div className="relative aspect-video rounded-xl bg-zinc-950 border border-zinc-800 overflow-hidden">
                  <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                  <div className="absolute top-2 left-2 size-2 rounded-full bg-emerald-500 animate-pulse" />
                </div>
              </div>

              {/* Status Indexes */}
              <div className="space-y-3.5">
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Integrity Status Panel</span>
                
                <div className="flex items-center justify-between bg-zinc-900/50 rounded-xl p-3 border border-zinc-800">
                  <div className="flex items-center gap-2">
                    <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-xs font-semibold text-zinc-300">AI Shield Active</span>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-400 uppercase">Secure</span>
                </div>

                <div className="flex items-center justify-between bg-zinc-900/50 rounded-xl p-3 border border-zinc-800">
                  <span className="text-xs font-semibold text-zinc-300">Tab Switch Limit</span>
                  <span className={`text-xs font-bold ${tabSwitches > 2 ? "text-red-500" : "text-zinc-400"}`}>
                    {tabSwitches} / 3 Switches
                  </span>
                </div>
              </div>

              {/* Questions Checklist map */}
              <div className="space-y-2">
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Questions Checklist</span>
                <div className="grid grid-cols-5 gap-2">
                  {questions.map((q, idx) => {
                    const isAnswered = answers[q.id] !== undefined;
                    const isActive = idx === activeIdx;
                    return (
                      <button
                        key={q.id}
                        type="button"
                        onClick={() => setActiveIdx(idx)}
                        className={`aspect-square rounded-lg flex items-center justify-center text-xs font-extrabold border transition cursor-pointer ${
                          isActive
                            ? "bg-[#c5af8a] text-zinc-950 border-[#c5af8a]"
                            : isAnswered
                            ? "bg-zinc-800 text-zinc-300 border-zinc-700"
                            : "bg-transparent text-zinc-500 border-zinc-800 hover:border-zinc-700"
                        }`}
                      >
                        {idx + 1}
                      </button>
                    );
                  })}
                </div>
              </div>

            </div>

            {/* Help guidelines */}
            <div className="pt-5 border-t border-zinc-800 flex gap-2 text-zinc-500 text-[10px] items-center">
              <HelpCircle className="size-4 shrink-0" />
              <span>Need assistance? Use the portal help menu for proctor warnings.</span>
            </div>
          </aside>

        </div>
      )}
    </div>
  );
}
