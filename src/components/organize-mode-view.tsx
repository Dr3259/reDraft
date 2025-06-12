
"use client";

import * as React from 'react';
import { Textarea } from '@/components/ui/textarea';
import { useI18n } from '@/locales/client';
import { useAutosave } from '@/hooks/useAutosave';
import { SlashCommandPalette, type Command } from '@/components/slash-command-palette';
import { Heading1, Heading2, Heading3, List, ListOrdered, ListTodo, Download, FileText, FileType, FileJson, Minus, Eye, PencilLine } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useToast } from "@/hooks/use-toast";
import { jsPDF } from "jspdf";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ScrollArea } from '@/components/ui/scroll-area';

const LOCAL_STORAGE_ORGANIZE_NOTE_KEY = 'organizeModeNote_v1';

const availableCommands: Command[] = [
  { id: 'h1', labelKey: 'slashCommands.heading1', icon: Heading1, action: '# ' },
  { id: 'h2', labelKey: 'slashCommands.heading2', icon: Heading2, action: '## ' },
  { id: 'h3', labelKey: 'slashCommands.heading3', icon: Heading3, action: '### ' },
  { id: 'bulletList', labelKey: 'slashCommands.bulletedList', icon: List, action: '- ' },
  { id: 'numberList', labelKey: 'slashCommands.numberedList', icon: ListOrdered, action: '1. ' },
  { id: 'todoList', labelKey: 'slashCommands.todoList', icon: ListTodo, action: '- [ ] ' },
  { id: 'hr', labelKey: 'slashCommands.horizontalRule', icon: Minus, action: '---\n' },
];

type OrganizeViewMode = 'edit' | 'preview';

