import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingOverlayProps {
  isVisible: boolean;
  message?: string;
  progress?: {
    current: number;
    total: number;
  };
}

// Add CSS keyframes
const styles = `
  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: scale(0.95);
    }
    to {
      opacity: 1;
      transform: scale(1);
    }
  }
`;

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({ 
  isVisible, 
  message = 'Berechnung läuft...', 
  progress 
}) => {
  if (!isVisible) return null;

  return (
    <>
      <style>{styles}</style>
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999]" style={{ backdropFilter: 'blur(4px)' }}>
      <div className="bg-white rounded-lg shadow-2xl p-8 flex flex-col items-center space-y-4 min-w-[320px] max-w-[400px]" style={{ animation: 'fadeIn 0.2s ease-out' }}>
        <div className="relative">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
          <div className="absolute inset-0 h-12 w-12 animate-ping opacity-20">
            <div className="h-full w-full rounded-full bg-blue-600" />
          </div>
        </div>
        <div className="text-center w-full">
          <p className="text-lg font-medium text-gray-900">{message}</p>
          {progress && (
            <div className="mt-4 w-full">
              <div className="text-sm text-gray-600 mb-2">
                {progress.current.toLocaleString('de-DE')} von {progress.total.toLocaleString('de-DE')} berechnet
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                <div 
                  className="bg-gradient-to-r from-blue-500 to-blue-600 h-3 rounded-full transition-all duration-300 ease-out"
                  style={{ width: `${(progress.current / progress.total) * 100}%` }}
                />
              </div>
              <div className="flex justify-between items-center mt-2">
                <div className="text-xs text-gray-500">
                  {Math.round((progress.current / progress.total) * 100)}%
                </div>
                {progress.current > 0 && progress.total > progress.current && (
                  <div className="text-xs text-gray-500">
                    Verbleibend: {(progress.total - progress.current).toLocaleString('de-DE')}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
    </>
  );
};