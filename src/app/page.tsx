"use client";

import * as React from 'react';
import {
  BoldIcon, ItalicIcon, Heading1Icon, Heading2Icon, Heading3Icon,
  ListIcon, ListOrderedIcon, FileTextIcon, FileCodeIcon, FileDownIcon, Wand2Icon, DownloadIcon
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useToast } from "@/hooks/use-toast";
import { useAutosave } from '@/hooks/useAutosave';
import { grammarSuggestion } from '@/ai/flows/grammar-suggestion';
import { LogoIcon } from '@/components/icons/LogoIcon';
import { ToolbarButton } from '@/components/editor/ToolbarButton';
import jsPDF from 'jspdf';

type FormatType = 'bold' | 'italic' | 'h1' | 'h2' | 'h3' | 'ul' | 'ol';

export default function NoteCanvasPage() {
  const [noteContent, setNoteContent] = useAutosave('noteCanvasContent', '');
  const [aiSuggestions, setAiSuggestions] = React.useState<string | null>(null);
  const [isAISuggesting, setIsAISuggesting] = React.useState(false);
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);
  const [cursorPos, setCursorPos] = React.useState<{start: number, end: number} | null>(null);
  const { toast } = useToast();

  const handleFormat = (type: FormatType) => {
    if (!textareaRef.current) return;
    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const currentText = textarea.value; // Use textarea.value for most up-to-date content
  
    let prefix = "";
    let suffix = "";
    let newCursorStart = start;
    let newCursorEnd = end;
    let newText = currentText;
  
    switch (type) {
      case 'bold': prefix = '**'; suffix = '**'; break;
      case 'italic': prefix = '*'; suffix = '*'; break;
      case 'h1': prefix = '# '; break;
      case 'h2': prefix = '## '; break;
      case 'h3': prefix = '### '; break;
      case 'ul': prefix = '- '; break;
      case 'ol': prefix = '1. '; break;
    }
  
    if ((type === 'bold' || type === 'italic') && start !== end) {
      // Wrap selected text
      newText = `${currentText.substring(0, start)}${prefix}${currentText.substring(start, end)}${suffix}${currentText.substring(end)}`;
      newCursorStart = start + prefix.length;
      newCursorEnd = end + prefix.length;
    } else if (type === 'bold' || type === 'italic') {
      // Insert markers and place cursor in between
      newText = `${currentText.substring(0, start)}${prefix}${suffix}${currentText.substring(end)}`;
      newCursorStart = start + prefix.length;
      newCursorEnd = newCursorStart;
    } else {
      // For headings and lists, operate on the current line
      let lineStart = start;
      while (lineStart > 0 && currentText[lineStart - 1] !== '\n') {
        lineStart--;
      }
      // If cursor is not at the beginning of the line and it's not an empty line, add a newline first
      const insertNewLine = (lineStart !== start || currentText.substring(lineStart, start).trim() !== "") && currentText[lineStart] !== '\n' && lineStart !==0 ;
      const prefixWithPossibleNewline = insertNewLine ? `\n${prefix}` : prefix;

      const textBeforeLine = currentText.substring(0, lineStart);
      const textAfterLineStart = currentText.substring(lineStart);
      
      newText = `${textBeforeLine}${prefixWithPossibleNewline}${textAfterLineStart}`;
      newCursorStart = lineStart + prefixWithPossibleNewline.length;
      newCursorEnd = newCursorStart;
    }
  
    setNoteContent(newText);
    setCursorPos({ start: newCursorStart, end: newCursorEnd });
  };

  React.useEffect(() => {
    if (textareaRef.current && cursorPos) {
      textareaRef.current.focus();
      textareaRef.current.setSelectionRange(cursorPos.start, cursorPos.end);
      setCursorPos(null); 
    }
  }, [noteContent, cursorPos]);


  const handleExport = (format: 'txt' | 'md' | 'pdf') => {
    const filename = `NoteCanvas_Export.${format}`;
    let mimeType = 'text/plain';
    let contentToExport = noteContent;

    if (format === 'md') {
      mimeType = 'text/markdown';
    }

    if (format === 'pdf') {
      try {
        const pdf = new jsPDF();
        // Split text into lines that fit page width. Crude way, jsPDF has better methods.
        const lines = pdf.splitTextToSize(noteContent, 180); 
        pdf.text(lines, 10, 10);
        pdf.save(filename);
        toast({ title: "Exported as PDF", description: `${filename} downloaded.` });
      } catch (e) {
        console.error("PDF export error:", e);
        toast({ title: "PDF Export Error", description: "Could not generate PDF.", variant: "destructive" });
      }
      return;
    }

    const blob = new Blob([contentToExport], { type: mimeType });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
    toast({ title: `Exported as ${format.toUpperCase()}`, description: `${filename} downloaded.` });
  };

  const handleGetSuggestions = async () => {
    if (!noteContent.trim()) {
      toast({ title: "Empty Note", description: "Write something before getting suggestions.", variant: "destructive" });
      return;
    }
    setIsAISuggesting(true);
    setAiSuggestions(null);
    try {
      const result = await grammarSuggestion({ text: noteContent });
      setAiSuggestions(result.suggestions);
      toast({ title: "AI Suggestions Ready", description: "Suggestions have been generated." });
    } catch (error) {
      console.error("Error getting AI suggestions:", error);
      setAiSuggestions("Failed to get suggestions. Please try again.");
      toast({ title: "AI Error", description: "Could not fetch suggestions.", variant: "destructive" });
    } finally {
      setIsAISuggesting(false);
    }
  };

  const formattingTools = [
    { type: 'bold' as FormatType, icon: <BoldIcon className="h-4 w-4" />, label: 'Bold' },
    { type: 'italic' as FormatType, icon: <ItalicIcon className="h-4 w-4" />, label: 'Italic' },
    { type: 'h1' as FormatType, icon: <Heading1Icon className="h-4 w-4" />, label: 'Heading 1' },
    { type: 'h2' as FormatType, icon: <Heading2Icon className="h-4 w-4" />, label: 'Heading 2' },
    { type: 'h3' as FormatType, icon: <Heading3Icon className="h-4 w-4" />, label: 'Heading 3' },
    { type: 'ul' as FormatType, icon: <ListIcon className="h-4 w-4" />, label: 'Unordered List' },
    { type: 'ol' as FormatType, icon: <ListOrderedIcon className="h-4 w-4" />, label: 'Ordered List' },
  ];

  return (
    <div className="flex flex-col min-h-screen font-body">
      <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <LogoIcon className="h-8 w-8 text-primary" />
            <h1 className="text-2xl font-headline font-semibold text-primary">NoteCanvas</h1>
          </div>
        </div>
      </header>

      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          <div className="lg:w-2/3 flex flex-col gap-4">
            <Card className="shadow-lg">
              <CardHeader className="bg-muted/30 p-3 border-b">
                <div className="flex items-center gap-2 flex-wrap">
                  {formattingTools.map(tool => (
                    <ToolbarButton
                      key={tool.type}
                      tooltipLabel={tool.label}
                      icon={tool.icon}
                      onClick={() => handleFormat(tool.type)}
                      aria-label={tool.label}
                    />
                  ))}
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <Textarea
                  ref={textareaRef}
                  value={noteContent}
                  onChange={(e) => setNoteContent(e.target.value)}
                  placeholder="Start your masterpiece..."
                  className="w-full h-[calc(100vh-20rem)] min-h-[300px] rounded-none border-0 focus-visible:ring-0 focus-visible:ring-offset-0 p-4 resize-none text-base"
                  aria-label="Note content editor"
                />
              </CardContent>
            </Card>
          </div>

          <div className="lg:w-1/3 flex flex-col gap-6">
            <Card className="shadow-md">
              <CardHeader>
                <CardTitle className="text-xl flex items-center gap-2">
                  <DownloadIcon className="h-5 w-5 text-primary" />
                  Export Note
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col sm:flex-row lg:flex-col gap-2">
                <Button onClick={() => handleExport('txt')} className="flex-1 w-full">
                  <FileTextIcon className="mr-2 h-4 w-4" /> Export as .txt
                </Button>
                <Button onClick={() => handleExport('md')} className="flex-1 w-full">
                  <FileCodeIcon className="mr-2 h-4 w-4" /> Export as .md
                </Button>
                <Button onClick={() => handleExport('pdf')} className="flex-1 w-full">
                  <FileDownIcon className="mr-2 h-4 w-4" /> Export as .pdf
                </Button>
              </CardContent>
            </Card>

            <Card className="shadow-md">
              <CardHeader>
                <CardTitle className="text-xl flex items-center gap-2">
                  <Wand2Icon className="h-5 w-5 text-primary" />
                  AI Assistant
                </CardTitle>
                <CardDescription>Get suggestions for grammar, clarity, and style.</CardDescription>
              </CardHeader>
              <CardContent>
                <Button onClick={handleGetSuggestions} disabled={isAISuggesting} className="w-full">
                  {isAISuggesting ? 'Getting Suggestions...' : 'Get Suggestions'}
                </Button>
                {aiSuggestions && (
                  <div className="mt-4 p-3 bg-muted/50 rounded-md border">
                    <h4 className="font-semibold mb-2">Suggestions:</h4>
                    <p className="text-sm whitespace-pre-wrap">{aiSuggestions}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      <footer className="border-t py-4">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          &copy; {new Date().getFullYear()} NoteCanvas. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