export function OrganizeModeView() {
  const t = useI18n();
  const { toast, dismiss: dismissToast } = useToast();
  const [noteContent, setNoteContent] = useAutosave(LOCAL_STORAGE_ORGANIZE_NOTE_KEY, '');
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);
  const popoverAnchorRef = React.useRef<HTMLDivElement>(null);

  const [isSlashPaletteOpen, setIsSlashPaletteOpen] = React.useState(false);
  const [slashQuery, setSlashQuery] = React.useState('');
  const [slashTriggerPosition, setSlashTriggerPosition] = React.useState(0);
  const [organizeViewMode, setOrganizeViewMode] = React.useState<OrganizeViewMode>('edit');

  const handleToggleViewMode = () => {
    setOrganizeViewMode(prev => prev === 'edit' ? 'preview' : 'edit');
  };

  const handleTextChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = event.target.value;
    setNoteContent(newValue);

    const cursorPos = event.target.selectionStart;
    const textBeforeCursor = newValue.substring(0, cursorPos);
    const match = textBeforeCursor.match(/\/(\S*)$/);

    if (match) {
      setIsSlashPaletteOpen(true);
      setSlashQuery(match[1]);
      setSlashTriggerPosition(cursorPos);
    } else {
      setIsSlashPaletteOpen(false);
      setSlashQuery('');
    }
  };

  const handleCommandSelect = (command: Command) => {
    if (!textareaRef.current) return;

    const currentValue = textareaRef.current.value;
    const queryLengthWithSlash = 1 + slashQuery.length;
    const startOfSlashCommand = slashTriggerPosition - queryLengthWithSlash;

    if (startOfSlashCommand < 0) {
        setIsSlashPaletteOpen(false);
        return;
    }
    
    let actionToInsert = command.action;
    if (command.id === 'hr') {
      // Ensure HR is on a new line if the preceding character isn't already a newline
      if (startOfSlashCommand > 0 && currentValue.charAt(startOfSlashCommand - 1) !== '\n') {
        actionToInsert = '\n' + actionToInsert;
      }
    }
    
    const textBeforeSlashCommand = currentValue.substring(0, startOfSlashCommand);
    const textAfterSlashCommand = currentValue.substring(slashTriggerPosition);

    const newText = textBeforeSlashCommand + actionToInsert + textAfterSlashCommand;
    setNoteContent(newText);
    setIsSlashPaletteOpen(false);
    setSlashQuery('');

    const newCursorPos = startOfSlashCommand + actionToInsert.length;
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
      }
    }, 0);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const textarea = textareaRef.current;
    if (!textarea) return;
  
    if (event.key === 'Enter') {
      const cursorPos = textarea.selectionStart;
      const currentText = textarea.value;
      const lineStart = currentText.lastIndexOf('\n', cursorPos - 1) + 1;
      const currentLineText = currentText.substring(lineStart, cursorPos);

      // Check if the current line up to the cursor (trimmed) is exactly '---'
      if (currentLineText.trim() === '---') {
        // Further check if the entire line (not just up to cursor) is '---' or '--- ' etc.
        let lineEnd = currentText.indexOf('\n', cursorPos);
        if (lineEnd === -1) {
          lineEnd = currentText.length;
        }
        const fullCurrentLine = currentText.substring(lineStart, lineEnd).trim();

        if (fullCurrentLine === '---') {
            event.preventDefault();
            
            const textBefore = currentText.substring(0, lineStart);
            const textAfter = currentText.substring(lineEnd); // Text after the current line's \n or end of string
            
            // Replace the current line with '---' and add a newline, then the rest of the text
            const newText = `${textBefore}---\n${textAfter.startsWith('\n') ? textAfter.substring(1) : textAfter}`;
            setNoteContent(newText);
    
            const newCursorPos = `${textBefore}---\n`.length;
            setTimeout(() => {
              if (textareaRef.current) {
                textareaRef.current.focus();
                textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
              }
            }, 0);
            return;
        }
      }
    }
    
    if (isSlashPaletteOpen) {
      if (event.key === 'Escape') {
        setIsSlashPaletteOpen(false);
        event.preventDefault();
      }
    }
  };

  const downloadFile = (filename: string, content: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleExport = (format: 'txt' | 'md' | 'pdf') => {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filenameBase = `note-${timestamp}`;

    if (noteContent.trim() === '') {
      const { id: toastId } = toast({
        variant: "destructive",
        title: t('export.emptyNoteErrorTitle'),
        description: t('export.emptyNoteErrorDescription'),
      });
      setTimeout(() => dismissToast(toastId), 3000);
      return;
    }

    try {
      if (format === 'txt') {
        const filename = `${filenameBase}.txt`;
        downloadFile(filename, noteContent, 'text/plain;charset=utf-8');
        const { id: toastId } = toast({ title: t('toast.exportedAs', { format: '.txt' }), description: t('toast.downloadedDescription', {filename}) });
        setTimeout(() => dismissToast(toastId), 2000);
      } else if (format === 'md') {
        const filename = `${filenameBase}.md`;
        downloadFile(filename, noteContent, 'text/markdown;charset=utf-8');
        const { id: toastId } = toast({ title: t('toast.exportedAs', { format: '.md' }), description: t('toast.downloadedDescription', {filename}) });
        setTimeout(() => dismissToast(toastId), 2000);
      } else if (format === 'pdf') {
        const filename = `${filenameBase}.pdf`;
        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.getWidth();
        const margin = 15; 
        const maxLineWidth = pageWidth - margin * 2;
        
        const lines = doc.splitTextToSize(noteContent, maxLineWidth);
        doc.text(lines, margin, margin);
        doc.save(filename);
        const { id: toastId } = toast({ title: t('toast.exportedAs', { format: '.pdf' }), description: t('toast.downloadedDescription', {filename}) });
        setTimeout(() => dismissToast(toastId), 2000);
      }
    } catch (error) {
      console.error("Export error:", error);
      const { id: toastId } = toast({
        variant: "destructive",
        title: t('toast.pdfExportErrorTitle'), 
        description: t('toast.pdfExportErrorDescription'),
      });
      setTimeout(() => dismissToast(toastId), 3000);
    }
  };


  return (
    <div className="flex flex-col h-full overflow-hidden bg-background text-foreground">
      <div className="flex justify-between items-center p-4 sm:p-6 md:p-8 border-b flex-shrink-0">
        <h1 className="text-2xl sm:text-3xl font-semibold text-foreground">
          {t('appModes.organizeTitle')}
        </h1>
        <div className="flex items-center space-x-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="icon" onClick={handleToggleViewMode} aria-label={organizeViewMode === 'edit' ? t('organizeMode.switchToPreview') : t('organizeMode.switchToEdit')}>
                  {organizeViewMode === 'edit' ? <Eye className="h-5 w-5" /> : <PencilLine className="h-5 w-5" />}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{organizeViewMode === 'edit' ? t('organizeMode.switchToPreview') : t('organizeMode.switchToEdit')}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" aria-label={t('export.title')}>
                <Download className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleExport('txt')}>
                <FileText className="mr-2 h-4 w-4" />
                <span>{t('export.txt')}</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport('md')}>
                <FileType className="mr-2 h-4 w-4" /> 
                <span>{t('export.md')}</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => handleExport('pdf')}>
                <FileJson className="mr-2 h-4 w-4" /> 
                <span>{t('export.pdf')}</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="flex-grow overflow-hidden">
        {organizeViewMode === 'edit' ? (
          <div ref={popoverAnchorRef} className="relative flex flex-col h-full">
            <ScrollArea className="flex-grow h-full">
              <Textarea
                ref={textareaRef}
                placeholder={t('organizeMode.placeholder')}
                value={noteContent}
                onChange={handleTextChange}
                onKeyDown={handleKeyDown}
                className="w-full h-full resize-none border-none focus-visible:ring-0 focus-visible:ring-offset-0 p-4 md:p-6 text-base leading-relaxed bg-transparent placeholder-muted-foreground/70"
                aria-label={t('organizeMode.placeholder')}
              />
            </ScrollArea>
            {popoverAnchorRef.current && (
              <SlashCommandPalette
                isOpen={isSlashPaletteOpen}
                onOpenChange={setIsSlashPaletteOpen}
                commands={availableCommands}
                onCommandSelect={handleCommandSelect}
                query={slashQuery}
                targetRef={popoverAnchorRef}
              />
            )}
          </div>
        ) : (
          <ScrollArea className="h-full overflow-y-auto">
            <div className="p-4 md:p-6 prose dark:prose-invert lg:prose-xl max-w-none">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {noteContent}
              </ReactMarkdown>
            </div>
          </ScrollArea>
        )}
      </div>
    </div>
  );
}
