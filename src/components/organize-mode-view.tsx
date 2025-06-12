
"use client";

import * as React from 'react';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useI18n } from '@/locales/client';
import { useAutosave } from '@/hooks/useAutosave';

const LOCAL_STORAGE_ORGANIZE_NOTE_KEY = 'organizeModeNote_v1';

export function OrganizeModeView() {
  const t = useI18n();
  const [noteContent, setNoteContent] = useAutosave(LOCAL_STORAGE_ORGANIZE_NOTE_KEY, '');

  return (
    <div className="flex flex-col h-full p-4 md:p-8 space-y-4 overflow-hidden">
      <h1 className="text-2xl font-semibold">{t('appModes.organizeTitle')}</h1>
      <div className="flex flex-col md:flex-row flex-grow space-y-4 md:space-y-0 md:space-x-4 overflow-hidden">
        <Card className="flex-1 flex flex-col overflow-hidden">
          <CardHeader>
            <CardTitle>{t('organizeMode.editorTitle')}</CardTitle>
            <CardDescription>{t('organizeMode.editorDescription')}</CardDescription>
          </CardHeader>
          <CardContent className="flex-grow flex flex-col p-0">
            <ScrollArea className="flex-grow p-6 pt-0">
              <Textarea
                placeholder={t('organizeMode.placeholder')}
                value={noteContent}
                onChange={(e) => setNoteContent(e.target.value)}
                className="h-full min-h-[300px] resize-none text-base"
                aria-label={t('organizeMode.editorTitle')}
              />
            </ScrollArea>
            {/* AI Button removed from here */}
          </CardContent>
        </Card>
        {/* AI Suggestions Card removed from here */}
      </div>
    </div>
  );
}
