
"use client";

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useI18n, useCurrentLocale } from '@/locales/client';
import { PlusCircle, Maximize, Minimize, Eraser, Save, FolderOpen, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    Sheet,
    SheetTrigger,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetClose,
    SheetFooter,
} from "@/components/ui/sheet"
import { ScrollArea } from './ui/scroll-area';
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

// --- Types ---
interface Topic {
    id: string;
    content: string;
    x: number;
    y: number;
    width: number;
    height: number;
    parentId?: string | null;
    fontFamily: string;
}

interface SavedBoard {
    id: string;
    name: string;
    topics: Topic[];
    createdAt: string;
    thumbnail: string; // SVG data URL
}

type Vector = { x: number; y: number };

const FONT_CLASSES: Record<string, string> = {
    'font-sans-sc': '思源黑体 (默认)',
    'font-xiaowei': '站酷小薇体',
    'font-longcang': '龙藏体',
    'font-mashan': '马善政毛笔',
    'font-inter': 'Inter (English)',
};

const LOCAL_STORAGE_KEY = 'brainstorm_boards_v1';

// --- Helper Functions ---
const getTopicElementId = (topicId: string) => `topic-${topicId}`;

// --- Hooks ---
const useFullscreen = () => {
    const [isFullscreen, setIsFullscreen] = React.useState(false);

    const toggleFullscreen = React.useCallback(() => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(err => {
                alert(`Error attempting to enable full-screen mode: ${err.message} (${err.name})`);
            });
        } else {
            document.exitFullscreen();
        }
    }, []);

    React.useEffect(() => {
        const onFullscreenChange = () => setIsFullscreen(!!document.fullscreenElement);
        document.addEventListener('fullscreenchange', onFullscreenChange);
        return () => document.removeEventListener('fullscreenchange', onFullscreenChange);
    }, []);

    return { isFullscreen, toggleFullscreen };
};


// --- Sub-components ---
const TopicNode = React.memo(({
    topic,
    onDrag,
    onUpdate,
    onAddChild,
    onDelete,
    onStartEditing,
    onEndEditing,
    isEditing,
    isSelected,
    placeholderText,
}: {
    topic: Topic;
    onDrag: (id: string, pos: Vector) => void;
    onUpdate: (id:string, content: string, dimensions: {width: number, height: number}) => void;
    onAddChild: (id: string) => void;
    onDelete: (id: string) => void;
    onStartEditing: (id: string) => void;
    onEndEditing: () => void;
    isEditing: boolean;
    isSelected: boolean;
    placeholderText: string;
}) => {
    const textareaRef = React.useRef<HTMLTextAreaElement>(null);
    const nodeRef = React.useRef<HTMLDivElement>(null);

    React.useEffect(() => {
        if (isEditing && textareaRef.current) {
            textareaRef.current.focus();
            textareaRef.current.select();
        }
    }, [isEditing]);
    
    const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const textarea = e.target;
        // Reset height to auto to get the correct scrollHeight
        textarea.style.height = 'auto';
        const newHeight = textarea.scrollHeight;
        textarea.style.height = `${newHeight}px`;

        // Measure width
        const span = document.createElement('span');
        span.style.font = window.getComputedStyle(textarea).font;
        span.style.whiteSpace = 'pre';
        span.textContent = textarea.value.split('\n').sort((a,b) => b.length - a.length)[0];
        document.body.appendChild(span);
        const newWidth = span.offsetWidth + 40; // Add some padding
        document.body.removeChild(span);

        onUpdate(topic.id, e.target.value, { width: Math.max(150, newWidth), height: newHeight + 20 });
    };


    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            onEndEditing();
        }
        if (e.key === 'Escape') {
            onEndEditing();
        }
    };
    
    return (
         <motion.div
            ref={nodeRef}
            id={getTopicElementId(topic.id)}
            className={cn(
                "absolute bg-background text-foreground rounded-lg shadow-lg cursor-grab flex items-center group",
                "border-2",
                isSelected ? 'border-primary ring-2 ring-primary/50' : 'border-border',
                topic.fontFamily,
            )}
            style={{ 
              left: topic.x, 
              top: topic.y, 
              width: topic.width, 
              minHeight: topic.height,
            }}
            drag
            onDrag={(e, info) => onDrag(topic.id, { x: info.point.x, y: info.point.y })}
            dragMomentum={false}
            onDoubleClick={() => onStartEditing(topic.id)}
            onContextMenu={(e) => {
              e.preventDefault();
              onDelete(topic.id);
            }}
            layout
            transition={{ type: "spring", stiffness: 500, damping: 30 }}
        >
            {isEditing ? (
                 <textarea
                    ref={textareaRef}
                    value={topic.content}
                    onChange={handleTextChange}
                    onBlur={onEndEditing}
                    onKeyDown={handleKeyDown}
                    className="w-full h-full p-2 bg-transparent resize-none text-center focus:outline-none"
                    style={{ minHeight: topic.height - 16 }}
                />
            ) : (
                <div className="w-full h-full p-3 text-center flex items-center justify-center whitespace-pre-wrap break-words">
                   {topic.content || placeholderText}
                </div>
            )}
            <button
                className="absolute -right-3 -top-3 w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => {
                    e.stopPropagation();
                    onAddChild(topic.id);
                }}
            >
                <PlusCircle size={20} />
            </button>
        </motion.div>
    );
});
TopicNode.displayName = 'TopicNode';


