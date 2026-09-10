import React, { useRef, useState, useEffect } from 'react';
import { RotateCcw, PenTool, Type } from 'lucide-react';

export interface SignatureCanvasPadProps {
  onSignatureChange: (dataUrl: string | null) => void;
  width?: number;
  height?: number;
}

export const SignatureCanvasPad: React.FC<SignatureCanvasPadProps> = ({
  onSignatureChange,
  width = 500,
  height = 160,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [mode, setMode] = useState<'draw' | 'type'>('draw');
  const [typedName, setTypedName] = useState('');
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.strokeStyle = '#0f172a'; // slate-900
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  }, []);

  const getCoordinates = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    if ('touches' in e) {
      const touch = e.touches[0];
      return {
        x: (touch.clientX - rect.left) * scaleX,
        y: (touch.clientY - rect.top) * scaleY,
      };
    } else {
      return {
        x: (e.clientX - rect.left) * scaleX,
        y: (e.clientY - rect.top) * scaleY,
      };
    }
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { x, y } = getCoordinates(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { x, y } = getCoordinates(e);
    ctx.lineTo(x, y);
    ctx.stroke();
    setHasDrawn(true);
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (!canvas) return;
    onSignatureChange(canvas.toDataURL('image/png'));
  };

  const handleTypedChange = (val: string) => {
    setTypedName(val);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (!val.trim()) {
      setHasDrawn(false);
      onSignatureChange(null);
      return;
    }

    ctx.font = 'italic 34px cursive, serif';
    ctx.fillStyle = '#0f172a';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(val, canvas.width / 2, canvas.height / 2);
    setHasDrawn(true);
    onSignatureChange(canvas.toDataURL('image/png'));
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawn(false);
    setTypedName('');
    onSignatureChange(null);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs font-semibold text-neutral-700">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setMode('draw')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${
              mode === 'draw'
                ? 'bg-emerald-100 text-emerald-800'
                : 'text-neutral-600 hover:bg-neutral-100'
            }`}
          >
            <PenTool className="w-3.5 h-3.5" />
            Draw Signature
          </button>
          <button
            type="button"
            onClick={() => setMode('type')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${
              mode === 'type'
                ? 'bg-emerald-100 text-emerald-800'
                : 'text-neutral-600 hover:bg-neutral-100'
            }`}
          >
            <Type className="w-3.5 h-3.5" />
            Type Signature (Accessible)
          </button>
        </div>
        <button
          type="button"
          onClick={clearCanvas}
          className="text-neutral-600 hover:text-neutral-900 text-[11px] flex items-center gap-1 transition-colors p-1 rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
        >
          <RotateCcw className="w-3 h-3" /> Clear
        </button>
      </div>

      {mode === 'type' && (
        <div>
          <label htmlFor="accessible-typed-signature" className="block text-xs font-medium text-neutral-700 mb-1">
            Type your full legal name below to generate your signature:
          </label>
          <input
            id="accessible-typed-signature"
            type="text"
            value={typedName}
            onChange={(e) => handleTypedChange(e.target.value)}
            placeholder="Type your full legal name"
            className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 bg-white text-neutral-900"
          />
        </div>
      )}

      <div className="relative border-2 border-dashed border-neutral-300 rounded-xl overflow-hidden bg-white touch-none">
        <canvas
          ref={canvasRef}
          width={width}
          height={height}
          onMouseDown={mode === 'draw' ? startDrawing : undefined}
          onMouseMove={mode === 'draw' ? draw : undefined}
          onMouseUp={mode === 'draw' ? stopDrawing : undefined}
          onMouseLeave={mode === 'draw' ? stopDrawing : undefined}
          onTouchStart={mode === 'draw' ? startDrawing : undefined}
          onTouchMove={mode === 'draw' ? draw : undefined}
          onTouchEnd={mode === 'draw' ? stopDrawing : undefined}
          className={`w-full h-[160px] block ${mode === 'draw' ? 'cursor-crosshair' : 'cursor-default'}`}
        />

        {!hasDrawn && (
          <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center text-neutral-400">
            <span className="text-sm font-medium">
              {mode === 'draw' ? 'Sign above with mouse or touchscreen' : 'Type your name above to populate signature'}
            </span>
            <span className="text-xs text-neutral-400 mt-1">✕ _____________________________________</span>
          </div>
        )}
      </div>
    </div>
  );
};
