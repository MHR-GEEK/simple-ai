// client/src/components/Layout/NotificationToast.tsx
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';
import { cn } from '../../utils/helpers';
import type { Notification } from '../../contexts/AppContext';

interface NotificationToastProps {
  notifications: Notification[];
}

export function NotificationToast({ notifications }: NotificationToastProps) {
  const icons = {
    success: <CheckCircle className="w-5 h-5 text-green-500" />,
    error: <AlertCircle className="w-5 h-5 text-red-500" />,
    warning: <AlertTriangle className="w-5 h-5 text-yellow-500" />,
    info: <Info className="w-5 h-5 text-blue-500" />,
  };

  return (
    <AnimatePresence>
      <div className="fixed bottom-6 left-6 z-50 flex flex-col gap-2 pointer-events-none">
        {notifications.map((notification) => (
          <motion.div
            key={notification.id}
            initial={{ x: 400, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 400, opacity: 0 }}
            className={cn(
              'pointer-events-auto w-80 bg-background dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl p-4 flex items-start gap-3',
              `border-l-4 ${
                notification.type === 'success' ? 'border-green-500' :
                notification.type === 'error' ? 'border-red-500' :
                notification.type === 'warning' ? 'border-yellow-500' :
                'border-blue-500'
              }`
            )}
          >
            {icons[notification.type]}
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm">{notification.title}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{notification.message}</p>
            </div>
            <button
              onClick={() => {}}
              className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 flex-shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        ))}
      </div>
    </AnimatePresence>
  );
}
