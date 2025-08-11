
"use client";

import * as React from 'react';
import { useI18n } from '@/locales/client';

interface TreeModeViewProps {
  themeBackgroundColor: string;
  themeTextColor: string;
}

export function TreeModeView({ themeBackgroundColor, themeTextColor }: TreeModeViewProps) {
  const t = useI18n();

  return (
    <div 
      className="relative flex flex-col h-full overflow-hidden items-center justify-center" 
      style={{ backgroundColor: themeBackgroundColor, color: themeTextColor }}
    >
      <div className="text-center p-8">
        <h1 className="text-2xl font-bold mb-4">{t('appModes.tree')}</h1>
        <p className="text-lg text-muted-foreground" style={{ color: themeTextColor, opacity: 0.8 }}>
          {t('treeMode.underConstruction')}
        </p>
      </div>
    </div>
  );
}

    