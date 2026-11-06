# Larger portrait and scroll parallax

User requested a larger centered picture and a 3D effect while scrolling. Preserve the repaired transparent cutout and existing repeating introduction reveals.

Use the existing figure as a stable named CSS view timeline and perspective container. One inner `.portrait-depth` wrapper rotates by up to 3 degrees on each axis and moves vertically from -20px to 24px. Following a user report of pixelation, remove depth zoom, forced `will-change`, nested `preserve-3d`, and the figure's simultaneous entrance animation. These can cause bitmap resampling or raster-layer softening; the source PNG remains unchanged at 1071px wide, compared with a maximum layout width of 460px. Moving only the inner layer keeps the timeline based on a stationary layout box.

Portrait width: `clamp(300px,34vw,460px)` on desktop and `min(320px,82vw)` on phones. Increase the gap before the text to keep the image clear of the heading while it moves. Keep automatic image height and contain sizing to retain the complete silhouette.

The parallax lives inside reduced-motion and feature-support media checks. Unsupported browsers retain the larger static portrait. No JavaScript additions, dependencies, wheel handlers, or artificial scroll distance.

Verification: syntax/source checks, reference and image dimensions, responsive sizing arithmetic, transform/animation isolation, and reduced-motion/unsupported-browser fallbacks. Live browser visual verification is limited by the previously unavailable browser automation connection.
