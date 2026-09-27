# PixelPainter

PixelPainter is a **client-side painting reference generator**. You upload a photo (or a saved matrix file), crop it to a canvas ratio, and get a coarse pixel grid. Every square can be inspected for its sampled color and an approximate mix of the paints in your palette.

There is **no backend, no database, and no HTTP API**. Image processing, mixing, export, and session restore all run in the browser.

Your last session (grid, palette, crop, and uploaded photo) is stored on this device until you click **New** or clear site data.

---

## How the app is meant to be used

1. Open PixelPainter and upload a PNG, JPG, or WebP — or a previously saved `.json` / `.txt` matrix file.
2. Set width × height (default **30 × 40**) and crop the photo to that aspect ratio. The crop frame includes rule-of-thirds guides and a center mark.
3. Generate the pixel grid. Each cell is an HTML element (large grids fall back to a canvas for performance).
4. Zoom, pan, hover, and click squares. The inspector shows HEX / RGB / HSL plus a paint mixture that always totals 100%.
5. Optionally turn on **Show mixed colors** to fill the grid with the reconstructed palette mix instead of the sampled target.
6. Download a pixelated JPG (always the **target** colors) or a versioned JSON matrix that recreates the artwork without the original image.

The mix is a **deterministic subtractive approximation** in RGB absorption space. It is not physically accurate pigment chemistry (Kubelka–Munk, real oils/acrylics, etc.). The UI states this clearly.

```text
image  →  crop  →  area-average sample  →  pixel matrix
                                              ↓
                                    target RGB per cell
                                              ↓
                                    calculatePaintMix(palette)
                                              ↓
                                    interactive grid + inspector
```

---

## Run locally

```bash
npm install
npm run dev      # Vite dev server
npm run build    # tsc -b && vite build
npm test         # vitest (mix math, matrix I/O, crop, session)
npm run lint     # oxlint
npm run preview  # serve the production build
```

Path alias: `@/` → `src/` (Vite + TypeScript).

---

## Tech stack

| Layer | Choice |
| --- | --- |
| Bundler | Vite |
| UI | React 19, functional components |
| Language | TypeScript, `strict`, `noUnusedLocals`, `noUnusedParameters`, no `any` |
| Routing | React Router library mode, single route `/` |
| Styling | Tailwind CSS v4, shadcn/ui (Radix Nova), Geist fonts |
| Theme | `next-themes`, storage key `pixelpainter-theme` |
| State | React context + `useReducer` (no Redux/Zustand) |
| Heavy work | Web Worker for large grids (`src/workers/matrix-build.worker.ts`) |
| Local persistence | `localStorage` snapshot + IndexedDB for the source image blob |

UI primitives live in `src/components/ui/` (shadcn). Application UI lives beside them and should stay presentation-focused.

---

## Architecture

```text
src/
  types/index.ts              Domain models
  state/                      Project context + reducer
  routes/                     Single home route, phases: start | crop | editor
  lib/
    image-processing/         Load, crop, sample, build matrix
    color/                    Conversions + mix algorithm
    matrix/                   JSON serialize / parse / versioning
    export/                   JPG + file download
    persistence/              Session snapshot + IndexedDB
    analytics/                Palette usage summary
  workers/                    Off-main-thread sample + mix
  components/                 Screens and widgets
```

**State** is one `PixelPainterProject` plus view flags (`showMixedColors`, mismatch highlight, reference overlay). Recalculation happens only when source, crop, dimensions, or palette change — never on every React render.

Phases in `src/routes/home.tsx`:

- `start` — upload image or matrix
- `crop` — aspect-locked frame
- `editor` — grid, inspector, palette, export

Entry: `src/main.tsx` → `src/App.tsx` (`ThemeProvider`, `ProjectProvider`, `RouterProvider`).

---

## Core idea and internal “API”

There is no server. The contract of the app is a handful of pure functions plus a JSON project file.

### 1. Sampling (image → target colors)

`sampleGrid(source, crop, width, height)` in `src/lib/image-processing/sample.ts`:

1. Draw the crop onto a canvas (downsampled if the crop is huge).
2. For each output cell, average **all** source pixels in that rectangle (`src/lib/image-processing/sample-core.ts`).
3. Return `RGBColor[][]` — one representative color per cell.

The source image is **never stretched** to the output ratio. The crop rectangle is the mapping.

### 2. Mixing (target RGB → paint weights)

`calculatePaintMix(targetColor, palette)` in `src/lib/color/mix.ts`:

