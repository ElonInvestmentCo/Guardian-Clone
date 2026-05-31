import { useState, useRef, useCallback, useEffect } from "react";

export type VoiceStatus = "idle" | "connecting" | "active" | "error";

export interface VoiceMessage {
  id: string;
  role: "user" | "assistant";
  text: string;
  interrupted?: boolean;
}

interface UseVoiceAgentOptions {
  voice?: string;
  instructions?: string;
}

const WS_ENDPOINT = "wss://api.x.ai/v1/realtime?model=grok-voice-latest";
const MIC_BUFFER_CAP = 240_000;

function audioToBase64(int16Array: Int16Array): string {
  const bytes = new Uint8Array(int16Array.buffer, int16Array.byteOffset, int16Array.byteLength);
  const CHUNK = 0x2000;
  const parts: string[] = [];
  for (let i = 0; i < bytes.length; i += CHUNK) {
    parts.push(String.fromCharCode.apply(null, Array.from(bytes.subarray(i, i + CHUNK))));
  }
  return btoa(parts.join(""));
}

export function useVoiceAgent(options: UseVoiceAgentOptions = {}) {
  const {
    voice = "Eve",
    instructions = `You are Guardian AI, an expert trading assistant for Guardian Trading platform. 
You help users with: market analysis, portfolio review, trade ideas, risk management, 
economic news, crypto and stocks, and account questions. 
Be concise, clear, and professional. Use numbers and data when helpful. 
Keep responses conversational and under 3 sentences unless the user asks for detail.`,
  } = options;

  const [status, setStatus] = useState<VoiceStatus>("idle");
  const [messages, setMessages] = useState<VoiceMessage[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [micLevel, setMicLevel] = useState(0);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const wsRef = useRef<WebSocket | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const workletNodeRef = useRef<AudioWorkletNode | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const micBufferRef = useRef<Int16Array[]>([]);
  const micBufferSizeRef = useRef(0);
  const sessionReadyRef = useRef(false);
  const intentionalCloseRef = useRef(false);
  const nextPlayTimeRef = useRef(0);
  const queuedSourcesRef = useRef<AudioBufferSourceNode[]>([]);
  const currentResponseIdRef = useRef<string | null>(null);
  const animFrameRef = useRef<number>(0);
  const tokenExpiresAtRef = useRef<number>(0);
  const tokenValueRef = useRef<string>("");

  const addMessage = useCallback((msg: VoiceMessage) => {
    setMessages((prev) => {
      const existing = prev.findIndex((m) => m.id === msg.id);
      if (existing !== -1) {
        const updated = [...prev];
        updated[existing] = msg;
        return updated;
      }
      return [...prev, msg];
    });
  }, []);

  const updateMessage = useCallback((id: string, patch: Partial<VoiceMessage>) => {
    setMessages((prev) =>
      prev.map((m) => (m.id === id ? { ...m, ...patch } : m))
    );
  }, []);

  const interruptPlayback = useCallback(() => {
    for (const src of queuedSourcesRef.current) {
      try { src.stop(); } catch { /* already stopped */ }
    }
    queuedSourcesRef.current = [];
    nextPlayTimeRef.current = 0;
    setIsSpeaking(false);
  }, []);

  const playPcmChunk = useCallback((base64: string) => {
    const ctx = audioCtxRef.current;
    if (!ctx) return;

    const raw = atob(base64);
    const bytes = new Uint8Array(raw.length);
    for (let i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i);
    const int16 = new Int16Array(bytes.buffer);
    const float32 = new Float32Array(int16.length);
    for (let i = 0; i < int16.length; i++) float32[i] = int16[i] / 32768;

    const buf = ctx.createBuffer(1, float32.length, 24000);
    buf.getChannelData(0).set(float32);
    const src = ctx.createBufferSource();
    src.buffer = buf;
    src.connect(ctx.destination);

    const now = ctx.currentTime;
    const startAt = Math.max(now, nextPlayTimeRef.current);
    src.start(startAt);
    nextPlayTimeRef.current = startAt + buf.duration;
    queuedSourcesRef.current.push(src);
    setIsSpeaking(true);

    src.onended = () => {
      const idx = queuedSourcesRef.current.indexOf(src);
      if (idx !== -1) queuedSourcesRef.current.splice(idx, 1);
      if (queuedSourcesRef.current.length === 0) setIsSpeaking(false);
    };
  }, []);

  const sendAudioChunk = useCallback((int16: Int16Array) => {
    const ws = wsRef.current;
    if (!ws || ws.readyState !== WebSocket.OPEN) return;
    ws.send(JSON.stringify({
      type: "input_audio_buffer.append",
      audio: audioToBase64(int16),
    }));
  }, []);

  const handleWsMessage = useCallback((event: MessageEvent) => {
    let msg: Record<string, unknown>;
    try { msg = JSON.parse(event.data as string) as Record<string, unknown>; }
    catch { return; }

    switch (msg.type as string) {
      case "session.created":
        break;

      case "session.updated":
        if (!sessionReadyRef.current) {
          sessionReadyRef.current = true;
          setStatus("active");
          const buf = micBufferRef.current;
          micBufferRef.current = [];
          micBufferSizeRef.current = 0;
          for (const chunk of buf) sendAudioChunk(chunk);
        }
        break;

      case "input_audio_buffer.speech_started":
        interruptPlayback();
        if (currentResponseIdRef.current) {
          updateMessage(currentResponseIdRef.current, { interrupted: true });
          currentResponseIdRef.current = null;
        }
        wsRef.current?.send(JSON.stringify({ type: "response.cancel" }));
        break;

      case "conversation.item.input_audio_transcription.completed": {
        const transcript = msg.transcript as string | undefined;
        if (transcript?.trim()) {
          addMessage({
            id: `user-${Date.now()}`,
            role: "user",
            text: transcript.trim(),
          });
        }
        break;
      }

      case "response.created": {
        const responseId = (msg.response as Record<string, unknown>)?.id as string | undefined;
        if (responseId) {
          currentResponseIdRef.current = responseId;
          addMessage({ id: responseId, role: "assistant", text: "" });
        }
        break;
      }

      case "response.output_audio.delta": {
        const delta = msg.delta as string | undefined;
        if (delta) playPcmChunk(delta);
        break;
      }

      case "response.output_audio_transcript.delta": {
        const id = currentResponseIdRef.current;
        const delta = msg.delta as string | undefined;
        if (id && delta) {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === id ? { ...m, text: m.text + delta } : m
            )
          );
        }
        break;
      }

      case "response.done":
        currentResponseIdRef.current = null;
        break;

      case "error":
        console.error("[VoiceAgent] xAI error:", msg.message);
        break;
    }
  }, [addMessage, updateMessage, interruptPlayback, playPcmChunk, sendAudioChunk]);

  const fetchToken = useCallback(async (): Promise<string> => {
    const now = Date.now() / 1000;
    if (tokenValueRef.current && tokenExpiresAtRef.current > now + 10) {
      return tokenValueRef.current;
    }
    const res = await fetch("/api/voice/token", {
      method: "POST",
      credentials: "include",
    });
    if (!res.ok) {
      const body = await res.json() as { error?: string };
      throw new Error(body.error ?? "Failed to get voice token");
    }
    const data = await res.json() as { token: string; expiresAt: number };
    tokenValueRef.current = data.token;
    tokenExpiresAtRef.current = data.expiresAt;
    return data.token;
  }, []);

  const startMicLevel = useCallback(() => {
    const analyser = analyserRef.current;
    if (!analyser) return;
    const data = new Uint8Array(analyser.fftSize);
    const tick = () => {
      analyser.getByteTimeDomainData(data);
      let sum = 0;
      for (let i = 0; i < data.length; i++) {
        const v = (data[i] - 128) / 128;
        sum += v * v;
      }
      setMicLevel(Math.min(1, Math.sqrt(sum / data.length) * 6));
      animFrameRef.current = requestAnimationFrame(tick);
    };
    animFrameRef.current = requestAnimationFrame(tick);
  }, []);

  const connect = useCallback(async () => {
    if (status === "connecting" || status === "active") return;

    setStatus("connecting");
    setError(null);
    setMessages([]);
    intentionalCloseRef.current = false;
    sessionReadyRef.current = false;
    micBufferRef.current = [];
    micBufferSizeRef.current = 0;

    try {
      const audioCtx = new AudioContext({ sampleRate: 24000 });
      if (audioCtx.state === "suspended") await audioCtx.resume();
      audioCtxRef.current = audioCtx;

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 24000,
        },
      });
      streamRef.current = stream;

      stream.getAudioTracks()[0].addEventListener("ended", () => {
        if (!intentionalCloseRef.current) {
          setError("Microphone disconnected.");
          setStatus("error");
        }
      });

      await audioCtx.audioWorklet.addModule("/pcm-processor-worklet.js");
      const source = audioCtx.createMediaStreamSource(stream);

      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      analyserRef.current = analyser;
      source.connect(analyser);

      const workletNode = new AudioWorkletNode(audioCtx, "pcm-processor");
      workletNodeRef.current = workletNode;
      source.connect(workletNode);

      workletNode.port.onmessage = (e: MessageEvent<Int16Array>) => {
        const chunk = e.data as Int16Array;
        if (sessionReadyRef.current) {
          sendAudioChunk(chunk);
        } else {
          if (micBufferSizeRef.current + chunk.length <= MIC_BUFFER_CAP) {
            micBufferRef.current.push(chunk);
            micBufferSizeRef.current += chunk.length;
          }
        }
      };

      startMicLevel();

      const token = await fetchToken();
      const ws = new WebSocket(WS_ENDPOINT, [`xai-client-secret.${token}`]);
      wsRef.current = ws;

      const connectTimeout = setTimeout(() => {
        if (ws.readyState !== WebSocket.OPEN) {
          ws.close();
          setError("Connection timed out. Please try again.");
          setStatus("error");
        }
      }, 10_000);

      ws.onopen = () => {
        clearTimeout(connectTimeout);
        ws.send(JSON.stringify({
          type: "session.update",
          session: {
            voice,
            instructions,
            turn_detection: { type: "server_vad" },
            input_audio_transcription: { model: "grok-2-audio" },
            audio: {
              input:  { format: { type: "audio/pcm", rate: 24000 } },
              output: { format: { type: "audio/pcm", rate: 24000 } },
            },
          },
        }));
      };

      ws.onmessage = handleWsMessage;

      ws.onerror = () => {
        if (!intentionalCloseRef.current) {
          setError("Connection error. Please try again.");
          setStatus("error");
        }
      };

      ws.onclose = () => {
        if (!intentionalCloseRef.current) {
          setStatus("idle");
        }
      };

    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      let display = msg;
      if (msg.includes("NotAllowedError") || msg.includes("Permission denied")) {
        display = "Microphone access denied. Please allow microphone access in your browser settings.";
      } else if (msg.includes("NotFoundError")) {
        display = "No microphone found. Please connect a microphone and try again.";
      }
      setError(display);
      setStatus("error");
      cancelAnimationFrame(animFrameRef.current);
      streamRef.current?.getTracks().forEach((t) => t.stop());
      audioCtxRef.current?.close();
    }
  }, [status, voice, instructions, fetchToken, handleWsMessage, sendAudioChunk, startMicLevel]);

  const disconnect = useCallback(() => {
    intentionalCloseRef.current = true;
    cancelAnimationFrame(animFrameRef.current);
    interruptPlayback();
    wsRef.current?.close();
    wsRef.current = null;
    workletNodeRef.current?.disconnect();
    workletNodeRef.current = null;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    audioCtxRef.current?.close();
    audioCtxRef.current = null;
    analyserRef.current = null;
    sessionReadyRef.current = false;
    micBufferRef.current = [];
    micBufferSizeRef.current = 0;
    setStatus("idle");
    setMicLevel(0);
    setIsSpeaking(false);
  }, [interruptPlayback]);

  const sendText = useCallback((text: string) => {
    const ws = wsRef.current;
    if (!ws || ws.readyState !== WebSocket.OPEN) return;
    addMessage({ id: `user-text-${Date.now()}`, role: "user", text });
    ws.send(JSON.stringify({
      type: "conversation.item.create",
      item: { type: "message", role: "user", content: [{ type: "input_text", text }] },
    }));
    ws.send(JSON.stringify({ type: "response.create" }));
  }, [addMessage]);

  useEffect(() => {
    return () => {
      intentionalCloseRef.current = true;
      cancelAnimationFrame(animFrameRef.current);
      interruptPlayback();
      wsRef.current?.close();
      streamRef.current?.getTracks().forEach((t) => t.stop());
      audioCtxRef.current?.close();
    };
  }, [interruptPlayback]);

  return { status, messages, error, micLevel, isSpeaking, connect, disconnect, sendText };
}
