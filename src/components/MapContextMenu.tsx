import React from 'react';
import * as ContextMenu from '@radix-ui/react-context-menu';
import {
  MapPin,
  Radio,
  Mountain,
  Zap,
  Plus,
  ChevronRight
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface MapContextMenuProps {
  children: React.ReactNode;
  onAddHochpunkt: () => void;
  onAddESQ: () => void;
  onAddImmissionPoint: () => void;
  onAddMast: (trasseId?: string) => void;
  onCreateTrasse: () => void;
  trassen: Array<{ id: string; name: string; mastCount: number }>;
}

export const MapContextMenu: React.FC<MapContextMenuProps> = ({
  children,
  onAddHochpunkt,
  onAddESQ,
  onAddImmissionPoint,
  onAddMast,
  onCreateTrasse,
  trassen = []
}) => {
  return (
    <ContextMenu.Root>
      <ContextMenu.Trigger asChild>
        {children}
      </ContextMenu.Trigger>

      <ContextMenu.Portal>
        <ContextMenu.Content
          className={cn(
            "z-[10000] min-w-[220px] overflow-hidden rounded-md border border-slate-200",
            "bg-white p-1 shadow-md",
            "data-[state=open]:animate-in data-[state=closed]:animate-out",
            "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
            "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
            "data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2",
            "data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2"
          )}
        >
          <ContextMenu.Item
            className={cn(
              "relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none",
              "transition-colors hover:bg-slate-100 hover:text-slate-900",
              "data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
            )}
            onSelect={onAddHochpunkt}
          >
            <Mountain className="mr-2 h-4 w-4" />
            <span>Höhenpunkt hinzufügen</span>
          </ContextMenu.Item>

          <ContextMenu.Item
            className={cn(
              "relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none",
              "transition-colors hover:bg-slate-100 hover:text-slate-900",
              "data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
            )}
            onSelect={() => {
              console.log('Immissionspunkt hinzufügen');
              onAddImmissionPoint();
            }}
          >
            <Radio className="mr-2 h-4 w-4" />
            <span>Immissionspunkt hinzufügen</span>
          </ContextMenu.Item>

          <ContextMenu.Item
            className={cn(
              "relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none",
              "transition-colors hover:bg-slate-100 hover:text-slate-900",
              "data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
            )}
            onSelect={onAddESQ}
          >
            <Zap className="mr-2 h-4 w-4" />
            <span>ESQ hinzufügen</span>
          </ContextMenu.Item>

          <ContextMenu.Separator className="my-1 h-px bg-slate-200" />

          {trassen.length === 0 ? (
            <ContextMenu.Item
              className={cn(
                "relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none",
                "transition-colors hover:bg-slate-100 hover:text-slate-900",
                "data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
              )}
              onSelect={onCreateTrasse}
            >
              <Plus className="mr-2 h-4 w-4" />
              <span>Neue Trasse erstellen</span>
            </ContextMenu.Item>
          ) : trassen.length === 1 ? (
            <ContextMenu.Item
              className={cn(
                "relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none",
                "transition-colors hover:bg-slate-100 hover:text-slate-900",
                "data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
              )}
              onSelect={() => onAddMast(trassen[0].id)}
            >
              <MapPin className="mr-2 h-4 w-4" />
              <span>Mast hinzufügen ({trassen[0].name})</span>
            </ContextMenu.Item>
          ) : (
            <ContextMenu.Sub>
              <ContextMenu.SubTrigger
                className={cn(
                  "relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none",
                  "transition-colors hover:bg-slate-100 hover:text-slate-900",
                  "data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
                  "data-[state=open]:bg-slate-100 data-[state=open]:text-slate-900"
                )}
              >
                <MapPin className="mr-2 h-4 w-4" />
                <span>Mast hinzufügen</span>
                <ChevronRight className="ml-auto h-4 w-4" />
              </ContextMenu.SubTrigger>
              <ContextMenu.SubContent
                className={cn(
                  "z-[10001] min-w-[160px] overflow-hidden rounded-md border border-slate-200",
                  "bg-white p-1 shadow-md",
                  "data-[state=open]:animate-in data-[state=closed]:animate-out",
                  "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
                  "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
                  "data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2",
                  "data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2"
                )}
              >
                {trassen.map((trasse) => (
                  <ContextMenu.Item
                    key={trasse.id}
                    className={cn(
                      "relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none",
                      "transition-colors hover:bg-slate-100 hover:text-slate-900",
                      "data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
                    )}
                    onSelect={() => onAddMast(trasse.id)}
                  >
                    <span className="flex-1">{trasse.name}</span>
                    <span className="ml-2 text-xs text-slate-500">
                      ({trasse.mastCount} Masten)
                    </span>
                  </ContextMenu.Item>
                ))}
                <ContextMenu.Separator className="my-1 h-px bg-slate-200" />
                <ContextMenu.Item
                  className={cn(
                    "relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none",
                    "transition-colors hover:bg-slate-100 hover:text-slate-900",
                    "data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
                  )}
                  onSelect={onCreateTrasse}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  <span>Neue Trasse</span>
                </ContextMenu.Item>
              </ContextMenu.SubContent>
            </ContextMenu.Sub>
          )}
        </ContextMenu.Content>
      </ContextMenu.Portal>
    </ContextMenu.Root>
  );
};