// --- Main View ---
export function BrainstormModeView({ themeBackgroundColor, themeTextColor }: { themeBackgroundColor: string; themeTextColor: string;}) {
    const t = useI18n();
    const locale = useCurrentLocale();
    const { toast } = useToast();
    const { isFullscreen, toggleFullscreen } = useFullscreen();

    const [topics, setTopics] = React.useState<Topic[]>([]);
    const [editingTopicId, setEditingTopicId] = React.useState<string | null>(null);
    const [selectedTopicId, setSelectedTopicId] = React.useState<string | null>(null);
    const [globalFont, setGlobalFont] = React.useState('font-sans-sc');
    const [savedBoards, setSavedBoards] = React.useState<SavedBoard[]>([]);

    const canvasRef = React.useRef<HTMLDivElement>(null);
    const placeholderText = t('brainstorm.placeholder');

    // Load saved boards on mount
    React.useEffect(() => {
        const rawData = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (rawData) {
            setSavedBoards(JSON.parse(rawData));
        }
    }, []);

    const updateTopicPosition = (id: string, pos: Vector) => {
        const canvasRect = canvasRef.current?.getBoundingClientRect();
        if (!canvasRect) return;
        setTopics(prev => prev.map(t => t.id === id ? { ...t, x: pos.x - canvasRect.left, y: pos.y - canvasRect.top } : t));
    };

    const updateTopicContent = (id: string, content: string, dimensions: {width: number, height: number}) => {
        setTopics(prev => prev.map(t => t.id === id ? { ...t, content, width: dimensions.width, height: dimensions.height } : t));
    };

    const addTopic = (pos: Vector, parentId?: string) => {
        const newTopic: Topic = {
            id: `topic_${Date.now()}`,
            content: t('brainstorm.newTopic'),
            x: pos.x,
            y: pos.y,
            width: 150,
            height: 50,
            parentId: parentId || null,
            fontFamily: globalFont,
        };
        setTopics(prev => [...prev, newTopic]);
        setEditingTopicId(newTopic.id);
        setSelectedTopicId(newTopic.id);
    };

    const addChildTopic = (parentId: string) => {
        const parent = topics.find(t => t.id === parentId);
        if (!parent) return;
        const pos = { x: parent.x + parent.width + 100, y: parent.y };
        addTopic(pos, parentId);
    };

    const handleCanvasRightClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (e.target !== canvasRef.current) return;
        e.preventDefault();
        const rect = canvasRef.current.getBoundingClientRect();
        addTopic({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    };
    
    const deleteBranch = (startNodeId: string) => {
        let nodeIdsToDelete = new Set<string>([startNodeId]);
        let queue = [startNodeId];

        while(queue.length > 0){
            const currentId = queue.shift()!;
            const children = topics.filter(t => t.parentId === currentId);
            for(const child of children){
                if(!nodeIdsToDelete.has(child.id)){
                    nodeIdsToDelete.add(child.id);
                    queue.push(child.id);
                }
            }
        }
        
        setTopics(prev => prev.filter(t => !nodeIdsToDelete.has(t.id)));
        toast({ description: t('brainstorm.branchDeleted') });
    };

    const handleClearCanvas = () => {
        setTopics([]);
        toast({ description: t('brainstorm.canvasCleared') });
    };

    const handleSaveBoard = () => {
        if(topics.length === 0){
            toast({ variant: 'destructive', description: t('brainstorm.emptyBoardSaveError') });
            return;
        }

        const boardName = topics.find(t => !t.parentId)?.content.slice(0, 20) || t('brainstorm.untitled');
        const finalName = `${boardName} - ${new Date().toLocaleString(locale)}`;

        // Create SVG Thumbnail
        const PADDING = 50;
        const minX = Math.min(...topics.map(t => t.x));
        const minY = Math.min(...topics.map(t => t.y));
        const maxX = Math.max(...topics.map(t => t.x + t.width));
        const maxY = Math.max(...topics.map(t => t.y + t.height));

        const viewBoxWidth = maxX - minX + PADDING * 2;
        const viewBoxHeight = maxY - minY + PADDING * 2;

        const svgContent = `
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${viewBoxWidth} ${viewBoxHeight}" width="100%" height="100%">
                <style>
                    .topic-rect { fill: #fff; stroke: #ddd; stroke-width: 1; }
                    .topic-line { stroke: #ccc; stroke-width: 1.5; }
                </style>
                <g>
                    ${topics.map(topic => {
                        const parent = topics.find(t => t.id === topic.parentId);
                        if (!parent) return '';
                        return `<line class="topic-line" x1="${parent.x - minX + PADDING + parent.width / 2}" y1="${parent.y - minY + PADDING + parent.height / 2}" x2="${topic.x - minX + PADDING + topic.width / 2}" y2="${topic.y - minY + PADDING + topic.height / 2}" />`;
                    }).join('')}
                    ${topics.map(topic => 
                        `<rect class="topic-rect" x="${topic.x - minX + PADDING}" y="${topic.y - minY + PADDING}" width="${topic.width}" height="${topic.height}" rx="8" />`
                    ).join('')}
                </g>
            </svg>
        `;
        const thumbnail = `data:image/svg+xml;base64,${btoa(svgContent)}`;

        const newBoard: SavedBoard = {
            id: `board_${Date.now()}`,
            name: finalName,
            topics: topics,
            createdAt: new Date().toISOString(),
            thumbnail,
        };

        const updatedBoards = [...savedBoards, newBoard];
        setSavedBoards(updatedBoards);
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updatedBoards));

        toast({ description: t('brainstorm.boardSaved', { name: finalName }) });
    };

    const handleLoadBoard = (boardId: string) => {
        const boardToLoad = savedBoards.find(b => b.id === boardId);
        if (boardToLoad) {
            setTopics(boardToLoad.topics);
            // Also set the global font from the first topic if it exists
            if (boardToLoad.topics[0]?.fontFamily) {
                setGlobalFont(boardToLoad.topics[0].fontFamily);
            }
            toast({ description: t('brainstorm.boardLoaded', { name: boardToLoad.name }) });
        }
    };
    
    const handleDeleteBoard = (boardId: string) => {
        const boardToDelete = savedBoards.find(b => b.id === boardId);
        const updatedBoards = savedBoards.filter(b => b.id !== boardId);
        setSavedBoards(updatedBoards);
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updatedBoards));
        if(boardToDelete) {
           toast({ description: t('brainstorm.boardDeleted', { name: boardToDelete.name }) });
        }
    };

    const handleSetGlobalFont = (font: string) => {
        setGlobalFont(font);
        setTopics(prev => prev.map(t => ({ ...t, fontFamily: font })));
    };

    return (
        <div className="w-full h-full flex flex-col relative overflow-hidden" style={{ backgroundColor: themeBackgroundColor, color: themeTextColor }}>
             {/* Toolbar */}
             <div className="absolute top-4 left-4 z-20 flex items-center gap-2 flex-wrap">
                <Select value={globalFont} onValueChange={handleSetGlobalFont}>
                    <SelectTrigger className="w-[180px] bg-background">
                        <SelectValue placeholder={t('brainstorm.selectFont')} />
                    </SelectTrigger>
                    <SelectContent>
                       {Object.entries(FONT_CLASSES).map(([value, label]) => (
                            <SelectItem key={value} value={value} className={value}>{label}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button variant="outline" size="icon" aria-label={t('brainstorm.clearCanvas')}>
                            <Eraser />
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                           <AlertDialogTitle>{t('brainstorm.confirmClearTitle')}</AlertDialogTitle>
                           <AlertDialogDescription>{t('brainstorm.confirmClearDescription')}</AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                           <AlertDialogCancel>{t('novelistMode.cancelButton')}</AlertDialogCancel>
                           <AlertDialogAction onClick={handleClearCanvas}>{t('brainstorm.clearButton')}</AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
               
                <Button variant="outline" size="icon" onClick={toggleFullscreen} aria-label={isFullscreen ? t('whiteboard.exitFullscreenTooltip') : t('whiteboard.enterFullscreenTooltip')}>
                    {isFullscreen ? <Minimize /> : <Maximize />}
                </Button>
                <Button variant="outline" size="icon" onClick={handleSaveBoard} aria-label={t('brainstorm.saveBoard')}>
                    <Save />
                </Button>
                
                <Sheet>
                    <SheetTrigger asChild>
                        <Button variant="outline" size="icon" aria-label={t('brainstorm.openSaved')}>
                            <FolderOpen />
                        </Button>
                    </SheetTrigger>
                    <SheetContent className="w-[400px] sm:w-[540px] flex flex-col">
                        <SheetHeader>
                            <SheetTitle>{t('brainstorm.savedBoardsTitle')}</SheetTitle>
                            <SheetDescription>
                                {savedBoards.length > 0 ? t('brainstorm.savedBoardsDescription') : t('brainstorm.noSavedBoards')}
                            </SheetDescription>
                        </SheetHeader>
                        <ScrollArea className="flex-grow my-4">
                           <div className="space-y-4 pr-6">
                           {savedBoards.sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map(board => (
                               <div key={board.id} className="border rounded-lg p-3 flex flex-col gap-3">
                                   <div className='flex items-start gap-4'>
                                        <div className="w-24 h-16 bg-white border rounded flex-shrink-0">
                                            <img src={board.thumbnail} alt={board.name} className="w-full h-full object-contain" />
                                        </div>
                                        <div className='flex-grow'>
                                            <p className="font-semibold">{board.name}</p>
                                            <p className="text-xs text-muted-foreground">{new Date(board.createdAt).toLocaleString(locale)}</p>
                                        </div>
                                   </div>
                                   <div className='flex items-center justify-end gap-2'>
                                        <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                                <Button variant="destructive" size="icon" className="h-8 w-8">
                                                    <Trash2 size={16}/>
                                                </Button>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent>
                                                <AlertDialogHeader>
                                                    <AlertDialogTitle>{t('brainstorm.confirmDeleteBoardTitle')}</AlertDialogTitle>
                                                    <AlertDialogDescription>
                                                       {t('brainstorm.confirmDeleteBoardDescription', {name: board.name})}
                                                    </AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                    <AlertDialogCancel>{t('novelistMode.cancelButton')}</AlertDialogCancel>
                                                    <AlertDialogAction onClick={() => handleDeleteBoard(board.id)}>
                                                        {t('novelistMode.deleteButton')}
                                                    </AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                        <SheetClose asChild>
                                            <Button onClick={() => handleLoadBoard(board.id)}>{t('brainstorm.loadButton')}</Button>
                                        </SheetClose>
                                   </div>
                               </div>
                           ))}
                           </div>
                        </ScrollArea>
                        <SheetFooter>
                            <SheetClose asChild>
                                <Button variant="outline">{t('whiteboard.closeDialogButton')}</Button>
                            </SheetClose>
                        </SheetFooter>
                    </SheetContent>
                </Sheet>

            </div>


            {/* Canvas */}
            <div
                ref={canvasRef}
                className="w-full h-full flex-grow relative cursor-default"
                onContextMenu={handleCanvasRightClick}
                onClick={(e) => {
                    if (e.target === canvasRef.current) {
                        setSelectedTopicId(null);
                        setEditingTopicId(null);
                    }
                }}
            >
                {/* Connection Lines */}
                 <svg className="absolute top-0 left-0 w-full h-full pointer-events-none">
                    <g>
                        {topics.map(topic => {
                            const parent = topics.find(t => t.id === topic.parentId);
                            if (!parent) return null;
                            
                            const start = { x: parent.x + parent.width / 2, y: parent.y + parent.height / 2 };
                            const end = { x: topic.x + topic.width / 2, y: topic.y + topic.height / 2 };
                            
                            return (
                                <motion.path
                                    key={`line-${parent.id}-${topic.id}`}
                                    d={`M ${start.x} ${start.y} L ${end.x} ${end.y}`}
                                    stroke={themeTextColor}
                                    strokeWidth="1.5"
                                    opacity="0.5"
                                    initial={{ pathLength: 0 }}
                                    animate={{ pathLength: 1 }}
                                    transition={{ duration: 0.5 }}
                                />
                            );
                        })}
                    </g>
                </svg>

                {/* Topics */}
                <AnimatePresence>
                {topics.map(topic => (
                    <TopicNode
                        key={topic.id}
                        topic={topic}
                        placeholderText={placeholderText}
                        onDrag={updateTopicPosition}
                        onUpdate={updateTopicContent}
                        onAddChild={addChildTopic}
                        onDelete={deleteBranch}
                        onStartEditing={setEditingTopicId}
                        onEndEditing={() => setEditingTopicId(null)}
                        isEditing={editingTopicId === topic.id}
                        isSelected={selectedTopicId === topic.id}
                    />
                ))}
                </AnimatePresence>
            </div>
        </div>
    );
}
