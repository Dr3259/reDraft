
"use client";

import * as React from 'react';
import { useState } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useI18n } from '@/locales/client';
import { useToast } from '@/hooks/use-toast';
import { useAutosave } from '@/hooks/useAutosave';
import { grammarSuggestion, type GrammarSuggestionInput, type GrammarSuggestionOutput } from '@/ai/flows/grammar-suggestion';
import { Lightbulb } from 'lucide-react';

const LOCAL_STORAGE_ORGANIZE_NOTE_KEY = 'organizeModeNote_v1';

export function OrganizeModeView() {
  const t = useI18n();
  const { toast, dismiss: dismissToast } = useToast();
  const [noteContent, setNoteContent] = useAutosave(LOCAL_STORAGE_ORGANIZE_NOTE_KEY, '');
  const [suggestions, setSuggestions] = useState<string | null>(null);
  const [isGettingSuggestions, setIsGettingSuggestions] = useState(false);

  const handleGetSuggestions = async () => {
    if (!noteContent.trim()) {
      const { id } = toast({
        title: t('aiAssistant.emptyNoteTitle'),
        description: t('aiAssistant.emptyNoteDescription'),
        variant: 'default',
      });
      setTimeout(() => dismissToast(id), 3000);
      return;
    }

    setIsGettingSuggestions(true);
    setSuggestions(null);
    const toastId = toast({ title: t('aiAssistant.gettingSuggestions') }).id;

    try {
      const input: GrammarSuggestionInput = { text: noteContent };
      const result: GrammarSuggestionOutput = await grammarSuggestion(input);
      setSuggestions(result.suggestions);
      dismissToast(toastId);
      const { id: successId } = toast({
        title: t('aiAssistant.suggestionsReadyTitle'),
        description: t('aiAssistant.suggestionsReadyDescription'),
      });
      setTimeout(() => dismissToast(successId), 3000);
    } catch (error) {
      console.error("Error getting AI suggestions:", error);
      dismissToast(toastId);
      const { id: errorId } = toast({
        title: t('aiAssistant.aiErrorTitle'),
        description: t('aiAssistant.failedToGetSuggestions'),
        variant: 'destructive',
      });
      setTimeout(() => dismissToast(errorId), 3000);
      setSuggestions(t('aiAssistant.failedToGetSuggestions'));
    } finally {
      setIsGettingSuggestions(false);
    }
  };

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
            <div className="p-6 border-t">
              <Button onClick={handleGetSuggestions} disabled={isGettingSuggestions}>
                <Lightbulb className="mr-2 h-4 w-4" />
                {isGettingSuggestions ? t('aiAssistant.gettingSuggestions') : t('aiAssistant.getSuggestions')}
              </Button>
            </div>
          </CardContent>
        </Card>

        {(suggestions || isGettingSuggestions) && (
          <Card className="flex-1 flex flex-col overflow-hidden md:max-w-md lg:max-w-lg">
            <CardHeader>
              <CardTitle>{t('aiAssistant.suggestionsHeader')}</CardTitle>
              <CardDescription>{t('organizeMode.suggestionsDescription')}</CardDescription>
            </CardHeader>
            <CardContent className="flex-grow p-0">
              <ScrollArea className="h-full p-6 pt-0">
                {isGettingSuggestions && !suggestions && (
                  <p className="text-muted-foreground">{t('aiAssistant.gettingSuggestions')}...</p>
                )}
                {suggestions && (
                  <div className="prose dark:prose-invert max-w-none">
                    <pre className="whitespace-pre-wrap text-sm">{suggestions}</pre>
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