1. Convert sRGB → linear RGB → **absorption** (`-ln(linear)`, with a small epsilon so black is finite). See `rgbToAbsorption` in `src/lib/color/convert.ts`.
2. Solve non-negative least squares on the simplex: weights ≥ 0, sum = 1, minimize `||A w − t||²` in absorption space.
3. Solver: projected gradient descent, fixed iterations, no extra math library.
4. Store weights keyed by **paint id** internally. Reconstruct a preview color with the same absorption mix (`reconstructed`).
5. The inspector rounds to 1 decimal percent and nudges the largest weight so the UI totals **100%**. Every palette color is listed, including `0.0%`.

Exact palette hits (within 1 RGB unit) short-circuit to 100% of that paint.

To replace the model later, keep the function signature and swap the body of `mix.ts`. The rest of the app only depends on `PaintMix`.

Current algorithm id: `rgb-absorb-nnls`. Older matrix files may still say `rgb-linear-nnls`; import **recomputes** mixes with the current algorithm.

### 3. Pixel matrix (the important object)

```ts
type PixelData = {
  targetColor: RGBColor;   // sampled from the photo
  mix: PaintMix;           // weights + reconstructed RGB
};
```

`pixels[row][col]` is `pixels[y][x]`. Display can show either `targetColor` or `mix.reconstructed` (sidebar switch). JPG export always uses `targetColor`.

### 4. Matrix file (the public interchange format)

`serializeMatrix` / `parseMatrix` in `src/lib/matrix/index.ts`.

```json
{
  "format": "pixelpainter",
  "version": 1,
  "width": 30,
  "height": 40,
  "palette": [{ "id": "Blue", "name": "Blue", "hex": "#0006FF" }],
  "pixels": [[{ "hex": "#DA8E53", "mix": { "Blue": 0.4, "White": 0.6 } }]],
  "algorithm": "rgb-absorb-nnls",
  "createdAt": "..."
}
```

- Mix keys in the file are **user-facing paint names**, not internal UUIDs.
- Parser still accepts older files that keyed mixes by id (`cyan`, UUID, …).
- Import rebuilds the interactive grid with no source image. Recrop / resize needs a new photo.

### 5. Other library functions you will actually call

| Function | File | Role |
| --- | --- | --- |
| `loadImageFile` | `lib/image-processing/load.ts` | Decode PNG/JPG/WebP client-side |
| `largestCenteredCrop` / `fitCropToAspect` | `lib/image-processing/crop.ts` | Aspect-locked crop math |
| `buildPixelMatrix` / `buildPixelMatrixAsync` | `lib/image-processing/` | Sample + mix (worker if grid is large) |
| `remixPixels` | `lib/image-processing/matrix-from-image.ts` | Palette change without resampling |
| `downloadPixelJpeg` | `lib/export/index.ts` | Hard-edged JPG of target colors |
| `summarizePaintUsage` | `lib/analytics/paint-usage.ts` | Average mix % per paint |

UI talks to these through `src/state/project-context.tsx` (`loadImage`, `confirmCrop`, `updatePalette`, `setShowMixedColors`, …).

---

## Where to change important parameters

Start here if you want to tune behavior without hunting the whole tree.

### Grid size and export

[`src/lib/image-processing/dimensions.ts`](src/lib/image-processing/dimensions.ts)

| Constant | Default | Meaning |
| --- | --- | --- |
| `DEFAULT_GRID_WIDTH` / `HEIGHT` | 30 / 40 | New project size |
| `MIN_GRID_SIZE` | 4 | Smallest side |
| `MAX_GRID_SIDE` | 150 | Largest side |
| `MAX_GRID_CELLS` | 10_000 | Cap (e.g. 100×100) so the tab stays usable |
| `PIXEL_CELL_SIZE` | 18 | CSS pixels per cell at zoom 1 |
| `JPG_PIXEL_SCALE` | 40 | Export: 30×40 → 1200×1600 |
| `JPG_QUALITY` | 0.92 | JPEG quality |

### Paint mix solver

[`src/lib/color/mix.ts`](src/lib/color/mix.ts) and [`src/lib/color/convert.ts`](src/lib/color/convert.ts)

| Constant | Default | Meaning |
| --- | --- | --- |
| `MIX_ITERATIONS` | 200 | Gradient-descent steps |
| `MIX_LEARNING_RATE` | 0.015 | Step size in absorption space |
| `LINEAR_ABSORPTION_EPSILON` | `1/255` | Floor so `-ln(0)` does not explode |
| `MIX_ALGORITHM` | `rgb-absorb-nnls` | Written into matrix JSON (`src/types/index.ts`) |

