import { useRef, useEffect } from 'react';

interface ChartProps {
  data: number[];
  threshold: number;
  safeMax: number;
  label: string;
  width?: number;
  height?: number;
}

export function Chart({ data, threshold, safeMax, label, width = 400, height = 160 }: ChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    const pad = { top: 20, right: 10, bottom: 25, left: 40 };
    const cw = width - pad.left - pad.right;
    const ch = height - pad.top - pad.bottom;

    // Background
    ctx.fillStyle = '#0a0e1a';
    ctx.fillRect(0, 0, width, height);

    // Grid
    ctx.strokeStyle = '#1a2040';
    ctx.lineWidth = 0.5;
    for (let i = 0; i <= 4; i++) {
      const y = pad.top + (ch / 4) * i;
      ctx.beginPath();
      ctx.moveTo(pad.left, y);
      ctx.lineTo(pad.left + cw, y);
      ctx.stroke();
    }

    // Y-axis labels
    ctx.fillStyle = '#6b7db3';
    ctx.font = '10px monospace';
    ctx.textAlign = 'right';
    for (let i = 0; i <= 4; i++) {
      const val = 100 - (i * 25);
      const y = pad.top + (ch / 4) * i;
      ctx.fillText(val.toString(), pad.left - 5, y + 3);
    }

    // Threshold line (red dashed)
    const threshY = pad.top + ch * (1 - threshold / 100);
    ctx.strokeStyle = '#ff0040';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(pad.left, threshY);
    ctx.lineTo(pad.left + cw, threshY);
    ctx.stroke();

    // Safe line (amber dashed)
    const safeY = pad.top + ch * (1 - safeMax / 100);
    ctx.strokeStyle = '#ffa500';
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(pad.left, safeY);
    ctx.lineTo(pad.left + cw, safeY);
    ctx.stroke();
    ctx.setLineDash([]);

    // Data line
    if (data.length > 1) {
      const maxPoints = 150;
      const points = data.slice(-maxPoints);
      const step = cw / (maxPoints - 1);

      ctx.strokeStyle = '#00d4ff';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      points.forEach((val, i) => {
        const x = pad.left + i * step;
        const y = pad.top + ch * (1 - val / 100);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();

      // Glow effect
      ctx.strokeStyle = 'rgba(0, 212, 255, 0.15)';
      ctx.lineWidth = 4;
      ctx.beginPath();
      points.forEach((val, i) => {
        const x = pad.left + i * step;
        const y = pad.top + ch * (1 - val / 100);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();
    }

    // Label
    ctx.fillStyle = '#6b7db3';
    ctx.font = '11px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(label, width / 2, height - 5);

    // Current value
    if (data.length > 0) {
      const current = data[data.length - 1];
      const color = current >= threshold ? '#ff0040' : current >= safeMax ? '#ffa500' : '#00ff41';
      ctx.fillStyle = color;
      ctx.font = 'bold 12px monospace';
      ctx.textAlign = 'right';
      ctx.fillText(current.toFixed(1) + '%', width - pad.right, pad.top - 5);
    }
  }, [data, threshold, safeMax, label, width, height]);

  return (
    <div className="chart">
      <canvas
        ref={canvasRef}
        style={{ width, height, borderRadius: 6 }}
      />
    </div>
  );
}
