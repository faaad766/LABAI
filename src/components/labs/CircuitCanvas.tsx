import React, { useEffect, useRef, useCallback, useState, forwardRef, useImperativeHandle } from 'react';

type ComponentType = 'battery' | 'resistor' | 'led' | 'wire-h' | 'wire-v';

interface CircuitComp {
  id: string;
  type: ComponentType;
  x: number;  // grid col
  y: number;  // grid row
  connected: boolean;
}

export interface CircuitCanvasRef {
  reset: () => void;
}

interface CircuitCanvasProps {
  onCircuitComplete: (complete: boolean, event: string) => void;
}

const GRID_SIZE = 60;
const COLS = 7;
const ROWS = 5;

// Correct circuit layout: battery at (1,2), wires connecting, LED at (5,2), resistor at (3,2)
const INITIAL_COMPONENTS: CircuitComp[] = [
  { id: 'battery', type: 'battery', x: 1, y: 2, connected: false },
  { id: 'resistor', type: 'resistor', x: 3, y: 2, connected: false },
  { id: 'led', type: 'led', x: 5, y: 2, connected: false },
  { id: 'wire-h-1', type: 'wire-h', x: 2, y: 2, connected: false },
  { id: 'wire-h-2', type: 'wire-h', x: 4, y: 2, connected: false },
];

// Snap targets for components — placed on grid
const TARGET_POSITIONS: Record<string, { x: number; y: number }> = {
  battery: { x: 1, y: 2 },
  resistor: { x: 3, y: 2 },
  led: { x: 5, y: 2 },
  'wire-h-1': { x: 2, y: 2 },
  'wire-h-2': { x: 4, y: 2 },
};

