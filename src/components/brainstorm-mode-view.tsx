
"use client";

import * as React from 'react';
import { useI18n } from '@/locales/client';

interface BrainstormModeViewProps {
  themeBackgroundColor: string;
  themeTextColor: string;
}

export function BrainstormModeView({ themeBackgroundColor, themeTextColor }: BrainstormModeViewProps) {
  const t = useI18n();

  return (
    <div 
      className="flex flex-col h-full w-full items-center justify-center"
      style={{ backgroundColor: themeBackgroundColor, color: themeTextColor }}
    >
      <div className="text-center">
        <h2 className="text-2xl font-semibold mb-4">{t('appModes.brainstorm')}</h2>
        <p className="text-muted-foreground">{t('treeMode.underConstruction')}</p>
      </div>
    </div>
  );
}
