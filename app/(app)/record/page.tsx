"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Mic, Square, Upload, FileAudio, Loader2, X } from "lucide-react";
import Waveform from "@/components/Waveform";
import UpgradeModal from "@/components/UpgradeModal";
import Toast from "@/components/Toast";
import { createClient } from "@/lib/supabase/client";

type RecordingMode = "inperson" | "online";
type AnalysisStep = "transcribing" | "speakers" | "summary" | "actions";
const ANALYSIS_STEPS: { key: AnalysisStep; label: string }[] = [
  { key: "transcribing", label: "Transcribing audio..." },
  { key: "speakers", label: "Identifying speakers..." },
  { key: "summary", label: "Generating summary..." },
  { key: "actions", label: "Extracting action items..." },
];

export default function RecordPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [recording, setRecording] = useState(false);
  const [timer, setTimer] = useState(0);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisStep, setAnalysisStep] = useState(0);
  const [dragOver, setDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [recordingMode, setRecordingModeState] = useState<RecordingMode>("inperson");
  const [onlineModeAvailable, setOnlineModeAvailable] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);
  const tabStreamRef = useRef<MediaStream | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const recordingModeRef = useRef<RecordingMode>("inperson");

  function setRecordingMode(mode: RecordingMode) {
    setRecordingModeState(mode);
    recordingModeRef.current = mode;
  }

  const showToast = useCallback((message: string, type: "success" | "error") => {
    setToast({ message, type });
  }, []);

  useEffect(() => {
    const ua = navigator.userAgent;
    const isChromium = /Chrome\//.test(ua);
    const isDesktop = !/Mobi|Android/.test(ua);
    const hasGetDisplayMedia = typeof navigator.mediaDevices?.getDisplayMedia === "function";
    setOnlineModeAvailable(hasGetDisplayMedia && isChromium && isDesktop);
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined" && window.location.search.includes("upgraded=true")) {
      const w = window as Window & { dataLayer?: object[] };
      w.dataLayer = w.dataLayer || [];
      w.dataLayer.push({
        event: "purchase_completed",
        plan: "pro",
        value: 15,
        currency: "USD",
      });
      showToast("Welcome to Pro! You now have unlimited meetings.", "success");
      router.replace("/record");
    }
  }, [showToast, router]);

  async function checkPlanLimit(): Promise<boolean> {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const { data: profile } = await supabase
      .from("profiles")
      .select("plan, meetings_count")
      .eq("id", user.id)
      .single();

    if (profile?.plan === "free" && (profile?.meetings_count || 0) >= 3) {
      setShowUpgrade(true);
      return false;
    }
    return true;
  }

  function cleanupOnlineStreams() {
    tabStreamRef.current?.getTracks().forEach((t) => t.stop());
    micStreamRef.current?.getTracks().forEach((t) => t.stop());
    audioContextRef.current?.close();
    tabStreamRef.current = null;
    micStreamRef.current = null;
    audioContextRef.current = null;
  }

  function launchMediaRecorder(stream: MediaStream) {
    const mediaRecorder = new MediaRecorder(stream);
    mediaRecorderRef.current = mediaRecorder;
    chunksRef.current = [];

    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };

    mediaRecorder.start(100);
    setRecording(true);
    startTimeRef.current = Date.now();

    timerRef.current = setInterval(() => {
      setTimer(Math.floor((Date.now() - startTimeRef.current) / 1000));
    }, 1000);
  }

  async function startInPersonRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      launchMediaRecorder(stream);
    } catch {
      showToast("Microphone access denied. Please allow microphone permissions.", "error");
    }
  }

  async function startOnlineRecording() {
    let tabStream: MediaStream;
    try {
      tabStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true,
        // @ts-expect-error: Chrome-specific constraints
        preferCurrentTab: false,
        selfBrowserSurface: "exclude",
        systemAudio: "include",
      });
    } catch {
      return;
    }

    tabStream.getVideoTracks().forEach((t) => t.stop());

    const tabAudioTracks = tabStream.getAudioTracks();
    if (tabAudioTracks.length === 0) {
      tabStream.getTracks().forEach((t) => t.stop());
      showToast(
        "No audio detected. Select the meeting tab and check 'Share tab audio'.",
        "error"
      );
      return;
    }

    let micStream: MediaStream;
    try {
      micStream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true },
      });
    } catch {
      tabStream.getTracks().forEach((t) => t.stop());
      showToast("Microphone access denied. Please allow microphone permissions.", "error");
      return;
    }

    const audioContext = new AudioContext();
    const destination = audioContext.createMediaStreamDestination();
    audioContext.createMediaStreamSource(tabStream).connect(destination);
    audioContext.createMediaStreamSource(micStream).connect(destination);

    tabStreamRef.current = tabStream;
    micStreamRef.current = micStream;
    audioContextRef.current = audioContext;

    tabAudioTracks[0].addEventListener("ended", () => {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
        stopAndAnalyze();
      }
    });

    launchMediaRecorder(destination.stream);
  }

  async function startRecording() {
    const allowed = await checkPlanLimit();
    if (!allowed) return;

    if (recordingModeRef.current === "online") {
      await startOnlineRecording();
    } else {
      await startInPersonRecording();
    }
  }

  async function stopAndAnalyze() {
    const mr = mediaRecorderRef.current;
    if (!mr || mr.state === "inactive") return;

    mr.stop();

    if (recordingModeRef.current === "online") {
      cleanupOnlineStreams();
    } else {
      mr.stream.getTracks().forEach((t) => t.stop());
    }

    if (timerRef.current) clearInterval(timerRef.current);
    setRecording(false);

    await new Promise<void>((resolve) => {
      mr.onstop = () => resolve();
    });

    const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
    const blob = new Blob(chunksRef.current, { type: "audio/webm" });
    const file = new File([blob], "recording.webm", { type: "audio/webm" });
    await analyzeFile(file, elapsed);
  }

  async function analyzeFile(file: File, duration?: number) {
    setAnalyzing(true);
    setAnalysisStep(0);

    const stepInterval = setInterval(() => {
      setAnalysisStep((prev) => {
        if (prev < ANALYSIS_STEPS.length - 1) return prev + 1;
        return prev;
      });
    }, 1500);

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const formData = new FormData();
      formData.append("audio", file);
      formData.append("title", title || "");
      formData.append("userId", user.id);
      if (duration) formData.append("duration", String(duration));

      const res = await fetch("/api/analyze", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        if (data.error === "upgrade_required") {
          clearInterval(stepInterval);
          setAnalyzing(false);
          setShowUpgrade(true);
          return;
        }
        throw new Error(data.error || "Analysis failed");
      }

      clearInterval(stepInterval);
      router.push(`/meetings/${data.meetingId}`);
    } catch (err) {
      clearInterval(stepInterval);
      setAnalyzing(false);
      showToast(err instanceof Error ? err.message : "Analysis failed. Please try again.", "error");
    }
  }

  async function handleFileSelect(file: File) {
    const MAX_SIZE = 100 * 1024 * 1024;
    const ALLOWED = ["audio/mpeg", "audio/mp4", "audio/wav", "audio/webm", "audio/ogg", "audio/x-m4a", "video/mp4"];

    if (file.size > MAX_SIZE) {
      showToast("File too large. Maximum size is 100MB.", "error");
      return;
    }
    if (!ALLOWED.some((t) => file.type.startsWith(t.split("/")[0]))) {
      showToast("Unsupported file type. Use MP3, M4A, WAV, WebM, OGG, or MP4.", "error");
      return;
    }

    const allowed = await checkPlanLimit();
    if (!allowed) return;

    setSelectedFile(file);
  }

  async function handleUploadAndAnalyze() {
    if (!selectedFile) return;
    await analyzeFile(selectedFile);
  }

  function formatTimer(s: number) {
    const m = Math.floor(s / 60).toString().padStart(2, "0");
    const sec = (s % 60).toString().padStart(2, "0");
    return `${m}:${sec}`;
  }

  if (analyzing) {
    return (
      <div className="max-w-2xl mx-auto px-6 py-16 flex flex-col items-center text-center gap-6">
        <div className="w-16 h-16 border-4 border-stone-200 border-t-[#2d5a27] rounded-full animate-spin" />
        <div>
          <h2 className="text-xl font-semibold text-stone-900 mb-1">
            Analyzing your meeting
          </h2>
          <p className="text-stone-500 text-sm">
            {ANALYSIS_STEPS[analysisStep]?.label}
          </p>
        </div>
        <div className="flex gap-1">
          {ANALYSIS_STEPS.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 w-8 rounded-full transition-colors ${
                i <= analysisStep ? "bg-[#2d5a27]" : "bg-stone-200"
              }`}
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-6 py-10 space-y-6">
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
      {showUpgrade && <UpgradeModal onClose={() => setShowUpgrade(false)} />}

      <div>
        <h1 className="text-2xl font-bold text-stone-900 mb-1">New meeting</h1>
        <p className="text-stone-500 text-sm">Record or upload audio to extract action items automatically.</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-stone-700 mb-1">
          Meeting title <span className="text-stone-400 font-normal">(optional)</span>
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Team meeting, Project review..."
          className="w-full px-3 py-2.5 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#2d5a27] focus:border-transparent"
        />
      </div>

      <div className="bg-white rounded-xl border border-stone-200 p-6">
        <h2 className="text-sm font-medium text-stone-700 mb-4">Start recording</h2>

        {!recording && (
          <div className="flex rounded-lg border border-stone-300 overflow-hidden mb-4">
            <button
              id="mode-inperson"
              onClick={() => setRecordingMode("inperson")}
              className={`flex-1 py-2 text-sm font-medium transition-colors ${
                recordingMode === "inperson"
                  ? "bg-[#24481f] text-white"
                  : "bg-white text-stone-600 hover:bg-stone-50"
              }`}
            >
              In-person
            </button>
            <button
              id="mode-online"
              onClick={() => onlineModeAvailable && setRecordingMode("online")}
              disabled={!onlineModeAvailable}
              className={`flex-1 py-2 text-sm font-medium transition-colors leading-tight ${
                recordingMode === "online"
                  ? "bg-[#24481f] text-white"
                  : onlineModeAvailable
                  ? "bg-white text-stone-600 hover:bg-stone-50"
                  : "bg-white text-stone-400 cursor-not-allowed"
              }`}
            >
              Online meeting (browser tab)
              {!onlineModeAvailable && (
                <span className="block text-xs font-normal mt-0.5">
                  Available on Chrome and Edge desktop
                </span>
              )}
            </button>
          </div>
        )}

        {recordingMode === "online" && !recording && (
          <div className="text-xs text-stone-600 bg-stone-50 border border-stone-200 rounded-lg p-3 mb-4">
            Chrome will ask you to choose a tab. Pick your meeting tab and make sure{" "}
            <strong>&apos;Share tab audio&apos;</strong> is checked.
          </div>
        )}

        {recording ? (
          <div className="space-y-4">
            <div className="flex items-center justify-center gap-3">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              <span className="text-2xl font-mono font-bold text-stone-900">
                {formatTimer(timer)}
              </span>
            </div>
            <Waveform />
            <button
              onClick={stopAndAnalyze}
              className="w-full flex items-center justify-center gap-2 bg-red-500 text-white py-3 rounded-lg font-medium hover:bg-red-600 transition-colors"
            >
              <Square className="w-4 h-4" />
              Stop and analyze
            </button>
          </div>
        ) : (
          <button
            onClick={startRecording}
            className="w-full flex items-center justify-center gap-2 bg-[#2d5a27] text-white py-3 rounded-lg font-medium hover:bg-[#24481f] transition-colors"
          >
            <Mic className="w-4 h-4" />
            Start recording
          </button>
        )}
      </div>

      <div className="flex items-center gap-3">
        <div className="flex-1 h-px bg-stone-200" />
        <span className="text-xs text-stone-400">or</span>
        <div className="flex-1 h-px bg-stone-200" />
      </div>

      <div className="bg-white rounded-xl border border-stone-200 p-6">
        <h2 className="text-sm font-medium text-stone-700 mb-4">Import an audio file</h2>

        {selectedFile ? (
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 bg-[#f6f1ed] rounded-lg border border-stone-200">
              <FileAudio className="w-8 h-8 text-[#2d5a27]" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-stone-900 truncate">{selectedFile.name}</p>
                <p className="text-xs text-stone-500">
                  {(selectedFile.size / (1024 * 1024)).toFixed(1)} MB
                </p>
              </div>
              <button
                onClick={() => setSelectedFile(null)}
                className="text-stone-400 hover:text-stone-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <button
              onClick={handleUploadAndAnalyze}
              className="w-full flex items-center justify-center gap-2 bg-[#2d5a27] text-white py-3 rounded-lg font-medium hover:bg-[#24481f] transition-colors"
            >
              <Loader2 className="w-4 h-4" />
              Analyze this file
            </button>
          </div>
        ) : (
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragOver(false);
              const file = e.dataTransfer.files[0];
              if (file) handleFileSelect(file);
            }}
            className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors cursor-pointer ${
              dragOver
                ? "border-[#2d5a27] bg-green-50"
                : "border-stone-300 hover:border-stone-400 hover:bg-[#f6f1ed]"
            }`}
            onClick={() => document.getElementById("file-input")?.click()}
          >
            <Upload className="w-8 h-8 text-stone-400 mx-auto mb-2" />
            <p className="text-sm font-medium text-stone-700">
              Drop your audio file here, or{" "}
              <span className="text-[#2d5a27]">browse</span>
            </p>
            <p className="text-xs text-stone-400 mt-1">
              MP3, M4A, WAV, WebM, OGG, MP4 — Max 100MB
            </p>
            <input
              id="file-input"
              type="file"
              accept=".mp3,.m4a,.wav,.webm,.ogg,.mp4,audio/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFileSelect(file);
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
