import { useState, useEffect, useRef, useCallback } from "react";
import { callAction } from "#apps-lib/callAction";
import { useCurrentUser } from "#apps-lib/hooks/useCurrentUser";
import type { Pixel } from "../backend/models/pixel";
import styles from "./App.module.scss";

const APP_ID = "9f6d535f";
const GRID_SIZE = 256;
const POLL_INTERVAL_MS = 10_000;
const COOLDOWN_MS = 60_000;

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}

export default function App() {
  const user = useCurrentUser();

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const offscreenRef = useRef<HTMLCanvasElement | null>(null);
  const cameraRef = useRef({ x: 0, y: 0, scale: 2 });
  const initialisedRef = useRef(false);

  const isPanning = useRef(false);
  const lastPointer = useRef({ x: 0, y: 0 });
  const pinchDistRef = useRef<number | null>(null);
  const spaceHeld = useRef(false);

  const [selectedColor, setSelectedColor] = useState("#e63946");
  const [cooldownMs, setCooldownMs] = useState(0);
  const [status, setStatus] = useState<string | null>(null);
  const [pixelCount, setPixelCount] = useState(0);

  // Cooldown countdown ticker
  useEffect(() => {
    if (cooldownMs <= 0) return;
    const id = setInterval(() => {
      setCooldownMs((prev) => Math.max(0, prev - 1000));
    }, 1000);
    return () => clearInterval(id);
  }, [cooldownMs > 0]);

  // Draw the offscreen canvas onto the visible canvas with the current camera
  const render = useCallback(() => {
    const canvas = canvasRef.current;
    const off = offscreenRef.current;
    if (!canvas || !off) return;
    const ctx = canvas.getContext("2d")!;
    const { x, y, scale } = cameraRef.current;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.imageSmoothingEnabled = false;

    const drawW = GRID_SIZE * scale;
    const drawH = GRID_SIZE * scale;
    ctx.drawImage(off, x, y, drawW, drawH);

    // Grid lines when zoomed in enough
    if (scale >= 8) {
      ctx.strokeStyle = "rgba(0,0,0,0.15)";
      ctx.lineWidth = 0.5;
      for (let gx = 0; gx <= GRID_SIZE; gx++) {
        const px = x + gx * scale;
        if (px < 0 || px > canvas.width) continue;
        ctx.beginPath();
        ctx.moveTo(px, Math.max(0, y));
        ctx.lineTo(px, Math.min(canvas.height, y + drawH));
        ctx.stroke();
      }
      for (let gy = 0; gy <= GRID_SIZE; gy++) {
        const py = y + gy * scale;
        if (py < 0 || py > canvas.height) continue;
        ctx.beginPath();
        ctx.moveTo(Math.max(0, x), py);
        ctx.lineTo(Math.min(canvas.width, x + drawW), py);
        ctx.stroke();
      }
    }
  }, []);

  // Initialise offscreen canvas + size the visible canvas, then kick off first fetch
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Create offscreen canvas filled white
    const off = document.createElement("canvas");
    off.width = GRID_SIZE;
    off.height = GRID_SIZE;
    const offCtx = off.getContext("2d")!;
    offCtx.fillStyle = "#ffffff";
    offCtx.fillRect(0, 0, GRID_SIZE, GRID_SIZE);
    offscreenRef.current = off;

    // Size the visible canvas and centre the camera — only once
    const setSize = () => {
      const prevW = canvas.width;
      const prevH = canvas.height;
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      // On first init, centre the grid; on subsequent resizes, adjust camera to keep centre stable
      if (!initialisedRef.current) {
        cameraRef.current.x = (canvas.width - GRID_SIZE * cameraRef.current.scale) / 2;
        cameraRef.current.y = (canvas.height - GRID_SIZE * cameraRef.current.scale) / 2;
        initialisedRef.current = true;
      } else {
        // Shift camera by half the size delta so the view stays centred
        cameraRef.current.x += (canvas.width - prevW) / 2;
        cameraRef.current.y += (canvas.height - prevH) / 2;
      }
      render();
    };

    setSize();
    window.addEventListener("resize", setSize);
    return () => window.removeEventListener("resize", setSize);
  }, [render]);

  // Paint pixels onto the offscreen canvas and re-render
  const applyPixels = useCallback((pixels: Pixel[]) => {
    const off = offscreenRef.current;
    if (!off) return;
    // Reset to white then paint all pixels
    const ctx = off.getContext("2d")!;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, GRID_SIZE, GRID_SIZE);
    for (const p of pixels) {
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x, p.y, 1, 1);
    }
    setPixelCount(pixels.length);
    render();
  }, [render]);

  // Fetch all pixels from backend
  const fetchCanvas = useCallback(async () => {
    try {
      const pixels = await callAction<Pixel[]>(APP_ID, "getCanvas", {});
      applyPixels(pixels);
    } catch { /* silently fail on poll */ }
  }, [applyPixels]);

  // Fetch cooldown for the logged-in user
  const fetchCooldown = useCallback(async () => {
    if (!user) return;
    try {
      const result = await callAction<{ remainingMs: number }>(APP_ID, "getCooldown", {});
      setCooldownMs(result.remainingMs);
    } catch { /* not critical */ }
  }, [user]);

  // Initial load + polling every 10s
  useEffect(() => {
    fetchCanvas();
    const id = setInterval(fetchCanvas, POLL_INTERVAL_MS);
    return () => clearInterval(id);
  }, []); // stable — fetchCanvas doesn't need to be a dep since we use the ref pattern below

  // Re-fetch cooldown whenever auth state changes
  useEffect(() => {
    fetchCooldown();
  }, [fetchCooldown]);

  // Keyboard space-to-pan
  useEffect(() => {
    const down = (e: KeyboardEvent) => { if (e.code === "Space") { e.preventDefault(); spaceHeld.current = true; } };
    const up = (e: KeyboardEvent) => { if (e.code === "Space") spaceHeld.current = false; };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => { window.removeEventListener("keydown", down); window.removeEventListener("keyup", up); };
  }, []);

  function screenToGrid(sx: number, sy: number) {
    const { x, y, scale } = cameraRef.current;
    return { gx: Math.floor((sx - x) / scale), gy: Math.floor((sy - y) / scale) };
  }

  function zoomAt(focalX: number, focalY: number, factor: number) {
    const cam = cameraRef.current;
    const newScale = clamp(cam.scale * factor, 0.5, 64);
    const actualFactor = newScale / cam.scale;
    cam.x = focalX - (focalX - cam.x) * actualFactor;
    cam.y = focalY - (focalY - cam.y) * actualFactor;
    cam.scale = newScale;
    render();
  }

  // --- Mouse handlers ---
  function onMouseDown(e: React.MouseEvent) {
    if (e.button === 1 || e.button === 2 || spaceHeld.current) {
      isPanning.current = true;
      lastPointer.current = { x: e.clientX, y: e.clientY };
      return;
    }
    if (e.button === 0) handlePaintAtScreen(e.clientX, e.clientY);
  }

  function onMouseMove(e: React.MouseEvent) {
    if (!isPanning.current) return;
    const cam = cameraRef.current;
    cam.x += e.clientX - lastPointer.current.x;
    cam.y += e.clientY - lastPointer.current.y;
    lastPointer.current = { x: e.clientX, y: e.clientY };
    render();
  }

  function onMouseUp() { isPanning.current = false; }

  function onWheel(e: React.WheelEvent) {
    e.preventDefault();
    zoomAt(e.clientX, e.clientY, e.deltaY < 0 ? 1.15 : 1 / 1.15);
  }

  // --- Touch handlers ---
  function onTouchStart(e: React.TouchEvent) {
    if (e.touches.length === 1) {
      isPanning.current = true;
      lastPointer.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      pinchDistRef.current = null;
    } else if (e.touches.length === 2) {
      isPanning.current = false;
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      pinchDistRef.current = Math.hypot(dx, dy);
    }
  }

  function onTouchMove(e: React.TouchEvent) {
    e.preventDefault();
    if (e.touches.length === 1 && isPanning.current) {
      const cam = cameraRef.current;
      cam.x += e.touches[0].clientX - lastPointer.current.x;
      cam.y += e.touches[0].clientY - lastPointer.current.y;
      lastPointer.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      render();
    } else if (e.touches.length === 2 && pinchDistRef.current !== null) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const newDist = Math.hypot(dx, dy);
      const focalX = (e.touches[0].clientX + e.touches[1].clientX) / 2;
      const focalY = (e.touches[0].clientY + e.touches[1].clientY) / 2;
      zoomAt(focalX, focalY, newDist / pinchDistRef.current);
      pinchDistRef.current = newDist;
    }
  }

  function onTouchEnd() { isPanning.current = false; pinchDistRef.current = null; }

  // --- Paint ---
  async function handlePaintAtScreen(sx: number, sy: number) {
    if (!user) {
      setStatus("Please log in to paint.");
      setTimeout(() => setStatus(null), 2000);
      return;
    }
    if (cooldownMs > 0) {
      setStatus(`Wait ${Math.ceil(cooldownMs / 1000)}s before painting again.`);
      setTimeout(() => setStatus(null), 2000);
      return;
    }
    const { gx, gy } = screenToGrid(sx, sy);
    if (gx < 0 || gx >= GRID_SIZE || gy < 0 || gy >= GRID_SIZE) return;

    // Optimistic paint on offscreen
    const off = offscreenRef.current;
    if (off) {
      const ctx = off.getContext("2d")!;
      ctx.fillStyle = selectedColor;
      ctx.fillRect(gx, gy, 1, 1);
      render();
    }

    try {
      await callAction(APP_ID, "paintPixel", { x: gx, y: gy, color: selectedColor });
      setCooldownMs(COOLDOWN_MS);
      setStatus("Pixel painted! ✓");
      setTimeout(() => setStatus(null), 1500);
    } catch (err: any) {
      setStatus(err?.message ?? "Failed to paint.");
      setTimeout(() => setStatus(null), 3000);
      // Revert optimistic paint
      fetchCanvas();
    }
  }

  const cooldownSecs = Math.ceil(cooldownMs / 1000);
  const ready = cooldownMs <= 0;

  return (
    <div className={styles.root}>
      <canvas
        ref={canvasRef}
        className={styles.canvas}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
        onWheel={onWheel}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onContextMenu={(e) => e.preventDefault()}
      />

      <div className={styles.hud}>
        <div className={styles.hudTitle}>Pixel Place</div>

        {user === undefined && <div className={styles.hudUser}>Loading...</div>}
        {user === null && (
          <div className={styles.hudUser}>
            <a href="/auth/login" className={styles.loginLink}>Log in to paint</a>
          </div>
        )}
        {user && <div className={styles.hudUser}>👤 {user.name}</div>}

        <div className={styles.hudPixels}>{pixelCount.toLocaleString()} pixels painted</div>

        <div className={styles.colorRow}>
          <label className={styles.colorLabel}>Colour</label>
          <input
            type="color"
            value={selectedColor}
            onChange={(e) => setSelectedColor(e.target.value)}
            className={styles.colorInput}
            title="Pick a colour"
          />
          <span className={styles.colorHex}>{selectedColor}</span>
        </div>

        {user && (
          <div className={`${styles.cooldown} ${ready ? styles.cooldownReady : styles.cooldownWaiting}`}>
            {ready ? "✓ Ready to paint" : `⏱ ${cooldownSecs}s remaining`}
          </div>
        )}

        {status && <div className={styles.status}>{status}</div>}

        <div className={styles.hint}>
          Scroll to zoom · Drag to pan<br />
          Click to paint a pixel
        </div>
      </div>
    </div>
  );
}
