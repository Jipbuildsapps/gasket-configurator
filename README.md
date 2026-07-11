# Gasket configurator cleanup

## Active files

- `gasket-configurator.css`
- `gasket-configurator-nesting.js`
- `gasket-configurator-drawing.js`
- `gasket-configurator.js`

## Do not keep loading

Do not load the old labor override script anymore. Its extra labor fields and price interception are now covered by `gasket-configurator.js`, and keeping the override can block the main calculator click handler.

## Result changes

- The result view now starts with a compact commercial summary.
- The old detailed technical calculation is still available under `Uitgebreide berekening tonen`.
- Total sale price, margin percent, and margin euro can be edited live.
- Per-gasket prices update live when sale price or margin changes.
- Rest-material display responds to the selected remainder mode.

## Shape changes

- Step 2 becomes shape-first: round, rectangle/square, or manhole gasket.
- Shape choice uses clickable icon tiles instead of a plain dropdown.
- Round keeps the existing OD/ID and optional bolt pattern flow.
- Rectangle/square supports outer width/height, outer radius, and either a round or rectangular inner hole.
- Manhole supports outer width/height and inner width/height as the same capsule-style shape, which matches the expected manhole gasket flow.
- Material area and cut length are calculated from the selected contour.
- Nesting uses the shape bounding width/height, so rectangular and manhole gaskets no longer behave like oversized circles.
- DXF/SVG export supports the new outer and inner contours.

Current limitation: bolt holes are still only enabled for round gaskets. Rectangular or manhole bolt patterns need a separate UX decision: circular bolt pattern, rectangular bolt pattern, or manual positions.

## Replace in Shopify

Replace these four theme assets:

- `assets/gasket-configurator.js`
- `assets/gasket-configurator.css`
- `assets/gasket-configurator-nesting.js`
- `assets/gasket-configurator-drawing.js`

Leave `assets/gasket-configurator-labor-override.js` unused.

Use this in the Shopify custom Liquid block:

```liquid
{% render 'gasket-configurator', product: product %}
```

## Checks run

- JavaScript syntax check for all three JS assets.
- Local nesting calculation check for mixed gasket rules and used-strip material mode.
- Local nesting check for rectangle and manhole gasket rules.
