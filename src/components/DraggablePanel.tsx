import React, { useState, useRef, useEffect } from 'react';
import { ChevronUp, ChevronDown, Move } from 'lucide-react';
import { cn } from '../lib/utils';

interface DraggablePanelProps {
  title: string;
  children: React.ReactNode;
  defaultPosition?: { x: number; y: number };
  defaultMinimized?: boolean;
  className?: string;
}

export const DraggablePanel: React.FC<DraggablePanelProps> = ({
  title,
  children,
  defaultPosition = { x: 10, y: 10 },
  defaultMinimized = false,
  className,
}) => {
  const [position, setPosition] = useState(defaultPosition);
  const [isDragging, setIsDragging] = useState(false);
  const [isMinimized, setIsMinimized] = useState(defaultMinimized);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const panelRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.drag-handle')) {
      setIsDragging(true);
      setDragStart({
        x: e.clientX - position.x,
        y: e.clientY - position.y,
      });
      e.preventDefault();
    }
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (isDragging) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, dragStart]);

  return (
    <div
      ref={panelRef}
      className={cn(
        "absolute bg-white/95 backdrop-blur-sm rounded-lg shadow-lg border border-gray-200 z-[1000]",
        isDragging && "cursor-move select-none",
        className
      )}
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        minWidth: '250px',
      }}
      onMouseDown={handleMouseDown}
    >
      <div className="flex items-center justify-between px-4 py-2 border-b border-gray-200 bg-gray-50 rounded-t-lg">
        <div className="flex items-center gap-2">
          <button
            className="drag-handle p-1 hover:bg-gray-200 rounded cursor-move"
            title="Verschieben"
          >
            <Move className="h-4 w-4 text-gray-600" />
          </button>
          <h3 className="font-semibold text-sm text-gray-700">{title}</h3>
        </div>
        <button
          onClick={() => setIsMinimized(!isMinimized)}
          className="p-1 hover:bg-gray-200 rounded transition-colors"
          title={isMinimized ? "Maximieren" : "Minimieren"}
        >
          {isMinimized ? (
            <ChevronDown className="h-4 w-4 text-gray-600" />
          ) : (
            <ChevronUp className="h-4 w-4 text-gray-600" />
          )}
        </button>
      </div>
      {!isMinimized && (
        <div className="p-4">
          {children}
        </div>
      )}
    </div>
  );
};