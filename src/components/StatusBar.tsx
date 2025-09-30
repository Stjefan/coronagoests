import React from 'react';

interface StatusBarProps {
  referencePointsCount: number;
  immissionPointsCount: number;
  isImmissionPointsComputed: boolean;
  gridPointsCount: number;
  isGridComputed: boolean;
}

export const StatusBar: React.FC<StatusBarProps> = ({
  referencePointsCount,
  immissionPointsCount,
  isImmissionPointsComputed,
  gridPointsCount,
  isGridComputed
}) => {
  return (
    <div className="fixed top-12 left-0 right-0 bg-gray-50 border-b border-gray-200 h-6 z-[9998]">
      <div className="flex items-center justify-end px-4 h-full space-x-4 text-xs">
        {referencePointsCount >= 2 ? (
          <span className="text-green-600">✓ {referencePointsCount} Referenzpunkte</span>
        ) : (
          <span className="text-yellow-600">⚠ {referencePointsCount}/2 Referenzpunkte</span>
        )}
        
        {immissionPointsCount > 0 && (
          <span className={isImmissionPointsComputed ? "text-green-600" : "text-blue-600"}>
            {isImmissionPointsComputed && "✓ "}{immissionPointsCount} Immissionspunkte
          </span>
        )}
        
        {gridPointsCount > 0 && (
          <span className={isGridComputed ? "text-green-600" : "text-blue-600"}>
            {isGridComputed && "✓ "}{gridPointsCount} Gitterpunkte
          </span>
        )}
      </div>
    </div>
  );
};