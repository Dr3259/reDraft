
"use client";

import * as React from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
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
import { cn } from '@/lib/utils';

const LOCAL_STORAGE_CORNELL_NOTE_KEY = 'cornellNote_v1';

interface CornellNote {
  title: string;
  cues: string;
  mainNotes: string;
  summary: string;
}

const initialCornellNote: CornellNote = {
  title: '',
  cues: '',
  mainNotes: '',
  summary: '',
};

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

interface OrganizeModeViewProps {
  themeBackgroundColor: string;
  themeTextColor: string;
}

export function OrganizeModeView({ themeBackgroundColor, themeTextColor }: OrganizeModeViewProps) {
  const t = useI18n();
  const { toast, dismiss: dismissToast } = useToast();
  const [cornellNote, setCornellNote] = useAutosave<CornellNote>(LOCAL_STORAGE_CORNELL_NOTE_KEY, initialCornellNote);
  
  const mainNotesTextareaRef = React.useRef<HTMLTextAreaElement>(null);
  const popoverAnchorRef = React.useRef<HTMLDivElement>(null); 

  const [isSlashPaletteOpen, setIsSlashPaletteOpen] = React.useState(false);
  const [slashQuery, setSlashQuery] = React.useState('');
  const [slashTriggerPosition, setSlashTriggerPosition] = React.useState(0);
  const [organizeViewMode, setOrganizeViewMode] = React.useState<OrganizeViewMode>('edit');

  const handleToggleViewMode = () => {
    setOrganizeViewMode(prev => prev === 'edit' ? 'preview' : 'edit');
  };

  const handleInputChange = (field: keyof CornellNote, value: string) => {
    setCornellNote(prev => ({ ...prev, [field]: value }));
  };
  
  const handleMainNotesChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = event.target.value;
    handleInputChange('mainNotes', newValue);

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
    if (!mainNotesTextareaRef.current) return;

    const currentValue = mainNotesTextareaRef.current.value;
    const queryLengthWithSlash = 1 + slashQuery.length;
    const startOfSlashCommand = slashTriggerPosition - queryLengthWithSlash;

    if (startOfSlashCommand < 0) {
        setIsSlashPaletteOpen(false);
        return;
    }
    
    let actionToInsert = command.action;
    if (command.id === 'hr') {
      if (startOfSlashCommand > 0 && currentValue.charAt(startOfSlashCommand - 1) !== '\n') {
        actionToInsert = '\n' + actionToInsert;
      }
    }
    
    const textBeforeSlashCommand = currentValue.substring(0, startOfSlashCommand);
    const textAfterSlashCommand = currentValue.substring(slashTriggerPosition);

    const newText = textBeforeSlashCommand + actionToInsert + textAfterSlashCommand;
    handleInputChange('mainNotes', newText);
    setIsSlashPaletteOpen(false);
    setSlashQuery('');

    const newCursorPos = startOfSlashCommand + actionToInsert.length;
    setTimeout(() => {
      if (mainNotesTextareaRef.current) {
        mainNotesTextareaRef.current.focus();
        mainNotesTextareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
      }
    }, 0);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const textarea = mainNotesTextareaRef.current;
    if (!textarea) return;
  
    if (event.key === 'Enter') {
      const cursorPos = textarea.selectionStart;
      const currentText = textarea.value;
      const lineStart = currentText.lastIndexOf('\n', cursorPos - 1) + 1;
      const currentLineText = currentText.substring(lineStart, cursorPos);
      
      const trimmedCurrentLine = currentLineText.trim();

      if (trimmedCurrentLine === '---') {
          event.preventDefault();
          const textBefore = currentText.substring(0, lineStart);
          const textAfterCurrentLine = currentText.substring(cursorPos);
          
          const newText = `${textBefore}---\n${textAfterCurrentLine}`;
          handleInputChange('mainNotes', newText);
  
          const newCursorPos = `${textBefore}---\n`.length;
          setTimeout(() => {
            if (textarea.focus) {
              textarea.focus();
              textarea.setSelectionRange(newCursorPos, newCursorPos);
            }
          }, 0);
          return;
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

  const formatCornellNoteForExport = () => {
    let content = `# ${cornellNote.title || t('cornellNotes.untitled')}\n\n`;
    content += `## ${t('cornellNotes.cuesArea')}\n${cornellNote.cues || t('cornellNotes.emptySection')}\n\n`;
    content += `## ${t('cornellNotes.mainNotesArea')}\n${cornellNote.mainNotes || t('cornellNotes.emptySection')}\n\n`;
    content += `## ${t('cornellNotes.summaryArea')}\n${cornellNote.summary || t('cornellNotes.emptySection')}\n`;
    return content;
  };

  const handleExport = (format: 'txt' | 'md' | 'pdf') => {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filenameBase = `cornell-note-${timestamp}`;
    const exportContent = formatCornellNoteForExport();

    if (!cornellNote.title && !cornellNote.cues && !cornellNote.mainNotes && !cornellNote.summary) {
      const { id: toastId } = toast({
        variant: "destructive",
        title: t('export.emptyNoteErrorTitle'),
        description: t('export.emptyNoteErrorDescription'),
      });
      setTimeout(() => dismissToast(toastId), 3000);
      return;
    }

    try {
      if (format === 'txt' || format === 'md') {
        const filename = `${filenameBase}.${format}`;
        downloadFile(filename, exportContent, format === 'txt' ? 'text/plain;charset=utf-8' : 'text/markdown;charset=utf-8');
        const { id: toastId } = toast({ title: t('toast.exportedAs', { format: `.${format}` }), description: t('toast.downloadedDescription', {filename}) });
        setTimeout(() => dismissToast(toastId), 2000);
      } else if (format === 'pdf') {
        const filename = `${filenameBase}.pdf`;
        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.getWidth();
        const margin = 15; 
        const maxLineWidth = pageWidth - margin * 2;
        
        doc.setTextColor(themeTextColor === 'hsl(0 0% 100%)' || themeTextColor === 'hsl(0 0% 95%)' ? 20 : 20); // Basic dark/light text for PDF

        const lines = doc.splitTextToSize(exportContent, maxLineWidth);
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

  const SectionHeader = ({ label }: { label: string }) => (
    <div className="p-2 border-b border-border" style={{ borderColor: 'hsl(var(--border))' }}>
      <h2 className="font-semibold text-sm" style={{ color: themeTextColor, opacity: 0.8 }}>{label}</h2>
    </div>
  );

  const RenderSection = ({ content, placeholder }: { content: string; placeholder: string }) => {
    if (organizeViewMode === 'preview') {
      return (
        <ScrollArea className="h-full p-3">
          <div style={{color: themeTextColor}} className={cn("prose dark:prose-invert max-w-none", themeTextColor === 'hsl(0 0% 0%)' ? '' : 'prose-invert-theme-colors' )}>
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {content || `*${placeholder}*`}
            </ReactMarkdown>
          </div>
        </ScrollArea>
      );
    }
    return null; 
  };
  
  const placeholderStyle = {
    '--placeholder-color': themeTextColor,
    '--placeholder-opacity': '0.6',
  } as React.CSSProperties;


  return (
    <div 
      className="flex flex-col h-full overflow-hidden" 
      style={{ backgroundColor: themeBackgroundColor, color: themeTextColor }}
    >
      <style jsx global>{`
        .theme-placeholder::placeholder {
          color: var(--placeholder-color);
          opacity: var(--placeholder-opacity);
        }
        .prose-invert-theme-colors {
            --tw-prose-body: ${themeTextColor};
            --tw-prose-headings: ${themeTextColor};
            --tw-prose-lead: ${themeTextColor};
            --tw-prose-links: ${themeTextColor};
            --tw-prose-bold: ${themeTextColor};
            --tw-prose-counters: ${themeTextColor};
            --tw-prose-bullets: ${themeTextColor};
            --tw-prose-hr: ${themeTextColor};
            --tw-prose-quotes: ${themeTextColor};
            --tw-prose-quote-borders: ${themeTextColor};
            --tw-prose-captions: ${themeTextColor};
            --tw-prose-code: ${themeTextColor};
            --tw-prose-pre-code: ${themeTextColor};
            --tw-prose-pre-bg: rgba(0,0,0,0.2); // A generic semi-transparent dark for code blocks
            --tw-prose-th-borders: ${themeTextColor};
            --tw-prose-td-borders: ${themeTextColor};
        }
      `}</style>
      <div className="flex justify-between items-center p-4 border-b border-border flex-shrink-0" style={{ borderColor: 'hsl(var(--border))' }}>
        <Input
          placeholder={t('cornellNotes.titlePlaceholder')}
          value={cornellNote.title}
          onChange={(e) => handleInputChange('title', e.target.value)}
          className="text-xl font-semibold border-none focus-visible:ring-0 focus-visible:ring-offset-0 flex-grow max-w-md mr-4 bg-transparent theme-placeholder"
          style={{ color: themeTextColor, ...placeholderStyle }}
          aria-label={t('cornellNotes.titlePlaceholder')}
        />
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

      <div className="flex flex-grow overflow-hidden" ref={popoverAnchorRef}>
        <div className="w-1/3 lg:w-1/4 flex flex-col border-r border-border" style={{ borderColor: 'hsl(var(--border))' }}>
          <SectionHeader label={t('cornellNotes.cuesArea')} />
          <div className="flex-grow relative">
            {organizeViewMode === 'edit' ? (
              <Textarea
                placeholder={t('cornellNotes.cuesPlaceholder')}
                value={cornellNote.cues}
                onChange={(e) => handleInputChange('cues', e.target.value)}
                className="w-full h-full resize-none border-none focus-visible:ring-0 focus-visible:ring-offset-0 p-3 text-sm leading-relaxed bg-transparent theme-placeholder"
                style={{ color: themeTextColor, ...placeholderStyle }}
                aria-label={t('cornellNotes.cuesPlaceholder')}
              />
            ) : (
              <RenderSection content={cornellNote.cues} placeholder={t('cornellNotes.cuesPlaceholder')} />
            )}
          </div>
        </div>

        <div className="w-2/3 lg:w-3/4 flex flex-col">
          <div className="flex-grow flex flex-col" style={{minHeight: '70%'}}>
             <SectionHeader label={t('cornellNotes.mainNotesArea')} />
            <div className="flex-grow relative">
              {organizeViewMode === 'edit' ? (
                <Textarea
                  ref={mainNotesTextareaRef}
                  placeholder={t('cornellNotes.mainNotesPlaceholder')}
                  value={cornellNote.mainNotes}
                  onChange={handleMainNotesChange}
                  onKeyDown={handleKeyDown}
                  className="w-full h-full resize-none border-none focus-visible:ring-0 focus-visible:ring-offset-0 p-3 text-sm leading-relaxed bg-transparent theme-placeholder"
                  style={{ color: themeTextColor, ...placeholderStyle }}
                  aria-label={t('cornellNotes.mainNotesPlaceholder')}
                />
              ) : (
                <RenderSection content={cornellNote.mainNotes} placeholder={t('cornellNotes.mainNotesPlaceholder')} />
              )}
              {popoverAnchorRef.current && mainNotesTextareaRef.current && organizeViewMode === 'edit' && (
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
          </div>

          <div className="flex flex-col border-t border-border" style={{minHeight: '30%', borderColor: 'hsl(var(--border))' }}>
            <SectionHeader label={t('cornellNotes.summaryArea')} />
            <div className="flex-grow relative">
            {organizeViewMode === 'edit' ? (
              <Textarea
                placeholder={t('cornellNotes.summaryPlaceholder')}
                value={cornellNote.summary}
                onChange={(e) => handleInputChange('summary', e.target.value)}
                className="w-full h-full resize-none border-none focus-visible:ring-0 focus-visible:ring-offset-0 p-3 text-sm leading-relaxed bg-transparent theme-placeholder"
                style={{ color: themeTextColor, ...placeholderStyle }}
                aria-label={t('cornellNotes.summaryPlaceholder')}
              />
            ) : (
              <RenderSection content={cornellNote.summary} placeholder={t('cornellNotes.summaryPlaceholder')} />
            )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

