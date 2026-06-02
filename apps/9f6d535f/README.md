# Pixel Place

A shared 256×256 pixel canvas. Paint one pixel per minute. Zoom in, pan around, and collaborate.

## How it works

- **Click** a spot on the canvas to paint a pixel in your selected colour
- **Scroll** to zoom in/out; **drag** (or hold Space + drag) to pan
- You can paint **once per minute** — the cooldown resets automatically
- The canvas **polls every 10 seconds** for other users' updates

## Tech

- Backend: `getCanvas`, `paintPixel`, `getCooldown` actions
- Pixels stored as `{x}_{y}` keyed records — upsert = natural overwrite
- Cooldowns stored per user in a separate collection
- Frontend: React + HTML Canvas with offscreen rendering, zoom/pan, touch pinch support
