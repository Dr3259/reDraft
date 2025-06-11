
"use client";

import * as React from 'react';
import { useRef, useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/locales/client';
import { LanguageSwitcher } from '@/components/language-switcher';
import { Eraser, Trash2, Undo2 } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const ERASER_WIDTH = 20;
const PEN_WIDTH = 2;
const PEN_COLOR = 'black';
const ERASER_COLOR = 'white'; // Must match canvas background
const MAX_HISTORY_STEPS = 30;

export default function WhiteboardPage() {
  const t = useI18n();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [lastPosition, setLastPosition] = useState<{ x: number; y: number } | null>(null);

  const [showTextInput, setShowTextInput] = useState(false);
  const [textInputValue, setTextInputValue] = useState('');
  const [textInputPosition, setTextInputPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const textInputRef = useRef<HTMLInputElement>(null);

  const [history, setHistory] = useState<ImageData[]>([]);
  const [currentTool, setCurrentTool] = useState<'pen' | 'eraser'>('pen');

  // Effect for initial canvas setup (size, background)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext('2d');
    if (!context) return;

    const parent = canvas.parentElement;
    if (parent) {
      canvas.width = parent.clientWidth;
      canvas.height = parent.clientHeight;
      context.fillStyle = ERASER_COLOR; // Background color
      context.fillRect(0, 0, canvas.width, canvas.height);
    }
  }, []);

  // Effect to synchronize drawing context with the current tool and save initial state
  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext('2d');
    if (!context || !canvas) return;

    if (currentTool === 'pen') {
      context.strokeStyle = PEN_COLOR;
      context.lineWidth = PEN_WIDTH;
      context.globalCompositeOperation = 'source-over';
    } else { // Eraser
      context.strokeStyle = ERASER_COLOR;
      context.lineWidth = ERASER_WIDTH;
      context.globalCompositeOperation = 'source-over'; // Draw with background color
    }
    context.lineCap = 'round';
    context.lineJoin = 'round';

    // Save initial state once canvas is ready and styled
    if (history.length === 0 && canvas.width > 0 && canvas.height > 0) {
      const initialImageData = context.getImageData(0, 0, canvas.width, canvas.height);
      setHistory([initialImageData]);
    }
  }, [currentTool, canvasRef, history.length]); // history.length to ensure initial save happens

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
        // Preserve current drawing during resize
        const imageData = context.getImageData(0, 0, currentCanvas.width, currentCanvas.height);
        
        currentCanvas.width = parentEl.clientWidth;
        currentCanvas.height = parentEl.clientHeight;
        
        context.putImageData(imageData, 0, 0);

        // Re-apply current tool's styles as context properties might be reset
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
      // Apply current tool styles
      if (currentTool === 'pen') {
        context.strokeStyle = PEN_COLOR;
        context.lineWidth = PEN_WIDTH;
      } else {
        context.strokeStyle = ERASER_COLOR;
        context.lineWidth = ERASER_WIDTH;
      }
      context.beginPath(); // Start a new path
      context.moveTo(x, y); // Move to the starting point
    }
  };

  const draw = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !lastPosition) return;
    const canvas = canvasRef.current;
    const context = canvas?.getContext('2d');
    if (!context) return;

    const { x, y } = getMousePosition(event);
    // context.beginPath(); // Not needed here, path is continuous from startDrawing or previous draw
    // context.moveTo(lastPosition.x, lastPosition.y); // Not needed if path is continuous
    context.lineTo(x, y);
    context.stroke();
    setLastPosition({ x, y });
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    const context = canvasRef.current?.getContext('2d');
    if(context) {
        context.closePath(); // Close the path for the current stroke
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

    // Ensure text is drawn with pen settings, not eraser settings
    const previousStrokeStyle = context.strokeStyle;
    const previousLineWidth = context.lineWidth;
    const previousFont = context.font;
    const previousFillStyle = context.fillStyle;
    const previousCompositeOp = context.globalCompositeOperation;

    context.globalCompositeOperation = 'source-over';
    context.font = '16px Arial'; 
    context.fillStyle = PEN_COLOR; // Text color
    context.textBaseline = 'top';
    context.fillText(text, x, y);

    // Restore previous context settings if they were for eraser or different
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
    </div>
  );
}

    