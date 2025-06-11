
"use client";

import * as React from 'react';
import { useRef, useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';
import { useI18n } from '@/locales/client';

export default function WhiteboardPage() {
  const t = useI18n();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [lastPosition, setLastPosition] = useState<{ x: number; y: number } | null>(null);

  const [showTextInput, setShowTextInput] = useState(false);
  const [textInputValue, setTextInputValue] = useState('');
  const [textInputPosition, setTextInputPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const textInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext('2d');
    if (!context) return;

    const resizeCanvas = () => {
      const parent = canvas.parentElement;
      if (parent) {
        // Save current drawing
        const imageData = context.getImageData(0, 0, canvas.width, canvas.height);

        canvas.width = parent.clientWidth;
        canvas.height = parent.clientHeight;
        
        // Restore drawing
        context.putImageData(imageData, 0, 0);

        // Reset styles as they might be cleared
        context.strokeStyle = 'black';
        context.lineWidth = 2;
        context.lineCap = 'round';
        context.lineJoin = 'round';
      }
    };
    
    // Initial setup
    const parent = canvas.parentElement;
    if (parent) {
        canvas.width = parent.clientWidth;
        canvas.height = parent.clientHeight;
        context.fillStyle = 'white'; // Ensure background is white initially
        context.fillRect(0, 0, canvas.width, canvas.height);
        context.strokeStyle = 'black';
        context.lineWidth = 2;
        context.lineCap = 'round';
        context.lineJoin = 'round';
    }

    window.addEventListener('resize', resizeCanvas);
    return () => window.removeEventListener('resize', resizeCanvas);
  }, []);

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
    if (event.button !== 0) return; // Only draw on left click
    const { x, y } = getMousePosition(event);
    setIsDrawing(true);
    setLastPosition({ x, y });
  };

  const draw = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !lastPosition) return;
    const canvas = canvasRef.current;
    const context = canvas?.getContext('2d');
    if (!context) return;

    const { x, y } = getMousePosition(event);
    context.beginPath();
    context.moveTo(lastPosition.x, lastPosition.y);
    context.lineTo(x, y);
    context.stroke();
    setLastPosition({ x, y });
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    setLastPosition(null);
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

  const applyTextToCanvas = () => {
    if (textInputValue.trim() !== '') {
      drawTextOnCanvas(textInputValue, textInputPosition.x, textInputPosition.y);
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

  const drawTextOnCanvas = (text: string, x: number, y: number) => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext('2d');
    if (!context) return;

    context.font = '16px Arial'; 
    context.fillStyle = 'black';
    context.textBaseline = 'top';
    context.fillText(text, x, y);
  };

  return (
    <div className="w-screen h-screen relative bg-white overflow-hidden">
      <canvas
        ref={canvasRef}
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing} 
        onContextMenu={handleContextMenu}
        className="w-full h-full cursor-crosshair"
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
    </div>
  );
}
