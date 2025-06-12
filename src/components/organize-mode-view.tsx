
"use client";

import * as React from 'react';
import { Textarea } from '@/components/ui/textarea';
import { useI18n } from '@/locales/client';
import { useAutosave } from '@/hooks/useAutosave';
import { SlashCommandPalette, type Command } from '@/components/slash-command-palette'; // Added
import { Heading1, Heading2, Heading3, List, ListOrdered, ListTodo } from 'lucide-react'; // Added

const LOCAL_STORAGE_ORGANIZE_NOTE_KEY = 'organizeModeNote_v1';

const availableCommands: Command[] = [
  { id: 'h1', labelKey: 'slashCommands.heading1', icon: Heading1, action: '# ' },
  { id: 'h2', labelKey: 'slashCommands.heading2', icon: Heading2, action: '## ' },
  { id: 'h3', labelKey: 'slashCommands.heading3', icon: Heading3, action: '### ' },
  { id: 'bulletList', labelKey: 'slashCommands.bulletedList', icon: List, action: '- ' },
  { id: 'numberList', labelKey: 'slashCommands.numberedList', icon: ListOrdered, action: '1. ' },
  { id: 'todoList', labelKey: 'slashCommands.todoList', icon: ListTodo, action: '- [ ] ' },
];

export function OrganizeModeView() {
  const t = useI18n();
  const [noteContent, setNoteContent] = useAutosave(LOCAL_STORAGE_ORGANIZE_NOTE_KEY, '');
  const textareaRef = React.useRef<HTMLTextAreaElement>(null); // Added
  const popoverAnchorRef = React.useRef<HTMLDivElement>(null); // Added

  const [isSlashPaletteOpen, setIsSlashPaletteOpen] = React.useState(false); // Added
  const [slashQuery, setSlashQuery] = React.useState(''); // Added
  const [slashTriggerPosition, setSlashTriggerPosition] = React.useState(0); // Added to store cursor pos when / was typed

  const handleTextChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = event.target.value;
    setNoteContent(newValue);

    const cursorPos = event.target.selectionStart;
    const textBeforeCursor = newValue.substring(0, cursorPos);
    const match = textBeforeCursor.match(/\/(\S*)$/);

    if (match) {
      setIsSlashPaletteOpen(true);
      setSlashQuery(match[1]);
      setSlashTriggerPosition(cursorPos); // Store cursor position at the end of the query
    } else {
      setIsSlashPaletteOpen(false);
      setSlashQuery('');
    }
  };

  const handleCommandSelect = (command: Command) => {
    if (!textareaRef.current) return;

    const currentValue = textareaRef.current.value;
    // const currentSelectionStart = textareaRef.current.selectionStart; // Not directly used

    // Determine the actual start of the `/query` text
    // slashTriggerPosition is the end of the /query string.
    // length of /query is 1 (for '/') + slashQuery.length
    const queryLengthWithSlash = 1 + slashQuery.length;
    const startOfSlashCommand = slashTriggerPosition - queryLengthWithSlash;

    if (startOfSlashCommand < 0) { // Should not happen if logic is correct
        setIsSlashPaletteOpen(false);
        return;
    }
    
    const textBeforeSlashCommand = currentValue.substring(0, startOfSlashCommand);
    const textAfterSlashCommand = currentValue.substring(slashTriggerPosition);

    const newText = textBeforeSlashCommand + command.action + textAfterSlashCommand;
    setNoteContent(newText);
    setIsSlashPaletteOpen(false);
    setSlashQuery('');

    // Set cursor position after the inserted command action
    const newCursorPos = startOfSlashCommand + command.action.length;
    setTimeout(() => { // setTimeout to allow React to re-render with newText
      if (textareaRef.current) {
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
      }
    }, 0);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (isSlashPaletteOpen) {
      if (event.key === 'Escape') {
        setIsSlashPaletteOpen(false);
        event.preventDefault();
      }
      // Future: Add ArrowUp, ArrowDown, Enter for keyboard navigation in palette
    }
  };

  return (
    <div className="flex flex-col h-full p-4 sm:p-6 md:p-8 lg:p-12 overflow-y-auto bg-background text-foreground">
      <div ref={popoverAnchorRef} className="w-full max-w-3xl mx-auto flex flex-col flex-grow relative"> {/* Added ref and relative */}
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-semibold mb-6 md:mb-8 text-foreground flex-shrink-0">
          {t('appModes.organizeTitle')}
        </h1>
        <Textarea
          ref={textareaRef} // Added ref
          placeholder={t('organizeMode.placeholder')}
          value={noteContent}
          onChange={handleTextChange} // Changed
          onKeyDown={handleKeyDown} // Added
          className="w-full flex-grow resize-none border-none focus-visible:ring-0 focus-visible:ring-offset-0 p-1 md:p-2 text-base leading-relaxed bg-transparent placeholder-muted-foreground/70"
          aria-label={t('organizeMode.placeholder')}
        />
        {popoverAnchorRef.current && (
          <SlashCommandPalette
            isOpen={isSlashPaletteOpen}
            onOpenChange={setIsSlashPaletteOpen}
            commands={availableCommands}
            onCommandSelect={handleCommandSelect}
            query={slashQuery}
            targetRef={popoverAnchorRef} // Use the wrapper div as anchor
          />
        )}
      </div>
    </div>
  );
}
