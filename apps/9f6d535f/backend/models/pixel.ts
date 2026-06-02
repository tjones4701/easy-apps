export interface Pixel {
  id: string; // "{x}_{y}"
  x: number;
  y: number;
  color: string; // hex e.g. "#ff0000"
  paintedAt: string; // ISO timestamp
}

export interface Cooldown {
  id: string; // username or session id
  lastPaintedAt: string; // ISO timestamp
}
