import { useEffect, useRef, useState } from 'react';

const W = 560;
const H = 260;
const CX = 130; // center of rotating arms
const CY = 130;
const WAVE_X_START = 280;
const WAVE_WIDTH = 260;

export default function FourierViz() {
  const canvasRef = useRef(null);
  const frameRef = useRef(null);
  const tRef = useRef(0);
  const [terms, setTerms] = useState(3);
  const [running, setRunning] = useState(true);
  const trailRef = useRef([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    // Scale for device pixel ratio
    const dpr = window.devicePixelRatio || 1;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    canvas.style.width = W + 'px';
    canvas.style.height = H + 'px';
    ctx.scale(dpr, dpr);

    const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const colors = {
      bg:        isDark ? '#1a1816' : '#fdfcfa',
      arm:       isDark ? '#4a4845' : '#c8c2b8',
      armTip:    isDark ? '#8a8480' : '#9a9490',
      dot:       isDark ? '#e8956d' : '#b85c38',
      wave:      isDark ? '#e8956d' : '#b85c38',
      waveOld:   isDark ? '#5a3828' : '#e8c4b0',
      grid:      isDark ? '#2a2826' : '#ede8e0',
      text:      isDark ? '#6a6460' : '#aaa098',
    };

    const SPEED = 0.025;

    function draw() {
      ctx.clearRect(0, 0, W, H);

      // Wave area grid line (center)
      ctx.strokeStyle = colors.grid;
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(WAVE_X_START, CY);
      ctx.lineTo(W - 10, CY);
      ctx.stroke();
      ctx.setLineDash([]);

      // Draw Fourier arms
      let x = CX, y = CY;
      const oddHarmonics = Array.from({ length: terms }, (_, i) => 2 * i + 1);

      oddHarmonics.forEach((n, i) => {
        const r = (4 / Math.PI) * (80 / n); // radius scaled
        const angle = n * tRef.current - Math.PI / 2;
        const nx = x + r * Math.cos(angle);
        const ny = y + r * Math.sin(angle);

        // Circle
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.strokeStyle = colors.arm;
        ctx.lineWidth = 0.75;
        ctx.stroke();

        // Arm
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(nx, ny);
        ctx.strokeStyle = colors.armTip;
        ctx.lineWidth = 1.5;
        ctx.stroke();

        x = nx;
        y = ny;
      });

      // Tip dot
      ctx.beginPath();
      ctx.arc(x, y, 3, 0, Math.PI * 2);
      ctx.fillStyle = colors.dot;
      ctx.fill();

      // Connecting line to wave
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(WAVE_X_START, y);
      ctx.strokeStyle = colors.grid;
      ctx.lineWidth = 0.75;
      ctx.setLineDash([3, 3]);
      ctx.stroke();
      ctx.setLineDash([]);

      // Add current y to trail
      trailRef.current.unshift(y);
      if (trailRef.current.length > WAVE_WIDTH - 4) {
        trailRef.current.pop();
      }

      // Draw wave trail
      const trail = trailRef.current;
      if (trail.length > 1) {
        ctx.beginPath();
        ctx.moveTo(WAVE_X_START, trail[0]);
        for (let i = 1; i < trail.length; i++) {
          ctx.lineTo(WAVE_X_START + i, trail[i]);
        }
        ctx.strokeStyle = colors.wave;
        ctx.lineWidth = 1.75;
        ctx.stroke();
      }

      // Label
      ctx.fillStyle = colors.text;
      ctx.font = '11px "JetBrains Mono", monospace';
      ctx.fillText(`${terms} term${terms > 1 ? 's' : ''}`, WAVE_X_START + 4, 18);

      if (running) {
        tRef.current += SPEED;
      }
      frameRef.current = requestAnimationFrame(draw);
    }

    frameRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(frameRef.current);
  }, [terms, running]);

  // Reset trail when terms change
  useEffect(() => {
    trailRef.current = [];
  }, [terms]);

  return (
    <div className="widget-island" style={{ padding: '1.25rem' }}>
      <canvas
        ref={canvasRef}
        style={{ width: '100%', maxWidth: W + 'px', display: 'block', borderRadius: '4px' }}
      />
      <div style={{
        marginTop: '0.875rem',
        display: 'flex',
        alignItems: 'center',
        gap: '1.5rem',
        flexWrap: 'wrap',
        fontSize: '13px',
        fontFamily: 'inherit',
      }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ color: 'inherit', opacity: 0.7 }}>Terms:</span>
          <input
            type="range"
            min={1}
            max={11}
            step={1}
            value={terms}
            onChange={e => setTerms(Number(e.target.value))}
            style={{ width: '120px' }}
          />
          <span style={{ fontVariantNumeric: 'tabular-nums', opacity: 0.9 }}>{terms}</span>
        </label>
        <button
          onClick={() => setRunning(r => !r)}
          style={{
            fontFamily: 'inherit',
            fontSize: '11px',
            padding: '2px 12px',
            border: '1px solid #e8956d',
            borderRadius: '2px',
            background: 'transparent',
            cursor: 'pointer',
            letterSpacing: '0.05em',
            color: '#e8956d',
            opacity: 0.8,
          }}
        >
          {running ? 'pause' : 'play'}
        </button>
      </div>
    </div>
  );
}
