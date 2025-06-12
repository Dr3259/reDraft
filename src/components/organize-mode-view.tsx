
"use client";

import * as React from 'react';
import { Input } from '@/components/ui/input';
import { useI18n, useCurrentLocale } from '@/locales/client';
import { Download, FileText, FileType, FileJson, FolderClock, FileSignature, Trash } from 'lucide-react';
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
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

import { useEditor, EditorContent, Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';

const LOCAL_STORAGE_CORNELL_DRAFTS_KEY = 'cornellNoteDrafts_v2_tiptap'; // Updated key for new format
const LEGACY_LOCAL_STORAGE_KEY_V1 = 'cornellNoteDrafts_v1'; // Old drafts key

interface CornellNote {
  title: string;
  cues: string; // Will store HTML from TipTap
  mainNotes: string; // Will store HTML from TipTap
  summary: string; // Will store HTML from TipTap
}

const initialCornellNote: CornellNote = {
  title: '',
  cues: '',
  mainNotes: '',
  summary: '',
};

interface SavedCornellDraft {
  id: string;
  name: string;
  data: CornellNote; // Data is HTML strings
  createdAt: string;
}

interface OrganizeModeViewProps {
  themeBackgroundColor: string;
  themeTextColor: string;
}

const TipTapEditor = ({ content, onUpdate, placeholder, themeTextColor, themeBackgroundColor }: { content: string; onUpdate: (html: string) => void; placeholder: string, themeTextColor: string, themeBackgroundColor: string }) => {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        // HorizontalRule is part of StarterKit by default
        // You can configure other extensions here if needed
        // e.g. heading: { levels: [1, 2, 3] }
      }),
      Placeholder.configure({ placeholder }),
    ],
    content: content,
    onUpdate: ({ editor }) => {
      onUpdate(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: cn(
          'prose prose-sm sm:prose lg:prose-lg xl:prose-xl max-w-none w-full h-full focus:outline-none p-3 overflow-y-auto',
          // Basic logic for prose-invert based on text color lightness
          // This might need refinement based on actual HSL values if available directly
          // For now, assuming light text means dark background
           parseInt(themeTextColor.match(/hsl\(\s*\d+\s+\d+%\s+(\d+)%\s*\)/)?.[1] || '0', 10) > 50 ? 'prose-invert' : ''
        ),
        style: `color: ${themeTextColor}; caret-color: ${themeTextColor};` // Ensure caret color matches text
      },
    },
  });

  React.useEffect(() => {
    if (editor && editor.isEditable) {
        // This re-applies the content, useful if the initial prop update was missed or for dynamic changes
        // However, be cautious with frequent updates here to avoid cursor jumps.
        // Only update if content prop truly differs from editor's current content.
        const currentEditorHTML = editor.getHTML();
        if (content !== currentEditorHTML) {
            editor.commands.setContent(content, false);
        }
    }
  }, [content, editor]);


  return (
    <div className="relative flex-grow" style={{ backgroundColor: 'transparent' }}>
      <EditorContent editor={editor} className="h-full w-full" />
    </div>
  );
};