const CircuitCanvas = forwardRef<CircuitCanvasRef, CircuitCanvasProps>(
  ({ onCircuitComplete }, ref) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animRef = useRef<number>(0);
    const [components, setComponents] = useState<CircuitComp[]>(INITIAL_COMPONENTS.map(c => ({ ...c, connected: false })));
    const [isComplete, setIsComplete] = useState(false);
    const [voltage] = useState(9);
    const [current, setCurrent] = useState(0);
    const [glowPhase, setGlowPhase] = useState(0);
    const dragging = useRef<{ id: string; offsetX: number; offsetY: number } | null>(null);
    const pixelPos = useRef<Record<string, { px: number; py: number }>>({});
    const wasComplete = useRef(false);

    useImperativeHandle(ref, () => ({
      reset: () => {
        setComponents(INITIAL_COMPONENTS.map(c => ({ ...c, connected: false })));
        setIsComplete(false);
        setCurrent(0);
        wasComplete.current = false;
        pixelPos.current = {};
      },
    }));

    // Check if circuit is complete (all components snapped to correct positions)
    const checkComplete = useCallback((comps: CircuitComp[]) => {
      const complete = comps.every((c) => c.connected);
      return complete;
    }, []);

    const snapToGrid = useCallback((px: number, py: number, canvas: HTMLCanvasElement): { x: number; y: number } => {
      const offsetX = (canvas.width - COLS * GRID_SIZE) / 2;
      const offsetY = (canvas.height - ROWS * GRID_SIZE) / 2;
      const col = Math.round((px - offsetX - GRID_SIZE / 2) / GRID_SIZE);
      const row = Math.round((py - offsetY - GRID_SIZE / 2) / GRID_SIZE);
      return {
        x: Math.max(0, Math.min(COLS - 1, col)),
        y: Math.max(0, Math.min(ROWS - 1, row)),
      };
    }, []);

    const getPixel = useCallback((gridX: number, gridY: number, canvas: HTMLCanvasElement) => {
      const offsetX = (canvas.width - COLS * GRID_SIZE) / 2;
      const offsetY = (canvas.height - ROWS * GRID_SIZE) / 2;
      return {
        px: offsetX + gridX * GRID_SIZE + GRID_SIZE / 2,
        py: offsetY + gridY * GRID_SIZE + GRID_SIZE / 2,
      };
    }, []);

    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const resize = () => {
        canvas.width = canvas.offsetWidth;
        canvas.height = canvas.offsetHeight;
      };
      resize();
      const ro = new ResizeObserver(resize);
      ro.observe(canvas);

      let phase = 0;

      const drawComponent = (comp: CircuitComp, px: number, py: number, lit: boolean, animPhase: number) => {
        ctx.save();
        ctx.translate(px, py);

        switch (comp.type) {
          case 'battery': {
            ctx.strokeStyle = comp.connected ? '#10b981' : 'rgba(226,232,240,0.7)';
            ctx.lineWidth = 2;
            // Battery symbol
            ctx.beginPath();
            ctx.moveTo(-20, 0); ctx.lineTo(-8, 0);
            ctx.moveTo(8, 0); ctx.lineTo(20, 0);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(-8, -12); ctx.lineTo(-8, 12);
            ctx.lineWidth = 4;
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(8, -7); ctx.lineTo(8, 7);
            ctx.lineWidth = 2;
            ctx.stroke();
            ctx.fillStyle = comp.connected ? '#10b981' : 'rgba(226,232,240,0.6)';
            ctx.font = 'bold 8px Inter';
            ctx.textAlign = 'center';
            ctx.fillText('9V', 0, 22);
            break;
          }
          case 'resistor': {
            ctx.strokeStyle = comp.connected ? '#F59E0B' : 'rgba(226,232,240,0.7)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(-22, 0); ctx.lineTo(-12, 0);
            ctx.stroke();
            ctx.beginPath();
            ctx.roundRect(-12, -8, 24, 16, 2);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(12, 0); ctx.lineTo(22, 0);
            ctx.stroke();
            ctx.fillStyle = comp.connected ? '#F59E0B' : 'rgba(226,232,240,0.5)';
            ctx.font = '8px Inter';
            ctx.textAlign = 'center';
            ctx.fillText('100Ω', 0, 22);
            break;
          }
          case 'led': {
            const ledColor = lit ? '#10b981' : 'rgba(100,150,100,0.6)';
            if (lit) {
              const glow = ctx.createRadialGradient(0, 0, 2, 0, 0, 28 + Math.sin(animPhase) * 4);
              glow.addColorStop(0, `rgba(16,185,129,0.6)`);
              glow.addColorStop(1, 'rgba(16,185,129,0)');
              ctx.fillStyle = glow;
              ctx.beginPath();
              ctx.arc(0, 0, 28 + Math.sin(animPhase) * 4, 0, Math.PI * 2);
              ctx.fill();
            }
            ctx.strokeStyle = ledColor;
            ctx.lineWidth = 2;
            // LED symbol: triangle + bar
            ctx.beginPath();
            ctx.moveTo(-20, 0); ctx.lineTo(-8, 0);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(-8, -10);
            ctx.lineTo(8, 0);
            ctx.lineTo(-8, 10);
            ctx.closePath();
            ctx.fillStyle = lit ? `rgba(16,185,129,${0.7 + Math.sin(animPhase) * 0.2})` : 'rgba(100,150,100,0.2)';
            ctx.fill();
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(8, -10); ctx.lineTo(8, 10);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(8, 0); ctx.lineTo(20, 0);
            ctx.stroke();
            ctx.fillStyle = lit ? '#10b981' : 'rgba(226,232,240,0.5)';
            ctx.font = '8px Inter';
            ctx.textAlign = 'center';
            ctx.fillText('LED', 0, 22);
            break;
          }
          case 'wire-h': {
            ctx.strokeStyle = comp.connected ? '#6366F1' : 'rgba(226,232,240,0.4)';
            ctx.lineWidth = 3;
            ctx.setLineDash(comp.connected ? [] : [4, 4]);
            ctx.beginPath();
            ctx.moveTo(-26, 0); ctx.lineTo(26, 0);
            ctx.stroke();
            ctx.setLineDash([]);
            ctx.fillStyle = 'rgba(226,232,240,0.3)';
            ctx.font = '8px Inter';
            ctx.textAlign = 'center';
            ctx.fillText('wire', 0, 16);
            break;
          }
          case 'wire-v': {
            ctx.strokeStyle = comp.connected ? '#6366F1' : 'rgba(226,232,240,0.4)';
            ctx.lineWidth = 3;
            ctx.setLineDash(comp.connected ? [] : [4, 4]);
            ctx.beginPath();
            ctx.moveTo(0, -26); ctx.lineTo(0, 26);
            ctx.stroke();
            ctx.setLineDash([]);
            break;
          }
        }

        // Snap indicator
        if (!comp.connected) {
          ctx.beginPath();
          ctx.arc(0, -22, 4, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(99,102,241,0.5)';
          ctx.fill();
        }

        ctx.restore();
      };

      const draw = () => {
        const w = canvas.width;
        const h = canvas.height;
        phase += 0.05;
        setGlowPhase(phase);

        ctx.clearRect(0, 0, w, h);

        const offsetX = (w - COLS * GRID_SIZE) / 2;
        const offsetY = (h - ROWS * GRID_SIZE) / 2;

        // Draw grid dots
        for (let col = 0; col <= COLS; col++) {
          for (let row = 0; row <= ROWS; row++) {
            ctx.beginPath();
            ctx.arc(offsetX + col * GRID_SIZE, offsetY + row * GRID_SIZE, 2, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(255,255,255,0.08)';
            ctx.fill();
          }
        }

        // Draw target position outlines
        for (const [id, pos] of Object.entries(TARGET_POSITIONS)) {
          const { px, py } = getPixel(pos.x, pos.y, canvas);
          ctx.save();
          ctx.beginPath();
          ctx.roundRect(px - 28, py - 18, 56, 36, 4);
          ctx.strokeStyle = 'rgba(99,102,241,0.2)';
          ctx.lineWidth = 1;
          ctx.setLineDash([3, 3]);
          ctx.stroke();
          ctx.setLineDash([]);
          ctx.restore();
          void id;
        }

        // Draw circuit wire path when complete
        const compsSnap = INITIAL_COMPONENTS.map(c => {
          const pos = pixelPos.current[c.id];
          return pos ? { ...c, px: pos.px, py: pos.py } : null;
        }).filter(Boolean);

        setComponents((prev) => {
          // Draw using current state
          const lit = prev.every(c => c.connected);
          for (const comp of prev) {
            const storedPos = pixelPos.current[comp.id];
            let px: number;
            let py: number;

            if (storedPos) {
              px = storedPos.px;
              py = storedPos.py;
            } else {
              // Default position: stacked on right side as palette
              const idx = INITIAL_COMPONENTS.findIndex(c => c.id === comp.id);
              const palOffsetX = w - 80;
              const palOffsetY = 40 + idx * 70;
              px = palOffsetX;
              py = palOffsetY;
              pixelPos.current[comp.id] = { px, py };
            }
            drawComponent(comp, px, py, lit, phase);
          }

          // Draw circuit path
          if (lit && compsSnap.length > 0) {
            const battComp = prev.find(c => c.type === 'battery');
            const ledComp = prev.find(c => c.type === 'led');
            if (battComp && ledComp) {
              const bp = pixelPos.current[battComp.id];
              const lp = pixelPos.current[ledComp.id];
              if (bp && lp) {
                ctx.save();
                ctx.strokeStyle = `rgba(99,102,241,${0.6 + Math.sin(phase) * 0.2})`;
                ctx.lineWidth = 2;
                ctx.shadowColor = '#6366F1';
                ctx.shadowBlur = 6;
                ctx.beginPath();
                // Top wire
                ctx.moveTo(bp.px, bp.py - 30);
                ctx.lineTo(lp.px, bp.py - 30);
                // Bottom wire
                ctx.moveTo(bp.px, bp.py + 30);
                ctx.lineTo(lp.px, lp.py + 30);
                ctx.stroke();
                ctx.restore();
              }
            }
          }

          return prev;
        });

        // Multimeter display
        setComponents((prev) => {
          const complete = prev.every(c => c.connected);
          if (complete) {
            const resistance = 100;
            const volts = 9;
            const amps = volts / resistance;
            setCurrent(amps * 1000); // mA

            const mX = 16;
            const mY = h - 100;
            ctx.save();
            ctx.beginPath();
            ctx.roundRect(mX, mY, 110, 80, 8);
            ctx.fillStyle = 'rgba(5,10,20,0.9)';
            ctx.fill();
            ctx.strokeStyle = 'rgba(99,102,241,0.4)';
            ctx.lineWidth = 1;
            ctx.stroke();
            ctx.fillStyle = 'rgba(99,102,241,0.7)';
            ctx.font = 'bold 8px Inter';
            ctx.textAlign = 'center';
            ctx.fillText('MULTIMETER', mX + 55, mY + 14);
            ctx.fillStyle = '#10b981';
            ctx.font = 'bold 14px Sora';
            ctx.fillText(`${volts}V`, mX + 30, mY + 40);
            ctx.fillStyle = '#F59E0B';
            ctx.fillText(`${(amps * 1000).toFixed(0)}mA`, mX + 82, mY + 40);
            ctx.fillStyle = 'rgba(226,232,240,0.5)';
            ctx.font = '8px Inter';
            ctx.fillText('Voltage', mX + 30, mY + 54);
            ctx.fillText('Current', mX + 82, mY + 54);
            ctx.restore();
          }
          return prev;
        });

        animRef.current = requestAnimationFrame(draw);
        void glowPhase; void current; void compsSnap;
      };

      draw();
      return () => {
        cancelAnimationFrame(animRef.current);
        ro.disconnect();
      };
    }, [getPixel, glowPhase, current]);

    const getCanvasPos = (e: React.MouseEvent | React.TouchEvent, canvas: HTMLCanvasElement) => {
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      if ('touches' in e) {
        const touch = e.touches[0] || e.changedTouches[0];
        return {
          x: (touch.clientX - rect.left) * scaleX,
          y: (touch.clientY - rect.top) * scaleY,
        };
      }
      return {
        x: (e.clientX - rect.left) * scaleX,
        y: (e.clientY - rect.top) * scaleY,
      };
    };

    const handleMouseDown = useCallback((e: React.MouseEvent) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const { x, y } = getCanvasPos(e, canvas);

      // Find clicked component
      for (const comp of components) {
        const pos = pixelPos.current[comp.id];
        if (!pos) continue;
        const dx = x - pos.px;
        const dy = y - pos.py;
        if (Math.abs(dx) < 30 && Math.abs(dy) < 30) {
          dragging.current = { id: comp.id, offsetX: dx, offsetY: dy };
          break;
        }
      }
    }, [components]);

    const handleMouseMove = useCallback((e: React.MouseEvent) => {
      if (!dragging.current) return;
      const canvas = canvasRef.current;
      if (!canvas) return;
      const { x, y } = getCanvasPos(e, canvas);
      pixelPos.current[dragging.current.id] = {
        px: x - dragging.current.offsetX,
        py: y - dragging.current.offsetY,
      };
    }, []);

    const handleMouseUp = useCallback(() => {
      if (!dragging.current) return;
      const canvas = canvasRef.current;
      if (!canvas) return;

      const compId = dragging.current.id;
      const pos = pixelPos.current[compId];
      if (!pos) { dragging.current = null; return; }

      // Snap to nearest grid position
      const snap = snapToGrid(pos.px, pos.py, canvas);
      const { px, py } = getPixel(snap.x, snap.y, canvas);
      pixelPos.current[compId] = { px, py };

      // Check if snapped to correct position
      const target = TARGET_POSITIONS[compId];
      const isConnected = target && snap.x === target.x && snap.y === target.y;

      setComponents((prev) => {
        const updated = prev.map((c) =>
          c.id === compId ? { ...c, x: snap.x, y: snap.y, connected: isConnected ?? false } : c
        );
        const complete = checkComplete(updated);
        if (complete && !wasComplete.current) {
          wasComplete.current = true;
          setIsComplete(true);
          onCircuitComplete(true, 'Circuit completed! Battery, resistor, LED and wires are all correctly connected. The LED is now glowing!');
        } else if (!complete && wasComplete.current) {
          wasComplete.current = false;
          setIsComplete(false);
        }
        return updated;
      });

      dragging.current = null;
    }, [snapToGrid, getPixel, checkComplete, onCircuitComplete]);

    return (
      <div className="flex flex-col w-full h-full">
        <canvas
          ref={canvasRef}
          className="flex-1 w-full min-h-0"
          style={{ cursor: dragging.current ? 'grabbing' : 'grab' }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        />
        <div className="border-t border-glass px-4 py-2 flex items-center justify-between">
          <div className="flex items-center gap-3 text-xs font-inter text-slate/60">
            <span>Drag components to the grid positions</span>
          </div>
          {isComplete && (
            <div className="flex items-center gap-2 text-xs text-emerald-lab font-medium">
              <span className="pulse-dot" />
              <span>Circuit Complete! {current.toFixed(0)}mA flowing</span>
            </div>
          )}
        </div>
      </div>
    );
  }
);

CircuitCanvas.displayName = 'CircuitCanvas';
export default CircuitCanvas;
