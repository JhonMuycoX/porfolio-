# Reference-led portfolio scroll scene

## Reference observation

The supplied `export-1793469681158.mp4` is 19.57 seconds, 898 by 812 pixels at 60 fps. Sampled frames show the tutorial demo: an initial centered headline over a layered forest; the scene advances while the bottle moves into the foreground; the first headline leaves; a second text block appears to the left with the bottle on the right. Later frames show the Figma construction process.

## Portfolio adaptation

Keep that sequence and relative layer speeds, using original portfolio material rather than the bottle and forest: project title cards become the backdrop, and the repaired portrait becomes the foreground subject. The centered headline reads “Learning by making.” The second composition introduces Muyco as a first-year student. The dark forest palette recalls the reference while keeping strong text contrast. Four project entries below become broad color bands with expandable overviews.

The pinned hero lasts 175svh on desktop, with a 100svh stage. Phone browser inspection revealed unreliable pinned viewport geometry, so viewports up to 700px wide use a compact static stack with repeating text reveals. A small event-driven JavaScript controller sets CSS variables for title movement/opacity, backdrop travel, portrait translation, and introduction appearance. The portrait does not scale or rotate, avoiding the earlier raster softening. It settles at 77% of progress; the final part holds a readable introduction. No wheel interception, external library, or framework.

## Accessibility and fallbacks

Inert states prevent invisible links from receiving focus. Reduced motion and compact viewports (700px wide or 650px tall or less) use a complete static layout. Without JavaScript, the headline, portrait, and introduction appear in normal reading order. The existing repeated About reveal remains. All project disclosures and anchor destinations stay native HTML.

## Validation

Check progress at 0, 0.5, 0.8, and 1 and in reverse; frame batching; keyboard state; reduced-motion and short-viewport changes; HTML references; portrait dimensions; and source style rules. Visual browser review must be reported separately from these checks.
