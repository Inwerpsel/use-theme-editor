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

### STALLED
- Facilitate other variables as a value
  - Needs to be aware of types, which is currently handled in a very ad-hoc way. Setting up proper type handling
    requires some focus, so I'll first wrap up other in progress stuff.

### IN PROGRESS
- Improve relative layout of deeper parts of the inspector UI
  - Find design principles that work with the complex and interconnected nature of the displayed information.
  - Current principles: at the top level it shows the entire dependency chain up to the variable setting the raw value.
    Each of these elements can be "opened" to access all details about that variable, including other references than 
    than the current one. It should provide quick and intuitive access to each piece of information, while keeping the 
    overall structure and flow understandable and not overwhelming. Ideally it's possible to open any 2 given pieces 
    of information at the same time.
  - Current per variable elements:
    - Basic information (formatted name, value) (always visible)
    - Screen switcher (only when needed) (always visible)
    - Extra scroll in view button
    - Usages in `var()` statements in source CSS on regular properties
      - Grouped by selector + property
      - Element locator for each individual selector of the rule
      - Property
    - Usages in `var()` statements of other custom properties (source + theme)
      - Referencing variable name
      - Grouped* by combined selectors of properties.
      - Element locator
    - Replace with other variable
    - Typed control (different per type, will do after figuring out how to handle property types)
    - Unset button
  - Element locator:
    - Selector being located
    - Scroll in view button
    - Previous and next button
    - Counter + indicator of current
    - Tagname + id + classes of current
    - Inspect button (unless element is the current inspected)
    - Not found message
  - Togglable elements:
    - CSS properties (+ indicator if current var is not the full value)
    - Source code link (if available, filename (formatted) + line)
  - Upcoming elements:
    - Media query

- Support "locally" scoped custom properties
  - Problem: Selector specificity when adding a rule after the existing rules. Any equally specific selector  occurring
    in source after the one we're overriding in the theme will start being overridden (i.e. it's not after that selector
    anymore). Hence, there's probably no choice but to figure out and repeat all rules that could be affected.

- Determine / infer property types
  - examples + libs
    - https://github.com/mdn/yari/blob/main/kumascript/macros/CSSSyntax.ejs
    - https://github.com/w3c/webref/tree/main/packages/css
    - https://github.com/csstree/csstree
    - https://github.com/mdn/data/
  - "De facto" type system
    - A variable gets its type from the intersection of all CSS properties it's used on.
    - UI filters the actions it allows, so that the end result is always legal CSS.
    - e.g. you should be able to change a variable to a gradient if it's only used on the `background` property.
      You should not be able to assign a gradient variable to a non-background property.
    - Split up a single variable into multiple groups with the same value types? E.g. you start adding a color to a 
      bunch of backgrounds and text colors, then find you want to use a gradient on all these backgrounds, but preserve
      the regular text colors.
  - Additional constraints
    - Should be possible to force constraints beyond usage inference.
    - Or perhaps including a property access in code is a very simple way to achieve this?

### TODO NEXT
- Use message to frame instead of polling local storage
- Fix compound properties
- Fix handling of multiple variables on a single rule

### TO FINISH
- Decouple WordPress further (use other or no component lib)
- Combine all media query versions of the same property into a single control. This can update the iframe to match the
  media query, so that you always can see your changes applied (done but for separate controls). Visualize media queries
  in UI.

### TODO
- Instead of searching for a corresponding regular property by removing `--hover` (or other state) from the name, try if
  we can do the same with the selector, and so locate it reliably regardless of naming scheme.
- More tailored controls / group properties into single control?
- Make hotkeys configurable in the UI
- Clean up internal style handling (separate styles altogether?, )
- Use `ResponsiveFrame` to render multiple themes / screen sizes at the same time
- Write tests
- Expand the color usages quick menu to allow picking all kinds of values. Maybe a textual widget ordered by how
  frequently used?
- Hot reloading would be nice, as reloading the page to see your changes applied will reset the iframe's scroll
  position.
- Better organizing of themes.
- Personal editor theme that is applied separately from the theme that is being edited. (detect own stylesheets?)
- Use sourcemap location and edits to auto generate a PR.
- List all elements that were hidden with `display: none`, currently no easy way to unhide after control loses focus.
- Make keyboard shortcuts work when focus is inside the frame.
- Ensure button elements are used where appropriate.
- Better text inputs (clear button, debounce where needed, reliably prevent capitalization)
- Show current changes compared to server (maybe integrate with "current theme" component?)
- As browser extension?
  - Address CORS (or detect + warn)
  - Address idle performance (lazy extract page variables / lazy include entire script)
- Optimize root property updates
  - Updating root causes full style recalculation
    - Doesn't work well on large pages
  - Use same selectors as `var` usages?
    - Cost: increased selector matching (though these are all selectors that are already in use)
    - Benefit: confirmed simple cases (e.g. one property on one class) are much faster, but same
      property used across many different rules likely is slower than updating the root. Extreme
      cases have over 100 different selectors per `var`. Then again, the full style recalculation
      would also be affected by this complexity. Moral of the story, I still need to measure it.
    - Referencing variables
      - Possible approaches:
        - Follow dependency chains so that these props can be added to each selector
        - Do add these to the root
        - Determine closest common root? (is this even possible?)
    - Heuristic
      - A variable is needed on root or body anyway => don't include its other selectors
      - Max number of selectors over which to prefer root (I guess about 20, but should measure)
    - Can be further optimized by excluding selectors that don't occur on the page
      - On page load + mutation observer
  - More els recalculated when using CSS `:root` selector instead of setting the document element's inline style.
    - What about that? Maybe I mislooked.
  - Is using `body` selector better?
- Move expensive logic (regex and searching lists) into initial data extraction where possible.