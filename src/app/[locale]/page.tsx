
"use client";

import * as React from 'react';
import {
  BoldIcon, ItalicIcon, Heading1Icon, Heading2Icon, Heading3Icon,
  ListIcon, ListOrderedIcon
} from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { useAutosave } from '@/hooks/useAutosave';
import { ToolbarButton } from '@/components/editor/ToolbarButton';
import { useI18n } from '@/locales/client';

type FormatType = 'bold' | 'italic' | 'h1' | 'h2' | 'h3' | 'ul' | 'ol';

export default function NoteCanvasPage() {
  const t = useI18n();
  const [noteContent, setNoteContent] = useAutosave('noteCanvasContent', '');
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);
  const [cursorPos, setCursorPos] = React.useState<{start: number, end: number} | null>(null);

  const handleFormat = (type: FormatType) => {
    if (!textareaRef.current) return;
    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const currentText = textarea.value;
  
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
      newText = `${currentText.substring(0, start)}${prefix}${currentText.substring(start, end)}${suffix}${currentText.substring(end)}`;
      newCursorStart = start + prefix.length;
      newCursorEnd = end + prefix.length;
    } else if (type === 'bold' || type === 'italic') {
      newText = `${currentText.substring(0, start)}${prefix}${suffix}${currentText.substring(end)}`;
      newCursorStart = start + prefix.length;
      newCursorEnd = newCursorStart;
    } else {
      let lineStart = start;
      while (lineStart > 0 && currentText[lineStart - 1] !== '\\n') {
        lineStart--;
      }
      const insertNewLine = (lineStart !== start || currentText.substring(lineStart, start).trim() !== "") && currentText[lineStart] !== '\\n' && lineStart !==0 ;
      const prefixWithPossibleNewline = insertNewLine ? `\\n${prefix}` : prefix;

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

  const formattingTools = [
    { type: 'bold' as FormatType, icon: <BoldIcon className="h-4 w-4" />, label: t('editor.bold') },
    { type: 'italic' as FormatType, icon: <ItalicIcon className="h-4 w-4" />, label: t('editor.italic') },
    { type: 'h1' as FormatType, icon: <Heading1Icon className="h-4 w-4" />, label: t('editor.h1') },
    { type: 'h2' as FormatType, icon: <Heading2Icon className="h-4 w-4" />, label: t('editor.h2') },
    { type: 'h3' as FormatType, icon: <Heading3Icon className="h-4 w-4" />, label: t('editor.h3') },
    { type: 'ul' as FormatType, icon: <ListIcon className="h-4 w-4" />, label: t('editor.ul') },
    { type: 'ol' as FormatType, icon: <ListOrderedIcon className="h-4 w-4" />, label: t('editor.ol') },
  ];

  return (
    <div className="flex flex-col h-screen font-body">
      <main className="flex-grow flex flex-col">
        <Card className="shadow-lg flex-grow flex flex-col rounded-none border-0">
          <CardHeader className="bg-muted/30 p-3 border-b rounded-none">
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
          <CardContent className="p-0 flex-grow">
            <Textarea
              ref={textareaRef}
              value={noteContent}
              onChange={(e) => setNoteContent(e.target.value)}
              placeholder={t('editor.placeholder')}
              className="w-full h-full rounded-none border-0 focus-visible:ring-0 focus-visible:ring-offset-0 p-4 resize-none text-base"
              aria-label="Note content editor"
            />
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
