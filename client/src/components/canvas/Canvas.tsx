import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

type Tool = "pencil" | "eraser";

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

// Bresenham line to prevent gaps during fast drags
function lineCells(x0: number, y0: number, x1: number, y1: number) {
  const pts: Array<{ x: number; y: number }> = [];
  let dx = Math.abs(x1 - x0);
  let dy = Math.abs(y1 - y0);
  let sx = x0 < x1 ? 1 : -1;
  let sy = y0 < y1 ? 1 : -1;
  let err = dx - dy;
  let x = x0;
  let y = y0;

  while (true) {
    pts.push({ x, y });
    if (x === x1 && y === y1) break;

    const e2 = 2 * err;
    if (e2 > -dy) {
      err -= dy;
      x += sx;
    }
    if (e2 < dx) {
      err += dx;
      y += sy;
    }
  }

  return pts;
}

function hexToRgba(hex: string) {
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return { r, g, b, a: 255 };
}

/**
 * Fast pixel canvas (single bitmap):
 * - ImageData in a ref
 * - Pointer capture
 * - Bresenham interpolation
 * - 1 draw per animation frame
 */
function PixelCanvas({
  gridW,
  gridH,
  tool,
  color,
  // allow parent to call actions
  onReady,
  className,
}: {
  gridW: number;
  gridH: number;
  tool: Tool;
  color: string;
  onReady?: (api: { clear: () => void; exportPng: () => void }) => void;
  className?: string;
}) {
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const viewRef = useRef<HTMLCanvasElement | null>(null);
  const [viewSize, setViewSize] = useState(720);

  const offscreen = useMemo(() => {
    const c = document.createElement("canvas");
    c.width = gridW;
    c.height = gridH;
    return c;
  }, [gridW, gridH]);

  const offCtxRef = useRef<CanvasRenderingContext2D | null>(null);
  const imgRef = useRef<ImageData | null>(null);

  const isDrawingRef = useRef(false);
  const lastCellRef = useRef<{ x: number; y: number } | null>(null);
  const rafRef = useRef<number | null>(null);

  const scheduleDraw = useCallback(() => {
    if (rafRef.current != null) return;

    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = null;

      const view = viewRef.current;
      const offCtx = offCtxRef.current;
      const img = imgRef.current;
      if (!view || !offCtx || !img) return;

      offCtx.putImageData(img, 0, 0);

      const vctx = view.getContext("2d");
      if (!vctx) return;

      vctx.imageSmoothingEnabled = false;
      vctx.clearRect(0, 0, view.width, view.height);
      vctx.drawImage(offscreen, 0, 0, view.width, view.height);
    });
  }, [offscreen]);

  const fillTransparentCheckerBase = useCallback(() => {
    // MVP: fill white; checkerboard is handled by CSS behind the canvas like Pixilart.
    const img = imgRef.current;
    if (!img) return;

    for (let i = 0; i < img.data.length; i += 4) {
      img.data[i + 0] = 255;
      img.data[i + 1] = 255;
      img.data[i + 2] = 255;
      img.data[i + 3] = 255;
    }
  }, []);

  const setCell = useCallback(
    (x: number, y: number) => {
      const img = imgRef.current;
      if (!img) return;

      const idx = (y * gridW + x) * 4;

      if (tool === "eraser") {
        // erase to white for MVP
        img.data[idx + 0] = 255;
        img.data[idx + 1] = 255;
        img.data[idx + 2] = 255;
        img.data[idx + 3] = 255;
      } else {
        const rgba = hexToRgba(color);
        img.data[idx + 0] = rgba.r;
        img.data[idx + 1] = rgba.g;
        img.data[idx + 2] = rgba.b;
        img.data[idx + 3] = rgba.a;
      }
    },
    [gridW, tool, color],
  );

  const getCellFromPointer = useCallback(
    (e: PointerEvent) => {
      const canvas = viewRef.current;
      if (!canvas) return null;

      const rect = canvas.getBoundingClientRect();
      const px = e.clientX - rect.left;
      const py = e.clientY - rect.top;

      const gx = Math.floor((px / rect.width) * gridW);
      const gy = Math.floor((py / rect.height) * gridH);

      return {
        x: clamp(gx, 0, gridW - 1),
        y: clamp(gy, 0, gridH - 1),
      };
    },
    [gridW, gridH],
  );

  const clear = useCallback(() => {
    fillTransparentCheckerBase();
    scheduleDraw();
  }, [fillTransparentCheckerBase, scheduleDraw]);

  const exportPng = useCallback(() => {
    const offCtx = offCtxRef.current;
    const img = imgRef.current;
    if (!offCtx || !img) return;

    offCtx.putImageData(img, 0, 0);
    const dataUrl = offscreen.toDataURL("image/png");

    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = `pixelit-${gridW}x${gridH}.png`;
    a.click();
  }, [gridW, gridH, offscreen]);

  useEffect(() => {
    onReady?.({ clear, exportPng });
  }, [onReady, clear, exportPng]);

  // init buffers
  useEffect(() => {
    offCtxRef.current = offscreen.getContext("2d", {
      willReadFrequently: true,
    });
    imgRef.current = new ImageData(gridW, gridH);

    fillTransparentCheckerBase();
    scheduleDraw();

    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
  }, [gridW, gridH, offscreen, fillTransparentCheckerBase, scheduleDraw]);

  // responsive sizing based on wrapper width
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;

    const ro = new ResizeObserver(() => {
      const w = el.clientWidth;
      // keep some padding like pixilart
      const size = clamp(Math.floor(w), 360, 900);
      setViewSize(size);
    });

    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // pointer events
  useEffect(() => {
    const canvas = viewRef.current;
    if (!canvas) return;

    const onDown = (e: PointerEvent) => {
      isDrawingRef.current = true;
      canvas.setPointerCapture(e.pointerId);

      const cell = getCellFromPointer(e);
      if (!cell) return;

      lastCellRef.current = cell;
      setCell(cell.x, cell.y);
      scheduleDraw();
    };

    const onMove = (e: PointerEvent) => {
      if (!isDrawingRef.current) return;

      const cell = getCellFromPointer(e);
      if (!cell) return;

      const last = lastCellRef.current;
      if (!last) {
        lastCellRef.current = cell;
        setCell(cell.x, cell.y);
        scheduleDraw();
        return;
      }

      if (cell.x === last.x && cell.y === last.y) return;

      const cells = lineCells(last.x, last.y, cell.x, cell.y);
      for (const c of cells) setCell(c.x, c.y);

      lastCellRef.current = cell;
      scheduleDraw();
    };

    const onUp = (e: PointerEvent) => {
      isDrawingRef.current = false;
      lastCellRef.current = null;
      try {
        canvas.releasePointerCapture(e.pointerId);
      } catch {}
    };

    canvas.addEventListener("pointerdown", onDown);
    canvas.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);

    return () => {
      canvas.removeEventListener("pointerdown", onDown);
      canvas.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
    };
  }, [getCellFromPointer, setCell, scheduleDraw]);

  return (
    <div ref={wrapRef} className={className} style={{ width: "100%" }}>
      <div className="px-canvasShell">
        <canvas
          ref={viewRef}
          width={viewSize}
          height={viewSize}
          className="px-canvas"
          style={{
            width: "100%",
            height: "auto",
            display: "block",
            imageRendering: "pixelated",
            touchAction: "none",
          }}
        />
      </div>
    </div>
  );
}

