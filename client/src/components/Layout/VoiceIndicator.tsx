// client/src/components/Layout/VoiceIndicator.tsx
import { motion } from 'framer-motion';
import { Mic, MicOff, X } from 'lucide-react';
import { cn } from '../../utils/helpers';

interface VoiceIndicatorProps {
  isListening: boolean;
  isSupported: boolean;
  transcript: string;
  onToggle: () => void;
  enabled: boolean;
}

export function VoiceIndicator({ isListening, isSupported, transcript, onToggle, enabled }: VoiceIndicatorProps) {
  if (!isSupported || !enabled) return null;

  return (
    <motion.div
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 100, opacity: 0 }}
      className={cn(
        'fixed bottom-6 right-6 z-50',
        isListening ? 'w-96' : 'w-14'
      )}
    >
      <div className={cn(
        'bg-background dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl p-3 flex items-center gap-3 transition-all duration-300',
        isListening ? 'w-full' : 'w-14'
      )}>
        <button
          onClick={onToggle}
          className={cn(
            'p-2 rounded-lg flex-shrink-0 transition-colors',
            isListening 
              ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 animate-pulse' 
              : 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-900/50'
          )}
          aria-label={isListening ? 'Stop listening' : 'Start listening'}
        >
          {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
        </button>

        {isListening && (
          <div className="flex-1 min-w-0 overflow-hidden">
            <div className="flex items-center gap-2 mb-1">
              <div className="flex gap-1">
                {[1,2,3,4,5].map(i => (
                  <motion.div
                    key={i}
                    className="w-1 h-2 bg-blue-500 rounded-full"
                    animate={{ scaleY: [1, 2, 1] }}
                    transition={{ duration: 0.5, repeat: Infinity, delay: i * 0.1 }}
                  />
                ))}
              </div>
              <span className="text-sm text-gray-500 dark:text-gray-400">Listening...</span>
            </div>
            {transcript && (
              <p className="text-sm text-gray-700 dark:text-gray-300 truncate">
                "{transcript}"
              </p>
            )}
          </div>
        )}

        {isListening && (
          <button
            onClick={onToggle}
            className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800 flex-shrink-0"
            aria-label="Stop listening"
          >
            <X className="w-4 h-4 text-gray-500" />
          </button>
        )}
      </div>
    </motion.div>
  );
}
