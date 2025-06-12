
"use client";

import * as React from 'react';
import { Textarea } from '@/components/ui/textarea';
import { useI18n } from '@/locales/client';
import { useAutosave } from '@/hooks/useAutosave';

const LOCAL_STORAGE_ORGANIZE_NOTE_KEY = 'organizeModeNote_v1';

export function OrganizeModeView() {
  const t = useI18n();
  const [noteContent, setNoteContent] = useAutosave(LOCAL_STORAGE_ORGANIZE_NOTE_KEY, '');

  return (
    // Main container for organize mode, takes full height and provides padding.
    // overflow-y-auto allows the entire "page" content (title + textarea) to scroll if needed.
    <div className="flex flex-col h-full p-4 sm:p-6 md:p-8 lg:p-12 overflow-y-auto bg-background text-foreground">
      {/* Centered content area with a max-width, like a Notion page. */}
      {/* flex-grow and flex-col here to allow textarea to expand. */}
      <div className="w-full max-w-3xl mx-auto flex flex-col flex-grow">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-semibold mb-6 md:mb-8 text-foreground flex-shrink-0">
          {t('appModes.organizeTitle')}
        </h1>
        {/* Textarea should grow to fill remaining vertical space. */}
        <Textarea
          placeholder={t('organizeMode.placeholder')}
          value={noteContent}
          onChange={(e) => setNoteContent(e.target.value)}
          className="w-full flex-grow resize-none border-none focus-visible:ring-0 focus-visible:ring-offset-0 p-1 md:p-2 text-base leading-relaxed bg-transparent placeholder-muted-foreground/70"
          aria-label={t('organizeMode.placeholder')}
        />
      </div>
    </div>
  );
}
