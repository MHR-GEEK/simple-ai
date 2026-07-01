import { useState, useRef, useCallback, useEffect } from 'react';
import type { VoiceCommand } from '../types';
import { parseVoiceCommand } from '../utils/helpers';

interface UseVoiceOptions {
  onCommand?: (command: VoiceCommand) => void;
  onTranscript?: (transcript: string) => void;
  language?: string;
  continuous?: boolean;
  interimResults?: boolean;
}

export function useVoice(options: UseVoiceOptions = {}) {
  const { onCommand, onTranscript, language = 'en-US', continuous = false, interimResults = true } = options;
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [transcript, setTranscript] = useState('');
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const finalTranscriptRef = useRef('');

  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      setIsSupported(true);
      const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SR();
      recognitionRef.current.lang = language;
      recognitionRef.current.continuous = continuous;
      recognitionRef.current.interimResults = interimResults;
      recognitionRef.current.maxAlternatives = 3;
    } else setIsSupported(false);
    return () => recognitionRef.current?.stop();
  }, [language, continuous, interimResults]);

  const startListening = useCallback(() => {
    if (!recognitionRef.current || isListening) return;
    setError(null); finalTranscriptRef.current = ''; setTranscript('');
    recognitionRef.current!.onstart = () => setIsListening(true);
    recognitionRef.current!.onresult = (e) => {
      let interim = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const t = e.results[i][0].transcript;
        e.results[i].isFinal ? finalTranscriptRef.current += t + ' ' : interim += t;
      }
      const full = finalTranscriptRef.current + interim;
      setTranscript(full); onTranscript?.(full);
    };
    recognitionRef.current!.onerror = (e) => { setError(e.error); setIsListening(false); };
    recognitionRef.current!.onend = () => {
      setIsListening(false);
      if (finalTranscriptRef.current.trim()) onCommand?.(parseVoiceCommand(finalTranscriptRef.current.trim()));
    };
    try { recognitionRef.current!.start(); } catch { setError('Failed to start'); setIsListening(false); }
  }, [isListening, onCommand, onTranscript]);

  const stopListening = useCallback(() => { recognitionRef.current?.stop(); setIsListening(false); }, []);
  const toggleListening = useCallback(() => isListening ? stopListening() : startListening(), [isListening, startListening, stopListening]);

  return { isListening, isSupported, error, transcript, startListening, stopListening, toggleListening };
}
