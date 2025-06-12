
"use client";

import * as React from 'react';
import {
  Popover,
  PopoverContent,
  // PopoverTrigger, // Not using a visible trigger
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { LucideIcon } from 'lucide-react';
import { useI18n } from '@/locales/client';

export interface Command {
  id: string;
  labelKey: string; // Translation key
  icon: LucideIcon | React.ElementType;
  action: string; // Text to insert
  descriptionKey?: string; // Optional translation key for description
}

interface SlashCommandPaletteProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  commands: Command[];
  onCommandSelect: (command: Command) => void;
  query: string; // For future filtering
  targetRef: React.RefObject<HTMLElement>; // Anchor element for Popover
}

export function SlashCommandPalette({
  isOpen,
  onOpenChange,
  commands,
  onCommandSelect,
  query,
  targetRef,
}: SlashCommandPaletteProps) {
  const t = useI18n();

  // Basic filtering (can be improved)
  const filteredCommands = commands.filter(command => 
    t(command.labelKey as any).toLowerCase().includes(query.toLowerCase()) || 
    command.id.toLowerCase().includes(query.toLowerCase())
  );

  if (!isOpen || !targetRef.current) {
    return null;
  }

  return (
    <Popover open={isOpen} onOpenChange={onOpenChange}>
      {/* 
        PopoverTrigger is technically required by Radix for accessibility,
        but we are controlling Popover open state programmatically.
        We can provide an invisible or a wrapper element as the trigger if needed.
        For now, Popover might work by just controlling the open state
        and relying on PopoverContent's internal positioning.
        If positioning issues arise, we might need to use PopoverAnchor.
      */}
      <PopoverContent
        className="w-72 p-1"
        side="bottom"
        align="start"
        sideOffset={5}
        // To use targetRef effectively, PopoverTrigger should ideally wrap or be the targetRef.
        // Or, use PopoverAnchor if available and compatible for more direct positioning.
        // For now, default positioning relative to the parent that Popover is in or viewport.
        // This might need adjustment if positioning is not ideal.
        // Let's assume the Popover is rendered inside the targetRef's parent or context
        // where Radix UI can calculate a reasonable position.
        // We will rely on the fact that Popover itself is inside the `popoverAnchorRef` div.
        style={{ position: 'absolute', top: '100%', left: '0' }} // Crude positioning, might need refinement.
                                                                  // This is tricky without knowing exact textarea cursor.
                                                                  // A better approach would be to use a library that handles @-mentions/slash commands.
                                                                  // For now, will appear below the textarea.
      >
        <ScrollArea className="h-[200px]">
          {filteredCommands.length > 0 ? (
            filteredCommands.map((command) => (
              <Button
                key={command.id}
                variant="ghost"
                className="w-full justify-start px-2 py-1.5 text-sm h-auto"
                onClick={() => onCommandSelect(command)}
              >
                <command.icon className="mr-2 h-4 w-4" />
                <span>{t(command.labelKey as any)}</span>
                {command.descriptionKey && (
                  <span className="ml-auto text-xs text-muted-foreground">
                    {t(command.descriptionKey as any)}
                  </span>
                )}
              </Button>
            ))
          ) : (
            <div className="p-2 text-sm text-muted-foreground text-center">
              {t('slashCommands.noResults')}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
