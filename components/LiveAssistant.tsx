import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GoogleGenAI, LiveServerMessage, Modality, Blob, LiveSession } from '@google/genai';
import { MicIcon, StopCircleIcon, XIcon, LogoIcon } from './icons';

// --- Audio Utility Functions ---
// Base64 encoding
function encode(bytes: Uint8Array) {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

// Base64 decoding
function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

// Decode raw PCM data into an AudioBuffer
async function decodeAudioData(data: Uint8Array, ctx: AudioContext, sampleRate: number, numChannels: number): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);
  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

function createBlob(data: Float32Array): Blob {
  const l = data.length;
  const int16 = new Int16Array(l);
  for (let i = 0; i < l; i++) {
    int16[i] = data[i] * 32768;
  }
  return {
    data: encode(new Uint8Array(int16.buffer)),
    mimeType: 'audio/pcm;rate=16000',
  };
}

// --- Component ---
interface LiveAssistantProps {
  onClose: () => void;
  showToast: (message: string, type?: 'success' | 'error') => void;
}

type Status = 'idle' | 'connecting' | 'listening' | 'speaking' | 'error';
type TranscriptItem = { speaker: 'user' | 'model'; text: string };

const LiveAssistant: React.FC<LiveAssistantProps> = ({ onClose, showToast }) => {
  const [status, setStatus] = useState<Status>('idle');
  const [transcript, setTranscript] = useState<TranscriptItem[]>([]);
  const [currentInput, setCurrentInput] = useState('');
  const [currentOutput, setCurrentOutput] = useState('');

  const sessionPromiseRef = useRef<Promise<LiveSession> | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const inputAudioContextRef = useRef<AudioContext | null>(null);
  const outputAudioContextRef = useRef<AudioContext | null>(null);
  const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
  const mediaStreamSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const outputSourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const transcriptEndRef = useRef<HTMLDivElement>(null);

  const cleanUp = useCallback(() => {
    // Close session
    if (sessionPromiseRef.current) {
        sessionPromiseRef.current.then(session => session.close());
        sessionPromiseRef.current = null;
    }
    // Stop microphone stream
    streamRef.current?.getTracks().forEach(track => track.stop());
    streamRef.current = null;
    // Disconnect and close audio contexts
    scriptProcessorRef.current?.disconnect();
    mediaStreamSourceRef.current?.disconnect();
    inputAudioContextRef.current?.close();
    outputAudioContextRef.current?.close();
    // Clear audio playback queue
    outputSourcesRef.current.forEach(source => source.stop());
    outputSourcesRef.current.clear();
  }, []);

  const startSession = async () => {
    setStatus('connecting');
    setCurrentInput('');
    setCurrentOutput('');
    setTranscript([]);

    try {
        streamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (err) {
        showToast('Microphone access denied.', 'error');
        console.error('Microphone access denied', err);
        setStatus('error');
        return;
    }

    inputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
    outputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    nextStartTimeRef.current = 0;

    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
    sessionPromiseRef.current = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        config: {
            responseModalities: [Modality.AUDIO],
            inputAudioTranscription: {},
            outputAudioTranscription: {},
            systemInstruction: 'You are a friendly and helpful assistant for the WABA water billing system. You can help users find customer information, check invoice statuses, and understand dashboard metrics. Be concise and clear in your responses.',
        },
        callbacks: {
            onopen: () => {
                const inputCtx = inputAudioContextRef.current!;
                mediaStreamSourceRef.current = inputCtx.createMediaStreamSource(streamRef.current!);
                scriptProcessorRef.current = inputCtx.createScriptProcessor(4096, 1, 1);
                
                scriptProcessorRef.current.onaudioprocess = (event) => {
                    const inputData = event.inputBuffer.getChannelData(0);
                    const pcmBlob = createBlob(inputData);
                    sessionPromiseRef.current?.then((session) => {
                        session.sendRealtimeInput({ media: pcmBlob });
                    });
                };
                
                mediaStreamSourceRef.current.connect(scriptProcessorRef.current);
                scriptProcessorRef.current.connect(inputCtx.destination);
                setStatus('listening');
            },
            onmessage: async (message: LiveServerMessage) => {
                // Handle transcriptions
                if (message.serverContent?.inputTranscription) {
                    setCurrentInput(prev => prev + message.serverContent!.inputTranscription!.text);
                }
                if (message.serverContent?.outputTranscription) {
                    setCurrentOutput(prev => prev + message.serverContent!.outputTranscription!.text);
                }

                if (message.serverContent?.turnComplete) {
                    setTranscript(prev => [
                        ...prev,
                        { speaker: 'user', text: currentInput.trim() },
                        { speaker: 'model', text: currentOutput.trim() }
                    ]);
                    setCurrentInput('');
                    setCurrentOutput('');
                }

                // Handle audio playback
                const audioData = message.serverContent?.modelTurn?.parts[0]?.inlineData.data;
                if (audioData) {
                    const outputCtx = outputAudioContextRef.current!;
                    setStatus('speaking');
                    nextStartTimeRef.current = Math.max(nextStartTimeRef.current, outputCtx.currentTime);
                    const audioBuffer = await decodeAudioData(decode(audioData), outputCtx, 24000, 1);
                    
                    const source = outputCtx.createBufferSource();
                    source.buffer = audioBuffer;
                    source.connect(outputCtx.destination);
                    source.addEventListener('ended', () => {
                        outputSourcesRef.current.delete(source);
                        if (outputSourcesRef.current.size === 0) {
                            setStatus('listening');
                        }
                    });

                    source.start(nextStartTimeRef.current);
                    nextStartTimeRef.current += audioBuffer.duration;
                    outputSourcesRef.current.add(source);
                }

                if (message.serverContent?.interrupted) {
                    outputSourcesRef.current.forEach(source => source.stop());
                    outputSourcesRef.current.clear();
                    nextStartTimeRef.current = 0;
                }
            },
            onerror: (e) => {
                console.error('Live API Error:', e);
                showToast('An error occurred with the connection.', 'error');
                setStatus('error');
                cleanUp();
            },
            onclose: () => {
                setStatus('idle');
                cleanUp();
            },
        },
    });
  };

  const handleToggleSession = () => {
    if (status === 'idle' || status === 'error') {
      startSession();
    } else {
      cleanUp();
      setStatus('idle');
    }
  };

  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [transcript, currentInput, currentOutput]);

  // Cleanup on component unmount
  useEffect(() => () => cleanUp(), [cleanUp]);

  const getStatusText = () => {
      switch (status) {
          case 'idle': return "Press the mic to start";
          case 'connecting': return "Connecting...";
          case 'listening': return "Listening...";
          case 'speaking': return "Speaking...";
          case 'error': return "Connection error. Please try again.";
      }
  }

  return (
    <AnimatePresence>
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 bg-black/70 z-[100] flex items-center justify-center p-4"
        >
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-2xl h-[80vh] flex flex-col relative overflow-hidden"
            >
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800 flex-shrink-0">
                    <div className="flex items-center gap-2">
                        <LogoIcon className="h-7 w-7 text-blue-500" />
                        <h2 className="text-lg font-bold text-slate-900 dark:text-white">Live Assistant</h2>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800">
                        <XIcon className="w-5 h-5 text-slate-500" />
                    </button>
                </div>

                {/* Transcript */}
                <div className="flex-1 p-6 overflow-y-auto space-y-4">
                    {transcript.map((item, index) => (
                        <div key={index} className={`flex ${item.speaker === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[80%] p-3 rounded-xl ${item.speaker === 'user' ? 'bg-blue-500 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200'}`}>
                                <p className="text-sm">{item.text}</p>
                            </div>
                        </div>
                    ))}
                    {currentInput && (
                        <div className="flex justify-end">
                            <div className="max-w-[80%] p-3 rounded-xl bg-blue-500/80 text-white/80"><p className="text-sm italic">{currentInput}</p></div>
                        </div>
                    )}
                     {currentOutput && (
                        <div className="flex justify-start">
                            <div className="max-w-[80%] p-3 rounded-xl bg-slate-100/80 dark:bg-slate-800/80"><p className="text-sm italic text-slate-600 dark:text-slate-400">{currentOutput}</p></div>
                        </div>
                    )}
                    <div ref={transcriptEndRef} />
                </div>

                {/* Footer / Controls */}
                <div className="p-6 border-t border-slate-200 dark:border-slate-800 flex-shrink-0">
                    <div className="flex flex-col items-center gap-3">
                        <button
                            onClick={handleToggleSession}
                            className={`w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300 ${
                                status === 'listening' || status === 'speaking' ? 'bg-red-500 text-white' : 'bg-blue-500 text-white'
                            } ${status === 'listening' ? 'animate-pulse' : ''}`}
                            disabled={status === 'connecting'}
                        >
                            {status === 'idle' || status === 'error' ? <MicIcon className="w-8 h-8"/> : <StopCircleIcon className="w-8 h-8"/>}
                        </button>
                        <p className="text-sm text-slate-500 dark:text-slate-400 min-h-[20px]">{getStatusText()}</p>
                    </div>
                </div>
            </motion.div>
        </motion.div>
    </AnimatePresence>
  );
};

export default LiveAssistant;
