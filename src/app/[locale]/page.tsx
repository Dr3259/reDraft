
"use client";

import * as React from 'react';
import { useRef, useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useI18n, useCurrentLocale } from '@/locales/client';
import { LanguageSwitcher } from '@/components/language-switcher';
import { Eraser, Trash2, Undo2, Save, Download, FolderClock } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { ScrollArea } from '@/components/ui/scroll-area';

const ERASER_WIDTH = 20;
const PEN_WIDTH = 2;
const PEN_COLOR = 'black';
const ERASER_COLOR = 'white'; // Must match canvas background
const MAX_HISTORY_STEPS = 30;
const LOCAL_STORAGE_DRAFTS_KEY = 'whiteboardDrafts_v2'; // Updated key for list of drafts

interface SavedDraft {
  id: string;
  name: string;
  dataUrl: string;
  createdAt: string; // ISO string
}

export default function WhiteboardPage() {
  const t = useI18n();
  const locale = useCurrentLocale();
  const { toast } = useToast();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [lastPosition, setLastPosition] = useState<{ x: number; y: number } | null>(null);

  const [showTextInput, setShowTextInput] = useState(false);
  const [textInputValue, setTextInputValue] = useState('');
  const [textInputPosition, setTextInputPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const textInputRef = useRef<HTMLInputElement>(null);

  const [history, setHistory] = useState<ImageData[]>([]);
  const [currentTool, setCurrentTool] = useState<'pen' | 'eraser'>('pen');

  const [drafts, setDrafts] = useState<SavedDraft[]>([]);
  const [isDraftsDialogOpen, setIsDraftsDialogOpen] = useState(false);

  // Effect for initial canvas setup and initial history
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext('2d');
    if (!context) return;

    const parent = canvas.parentElement;
    if (!parent) return;

    canvas.width = parent.clientWidth;
    canvas.height = parent.clientHeight;

    context.strokeStyle = PEN_COLOR;
    context.lineWidth = PEN_WIDTH;
    context.lineCap = 'round';
    context.lineJoin = 'round';
    context.globalCompositeOperation = 'source-over';

    // Setup blank canvas and save its state
    context.fillStyle = ERASER_COLOR; // Background color
    context.fillRect(0, 0, canvas.width, canvas.height);
    if (canvas.width > 0 && canvas.height > 0) {
        const initialImageData = context.getImageData(0, 0, canvas.width, canvas.height);
        setHistory([initialImageData]); // Save initial blank state
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


  // Effect for loading drafts list from localStorage
  useEffect(() => {
    const loadDraftsFromStorage = () => {
      const savedDraftsJson = localStorage.getItem(LOCAL_STORAGE_DRAFTS_KEY);
      if (savedDraftsJson) {
        try {
          const parsedDrafts: SavedDraft[] = JSON.parse(savedDraftsJson);
          // Sort by creation date, newest first
          setDrafts(parsedDrafts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
        } catch (e) {
          console.error("Error parsing drafts from localStorage:", e);
          localStorage.removeItem(LOCAL_STORAGE_DRAFTS_KEY); // Clear corrupted data
        }
      }
    };
    loadDraftsFromStorage();
  }, []);


  // Effect to synchronize drawing context with the current tool (styles only)
  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext('2d');
    if (!context || !canvas) return;

    if (currentTool === 'pen') {
      context.strokeStyle = PEN_COLOR;
      context.lineWidth = PEN_WIDTH;
    } else { // Eraser
      context.strokeStyle = ERASER_COLOR;
      context.lineWidth = ERASER_WIDTH;
    }
    context.lineCap = 'round';
    context.lineJoin = 'round';
    context.globalCompositeOperation = 'source-over';
  }, [currentTool]);


  // Effect for handling canvas resize
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resizeCanvas = () => {
      const currentCanvas = canvasRef.current;
      if (!currentCanvas) return;
      const context = currentCanvas.getContext('2d');
      if (!context) return;

      const parentEl = currentCanvas.parentElement;
      if (parentEl) {
        const imageData = context.getImageData(0, 0, currentCanvas.width, currentCanvas.height);
        
        currentCanvas.width = parentEl.clientWidth;
        currentCanvas.height = parentEl.clientHeight;
        
        context.putImageData(imageData, 0, 0);

        if (currentTool === 'pen') {
            context.strokeStyle = PEN_COLOR;
            context.lineWidth = PEN_WIDTH;
        } else {
            context.strokeStyle = ERASER_COLOR;
            context.lineWidth = ERASER_WIDTH;
        }
        context.lineCap = 'round';
        context.lineJoin = 'round';
        context.globalCompositeOperation = 'source-over';
      }
    };
    
    window.addEventListener('resize', resizeCanvas);
    return () => window.removeEventListener('resize', resizeCanvas);
  }, [currentTool]);


  const saveCanvasState = () => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext('2d');
    if (!canvas || !context || canvas.width === 0 || canvas.height === 0) return;
    try {
      const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
      setHistory(prev => {
        const newHistory = [...prev, imageData];
        if (newHistory.length > MAX_HISTORY_STEPS) {
          return newHistory.slice(newHistory.length - MAX_HISTORY_STEPS);
        }
        return newHistory;
      });
    } catch (e) {
      console.error("Failed to save canvas state:", e);
    }
  };

  const getMousePosition = (event: React.MouseEvent<HTMLCanvasElement>): { x: number; y: number } => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top
    };
  };

  const startDrawing = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (event.button !== 0) return; 
    const { x, y } = getMousePosition(event);
    setIsDrawing(true);
    setLastPosition({ x, y });

    const context = canvasRef.current?.getContext('2d');
    if (context) {
      if (currentTool === 'pen') {
        context.strokeStyle = PEN_COLOR;
        context.lineWidth = PEN_WIDTH;
      } else { 
        context.strokeStyle = ERASER_COLOR;
        context.lineWidth = ERASER_WIDTH;
      }
      context.lineCap = 'round';
      context.lineJoin = 'round';
      context.globalCompositeOperation = 'source-over';
      
      context.beginPath();
      context.moveTo(x, y);
    }
  };

  const draw = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !lastPosition) return;
    const canvas = canvasRef.current;
    const context = canvas?.getContext('2d');
    if (!context) return;

    const { x, y } = getMousePosition(event);
    context.lineTo(x, y);
    context.stroke();
    setLastPosition({ x, y });
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    const context = canvasRef.current?.getContext('2d');
    if(context) {
        context.closePath();
    }
    setIsDrawing(false);
    setLastPosition(null);
    saveCanvasState();
  };

  const handleContextMenu = (event: React.MouseEvent<HTMLCanvasElement>) => {
    event.preventDefault();
    if (isDrawing) stopDrawing(); 

    const { x, y } = getMousePosition(event);
    setTextInputPosition({ x, y });
    setShowTextInput(true);
    setTextInputValue(''); 
  };

  useEffect(() => {
    if (showTextInput && textInputRef.current) {
      textInputRef.current.focus();
    }
  }, [showTextInput]);

  const handleTextInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setTextInputValue(event.target.value);
  };

  const drawTextOnCanvas = (text: string, x: number, y: number) => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext('2d');
    if (!context) return;

    const previousStrokeStyle = context.strokeStyle;
    const previousLineWidth = context.lineWidth;
    const previousFont = context.font;
    const previousFillStyle = context.fillStyle;
    const previousCompositeOp = context.globalCompositeOperation;

    context.globalCompositeOperation = 'source-over';
    context.font = '16px Arial'; 
    context.fillStyle = PEN_COLOR;
    context.textBaseline = 'top';
    context.fillText(text, x, y);

    context.strokeStyle = previousStrokeStyle;
    context.lineWidth = previousLineWidth;
    context.font = previousFont;
    context.fillStyle = previousFillStyle;
    context.globalCompositeOperation = previousCompositeOp;
  };

  const applyTextToCanvas = () => {
    if (textInputValue.trim() !== '') {
      drawTextOnCanvas(textInputValue, textInputPosition.x, textInputPosition.y);
      saveCanvasState();
    }
    setShowTextInput(false);
    setTextInputValue('');
  }

  const handleTextInputBlur = () => {
    applyTextToCanvas();
  };

  const handleTextInputKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault(); 
      applyTextToCanvas();
    } else if (event.key === 'Escape') {
      setShowTextInput(false);
      setTextInputValue('');
    }
  };

  const handleClearCanvas = () => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext('2d');
    if (!canvas || !context) return;

    context.fillStyle = ERASER_COLOR;
    context.fillRect(0, 0, canvas.width, canvas.height);

    if (currentTool === 'pen') {
      context.strokeStyle = PEN_COLOR;
      context.lineWidth = PEN_WIDTH;
    } else { 
      context.strokeStyle = ERASER_COLOR;
      context.lineWidth = ERASER_WIDTH;
    }
    context.lineCap = 'round';
    context.lineJoin = 'round';
    context.globalCompositeOperation = 'source-over';

    saveCanvasState(); 
  };

  const handleUndo = () => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext('2d');
    if (!canvas || !context) return;

    if (history.length > 1) { 
      const newHistory = history.slice(0, -1);
      setHistory(newHistory);
      const prevState = newHistory[newHistory.length - 1];
      if (prevState) {
        context.putImageData(prevState, 0, 0);
      }
    }
  };

  const handleToggleEraser = () => {
    setCurrentTool(prevTool => (prevTool === 'pen' ? 'eraser' : 'pen'));
  };

  const handleSaveCanvasDraft = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    try {
      const dataUrl = canvas.toDataURL('image/png');
      const draftName = `${t('whiteboard.draftNamePrefix')} ${new Date().toLocaleString(locale, { dateStyle: 'short', timeStyle: 'short' })}`;
      const newDraft: SavedDraft = {
        id: Date.now().toString(),
        name: draftName,
        dataUrl: dataUrl,
        createdAt: new Date().toISOString(),
      };

      const updatedDrafts = [newDraft, ...drafts].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      // Optional: Limit the number of drafts, e.g., to 20
      // if (updatedDrafts.length > 20) {
      //   updatedDrafts.splice(20);
      // }

      localStorage.setItem(LOCAL_STORAGE_DRAFTS_KEY, JSON.stringify(updatedDrafts));
      setDrafts(updatedDrafts);
      toast({
        title: t('whiteboard.draftSavedTitle'),
        description: t('whiteboard.draftSavedDescription', { draftName: newDraft.name }),
      });
    } catch (error) {
      console.error("Error saving draft to localStorage:", error);
      toast({
        variant: "destructive",
        title: t('whiteboard.draftSaveErrorTitle'),
        description: t('whiteboard.draftSaveErrorDescription'),
      });
    }
  };
  
  const handleLoadSpecificDraft = (draftId: string) => {
    const draftToLoad = drafts.find(d => d.id === draftId);
    if (!draftToLoad || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    if (!context) return;

    const img = new Image();
    img.onload = () => {
      context.clearRect(0, 0, canvas.width, canvas.height); 
      context.drawImage(img, 0, 0);
      const loadedImageData = context.getImageData(0, 0, canvas.width, canvas.height);
      setHistory([loadedImageData]); 
      toast({ title: t('whiteboard.draftLoadedTitle'), description: t('whiteboard.draftLoadedDescription', { draftName: draftToLoad.name }) });
      setIsDraftsDialogOpen(false); 
    };
    img.onerror = () => {
      toast({ variant: "destructive", title: t('whiteboard.draftLoadErrorTitle'), description: t('whiteboard.draftLoadErrorSpecificDescription') });
    };
    img.src = draftToLoad.dataUrl;
  };


  const handleDownloadCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    link.download = `whiteboard-${timestamp}.png`;
    link.href = dataUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast({
      title: t('toast.downloadedTitle'),
      description: t('toast.downloadedDescription', { filename: link.download }),
    });
  };
  
  const undoDisabled = history.length <= 1;

  return (
    <div className="w-screen h-screen relative bg-white overflow-hidden flex flex-col">
      <div className="absolute top-4 right-4 z-10">
        <LanguageSwitcher />
      </div>
      <canvas
        ref={canvasRef}
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing} 
        onContextMenu={handleContextMenu}
        className="w-full h-full cursor-crosshair flex-grow"
        aria-label={t('whiteboard.canvasLabel')}
      />
      {showTextInput && (
        <Input
          ref={textInputRef}
          type="text"
          value={textInputValue}
          onChange={handleTextInputChange}
          onBlur={handleTextInputBlur}
          onKeyDown={handleTextInputKeyDown}
          className="absolute p-1 border border-gray-400 bg-white shadow-md text-sm z-10"
          style={{
            left: `${textInputPosition.x}px`,
            top: `${textInputPosition.y}px`,
            minWidth: '100px',
            maxWidth: '300px',
          }}
          placeholder={t('whiteboard.textInputPlaceholder')}
        />
      )}
      <TooltipProvider>
        <div className="absolute bottom-4 right-4 z-10 flex gap-2">
           <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="outline" 
                size="icon" 
                onClick={() => setIsDraftsDialogOpen(true)}
                aria-label={t('whiteboard.manageDraftsTooltip')}
              >
                <FolderClock className="h-5 w-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{t('whiteboard.manageDraftsTooltip')}</p>
            </TooltipContent>
          </Tooltip>
           <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="outline" 
                size="icon" 
                onClick={handleSaveCanvasDraft}
                aria-label={t('whiteboard.saveDraftTooltip')}
              >
                <Save className="h-5 w-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{t('whiteboard.saveDraftTooltip')}</p>
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="outline" 
                size="icon" 
                onClick={handleDownloadCanvas}
                aria-label={t('whiteboard.downloadTooltip')}
              >
                <Download className="h-5 w-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{t('whiteboard.downloadTooltip')}</p>
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="outline" 
                size="icon" 
                onClick={handleClearCanvas}
                aria-label={t('whiteboard.clearCanvasTooltip')}
              >
                <Trash2 className="h-5 w-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{t('whiteboard.clearCanvasTooltip')}</p>
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="outline" 
                size="icon" 
                onClick={handleUndo}
                disabled={undoDisabled}
                aria-label={t('whiteboard.undoTooltip')}
              >
                <Undo2 className="h-5 w-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{t('whiteboard.undoTooltip')}</p>
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant={currentTool === 'eraser' ? 'secondary' : 'outline'} 
                size="icon" 
                onClick={handleToggleEraser}
                aria-label={t('whiteboard.eraserTooltip')}
              >
                <Eraser className="h-5 w-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{t('whiteboard.eraserTooltip')}</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </TooltipProvider>

      <Dialog open={isDraftsDialogOpen} onOpenChange={setIsDraftsDialogOpen}>
        <DialogContent className="sm:max-w-[525px]">
          <DialogHeader>
            <DialogTitle>{t('whiteboard.draftsDialogTitle')}</DialogTitle>
            <DialogDescription>
              {drafts.length > 0 ? t('whiteboard.draftsDialogDescription') : t('whiteboard.noDraftsMessage')}
            </DialogDescription>
          </DialogHeader>
          {drafts.length > 0 && (
            <ScrollArea className="h-[300px] w-full rounded-md border p-4">
              <div className="space-y-2">
                {drafts.map((draft) => (
                  <div key={draft.id} className="flex items-center justify-between p-2 rounded-md hover:bg-accent">
                    <div>
                      <p className="font-medium">{draft.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(draft.createdAt).toLocaleString(locale, { dateStyle: 'medium', timeStyle: 'short' })}
                      </p>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => handleLoadSpecificDraft(draft.id)}>
                      {t('whiteboard.loadDraftButton')}
                    </Button>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">{t('whiteboard.closeDialogButton')}</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