export function OrganizeModeView({ themeBackgroundColor, themeTextColor }: OrganizeModeViewProps) {
  const t = useI18n();
  const locale = useCurrentLocale();
  const { toast, dismiss: dismissToast } = useToast();
  
  const [cornellNote, setCornellNote] = React.useState<CornellNote>(initialCornellNote);
  const [cornellDrafts, setCornellDrafts] = React.useState<SavedCornellDraft[]>([]);
  const [isCornellDraftsDialogOpen, setIsCornellDraftsDialogOpen] = React.useState(false);
  
  React.useEffect(() => {
    const loadDrafts = () => {
      let draftsToLoad: SavedCornellDraft[] = [];
      const savedDraftsJson = localStorage.getItem(LOCAL_STORAGE_CORNELL_DRAFTS_KEY);
      if (savedDraftsJson) {
        try {
          draftsToLoad = JSON.parse(savedDraftsJson);
        } catch (e) {
          console.error("Error parsing Cornell drafts (v2) from localStorage:", e);
          localStorage.removeItem(LOCAL_STORAGE_CORNELL_DRAFTS_KEY);
        }
      } else {
        // Attempt to migrate legacy drafts (v1 - Markdown strings)
        const legacyDraftsJson = localStorage.getItem(LEGACY_LOCAL_STORAGE_KEY_V1);
        if (legacyDraftsJson) {
          try {
            const legacyDrafts: SavedCornellDraft[] = JSON.parse(legacyDraftsJson);
            // For simplicity, we're not converting MD to HTML here.
            // They will load as plain text. New saves will be HTML.
            // A proper migration would involve an MD-to-HTML converter.
            draftsToLoad = legacyDrafts.map(draft => ({
              ...draft,
              data: { // Assume legacy data structure was also CornellNote-like but with MD strings
                title: draft.data.title || '',
                // For simplicity, existing MD content will be treated as plain text by TipTap
                // A proper migration would convert MD to HTML here before setting it
                cues: draft.data.cues || '', 
                mainNotes: draft.data.mainNotes || '',
                summary: draft.data.summary || '',
              }
            }));
            localStorage.setItem(LOCAL_STORAGE_CORNELL_DRAFTS_KEY, JSON.stringify(draftsToLoad)); // Save migrated drafts in new format
            localStorage.removeItem(LEGACY_LOCAL_STORAGE_KEY_V1); // Remove old key
            const { id: toastId } = toast({
              title: t('cornellNotes.migratedOldNoteTitle'),
              description: t('cornellNotes.migratedOldNoteDescriptionNewFormat'),
              duration: 7000,
            });
            setTimeout(() => dismissToast(toastId), 7000);
          } catch (e) {
            console.error("Error parsing or migrating legacy Cornell drafts (v1):", e);
            localStorage.removeItem(LEGACY_LOCAL_STORAGE_KEY_V1);
          }
        }
      }
      setCornellDrafts(draftsToLoad.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    };
    loadDrafts();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


  const handleTitleChange = (value: string) => {
    setCornellNote(prev => ({ ...prev, title: value }));
  };

  const handleContentUpdate = (field: keyof Pick<CornellNote, 'cues' | 'mainNotes' | 'summary'>, html: string) => {
    setCornellNote(prev => ({ ...prev, [field]: html }));
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

  const formatCornellNoteForExport = (isPlainText: boolean = false) => {
    // Basic HTML structure for export. For plain text, try to strip HTML (very basic).
    let content = `<h1>${cornellNote.title || t('cornellNotes.untitled')}</h1>\n\n`;
    
    const stripHtml = (html: string) => {
        const doc = new DOMParser().parseFromString(html, 'text/html');
        return doc.body.textContent || "";
    };

    const cuesContent = isPlainText ? stripHtml(cornellNote.cues) : cornellNote.cues;
    const mainNotesContent = isPlainText ? stripHtml(cornellNote.mainNotes) : cornellNote.mainNotes;
    const summaryContent = isPlainText ? stripHtml(cornellNote.summary) : cornellNote.summary;

    content += `<h2>${t('cornellNotes.cuesArea')}</h2>\n<div>${cuesContent || `<p><em>${t('cornellNotes.emptySection')}</em></p>`}</div>\n\n`;
    content += `<h2>${t('cornellNotes.mainNotesArea')}</h2>\n<div>${mainNotesContent || `<p><em>${t('cornellNotes.emptySection')}</em></p>`}</div>\n\n`;
    content += `<h2>${t('cornellNotes.summaryArea')}</h2>\n<div>${summaryContent || `<p><em>${t('cornellNotes.emptySection')}</em></p>`}</div>\n`;
    return content;
  };

  const handleExport = (format: 'txt' | 'md' | 'pdf') => {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filenameBase = `cornell-note-${(cornellNote.title.trim() || 'untitled').replace(/\s+/g, '_')}-${timestamp}`;
    
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
      if (format === 'txt') {
        const exportContent = formatCornellNoteForExport(true); // true for plain text
        const filename = `${filenameBase}.txt`;
        downloadFile(filename, exportContent, 'text/plain;charset=utf-8');
        const { id: toastId } = toast({ title: t('toast.exportedAs', { format: '.txt' }), description: t('toast.downloadedDescription', {filename}) });
        setTimeout(() => dismissToast(toastId), 2000);
      } else if (format === 'md') {
        // Note: This exports HTML content as .md. True MD conversion is complex.
        const exportContent = formatCornellNoteForExport(false);
        const filename = `${filenameBase}.md`;
        downloadFile(filename, exportContent, 'text/markdown;charset=utf-8'); // Mime type is markdown, but content is HTML
         const { id: toastId } = toast({ title: t('toast.exportedAs', { format: '.md' }), description: `${t('toast.downloadedDescription', {filename})} (${t('export.mdContainsHtmlWarning')})` });
        setTimeout(() => dismissToast(toastId), 4000);
      } else if (format === 'pdf') {
        const filename = `${filenameBase}.pdf`;
        const exportContent = formatCornellNoteForExport(true); // PDF export uses stripped text for simplicity
        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.getWidth();
        const margin = 15; 
        const maxLineWidth = pageWidth - margin * 2;
        
        doc.setTextColor(0,0,0); 
        // jsPDF's text method doesn't interpret HTML. We are passing pseudo-Markdown/text.
        // For rich PDF, a more sophisticated HTML-to-PDF library would be needed.
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
      data: { ...cornellNote }, // Data is HTML
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

    // Ensure all fields are present, even if empty strings, to avoid TipTap errors
    const loadedData: CornellNote = {
        title: draftToLoad.data.title || '',
        cues: draftToLoad.data.cues || '',
        mainNotes: draftToLoad.data.mainNotes || '',
        summary: draftToLoad.data.summary || '',
    };
    setCornellNote(loadedData);

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
        style={{ color: themeTextColor, opacity: 0.8 }}
      >
        {label}
      </h2>
    </div>
  );
  
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
          {/* Edit/Preview toggle removed as editor is WYSIWYG */}
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

      <div className="flex flex-grow overflow-hidden">
        {/* Cues Section (Left) */}
        <div className="w-[38.2%] flex flex-col border-r border-border" style={{ borderColor: 'hsl(var(--border))' }}>
          <SectionHeader label={t('cornellNotes.cuesArea')} />
          <TipTapEditor
            content={cornellNote.cues}
            onUpdate={(html) => handleContentUpdate('cues', html)}
            placeholder={t('cornellNotes.cuesPlaceholder')}
            themeTextColor={themeTextColor}
            themeBackgroundColor={themeBackgroundColor}
          />
        </div>

        {/* Main Notes & Summary Section (Right) */}
        <div className="w-[61.8%] flex flex-col">
          {/* Main Notes Area */}
          <div className="h-[61.8%] flex flex-col">
             <SectionHeader label={t('cornellNotes.mainNotesArea')} />
             <TipTapEditor
                content={cornellNote.mainNotes}
                onUpdate={(html) => handleContentUpdate('mainNotes', html)}
                placeholder={t('cornellNotes.mainNotesPlaceholder')}
                themeTextColor={themeTextColor}
                themeBackgroundColor={themeBackgroundColor}
              />
          </div>

          {/* Summary Area */}
          <div className="h-[38.2%] flex flex-col border-t border-border" style={{ borderColor: 'hsl(var(--border))' }}>
            <SectionHeader label={t('cornellNotes.summaryArea')} />
            <TipTapEditor
                content={cornellNote.summary}
                onUpdate={(html) => handleContentUpdate('summary', html)}
                placeholder={t('cornellNotes.summaryPlaceholder')}
                themeTextColor={themeTextColor}
                themeBackgroundColor={themeBackgroundColor}
              />
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