export default function DrawPage() {
  // MVP state (wire these to your real tools later)
  const [tool, setTool] = useState<Tool>("pencil");
  const [color, setColor] = useState("#000000");
  const [gridSize, setGridSize] = useState(100);

  const canvasApiRef = useRef<{
    clear: () => void;
    exportPng: () => void;
  } | null>(null);

  return (
    <div className="px-app">
      <style>{css}</style>

      {/* TOP BAR */}
      <header className="px-topbar">
        <div className="px-topLeft">
          <button className="px-menuBtn">☰</button>
          <div className="px-topLink">FILE</div>
          <div className="px-topLink">EDIT</div>
          <div className="px-topLink">VIEW</div>
        </div>

        <div className="px-logo">
          <span className="px-heart">❤</span>
          <span className="px-brand">PIXELIT</span>
        </div>

        <div className="px-topRight">
          <button
            className="px-primaryBtn"
            onClick={() => canvasApiRef.current?.exportPng()}
          >
            SAVE DRAWING
          </button>
        </div>
      </header>

      {/* MAIN */}
      <div className="px-body">
        {/* LEFT TOOLBAR */}
        <aside className="px-leftbar">
          <div className="px-leftTitle">TOOLS</div>

          <button
            className={`px-toolBtn ${tool === "pencil" ? "isActive" : ""}`}
            onClick={() => setTool("pencil")}
            title="Pencil"
          >
            ✏
          </button>

          <button
            className={`px-toolBtn ${tool === "eraser" ? "isActive" : ""}`}
            onClick={() => setTool("eraser")}
            title="Eraser"
          >
            ⌫
          </button>

          <div className="px-leftDivider" />

          <button
            className="px-toolBtn"
            onClick={() => canvasApiRef.current?.clear()}
            title="Clear"
          >
            🧹
          </button>

          <div className="px-leftDivider" />

          <div className="px-swatchBlock" title="Color">
            <div className="px-swatch" style={{ background: color }} />
            <input
              className="px-colorInput"
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              aria-label="Color picker"
            />
          </div>
        </aside>

        {/* CENTER CANVAS AREA */}
        <main className="px-center">
          <div className="px-canvasTopRow">
            <div className="px-inlineGroup">
              <span className="px-label">PENCIL</span>
              <label className="px-check">
                <input type="checkbox" disabled />
                <span>PIXEL PERFECT</span>
              </label>
              <label className="px-check">
                <input type="checkbox" disabled />
                <span>MIRROR X</span>
              </label>
              <label className="px-check">
                <input type="checkbox" disabled />
                <span>MIRROR Y</span>
              </label>
            </div>

            <div className="px-inlineGroup">
              <span className="px-label">SIZE</span>
              <select
                className="px-select"
                value={gridSize}
                onChange={(e) => setGridSize(parseInt(e.target.value, 10))}
              >
                {[50, 75, 100, 150, 200, 256].map((n) => (
                  <option key={n} value={n}>
                    {n}×{n}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="px-canvasArea">
            <PixelCanvas
              gridW={gridSize}
              gridH={gridSize}
              tool={tool}
              color={color}
              onReady={(api) => (canvasApiRef.current = api)}
              className="px-canvasWrap"
            />
          </div>
        </main>

        {/* RIGHT SIDEBAR */}
        <aside className="px-rightbar">
          <div className="px-rightTabs">
            <div className="px-rightTab isActive">PREVIEW</div>
            <div className="px-rightTab">LAYER</div>
            <div className="px-rightTab">COLORS</div>
          </div>

          <div className="px-panel">
            <div className="px-panelHeader">NAVIGATION</div>
            <div className="px-previewBox" />
            <div className="px-sliderRow">
              <span>100%</span>
              <input type="range" min={10} max={400} defaultValue={100} />
            </div>
          </div>

          <div className="px-panel">
            <div className="px-panelHeader">LAYERS (1)</div>
            <div className="px-layerItem">
              <div className="px-layerDot" />
              <div className="px-layerName">BACKGROUND</div>
              <div className="px-layerLock">🔒</div>
            </div>
          </div>

          <div className="px-panel">
            <div className="px-panelHeader">PALETTE</div>
            <div className="px-palette">
              {palette.map((c) => (
                <button
                  key={c}
                  className="px-paletteSwatch"
                  style={{ background: c }}
                  onClick={() => setColor(c)}
                  title={c}
                />
              ))}
            </div>
          </div>
        </aside>
      </div>

      {/* BOTTOM FRAMES BAR */}
      <footer className="px-bottombar">
        <div className="px-bottomLeft">GIF FRAMES</div>
        <button className="px-bottomBtn">＋ ADD FRAME</button>
        <button className="px-bottomBtn">⧉ COPY FRAME</button>
        <button className="px-bottomBtn">▶ PREVIEW</button>
        <div className="px-bottomSpacer" />
        <div className="px-bottomNote">MVP timeline bar (wire this later)</div>
      </footer>
    </div>
  );
}

const palette = [
  "#000000",
  "#444444",
  "#888888",
  "#ffffff",
  "#ff3b30",
  "#ff9500",
  "#ffcc00",
  "#34c759",
  "#32ade6",
  "#007aff",
  "#5856d6",
  "#ff2d55",
];

const css = `
  :root{
    --bg:#1f1f1f;
    --bg2:#2a2a2a;
    --panel:#2f2f2f;
    --line:#3b3b3b;
    --text:#eaeaea;
    --muted:#bdbdbd;
    --accent:#2d7dff;
  }
  *{ box-sizing:border-box; }
  html,body,#root{ height:100%; }
  body{ margin:0; background:var(--bg); color:var(--text); font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial; }

  .px-app{
    height:100%;
    display:grid;
    grid-template-rows: 54px 1fr 44px;
  }

  .px-topbar{
    display:grid;
    grid-template-columns: 1fr auto 1fr;
    align-items:center;
    padding: 0 12px;
    background: #242424;
    border-bottom:1px solid var(--line);
  }
  .px-topLeft{ display:flex; gap:12px; align-items:center; }
  .px-menuBtn{
    width:34px; height:34px;
    border:1px solid var(--line);
    background:var(--bg2);
    color:var(--text);
    border-radius:6px;
    cursor:pointer;
  }
  .px-topLink{ font-size:12px; letter-spacing:.08em; color:var(--muted); }
  .px-logo{ display:flex; align-items:center; gap:10px; }
  .px-heart{ color:#ff2d55; font-size:18px; }
  .px-brand{ letter-spacing:.18em; font-weight:800; font-size:14px; }
  .px-topRight{ display:flex; justify-content:flex-end; }
  .px-primaryBtn{
    background: var(--accent);
    border: none;
    color: white;
    padding: 10px 12px;
    border-radius: 8px;
    font-weight:700;
    cursor:pointer;
  }

  .px-body{
    display:grid;
    grid-template-columns: 72px 1fr 320px;
    min-height:0;
  }

  .px-leftbar{
    background: #232323;
    border-right:1px solid var(--line);
    padding:10px 8px;
    display:flex;
    flex-direction:column;
    gap:10px;
    align-items:center;
  }
  .px-leftTitle{
    width:100%;
    text-align:center;
    font-size:11px;
    color:var(--muted);
    letter-spacing:.12em;
    padding:6px 0;
    border-bottom:1px solid var(--line);
  }
  .px-toolBtn{
    width:46px; height:46px;
    border-radius:10px;
    border:1px solid var(--line);
    background: var(--bg2);
    color: var(--text);
    font-size:18px;
    cursor:pointer;
  }
  .px-toolBtn.isActive{
    outline:2px solid var(--accent);
    border-color: var(--accent);
  }
  .px-leftDivider{
    width:100%;
    height:1px;
    background: var(--line);
    margin:6px 0;
  }
  .px-swatchBlock{
    width:46px;
    display:flex;
    flex-direction:column;
    gap:6px;
    align-items:center;
  }
  .px-swatch{
    width:46px; height:46px;
    border-radius:10px;
    border:1px solid var(--line);
  }
  .px-colorInput{
    width:46px;
    height:24px;
    background:transparent;
    border:none;
    cursor:pointer;
  }

  .px-center{
    min-height:0;
    display:grid;
    grid-template-rows: 44px 1fr;
    background: #1c1c1c;
  }
  .px-canvasTopRow{
    display:flex;
    justify-content:space-between;
    align-items:center;
    gap:10px;
    padding: 8px 12px;
    border-bottom:1px solid var(--line);
    background:#242424;
    min-width:0;
  }
  .px-inlineGroup{
    display:flex;
    gap:14px;
    align-items:center;
    flex-wrap:wrap;
    min-width:0;
  }
  .px-label{
    font-size:11px;
    letter-spacing:.12em;
    color:var(--muted);
    font-weight:800;
  }
  .px-check{
    display:flex;
    gap:6px;
    align-items:center;
    font-size:12px;
    color:var(--muted);
  }
  .px-select{
    background: var(--bg2);
    border:1px solid var(--line);
    color: var(--text);
    padding:6px 10px;
    border-radius:8px;
    font-weight:600;
  }

  .px-canvasArea{
    min-height:0;
    padding: 14px;
    display:flex;
    justify-content:center;
    align-items:center;
  }

  /* Pixilart-like checkerboard around the canvas */
  .px-canvasShell{
    width:100%;
    background:
      linear-gradient(45deg, #d7d7d7 25%, transparent 25%),
      linear-gradient(-45deg, #d7d7d7 25%, transparent 25%),
      linear-gradient(45deg, transparent 75%, #d7d7d7 75%),
      linear-gradient(-45deg, transparent 75%, #d7d7d7 75%);
    background-size: 18px 18px;
    background-position: 0 0, 0 9px, 9px -9px, -9px 0px;
    border: 1px solid var(--line);
    border-radius: 10px;
    padding: 10px;
    box-shadow: 0 6px 18px rgba(0,0,0,.35);
  }
  .px-canvas{
    border-radius: 8px;
    border: 1px solid rgba(0,0,0,.25);
    background: transparent;
  }

  .px-rightbar{
    background: #232323;
    border-left:1px solid var(--line);
    min-height:0;
    display:flex;
    flex-direction:column;
  }
  .px-rightTabs{
    display:grid;
    grid-template-columns: 1fr 1fr 1fr;
    border-bottom:1px solid var(--line);
    background:#242424;
  }
  .px-rightTab{
    padding:10px 8px;
    text-align:center;
    font-size:12px;
    color:var(--muted);
    letter-spacing:.08em;
    cursor:default;
    border-right:1px solid var(--line);
  }
  .px-rightTab:last-child{ border-right:none; }
  .px-rightTab.isActive{
    color:var(--text);
    background:#2b2b2b;
    font-weight:800;
  }

  .px-panel{
    padding: 10px;
    border-bottom:1px solid var(--line);
  }
  .px-panelHeader{
    font-size:11px;
    letter-spacing:.12em;
    color:var(--muted);
    font-weight:800;
    margin-bottom:10px;
  }
  .px-previewBox{
    height: 120px;
    background: #1a1a1a;
    border:1px solid var(--line);
    border-radius:8px;
    margin-bottom:10px;
  }
  .px-sliderRow{
    display:flex;
    gap:10px;
    align-items:center;
    color:var(--muted);
    font-size:12px;
  }
  .px-sliderRow input{ width:100%; }

  .px-layerItem{
    display:flex;
    align-items:center;
    gap:10px;
    padding:10px;
    border:1px solid var(--line);
    border-radius:8px;
    background:#2b2b2b;
  }
  .px-layerDot{
    width:10px; height:10px; border-radius:50%;
    background:#fff;
  }
  .px-layerName{ flex:1; font-size:12px; color:var(--text); }
  .px-layerLock{ color:var(--muted); }

  .px-palette{
    display:grid;
    grid-template-columns: repeat(6, 1fr);
    gap:8px;
  }
  .px-paletteSwatch{
    aspect-ratio: 1 / 1;
    border-radius:6px;
    border:1px solid rgba(255,255,255,.15);
    cursor:pointer;
  }

  .px-bottombar{
    background:#242424;
    border-top:1px solid var(--line);
    display:flex;
    align-items:center;
    gap:10px;
    padding: 0 12px;
  }
  .px-bottomLeft{
    font-size:11px;
    letter-spacing:.12em;
    color:var(--muted);
    font-weight:800;
  }
  .px-bottomBtn{
    background: var(--bg2);
    border: 1px solid var(--line);
    color: var(--text);
    padding: 8px 10px;
    border-radius:8px;
    cursor:pointer;
    font-weight:700;
    font-size:12px;
  }
  .px-bottomSpacer{ flex:1; }
  .px-bottomNote{ color:var(--muted); font-size:12px; }

  /* Mobile: collapse right sidebar */
  @media (max-width: 980px){
    .px-body{ grid-template-columns: 72px 1fr; }
    .px-rightbar{ display:none; }
  }
`;
