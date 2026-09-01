'use client';

import * as React from 'react';
import { PenTool, Type, RotateCcw } from 'lucide-react';
import { cn } from '../lib/utils';

export interface SignatureCanvasPadProps {
  value?: string;
  onChange: (signatureBase64: string) => void;
  error?: string;
  className?: string;
  signerName?: string;
}

/**
 * SignatureCanvasPad
 *
 * 100% Free in-house HTML5 Canvas signature pad supporting:
 * - Freehand Draw mode with smooth strokes (mouse & touch drag, stroke color #0f172a, width 2.5)
 * - Type mode with elegant cursive legal signature font rendering
 * - Export to standard PNG base64 data URL
 */
export function SignatureCanvasPad({
  value,
  onChange,
  error,
  className,
  signerName: defaultSignerName = '',
}: SignatureCanvasPadProps) {
  const [mode, setMode] = React.useState<'draw' | 'type'>('draw');
  const [typedName, setTypedName] = React.useState<string>(defaultSignerName);
  const [hasDrawn, setHasDrawn] = React.useState<boolean>(Boolean(value));
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);
  const isDrawingRef = React.useRef<boolean>(false);
  const lastPosRef = React.useRef<{ x: number; y: number } | null>(null);

  // Initialize and scale canvas for high DPI displays
  const setupCanvas = React.useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;

    // Set internal resolution based on CSS display size
    const width = rect.width || 480;
    const height = 160;

    canvas.width = width * dpr;
    canvas.height = height * dpr;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.scale(dpr, dpr);
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // If there is an existing value, render it onto the canvas
    if (value && value.startsWith('data:image/')) {
      const img = new Image();
      img.onload = () => {
        ctx.clearRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);
      };
      img.src = value;
    }
  }, [value]);

  React.useEffect(() => {
    setupCanvas();
    const handleResize = () => setupCanvas();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [setupCanvas]);

  // Synchronize signerName prop if supplied
  React.useEffect(() => {
    if (defaultSignerName && !typedName) {
      setTypedName(defaultSignerName);
    }
  }, [defaultSignerName, typedName]);

  const getCanvasCoords = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
  ): { x: number; y: number } | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();

    if ('touches' in e) {
      if (e.touches.length === 0) return null;
      const touch = e.touches[0];
      return {
        x: touch.clientX - rect.left,
        y: touch.clientY - rect.top,
      };
    } else {
      return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
    }
  };

  const startDrawing = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
  ) => {
    if (mode !== 'draw') return;
    const coords = getCanvasCoords(e);
    if (!coords) return;

    isDrawingRef.current = true;
    lastPosRef.current = coords;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Draw single dot on click/tap
    ctx.beginPath();
    ctx.arc(coords.x, coords.y, 1.25, 0, Math.PI * 2);
    ctx.fillStyle = '#0f172a';
    ctx.fill();
    setHasDrawn(true);
  };

  const draw = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
  ) => {
    if (!isDrawingRef.current || mode !== 'draw') return;
    const coords = getCanvasCoords(e);
    if (!coords || !lastPosRef.current) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.beginPath();
    ctx.moveTo(lastPosRef.current.x, lastPosRef.current.y);
    ctx.lineTo(coords.x, coords.y);
    ctx.stroke();

    lastPosRef.current = coords;
    setHasDrawn(true);
  };

  const stopDrawing = () => {
    if (!isDrawingRef.current) return;
    isDrawingRef.current = false;
    lastPosRef.current = null;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const dataUrl = canvas.toDataURL('image/png');
    onChange(dataUrl);
  };

  const renderTypedSignature = React.useCallback(
    (name: string) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const rect = canvas.getBoundingClientRect();
      const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
      const width = rect.width || 480;
      const height = 160;

      // Reset and clear
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, width, height);

      if (!name.trim()) {
        setHasDrawn(false);
        onChange('');
        return;
      }

      // Draw cursive typed signature
      ctx.fillStyle = '#0f172a';
      ctx.font = 'italic 38px "Brush Script MT", "Dancing Script", "Caveat", "Segoe Script", cursive, sans-serif';
      ctx.textBaseline = 'middle';
      ctx.textAlign = 'center';

      // Draw signature text
      ctx.fillText(name.trim(), width / 2, height / 2);

      setHasDrawn(true);
      const dataUrl = canvas.toDataURL('image/png');
      onChange(dataUrl);
    },
    [onChange]
  );

  const handleClear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    ctx.clearRect(0, 0, rect.width || 480, 160);
    setHasDrawn(false);
    setTypedName('');
    onChange('');
  };

  const handleModeChange = (newMode: 'draw' | 'type') => {
    setMode(newMode);
    handleClear();
    if (newMode === 'type' && defaultSignerName) {
      setTypedName(defaultSignerName);
      setTimeout(() => renderTypedSignature(defaultSignerName), 50);
    }
  };

  const handleTypeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newName = e.target.value;
    setTypedName(newName);
    renderTypedSignature(newName);
  };

  return (
    <div className={cn('w-full space-y-2', className)}>
      <div className="flex items-center justify-between">
        {/* Mode Selector Tabs */}
        <div className="inline-flex rounded-lg border border-gray-200 bg-gray-50 p-1 text-xs">
          <button
            type="button"
            onClick={() => handleModeChange('draw')}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 font-medium transition-colors',
              mode === 'draw'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-900'
            )}
          >
            <PenTool className="h-3.5 w-3.5" />
            Draw Signature
          </button>
          <button
            type="button"
            onClick={() => handleModeChange('type')}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 font-medium transition-colors',
              mode === 'type'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-900'
            )}
          >
            <Type className="h-3.5 w-3.5" />
            Type Signature
          </button>
        </div>

        {/* Clear Button */}
        {hasDrawn && (
          <button
            type="button"
            onClick={handleClear}
            className="inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors"
          >
            <RotateCcw className="h-3 w-3" />
            Clear
          </button>
        )}
      </div>

      {/* Type Mode Input */}
      {mode === 'type' && (
        <div className="pt-1">
          <input
            type="text"
            value={typedName}
            onChange={handleTypeChange}
            placeholder="Type your full legal name to generate signature"
            className="h-10 w-full rounded-lg border border-gray-300 bg-white px-3.5 py-1.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-colors"
          />
        </div>
      )}

      {/* Canvas Drawing Area */}
      <div
        className={cn(
          'relative w-full rounded-xl border bg-white shadow-inner transition-colors',
          mode === 'draw' ? 'cursor-crosshair' : 'cursor-default',
          error
            ? 'border-red-500 ring-2 ring-red-100'
            : 'border-gray-300 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20'
        )}
      >
        <canvas
          ref={canvasRef}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={(e) => {
            e.preventDefault();
            startDrawing(e);
          }}
          onTouchMove={(e) => {
            e.preventDefault();
            draw(e);
          }}
          onTouchEnd={(e) => {
            e.preventDefault();
            stopDrawing();
          }}
          className="h-40 w-full touch-none rounded-xl"
        />

        {/* Signature baseline guide */}
        <div className="pointer-events-none absolute inset-x-6 bottom-7 flex items-center gap-2 border-b border-dashed border-gray-300 text-gray-400">
          <span className="font-serif text-sm italic select-none">✕</span>
          <span className="text-[11px] uppercase tracking-wider text-gray-400 select-none">
            Sign on the line above
          </span>
        </div>

        {!hasDrawn && mode === 'draw' && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center text-xs text-gray-400 select-none">
            Draw signature using mouse, stylus, or finger
          </div>
        )}
      </div>

      {error && <p className="text-xs font-medium text-red-600">{error}</p>}
    </div>
  );
}
