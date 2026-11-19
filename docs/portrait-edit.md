# Portrait and introduction update

The original supplied photograph remains at `assets/portrait.png`. The hero uses `assets/portrait-cutout.png`, generated with the built-in imagegen tool and verified to contain an RGBA alpha channel including transparent and opaque pixels.

Final image prompt:

> Use case: background-extraction. Edit target: the supplied portrait photo. Remove only the deep red background to create a clean, genuinely transparent PNG cutout of the person for a portfolio website. Preserve the same person's exact facial identity, facial features, expression, skin texture, hair, pose, dark coat, lighting, framing, and original silhouette. Preserve fine hair detail and natural clean edges, no red background halos. Keep the subject intact; do not restyle, beautify, change clothes, invent body parts, or change the crop. Transparent pixels outside the person, not a white or checkerboard painted background.

The portrait is centered above the introduction at every breakpoint. A small IntersectionObserver toggles the introduction animation on viewport entry and resets it on exit, so returning to the hero or About section replays the reveal. The observer stays attached. Without JavaScript or IntersectionObserver, all text remains visible. CSS disables animations for reduced-motion preferences.

## Cropped shoulder repair

The first cutout retained the original photo's cropped right shoulder and bottom edge. CSS already displayed the whole image with `height:auto` and `object-fit:contain`; the image itself had nearly opaque pixels on the right and bottom boundaries (alpha 254). The replacement `assets/portrait-cutout-v2.png` completes the shoulder and softens the bottom. Its left, right, and bottom boundary alpha values are at most 1/255. The hero now references this version; previous assets remain preserved.

Repair prompt (built-in imagegen):

> Edit target: this transparent portrait cutout for a website. Repair the visibly cropped RIGHT SHOULDER and bottom coat edge. Expand the transparent canvas horizontally and complete the missing right shoulder/upper arm naturally so the entire bust silhouette fits INSIDE the image with at least 8% fully transparent padding on BOTH left and right, and transparent padding at top. Show the same person from head through mid torso. Keep face, expression, hairstyle, skin, pose, dark textured coat and lighting as close to this input as possible; change only the missing silhouette/canvas. At the lower torso, let the last 10% gently dissolve into alpha transparency so there is no hard rectangular bottom cutoff. The RIGHT outer shoulder contour must be curved, fully visible and surrounded by transparent pixels, NEVER touching or cut by the right canvas border. Genuine transparent RGBA background, no opaque background, no painted checkerboard, no border or extra objects.
