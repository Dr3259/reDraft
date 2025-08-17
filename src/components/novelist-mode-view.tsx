
"use client";

import * as React from 'react';
import { useI18n } from '@/locales/client';
import { Book, Users, Map, NotebookText, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { useAutosave } from '@/hooks/useAutosave';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { useToast } from "@/hooks/use-toast";


// Data Structures
interface NovelItem {
  id: string;
  title: string;
  content: string; // HTML content from TipTap
  createdAt: string;
}

type NovelSection = 'manuscript' | 'characters' | 'settings' | 'notes';

type NovelData = {
  [key in NovelSection]: NovelItem[];
};

const initialNovelData: NovelData = {
  manuscript: [],
  characters: [],
  settings: [],
  notes: [],
};

const LOCAL_STORAGE_NOVEL_KEY = 'novelistModeData_v1';


interface NovelistModeViewProps {
  themeBackgroundColor: string;
  themeTextColor: string;
}

export function NovelistModeView({ themeBackgroundColor, themeTextColor }: NovelistModeViewProps) {
  const t = useI18n();
  const { toast } = useToast();

  const [novelData, setNovelData] = useAutosave<NovelData>(LOCAL_STORAGE_NOVEL_KEY, initialNovelData, 1500);
  const [activeSection, setActiveSection] = React.useState<NovelSection>('manuscript');
  const [selectedItemId, setSelectedItemId] = React.useState<string | null>(null);

  const activeItem = React.useMemo(() => {
    if (!selectedItemId) return null;
    return novelData[activeSection].find(item => item.id === selectedItemId) || null;
  }, [selectedItemId, activeSection, novelData]);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({ placeholder: t('novelistMode.editorPlaceholder') }),
    ],
    content: activeItem?.content || '',
    editable: !!activeItem,
    editorProps: {
      attributes: {
        class: cn(
          'prose prose-sm sm:prose lg:prose-lg xl:prose-xl max-w-none w-full h-full focus:outline-none p-4 overflow-y-auto',
           parseInt(themeTextColor.match(/hsl\(\s*\d+\s+\d+%\s+(\d+)%\s*\)/)?.[1] || '0', 10) > 50 ? 'prose-invert' : ''
        ),
        style: `color: ${themeTextColor}; caret-color: ${themeTextColor};`
      },
    },
    onUpdate: ({ editor }) => {
      if (activeItem) {
        const updatedContent = editor.getHTML();
        setNovelData(prevData => ({
          ...prevData,
          [activeSection]: prevData[activeSection].map(item =>
            item.id === activeItem.id ? { ...item, content: updatedContent } : item
          ),
        }));
      }
    },
  });

  React.useEffect(() => {
    if (editor) {
      if (activeItem) {
        if (!editor.isFocused) {
          editor.commands.setContent(activeItem.content, false);
        }
        if (!editor.isEditable) {
           editor.setEditable(true);
        }
      } else {
        editor.commands.clearContent();
        editor.setEditable(false);
      }
    }
  }, [activeItem, editor]);
  
  React.useEffect(() => {
    // When section changes, select the first item if available
    const currentSectionItems = novelData[activeSection];
    if (currentSectionItems.length > 0) {
      setSelectedItemId(currentSectionItems[0].id);
    } else {
      setSelectedItemId(null);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSection]);


  const handleAddItem = () => {
    const newItem: NovelItem = {
      id: `item-${Date.now()}`,
      title: t('novelistMode.untitled'),
      content: '',
      createdAt: new Date().toISOString(),
    };
    setNovelData(prevData => ({
      ...prevData,
      [activeSection]: [...prevData[activeSection], newItem],
    }));
    setSelectedItemId(newItem.id);
  };

  const handleDeleteItem = (itemId: string, itemTitle: string) => {
    setNovelData(prevData => ({
      ...prevData,
      [activeSection]: prevData[activeSection].filter(item => item.id !== itemId),
    }));
    if (selectedItemId === itemId) {
      const remainingItems = novelData[activeSection].filter(item => item.id !== itemId);
      setSelectedItemId(remainingItems.length > 0 ? remainingItems[0].id : null);
    }
    toast({
      description: t('novelistMode.itemDeleted', { itemName: itemTitle }),
      duration: 3000,
    });
  };

  const handleUpdateTitle = (itemId: string, newTitle: string) => {
    setNovelData(prevData => ({
      ...prevData,
      [activeSection]: prevData[activeSection].map(item =>
        item.id === itemId ? { ...item, title: newTitle } : item
      ),
    }));
  };

  const sectionConfig: Record<NovelSection, { icon: React.ElementType, titleKey: keyof ReturnType<typeof useI18n>['novelistMode'], newButtonKey: keyof ReturnType<typeof useI18n>['novelistMode'], titlePlaceholder: keyof ReturnType<typeof useI18n>['novelistMode'] }> = {
    manuscript: { icon: Book, titleKey: 'manuscript', newButtonKey: 'newChapter', titlePlaceholder: 'chapterTitlePlaceholder' },
    characters: { icon: Users, titleKey: 'characters', newButtonKey: 'newCharacter', titlePlaceholder: 'characterNamePlaceholder' },
    settings: { icon: Map, titleKey: 'settings', newButtonKey: 'newSetting', titlePlaceholder: 'settingNamePlaceholder' },
    notes: { icon: NotebookText, titleKey: 'notes', newButtonKey: 'newNote', titlePlaceholder: 'noteTitlePlaceholder' },
  };

  return (
    <div className="flex h-full w-full" style={{ backgroundColor: themeBackgroundColor, color: themeTextColor }}>
      {/* Left Nav */}
      <div className="w-16 flex flex-col items-center space-y-4 py-4 border-r border-border" style={{ borderColor: 'hsl(var(--border))' }}>
        {(Object.keys(sectionConfig) as NovelSection[]).map(section => {
          const { icon: Icon, titleKey } = sectionConfig[section];
          return (
            <Button
              key={section}
              variant={activeSection === section ? 'secondary' : 'ghost'}
              size="icon"
              onClick={() => setActiveSection(section)}
              aria-label={t(`novelistMode.${titleKey}`)}
              className="h-12 w-12 flex-col text-xs"
            >
              <Icon className="h-5 w-5 mb-1" />
              <span>{t(`novelistMode.${titleKey}`)}</span>
            </Button>
          );
        })}
      </div>

      {/* Middle Panel - Item List */}
      <div className="w-64 flex flex-col border-r border-border" style={{ borderColor: 'hsl(var(--border))' }}>
        <div className="p-2 border-b border-border flex-shrink-0" style={{ borderColor: 'hsl(var(--border))' }}>
          <Button onClick={handleAddItem} className="w-full">
            <Plus className="mr-2 h-4 w-4" />
            {t(`novelistMode.${sectionConfig[activeSection].newButtonKey}`)}
          </Button>
        </div>
        <ScrollArea className="flex-grow">
          {novelData[activeSection].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()).map(item => (
            <div
              key={item.id}
              onClick={() => setSelectedItemId(item.id)}
              className={cn(
                "p-3 cursor-pointer border-b border-border text-sm",
                selectedItemId === item.id ? 'bg-accent/50' : 'hover:bg-accent/30'
              )}
               style={{ borderColor: 'hsl(var(--border))' }}
            >
              <p className="font-medium truncate" style={{ color: themeTextColor }}>{item.title}</p>
              <p className="text-xs text-muted-foreground" style={{ color: themeTextColor, opacity: 0.7 }}>
                {new Date(item.createdAt).toLocaleDateString()}
              </p>
            </div>
          ))}
        </ScrollArea>
      </div>

      {/* Right Panel - Editor */}
      <div className="flex-1 flex flex-col">
        {activeItem ? (
          <>
            <div className="p-2 border-b border-border flex items-center gap-2" style={{ borderColor: 'hsl(var(--border))' }}>
              <Input
                value={activeItem.title}
                onChange={(e) => handleUpdateTitle(activeItem.id, e.target.value)}
                placeholder={t(`novelistMode.${sectionConfig[activeSection].titlePlaceholder}`)}
                className="text-lg font-semibold border-none focus-visible:ring-0 focus-visible:ring-offset-0 flex-grow bg-transparent"
                style={{ color: themeTextColor }}
              />
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>{t('novelistMode.confirmDeleteTitle')}</AlertDialogTitle>
                    <AlertDialogDescription>
                      {t('novelistMode.confirmDeleteDescription', {itemName: activeItem.title})}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>{t('novelistMode.cancelButton')}</AlertDialogCancel>
                    <AlertDialogAction onClick={() => handleDeleteItem(activeItem.id, activeItem.title)}>
                      {t('novelistMode.deleteButton')}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
            <div className="flex-grow relative h-full">
               <EditorContent editor={editor} className="h-full" />
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            {t(`novelistMode.${sectionConfig[activeSection].newButtonKey}`)}
          </div>
        )}
      </div>
    </div>
  );
}
