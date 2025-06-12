
"use client";

import * as React from 'react';
import { useRef, useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useI18n, useCurrentLocale } from '@/locales/client';
import { LanguageSwitcher } from '@/components/language-switcher';
import { Eraser, Trash2, Undo2, Save, Download, FolderClock, Palette, Trash, Expand, Minimize } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useToast } from "@/hooks/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { cn } from '@/lib/utils';

const PEN_WIDTH = 2;
const ERASER_WIDTH = 20;
const MAX_HISTORY_STEPS = 30;
const LOCAL_STORAGE_DRAFTS_KEY = 'whiteboardDrafts_v2';
const LOCAL_STORAGE_THEME_KEY = 'whiteboardTheme_v1';

type CanvasTheme = 'whiteboard' | 'blackboard' | 'eyecare' | 'reading';

const themeClasses: Record<CanvasTheme, string> = {
  whiteboard: 'theme-whiteboard',
  blackboard: 'theme-blackboard',
  eyecare: 'theme-eyecare',
  reading: 'theme-reading',
};


interface SavedDraft {
  id: string;
  name: string;
  dataUrl: string;
  createdAt: string;
}

export default function WhiteboardPage() {
  const t = useI18n();
  const locale = useCurrentLocale();
  const { toast, dismiss: dismissToast } = useToast();

  const mainContainerRef = useRef<HTMLDivElement>(null);
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

  const [currentTheme, setCurrentTheme] = useState<CanvasTheme>('whiteboard');
  const [effectivePenColor, setEffectivePenColor] = useState('hsl(0 0% 0%)');
  const [effectiveEraserColor, setEffectiveEraserColor] = useState('hsl(0 0% 100%)');

  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem(LOCAL_STORAGE_THEME_KEY) as CanvasTheme | null;
    if (savedTheme && themeClasses[savedTheme]) {
      setCurrentTheme(savedTheme);
    }
  }, []);

  useEffect(() => {
    if (mainContainerRef.current) {
      Object.values(themeClasses).forEach(cls => mainContainerRef.current!.classList.remove(cls));
      mainContainerRef.current.classList.add(themeClasses[currentTheme]);
      localStorage.setItem(LOCAL_STORAGE_THEME_KEY, currentTheme);

      setTimeout(() => {
        if (mainContainerRef.current) {
          const computedStyle = getComputedStyle(mainContainerRef.current);
          const newEraserColor = `hsl(${computedStyle.getPropertyValue('--canvas-bg-hsl').trim()})`;
          const newPenColor = `hsl(${computedStyle.getPropertyValue('--canvas-pen-hsl').trim()})`;
          setEffectiveEraserColor(newEraserColor);
          setEffectivePenColor(newPenColor);

          const canvas = canvasRef.current;
          const context = canvas?.getContext('2d');
          if (!canvas || !context) return;

          context.fillStyle = newEraserColor;
          context.fillRect(0, 0, canvas.width, canvas.height);

          if (currentTool === 'pen') {
            context.strokeStyle = newPenColor;
            context.lineWidth = PEN_WIDTH;
          } else {
            context.strokeStyle = newEraserColor;
            context.lineWidth = ERASER_WIDTH;
          }
          context.lineCap = 'round';
          context.lineJoin = 'round';
          context.globalCompositeOperation = 'source-over';

          if (canvas.width > 0 && canvas.height > 0) {
            const initialImageData = context.getImageData(0, 0, canvas.width, canvas.height);
            setHistory([initialImageData]);
          }
        }
      }, 0);
    }
  }, [currentTheme, currentTool]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !effectiveEraserColor || !effectivePenColor) return;
    const context = canvas.getContext('2d');
    if (!context) return;

    const parent = canvas.parentElement;
    if (!parent) return;

    canvas.width = parent.clientWidth;
    canvas.height = parent.clientHeight;

    context.fillStyle = effectiveEraserColor;
    context.fillRect(0, 0, canvas.width, canvas.height);

    if (canvas.width > 0 && canvas.height > 0) {
        const initialImageData = context.getImageData(0, 0, canvas.width, canvas.height);
        setHistory([initialImageData]);
    }

    if (currentTool === 'pen') {
      context.strokeStyle = effectivePenColor;
      context.lineWidth = PEN_WIDTH;
    } else {
      context.strokeStyle = effectiveEraserColor;
      context.lineWidth = ERASER_WIDTH;
    }
    context.lineCap = 'round';
    context.lineJoin = 'round';
    context.globalCompositeOperation = 'source-over';

  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [effectiveEraserColor, effectivePenColor]);

  useEffect(() => {
    const loadDraftsFromStorage = () => {
      const savedDraftsJson = localStorage.getItem(LOCAL_STORAGE_DRAFTS_KEY);
      if (savedDraftsJson) {
        try {
          const parsedDrafts: SavedDraft[] = JSON.parse(savedDraftsJson);
          setDrafts(parsedDrafts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
        } catch (e) {
          console.error("Error parsing drafts from localStorage:", e);
          localStorage.removeItem(LOCAL_STORAGE_DRAFTS_KEY);
        }
      }
    };
    loadDraftsFromStorage();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resizeObserver = new ResizeObserver(entries => {
      const entry = entries[0];
      const { width, height } = entry.contentRect;

      const currentCanvas = canvasRef.current;
      if (!currentCanvas) return;
      const context = currentCanvas.getContext('2d');
      if (!context) return;

      const currentImageData = context.getImageData(0, 0, currentCanvas.width, currentCanvas.height);

      currentCanvas.width = width;
      currentCanvas.height = height;

      context.fillStyle = effectiveEraserColor;
      context.fillRect(0, 0, currentCanvas.width, currentCanvas.height);

      const tempImg = new window.Image();
      tempImg.onload = () => {
        context.drawImage(tempImg, 0, 0);

         if (currentTool === 'pen') {
          context.strokeStyle = effectivePenColor;
          context.lineWidth = PEN_WIDTH;
        } else {
          context.strokeStyle = effectiveEraserColor;
          context.lineWidth = ERASER_WIDTH;
        }
        context.lineCap = 'round';
        context.lineJoin = 'round';
        context.globalCompositeOperation = 'source-over';
        saveCanvasState();
      }
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = currentImageData.width;
      tempCanvas.height = currentImageData.height;
      const tempCtx = tempCanvas.getContext('2d');
      if (tempCtx) {
        tempCtx.putImageData(currentImageData, 0, 0);
        tempImg.src = tempCanvas.toDataURL();
      } else {
        if (currentCanvas.width === currentImageData.width && currentCanvas.height === currentImageData.height) {
           context.putImageData(currentImageData, 0, 0);
        }
         if (currentTool === 'pen') {
          context.strokeStyle = effectivePenColor;
          context.lineWidth = PEN_WIDTH;
        } else {
          context.strokeStyle = effectiveEraserColor;
          context.lineWidth = ERASER_WIDTH;
        }
        context.lineCap = 'round';
        context.lineJoin = 'round';
        context.globalCompositeOperation = 'source-over';
        saveCanvasState();
      }
    });

    const parentEl = canvas.parentElement;
    if (parentEl) {
      resizeObserver.observe(parentEl);
    }
    return () => {
      if (parentEl) {
        resizeObserver.unobserve(parentEl);
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentTool, effectiveEraserColor, effectivePenColor]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);


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
        context.strokeStyle = effectivePenColor;
        context.lineWidth = PEN_WIDTH;
      } else {
        context.strokeStyle = effectiveEraserColor;
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
    context.fillStyle = effectivePenColor;
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

    context.fillStyle = effectiveEraserColor;
    context.fillRect(0, 0, canvas.width, canvas.height);

    if (currentTool === 'pen') {
      context.strokeStyle = effectivePenColor;
      context.lineWidth = PEN_WIDTH;
    } else {
      context.strokeStyle = effectiveEraserColor;
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
    setCurrentTool(prevTool => {
      const newTool = prevTool === 'pen' ? 'eraser' : 'pen';
      const canvas = canvasRef.current;
      const context = canvas?.getContext('2d');
      if (context) {
        if (newTool === 'pen') {
          context.strokeStyle = effectivePenColor;
          context.lineWidth = PEN_WIDTH;
        } else {
          context.strokeStyle = effectiveEraserColor;
          context.lineWidth = ERASER_WIDTH;
        }
      }
      return newTool;
    });
  };

  const handleSaveCanvasDraft = () => {
    const canvas = canvasRef.current;
    if (!canvas || canvas.width === 0 || canvas.height === 0) {
      const { id: toastId } = toast({
        variant: "destructive",
        title: t('whiteboard.draftSaveErrorTitle'),
        description: t('whiteboard.canvasNotReadyError'),
      });
      setTimeout(() => { dismissToast(toastId); }, 3000);
      return;
    }

    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;
    const tempCtx = tempCanvas.getContext('2d');

    if (!tempCtx) {
      const { id: toastId } = toast({
        variant: "destructive",
        title: t('whiteboard.draftSaveErrorTitle'),
        description: t('whiteboard.genericSaveError'),
      });
      setTimeout(() => { dismissToast(toastId); }, 3000);
      return;
    }

    tempCtx.fillStyle = effectiveEraserColor;
    tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);

    let blankCanvasDataUrl: string;
    try {
      blankCanvasDataUrl = tempCanvas.toDataURL('image/png');
    } catch (e) {
      console.error("Error getting blank canvas data URL:", e);
      const { id: toastId } = toast({
        variant: "destructive",
        title: t('whiteboard.draftSaveErrorTitle'),
        description: t('whiteboard.genericSaveError'),
      });
      setTimeout(() => { dismissToast(toastId); }, 3000);
      return;
    }

    let currentCanvasDataUrl: string;
    try {
      currentCanvasDataUrl = canvas.toDataURL('image/png');
    } catch (e) {
       console.error("Error getting current canvas data URL:", e);
       const { id: toastId } = toast({
        variant: "destructive",
        title: t('whiteboard.draftSaveErrorTitle'),
        description: t('whiteboard.genericSaveError'),
      });
      setTimeout(() => { dismissToast(toastId); }, 3000);
      return;
    }

    if (currentCanvasDataUrl === blankCanvasDataUrl) {
      const { id: toastId } = toast({
        title: t('whiteboard.emptyCanvasTitle'),
        description: t('whiteboard.emptyCanvasDescription'),
      });
      setTimeout(() => {
        dismissToast(toastId);
      }, 3000);
      return;
    }

    try {
      const draftName = `${t('whiteboard.draftNamePrefix')} ${new Date().toLocaleString(locale, { dateStyle: 'short', timeStyle: 'short' })}`;
      const newDraft: SavedDraft = {
        id: Date.now().toString(),
        name: draftName,
        dataUrl: currentCanvasDataUrl,
        createdAt: new Date().toISOString(),
      };

      const updatedDrafts = [newDraft, ...drafts].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      localStorage.setItem(LOCAL_STORAGE_DRAFTS_KEY, JSON.stringify(updatedDrafts));
      setDrafts(updatedDrafts);
      const { id: toastId } = toast({
        title: t('whiteboard.draftSavedTitle'),
        description: t('whiteboard.draftSavedDescription', { draftName: newDraft.name }),
      });
      setTimeout(() => {
        dismissToast(toastId);
      }, 2000);
    } catch (error) {
      console.error("Error saving draft to localStorage:", error);
      const { id: toastId } = toast({
        variant: "destructive",
        title: t('whiteboard.draftSaveErrorTitle'),
        description: t('whiteboard.draftSaveErrorDescription'),
      });
      setTimeout(() => { dismissToast(toastId); }, 3000);
    }
  };

  const handleLoadSpecificDraft = (draftId: string) => {
    const draftToLoad = drafts.find(d => d.id === draftId);
    if (!draftToLoad || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    if (!context) return;

    const img = new window.Image();
    img.onload = () => {
      context.fillStyle = effectiveEraserColor;
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.drawImage(img, 0, 0, canvas.width, canvas.height);

      if (currentTool === 'pen') {
        context.strokeStyle = effectivePenColor;
        context.lineWidth = PEN_WIDTH;
      } else {
        context.strokeStyle = effectiveEraserColor;
        context.lineWidth = ERASER_WIDTH;
      }
      context.lineCap = 'round';
      context.lineJoin = 'round';
      context.globalCompositeOperation = 'source-over';

      saveCanvasState();
      const { id: toastId } = toast({ title: t('whiteboard.draftLoadedTitle'), description: t('whiteboard.draftLoadedDescription', { draftName: draftToLoad.name }) });
      setTimeout(() => dismissToast(toastId), 2000);
      setIsDraftsDialogOpen(false);
    };
    img.onerror = () => {
      const { id: toastId } = toast({ variant: "destructive", title: t('whiteboard.draftLoadErrorTitle'), description: t('whiteboard.draftLoadErrorSpecificDescription') });
      setTimeout(() => dismissToast(toastId), 3000);
    };
    img.src = draftToLoad.dataUrl;
  };

  const handleDeleteDraft = (draftId: string) => {
    const draftToDelete = drafts.find(d => d.id === draftId);
    if (!draftToDelete) return;

    const updatedDrafts = drafts.filter(d => d.id !== draftId);
    try {
      localStorage.setItem(LOCAL_STORAGE_DRAFTS_KEY, JSON.stringify(updatedDrafts));
      setDrafts(updatedDrafts);
      const { id: toastId } = toast({
        title: t('whiteboard.draftDeletedTitle'),
        description: t('whiteboard.draftDeletedDescription', { draftName: draftToDelete.name }),
      });
      setTimeout(() => dismissToast(toastId), 2000);
    } catch (error) {
      console.error("Error deleting draft from localStorage:", error);
      const { id: toastId } = toast({
        variant: "destructive",
        title: t('whiteboard.draftDeleteErrorTitle'),
        description: t('whiteboard.draftDeleteErrorDescription'),
      });
      setTimeout(() => dismissToast(toastId), 3000);
    }
  };


  const handleDownloadCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas || canvas.width === 0 || canvas.height === 0) {
      const { id: toastId } = toast({
        variant: "destructive",
        title: t('whiteboard.downloadErrorTitle'),
        description: t('whiteboard.canvasNotReadyError'),
      });
      setTimeout(() => { dismissToast(toastId); }, 3000);
      return;
    }

    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;
    const tempCtx = tempCanvas.getContext('2d');

    if (!tempCtx) {
       const { id: toastId } = toast({
        variant: "destructive",
        title: t('whiteboard.downloadErrorTitle'),
        description: t('whiteboard.downloadErrorDescription'),
      });
      setTimeout(() => { dismissToast(toastId); }, 3000);
      return;
    }

    tempCtx.fillStyle = effectiveEraserColor;
    tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);

    let blankCanvasDataUrl: string;
    try {
      blankCanvasDataUrl = tempCanvas.toDataURL('image/png');
    } catch (e) {
      console.error("Error getting blank canvas data URL for download check:", e);
      const { id: toastId } = toast({
        variant: "destructive",
        title: t('whiteboard.downloadErrorTitle'),
        description: t('whiteboard.downloadErrorDescription'),
      });
      setTimeout(() => { dismissToast(toastId); }, 3000);
      return;
    }

    let currentCanvasDataUrl: string;
    try {
      currentCanvasDataUrl = canvas.toDataURL('image/png');
    } catch (e) {
       console.error("Error getting current canvas data URL for download:", e);
       const { id: toastId } = toast({
        variant: "destructive",
        title: t('whiteboard.downloadErrorTitle'),
        description: t('whiteboard.downloadErrorDescription'),
      });
      setTimeout(() => { dismissToast(toastId); }, 3000);
      return;
    }

    if (currentCanvasDataUrl === blankCanvasDataUrl) {
      const { id: toastId } = toast({
        title: t('whiteboard.emptyCanvasDownloadTitle'),
        description: t('whiteboard.emptyCanvasDownloadDescription'),
      });
      setTimeout(() => {
        dismissToast(toastId);
      }, 3000);
      return;
    }

    const link = document.createElement('a');
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    link.download = `whiteboard-${timestamp}.png`;
    link.href = currentCanvasDataUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    const { id: toastId } = toast({
      title: t('toast.downloadedTitle'),
      description: t('toast.downloadedDescription', { filename: link.download }),
    });
    setTimeout(() => dismissToast(toastId), 2000);
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => {
        const { id: toastId } = toast({
          variant: "destructive",
          title: t('whiteboard.fullscreenErrorTitle'),
          description: t('whiteboard.fullscreenErrorDescription'),
        });
        setTimeout(() => dismissToast(toastId), 3000);
      });
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  };

  const undoDisabled = history.length <= 1;

  return (
    <div
      ref={mainContainerRef}
      className={cn("w-screen h-screen relative overflow-hidden flex flex-col app-canvas-container", themeClasses[currentTheme])}
      >
      <div className="absolute top-4 right-4 z-10 flex items-center space-x-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon" aria-label={t('themeSwitcher.title')}>
              <Palette className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>{t('themeSwitcher.title')}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuRadioGroup value={currentTheme} onValueChange={(value) => setCurrentTheme(value as CanvasTheme)}>
              <DropdownMenuRadioItem value="whiteboard">{t('themeSwitcher.whiteboard')}</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="blackboard">{t('themeSwitcher.blackboard')}</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="eyecare">{t('themeSwitcher.eyecare')}</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="reading">{t('themeSwitcher.reading')}</DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>
        <LanguageSwitcher />
      </div>
      <div className="flex-grow relative">
        <canvas
          ref={canvasRef}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onContextMenu={handleContextMenu}
          className="w-full h-full cursor-crosshair block"
          aria-label={t('whiteboard.canvasLabel')}
          style={{ backgroundColor: effectiveEraserColor }}
        />
      </div>
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
            color: effectivePenColor,
            backgroundColor: effectiveEraserColor,
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
                onClick={toggleFullscreen}
                aria-label={isFullscreen ? t('whiteboard.exitFullscreenTooltip') : t('whiteboard.enterFullscreenTooltip')}
              >
                {isFullscreen ? <Minimize className="h-5 w-5" /> : <Expand className="h-5 w-5" />}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{isFullscreen ? t('whiteboard.exitFullscreenTooltip') : t('whiteboard.enterFullscreenTooltip')}</p>
            </TooltipContent>
          </Tooltip>
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
              <div className="space-y-4">
                {drafts.map((draft) => (
                  <div key={draft.id} className="flex items-center justify-between p-2 rounded-md hover:bg-accent space-x-3">
                    <div className="flex items-center space-x-3 flex-grow">
                      <img
                        src={draft.dataUrl}
                        alt={t('whiteboard.draftThumbnailAlt', { draftName: draft.name })}
                        className="w-20 h-16 rounded-md border object-contain bg-white"
                        data-ai-hint="drawing preview"
                      />
                      <div>
                        <p className="font-medium">{draft.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(draft.createdAt).toLocaleString(locale, { dateStyle: 'medium', timeStyle: 'short' })}
                        </p>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm" onClick={() => handleLoadSpecificDraft(draft.id)}>
                        {t('whiteboard.loadDraftButton')}
                      </Button>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => handleDeleteDraft(draft.id)}>
                              <Trash className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{t('whiteboard.deleteDraftTooltip')}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
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