Default and preset palettes:

- [`src/lib/color/palette.ts`](src/lib/color/palette.ts) — `DEFAULT_PALETTE` (CMY + black + white)
- [`src/lib/color/palette-presets.ts`](src/lib/color/palette-presets.ts) — named kits in the palette editor

### Sampling and workers

| Constant | File | Default | Meaning |
| --- | --- | --- | --- |
| `MAX_SAMPLE_DIMENSION` | `lib/image-processing/sample.ts` | 2400 | Max crop canvas side before averaging |
| `GRID_CELL_WORKER_THRESHOLD` | `lib/image-processing/build-matrix-async.ts` | 900 | Offload sample+mix to a worker above this cell count |
| `CANVAS_CELL_THRESHOLD` | `components/pixel-grid/pixel-grid-canvas.tsx` | 2500 | Draw the grid as canvas instead of HTML cells |

Mismatch highlight (red ring when mix cannot hit the target):

- HTML grid: distance `> 18` in `src/components/pixel-grid/pixel-grid.tsx`
- Canvas grid: `MISMATCH_THRESHOLD = 18` in `pixel-grid-canvas.tsx`

### Viewport (zoom / pan)

[`src/components/pixel-grid/pixel-viewport.tsx`](src/components/pixel-grid/pixel-viewport.tsx)

| Constant | Default | Meaning |
| --- | --- | --- |
| `MIN_ZOOM` / `MAX_ZOOM` | 0.15 / 24 | Wheel and button zoom |
| `PAN_THRESHOLD` | 4 px | Distinguishes click vs drag-pan |
| Grid lines | `zoom >= 2` | Subtle cell outlines when zoomed in |

### Persistence and theme

| Constant | File | Meaning |
| --- | --- | --- |
| `SESSION_STORAGE_KEY` | `lib/persistence/session-snapshot.ts` | `pixelpainter-session-v1` in `localStorage` |
| IndexedDB blob | `lib/persistence/idb.ts` | Original photo bytes |
| `storageKey` | `src/App.tsx` | `pixelpainter-theme` (`next-themes`) |

View-only flags (`showMixedColors`, mismatch, reference overlay) are **not** persisted.

### UI copy and layout

- Shell / header / export: `src/components/app/`
- Crop overlay (thirds + center): `src/components/editor/crop-frame.tsx`
- Left sidebar switches: `src/components/editor/editor-screen.tsx` (`SettingsPanel`)
- Inspector: `src/components/pixel-inspector/pixel-inspector.tsx`
- Theme tokens: `src/index.css`

---

## How to change the code

Keep processing in `src/lib/` and UI in `src/components/`. Domain types stay in `src/types/index.ts`.

**Change default grid or export size** — edit `dimensions.ts` only.

**Change default paints** — `DEFAULT_PALETTE` and/or `PALETTE_PRESETS`. New colors should go through `createPaintColor` so they get a stable id.

**Change how mixes are calculated** — only `src/lib/color/mix.ts` (and helpers in `convert.ts`). Keep `calculatePaintMix(target, palette): PaintMix`. Add tests in `src/lib/color/mix.test.ts`. Bump or document `MIX_ALGORITHM` if the meaning of stored weights changes.

**Change sampling** — `sample-core.ts` (averaging) and `sample.ts` (crop canvas). The worker uses the same `colorsFromImageBuffer`.

**Change the matrix file** — `src/lib/matrix/index.ts`. Keep `format: "pixelpainter"` and bump `MATRIX_VERSION` if the shape is incompatible. Extend `parseMatrix` to still read v1.

**Change grid interaction** — `pixel-grid.tsx` / `pixel-cell.tsx` / `pixel-viewport.tsx`. Large grids must keep working via `pixel-grid-canvas.tsx`.

**Add a route** — `src/routes/router.tsx`. The MVP is a single `/`.

**State actions** — add a case in `src/state/project-reducer.ts` and a method on `ProjectProvider`. Do not compute the pixel matrix inside render.

After changes:

```bash
npm test
npm run build
```

---

## Session and privacy

- No accounts, analytics pixels, or remote image APIs.
- Session JSON lives in `localStorage`; the source photo lives in IndexedDB.
- **New** calls `clearSession()` and resets the project.
- Clearing browser site data for this origin wipes the session.

---

## Tests

Vitest covers mix reconstruction, matrix round-trip (including name-keyed mixes and legacy id keys), crop geometry, and session snapshot parsing. Add tests next to the library you change (`*.test.ts`).
