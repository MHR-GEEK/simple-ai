// client/src/hooks/useVoice.ts
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
  const {
    onCommand,
    onTranscript,
    language = 'en-US',
    continuous = false,
    interimResults = true,
  } = options;

  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [transcript, setTranscript] = useState('');
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const finalTranscriptRef = useRef('');

  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      setIsSupported(true);
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.lang = language;
      recognitionRef.current.continuous = continuous;
      recognitionRef.current.interimResults = interimResults;
      recognitionRef.current.maxAlternatives = 3;
    } else {
      setIsSupported(false);
      setError('Speech recognition not supported in this browser');
    }

    return () => {
      recognitionRef.current?.stop();
    };
  }, [language, continuous, interimResults]);

  const startListening = useCallback(() => {
    if (!recognitionRef.current || isListening) return;
    
    setError(null);
    finalTranscriptRef.current = '';
    setTranscript('');

    recognitionRef.current.onstart = () => {
      setIsListening(true);
    };

    recognitionRef.current.onresult = (event) => {
      let interimTranscript = '';
      
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const text = result[0].transcript;
        
        if (result.isFinal) {
          finalTranscriptRef.current += text + ' ';
        } else {
          interimTranscript += text;
        }
      }
      
      const fullTranscript = finalTranscriptRef.current + interimTranscript;
      setTranscript(fullTranscript);
      onTranscript?.(fullTranscript);
    };

    recognitionRef.current.onerror = (event) => {
      setError(event.error);
      setIsListening(false);
    };

    recognitionRef.current.onend = () => {
      setIsListening(false);
      
      if (finalTranscriptRef.current.trim()) {
        const command = parseVoiceCommand(finalTranscriptRef.current.trim());
        onCommand?.(command);
      }
    };

    try {
      recognitionRef.current.start();
    } catch (e) {
      setError('Failed to start speech recognition');
      setIsListening(false);
    }
  }, [isListening, onCommand, onTranscript]);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    setIsListening(false);
  }, []);

  const toggleListening = useCallback(() => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  }, [isListening, startListening, stopListening]);

  return {
    isListening,
    isSupported,
    error,
    transcript,
    startListening,
    stopListening,
    toggleListening,
  };
}

// Extend Window interface for TypeScript
declare global {
  interface Window {
    SpeechRecognition: typeof SpeechRecognition;
    webkitSpeechRecognition: typeof SpeechRecognition;
  }
}
