# PixelPainter

Client-side painting reference tool. Upload a photo, crop it to a canvas ratio, and inspect each square of a coarse pixel grid — including an approximate mix of the paints you have.

Everything runs in the browser. There is no backend or cloud sync. Your last session (grid, palette, crop, and uploaded photo) is saved on this device until you click **New** or clear site data.

## Scripts

```bash
npm install
npm run dev
npm run build
npm test
```

## Workflow

1. Open the app and upload a PNG, JPG, or WebP image — or a previously saved PixelPainter matrix file.
2. Choose a crop frame that matches the output aspect ratio (default 30 × 40).
3. Generate the HTML pixel grid.
4. Zoom, pan, hover, and click squares to read HEX/RGB/HSL and a paint mixture.
5. Download a pixelated JPG or a versioned JSON matrix that can recreate the artwork without the original image.

The paint mixture is an RGB approximation, not a physical pigment simulation.
