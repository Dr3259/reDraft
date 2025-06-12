
"use client";

import * as React from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { useI18n, useCurrentLocale } from '@/locales/client';
import { SlashCommandPalette, type Command } from '@/components/slash-command-palette';
import { Heading1, Heading2, Heading3, List, ListOrdered, ListTodo, Download, FileText, FileType, FileJson, Minus, Eye, PencilLine, FolderClock, FileSignature, Trash } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useToast } from "@/hooks/use-toast";
import { jsPDF } from "jspdf";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

const LOCAL_STORAGE_CORNELL_DRAFTS_KEY = 'cornellNoteDrafts_v1';
const LEGACY_LOCAL_STORAGE_KEY = 'cornellNoteContent_v1'; // Old autosave key

interface CornellNote {
  title: string;
  cues: string;
  mainNotes: string;
  summary: string;
}

type CornellNoteEditableFields = keyof Pick<CornellNote, 'cues' | 'mainNotes' | 'summary'>;

const initialCornellNote: CornellNote = {
  title: '',
  cues: '',
  mainNotes: '',
  summary: '',
};

interface SavedCornellDraft {
  id: string;
  name: string;
  data: CornellNote;
  createdAt: string;
}

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
  const locale = useCurrentLocale();
  const { toast, dismiss: dismissToast } = useToast();
  
  const [cornellNote, setCornellNote] = React.useState<CornellNote>(initialCornellNote);
  const [cornellDrafts, setCornellDrafts] = React.useState<SavedCornellDraft[]>([]);
  const [isCornellDraftsDialogOpen, setIsCornellDraftsDialogOpen] = React.useState(false);
  
  const cuesTextareaRef = React.useRef<HTMLTextAreaElement>(null);
  const mainNotesTextareaRef = React.useRef<HTMLTextAreaElement>(null);
  const summaryTextareaRef = React.useRef<HTMLTextAreaElement>(null);
  const popoverAnchorRef = React.useRef<HTMLDivElement>(null); 

  const [isSlashPaletteOpen, setIsSlashPaletteOpen] = React.useState(false);
  const [slashQuery, setSlashQuery] = React.useState('');
  const [slashTriggerPosition, setSlashTriggerPosition] = React.useState(0);
  const [organizeViewMode, setOrganizeViewMode] = React.useState<OrganizeViewMode>('edit');
  const [activeEditorForSlashCommand, setActiveEditorForSlashCommand] = React.useState<CornellNoteEditableFields | null>(null);


  React.useEffect(() => {
    const loadDrafts = () => {
      const savedDraftsJson = localStorage.getItem(LOCAL_STORAGE_CORNELL_DRAFTS_KEY);
      if (savedDraftsJson) {
        try {
          const parsedDrafts: SavedCornellDraft[] = JSON.parse(savedDraftsJson);
          setCornellDrafts(parsedDrafts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
        } catch (e) {
          console.error("Error parsing Cornell drafts from localStorage:", e);
          localStorage.removeItem(LOCAL_STORAGE_CORNELL_DRAFTS_KEY);
        }
      } else {
        // Check for legacy autosaved data
        const legacyDataJson = localStorage.getItem(LEGACY_LOCAL_STORAGE_KEY);
        if (legacyDataJson) {
          try {
            const legacyData: Partial<CornellNote> = JSON.parse(legacyDataJson);
            setCornellNote(prev => ({ ...prev, ...legacyData }));
            localStorage.removeItem(LEGACY_LOCAL_STORAGE_KEY); // Remove old key
            const { id: toastId } = toast({
              title: t('cornellNotes.migratedOldNoteTitle'),
              description: t('cornellNotes.migratedOldNoteDescription'),
              duration: 5000,
            });
            setTimeout(() => dismissToast(toastId), 5000);
          } catch (e) {
            console.error("Error parsing legacy Cornell data from localStorage:", e);
            localStorage.removeItem(LEGACY_LOCAL_STORAGE_KEY);
          }
        }
      }
    };
    loadDrafts();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


  const handleToggleViewMode = () => {
    setOrganizeViewMode(prev => prev === 'edit' ? 'preview' : 'edit');
  };

  const handleTitleChange = (value: string) => {
    setCornellNote(prev => ({ ...prev, title: value }));
  };

  const handleContentChange = (field: CornellNoteEditableFields, event: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = event.target.value;
    setCornellNote(prev => ({ ...prev, [field]: value }));

    const cursorPos = event.target.selectionStart;
    const textBeforeCursor = value.substring(0, cursorPos);
    const match = textBeforeCursor.match(/\/(\S*)$/);

    if (match) {
      setActiveEditorForSlashCommand(field);
      setIsSlashPaletteOpen(true);
      setSlashQuery(match[1]);
      setSlashTriggerPosition(cursorPos);
    } else {
      setIsSlashPaletteOpen(false);
      setSlashQuery('');
      // Do not reset activeEditorForSlashCommand here, only on palette close or selection
    }
  };
  
  const handleCommandSelect = (command: Command) => {
    if (!activeEditorForSlashCommand) return;

    let targetTextareaRef: React.RefObject<HTMLTextAreaElement> | null = null;
    switch (activeEditorForSlashCommand) {
      case 'cues': targetTextareaRef = cuesTextareaRef; break;
      case 'mainNotes': targetTextareaRef = mainNotesTextareaRef; break;
      case 'summary': targetTextareaRef = summaryTextareaRef; break;
    }

    if (!targetTextareaRef?.current) return;
    
    const textarea = targetTextareaRef.current;
    const currentValue = textarea.value;
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
    setCornellNote(prev => ({ ...prev, [activeEditorForSlashCommand]: newText }));
    
    setIsSlashPaletteOpen(false);
    setSlashQuery('');

    const newCursorPos = startOfSlashCommand + actionToInsert.length;
    setTimeout(() => {
      if (textarea) {
        textarea.focus();
        textarea.setSelectionRange(newCursorPos, newCursorPos);
      }
    }, 0);
    setActiveEditorForSlashCommand(null);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // This keydown is specifically for the mainNotesTextarea for --- handling
    // Escape for slash palette can be handled more globally if needed or remain here
    const textarea = mainNotesTextareaRef.current;
    if (!textarea || event.currentTarget !== textarea) return;
  
    if (event.key === 'Enter') {
      const cursorPos = textarea.selectionStart;
      const currentText = textarea.value;
      
      const lineStart = currentText.lastIndexOf('\n', cursorPos - 1) + 1;
      const currentLineText = currentText.substring(lineStart, cursorPos).trim(); // Text before cursor on the current line
      const lineAfterCursor = currentText.substring(cursorPos).split('\n')[0].trim(); // Text after cursor on the same line
      const fullLineContent = (currentLineText + lineAfterCursor).trim(); // Entire logical line content


      if (fullLineContent === '---') {
          event.preventDefault(); // Prevent default Enter behavior
          const textBeforeCurrentLine = currentText.substring(0, lineStart);
          
          // Determine text after the '---' line, handling cases where it's the last line
          let textAfterCurrentLine = "";
          const nextLineBreakPos = currentText.indexOf('\n', lineStart + fullLineContent.length);
          if (nextLineBreakPos !== -1) {
            textAfterCurrentLine = currentText.substring(nextLineBreakPos + 1);
          }
          
          const newText = `${textBeforeCurrentLine}---\n${textAfterCurrentLine}`;
          setCornellNote(prev => ({ ...prev, mainNotes: newText }));
  
          const newCursorPos = `${textBeforeCurrentLine}---\n`.length;
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
        setActiveEditorForSlashCommand(null);
        event.preventDefault();
      }
      // Add KeyDown, KeyUp, Enter for palette navigation if needed
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
    content += `## ${t('cornellNotes.cuesArea')}\n${cornellNote.cues || `_${t('cornellNotes.emptySection')}_`}\n\n`;
    content += `## ${t('cornellNotes.mainNotesArea')}\n${cornellNote.mainNotes || `_${t('cornellNotes.emptySection')}_`}\n\n`;
    content += `## ${t('cornellNotes.summaryArea')}\n${cornellNote.summary || `_${t('cornellNotes.emptySection')}_`}\n`;
    return content;
  };

  const handleExport = (format: 'txt' | 'md' | 'pdf') => {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filenameBase = `cornell-note-${(cornellNote.title.trim() || 'untitled').replace(/\s+/g, '_')}-${timestamp}`;
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
        
        doc.setTextColor(0,0,0); 

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
  
  const handleSaveCornellDraft = () => {
    if (!cornellNote.title.trim()) {
      const { id: toastId } = toast({
        variant: "destructive",
        title: t('cornellNotes.titleRequiredErrorTitle'),
        description: t('cornellNotes.titleRequiredErrorDescription'),
      });
      setTimeout(() => dismissToast(toastId), 3000);
      return;
    }

    const draftName = `${t('cornellNotes.draftNamePrefix')} - ${cornellNote.title.trim()}`;
    
    const newDraft: SavedCornellDraft = {
      id: Date.now().toString(),
      name: draftName,
      data: { ...cornellNote },
      createdAt: new Date().toISOString(),
    };

    const updatedDrafts = [newDraft, ...cornellDrafts].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    try {
      localStorage.setItem(LOCAL_STORAGE_CORNELL_DRAFTS_KEY, JSON.stringify(updatedDrafts));
      setCornellDrafts(updatedDrafts);
      const { id: toastId } = toast({
        title: t('cornellNotes.draftSavedTitle'),
        description: t('cornellNotes.draftSavedDescription', { draftName: newDraft.name }),
      });
      setTimeout(() => dismissToast(toastId), 2000);
    } catch (error) {
      console.error("Error saving Cornell draft to localStorage:", error);
      const { id: toastId } = toast({
        variant: "destructive",
        title: t('cornellNotes.draftSaveErrorTitle'),
        description: t('cornellNotes.draftSaveErrorDescription'),
      });
      setTimeout(() => dismissToast(toastId), 3000);
    }
  };

  const handleLoadCornellDraft = (draftId: string) => {
    const draftToLoad = cornellDrafts.find(d => d.id === draftId);
    if (!draftToLoad) return;

    setCornellNote({ ...draftToLoad.data });
    const { id: toastId } = toast({ 
      title: t('cornellNotes.draftLoadedTitle'), 
      description: t('cornellNotes.draftLoadedDescription', { draftName: draftToLoad.name }) 
    });
    setTimeout(() => dismissToast(toastId), 2000);
    setIsCornellDraftsDialogOpen(false);
  };

  const handleDeleteCornellDraft = (draftId: string) => {
    const draftToDelete = cornellDrafts.find(d => d.id === draftId);
    if (!draftToDelete) return;

    const updatedDrafts = cornellDrafts.filter(d => d.id !== draftId);
    try {
      localStorage.setItem(LOCAL_STORAGE_CORNELL_DRAFTS_KEY, JSON.stringify(updatedDrafts));
      setCornellDrafts(updatedDrafts);
      const { id: toastId } = toast({
        title: t('cornellNotes.draftDeletedTitle'),
        description: t('cornellNotes.draftDeletedDescription', { draftName: draftToDelete.name }),
      });
      setTimeout(() => dismissToast(toastId), 2000);
    } catch (error) {
      console.error("Error deleting Cornell draft from localStorage:", error);
      const { id: toastId } = toast({
        variant: "destructive",
        title: t('cornellNotes.draftDeleteErrorTitle'),
        description: t('cornellNotes.draftDeleteErrorDescription'),
      });
      setTimeout(() => dismissToast(toastId), 3000);
    }
  };

  const SectionHeader = ({ label }: { label: string }) => (
    <div className="px-3 pt-3 pb-1 flex-shrink-0">
      <h2 
        className="font-medium text-sm text-muted-foreground uppercase tracking-wider"
      >
        {label}
      </h2>
    </div>
  );

  const RenderSection = ({ content, placeholder }: { content: string; placeholder: string }) => {
    let isDarkBg = false;
    // Updated to match the HSL format from theme more reliably
    const match = themeTextColor.match(/hsl\(\s*(\d+)\s+(\d+%)\s+(\d+%)\s*\)/);
    if (match && match[3]) { // Check lightness (L in HSL)
        const lightness = parseInt(match[3].replace('%',''), 10);
        if (lightness > 60) { // Light text typically means dark background
            isDarkBg = true;
        }
    }


    if (organizeViewMode === 'preview') {
      return (
        <ScrollArea className="h-full p-3">
          <div 
            style={{ color: themeTextColor }} 
            className={cn(
              "prose max-w-none",
              isDarkBg && "prose-invert" 
            )}
          >
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
      className="relative flex flex-col h-full overflow-hidden" 
      style={{ backgroundColor: themeBackgroundColor, color: themeTextColor }}
    >
      <div className="flex justify-between items-center p-4 border-b border-border flex-shrink-0" style={{ borderColor: 'hsl(var(--border))' }}>
        <Input
          placeholder={t('cornellNotes.titlePlaceholder')}
          value={cornellNote.title}
          onChange={(e) => handleTitleChange(e.target.value)}
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
        <div className="w-[38.2%] flex flex-col border-r border-border" style={{ borderColor: 'hsl(var(--border))' }}>
          <SectionHeader label={t('cornellNotes.cuesArea')} />
          <div className="flex-grow relative">
            {organizeViewMode === 'edit' ? (
              <Textarea
                ref={cuesTextareaRef}
                placeholder={t('cornellNotes.cuesPlaceholder')}
                value={cornellNote.cues}
                onChange={(e) => handleContentChange('cues', e)}
                onKeyDown={(e) => { if (isSlashPaletteOpen && e.key === 'Escape') { setIsSlashPaletteOpen(false); setActiveEditorForSlashCommand(null); e.preventDefault();}}}
                className="w-full h-full resize-none border-none focus-visible:ring-0 focus-visible:ring-offset-0 p-3 text-sm leading-relaxed bg-transparent theme-placeholder"
                style={{ color: themeTextColor, ...placeholderStyle }}
                aria-label={t('cornellNotes.cuesPlaceholder')}
              />
            ) : (
              <RenderSection content={cornellNote.cues} placeholder={t('cornellNotes.cuesPlaceholder')} />
            )}
          </div>
        </div>

        <div className="w-[61.8%] flex flex-col">
          <div className="h-[61.8%] flex flex-col">
             <SectionHeader label={t('cornellNotes.mainNotesArea')} />
            <div className="flex-grow relative">
              {organizeViewMode === 'edit' ? (
                <Textarea
                  ref={mainNotesTextareaRef}
                  placeholder={t('cornellNotes.mainNotesPlaceholder')}
                  value={cornellNote.mainNotes}
                  onChange={(e) => handleContentChange('mainNotes', e)}
                  onKeyDown={handleKeyDown} // Keep specific onKeyDown for mainNotes if --- logic is only here
                  className="w-full h-full resize-none border-none focus-visible:ring-0 focus-visible:ring-offset-0 p-3 text-sm leading-relaxed bg-transparent theme-placeholder"
                  style={{ color: themeTextColor, ...placeholderStyle }}
                  aria-label={t('cornellNotes.mainNotesPlaceholder')}
                />
              ) : (
                <RenderSection content={cornellNote.mainNotes} placeholder={t('cornellNotes.mainNotesPlaceholder')} />
              )}
              {popoverAnchorRef.current && organizeViewMode === 'edit' && (
                <SlashCommandPalette
                  isOpen={isSlashPaletteOpen}
                  onOpenChange={(isOpen) => {
                    setIsSlashPaletteOpen(isOpen);
                    if (!isOpen) setActiveEditorForSlashCommand(null);
                  }}
                  commands={availableCommands}
                  onCommandSelect={handleCommandSelect}
                  query={slashQuery}
                  targetRef={popoverAnchorRef} 
                />
              )}
            </div>
          </div>

          <div className="h-[38.2%] flex flex-col border-t border-border" style={{ borderColor: 'hsl(var(--border))' }}>
            <SectionHeader label={t('cornellNotes.summaryArea')} />
            <div className="flex-grow relative">
            {organizeViewMode === 'edit' ? (
              <Textarea
                ref={summaryTextareaRef}
                placeholder={t('cornellNotes.summaryPlaceholder')}
                value={cornellNote.summary}
                onChange={(e) => handleContentChange('summary', e)}
                onKeyDown={(e) => { if (isSlashPaletteOpen && e.key === 'Escape') { setIsSlashPaletteOpen(false); setActiveEditorForSlashCommand(null); e.preventDefault();}}}
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

      <div className="absolute bottom-4 right-4 z-10 flex gap-2">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" size="icon" onClick={() => setIsCornellDraftsDialogOpen(true)} aria-label={t('cornellNotes.manageDraftsTooltip')}>
                <FolderClock className="h-5 w-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{t('cornellNotes.manageDraftsTooltip')}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" size="icon" onClick={handleSaveCornellDraft} aria-label={t('cornellNotes.saveDraftTooltip')}>
                <FileSignature className="h-5 w-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{t('cornellNotes.saveDraftTooltip')}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
      
      <Dialog open={isCornellDraftsDialogOpen} onOpenChange={setIsCornellDraftsDialogOpen}>
        <DialogContent className="sm:max-w-[525px]">
          <DialogHeader>
            <DialogTitle>{t('cornellNotes.draftsDialogTitle')}</DialogTitle>
            <DialogDescription>
              {cornellDrafts.length > 0 ? t('cornellNotes.draftsDialogDescription') : t('cornellNotes.noDraftsMessage')}
            </DialogDescription>
          </DialogHeader>
          {cornellDrafts.length > 0 && (
            <ScrollArea className="h-[300px] w-full rounded-md border p-4">
              <div className="space-y-4">
                {cornellDrafts.map((draft) => (
                  <div key={draft.id} className="flex items-center justify-between p-2 rounded-md hover:bg-accent space-x-3">
                    <div className="flex-grow">
                      <p className="font-medium">{draft.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(draft.createdAt).toLocaleString(locale, { dateStyle: 'medium', timeStyle: 'short' })}
                      </p>
                       {draft.data.title && <p className="text-xs text-muted-foreground mt-1 truncate">{t('cornellNotes.titleLabel')}: {draft.data.title}</p>}
                    </div>
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm" onClick={() => handleLoadCornellDraft(draft.id)}>
                        {t('cornellNotes.loadDraftButton')}
                      </Button>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => handleDeleteCornellDraft(draft.id)}>
                              <Trash className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{t('cornellNotes.deleteDraftTooltip')}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">{t('cornellNotes.closeDialogButton')}</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

    