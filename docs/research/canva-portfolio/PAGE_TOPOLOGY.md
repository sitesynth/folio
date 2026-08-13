# Canva Portfolio Topology

- Route: `/`
- Scope: pages 1 through 27 from the public Canva view link.
- Each page is a full-viewport HTML section with `scroll-snap-align: start`.
- Text is rendered as selectable HTML, not flattened into screenshots.
- Image layers use downloaded Canva media URLs when the public view exposes them.
- The source page exposes a presentation viewer rather than Canva's internal React/component tree, so positioning is reconstructed from visible layer metadata and visual references.
