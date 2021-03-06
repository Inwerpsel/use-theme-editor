# Experimental CSS variables based theme editor

This is a WIP theme editor that allows creating a theming UI for CSS variables based entirely on the built CSS files,
with no configuration needed to add a new setting. It works in the following way:

- Extract `var` usages from the accessible stylesheets. A usage has the selector, CSS property and default value.
- When you alt + click an element it is matched against all selectors of all variables. This can be done efficiently by
  combining all selectors for a variable with `,` and doing a single `element.match(selectors)`. To ensure we match all
  variables of parents too, each selector is also tested with ` *` appended.
- Next it travels up the DOM tree, doing the same matching on each parent. This only needs to match against the
  variables we previously filtered. Each time a jump to a parent matches fewer variables than the sibling we just
  visited, this means those "missing" variables can be attributed to that previous sibling.

TODO:

- Decouple WordPress further (use other or no component lib)
- Facilitate other variables as a value (you can type them for now)
- Instead of searching for a corresponding regular property by removing `--hover` (or other state) from the name, try if
  we can do the same with the selector, and so locate it reliably regardless of naming scheme.
- More tailored controls / group properties into single control?
- Make hotkeys configurable in the UI
- Move constant inline styles to CSS
- Use more of available screen space in "responsive" view
- Use `ResponsiveFrame` to render multiple themes / screen sizes at the same time
- Write tests
- Expand the color usages quick menu to allow picking all kinds of values. Maybe a textual widget ordered by how
  frequently used?
- Combine all media query versions of the same property into a single control. This can update the iframe to match the
  media query, so that you always can see your changes applied.
- Hot reloading would be nice, as reloading the page to see your changes applied will reset the iframe's scroll
  position.
- Better organizing of themes.
- Personal editor settings that are applied regardless of which theme is being edited.
- Use sourcemap location and edits to auto generate a PR.
- List all elements that were hidden with `display: none`, currently no easy way to unhide after control loses focus.
- Make keyboard shortcuts work when focus is inside the frame.
- Ensure button elements are used where appropriate.
