
import React, { useState, useEffect, useRef } from 'react';
import { getGeminiClient, encode, decode, decodeAudioData } from '../services/geminiService';
import { Modality, LiveServerMessage } from '@google/genai';

const VoiceInterface: React.FC = () => {
  const [isConnecting, setIsConnecting] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const [transcription, setTranscription] = useState('');
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const outputAudioContextRef = useRef<AudioContext | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const sessionRef = useRef<any>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const startSession = async () => {
    setIsConnecting(true);
    try {
      const ai = getGeminiClient();
      
      streamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      outputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });

      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        callbacks: {
          onopen: () => {
            setIsActive(true);
            setIsConnecting(false);
            
            if (audioContextRef.current && streamRef.current) {
              const source = audioContextRef.current.createMediaStreamSource(streamRef.current);
              const scriptProcessor = audioContextRef.current.createScriptProcessor(4096, 1, 1);
              scriptProcessor.onaudioprocess = (e) => {
                const inputData = e.inputBuffer.getChannelData(0);
                const l = inputData.length;
                const int16 = new Int16Array(l);
                for (let i = 0; i < l; i++) {
                  int16[i] = inputData[i] * 32768;
                }
                const pcmBlob = {
                  data: encode(new Uint8Array(int16.buffer)),
                  mimeType: 'audio/pcm;rate=16000',
                };
                sessionPromise.then(session => {
                  session.sendRealtimeInput({ media: pcmBlob });
                });
              };
              source.connect(scriptProcessor);
              scriptProcessor.connect(audioContextRef.current.destination);
            }
          },
          onmessage: async (message: LiveServerMessage) => {
            if (message.serverContent?.outputTranscription) {
              setTranscription(prev => prev + ' ' + message.serverContent?.outputTranscription?.text);
            }

            const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
            if (base64Audio && outputAudioContextRef.current) {
              const ctx = outputAudioContextRef.current;
              nextStartTimeRef.current = Math.max(nextStartTimeRef.current, ctx.currentTime);
              
              const audioBuffer = await decodeAudioData(decode(base64Audio), ctx, 24000, 1);
              const source = ctx.createBufferSource();
              source.buffer = audioBuffer;
              source.connect(ctx.destination);
              
              source.addEventListener('ended', () => {
                sourcesRef.current.delete(source);
              });
              
              source.start(nextStartTimeRef.current);
              nextStartTimeRef.current += audioBuffer.duration;
              sourcesRef.current.add(source);
            }

            if (message.serverContent?.interrupted) {
              sourcesRef.current.forEach(s => s.stop());
              sourcesRef.current.clear();
              nextStartTimeRef.current = 0;
            }
          },
          onerror: (e) => console.error('Live API Error:', e),
          onclose: () => stopSession()
        },
        config: {
          responseModalities: [Modality.AUDIO],
          systemInstruction: 'You are Helix AI in voice mode. Be conversational, concise, and helpful. Use a friendly tone.',
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } }
          },
          outputAudioTranscription: {}
        }
      });

      sessionRef.current = await sessionPromise;
    } catch (error) {
      console.error('Failed to start session:', error);
      setIsConnecting(false);
    }
  };

  const stopSession = () => {
    setIsActive(false);
    setIsConnecting(false);
    if (sessionRef.current) {
      try { sessionRef.current.close(); } catch(e) {}
      sessionRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    setTranscription('');
  };

  useEffect(() => {
    return () => stopSession();
  }, []);

  return (
    <div className="h-full flex flex-col items-center justify-center p-6 text-center max-w-2xl mx-auto">
      <div className="mb-12">
        <h2 className="text-3xl font-bold text-white mb-2">Live Voice Conversation</h2>
        <p className="text-slate-400">Experience real-time interaction with Helix AI.</p>
      </div>

      <div className="relative mb-12">
        {/* Pulsing Visualizer */}
        <div className={`w-48 h-48 rounded-full border-2 border-indigo-500/30 flex items-center justify-center transition-all duration-500 ${
          isActive ? 'scale-110' : 'scale-100'
        }`}>
          <div className={`absolute inset-0 rounded-full border border-indigo-500/50 animate-ping opacity-20 ${isActive ? 'block' : 'hidden'}`}></div>
          <div className={`w-32 h-32 rounded-full flex items-center justify-center glass shadow-2xl ${isActive ? 'bg-indigo-600/20' : ''}`}>
             <i className={`fa-solid fa-microphone text-4xl ${isActive ? 'text-indigo-400' : 'text-slate-600'}`}></i>
          </div>
        </div>
      </div>

      <div className="glass w-full rounded-2xl p-6 mb-8 min-h-[120px] flex items-center justify-center">
        {isActive ? (
          <p className="text-lg italic text-slate-300 leading-relaxed">
            {transcription || "Listening..."}
          </p>
        ) : (
          <p className="text-slate-500">Press start to begin conversation</p>
        )}
      </div>

      <button
        onClick={isActive ? stopSession : startSession}
        disabled={isConnecting}
        className={`px-8 py-4 rounded-full font-bold text-lg shadow-xl transition-all ${
          isConnecting 
            ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
            : isActive 
              ? 'bg-red-500/20 text-red-400 border border-red-500/50 hover:bg-red-500/30' 
              : 'bg-indigo-600 hover:bg-indigo-500 text-white hover:scale-105 active:scale-95'
        }`}
      >
        {isConnecting ? (
          <><i className="fa-solid fa-spinner fa-spin mr-2"></i> Initializing...</>
        ) : isActive ? (
          <><i className="fa-solid fa-stop mr-2"></i> End Session</>
        ) : (
          <><i className="fa-solid fa-play mr-2"></i> Start Conversing</>
        )}
      </button>

      <div className="mt-8 flex gap-4 text-xs text-slate-500">
        <div className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-green-500"></span> Low Latency
        </div>
        <div className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-blue-500"></span> Multimodal
        </div>
        <div className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-indigo-500"></span> Live Audio
        </div>
      </div>
    </div>
  );
};

export default VoiceInterface;
