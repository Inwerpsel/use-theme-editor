# Experimental CSS variables based theme editor

This is a WIP theme editor that allows creating a theming UI for CSS custom properties based entirely on the built CSS files,
with no configuration needed to add a new setting.

## Features
* Plug and play: discover and design on any page of an app, removing the need for mockups
* Get all relevant style attributes of an element with 1 click
* Link variables to other variables to create a design system
* Super fast access to contextual information
* Screen switcher on variables with a media query
* All changes applied instantly with no delay, regardless of the content size / amount of variables (on most sites on non potato devices)
* Switch themes while deep inspecting
* Reposition or hide any UI element with drag and drop

## Status
The theme editor should be usable in its current form, though given many features are currently under active development,
some features temporarily don't work or work improperly. This can break some use cases.

## Known issues
- Current theme view not working (needs adaptation to selector scoped properties)
- Expanded option of screen switcher not working
- Edits not working on pages that use multiple root scope selectors
- Equally specific (and so order dependent) selectors override too much (e.g. Bootstrap .btn background will override .btn-primary)
- Multiple issues with `:where` and similar selectors

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
  - Problem: Selector specificity when adding a rule after the existing rules
    - Any equally specific selector  occurring in source after the one we're overriding in the theme
      will start being overridden (i.e. it's not after that selector anymore).
    - Hence, there's probably no choice but to figure out and repeat all rules that could be affected.
    - Unless updates would actually change rules with a variable to their resolved value.
      - No additional CSS
      - Recalculations affect (potentially much) less elements, because cascading no longer needed
      - No specificity challenges at all
      - Also supports regular CSS

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
  - Fix handling of multiple variables on a single rule

### TODO NEXT
- Support typing of variables surrounded by just 1 function
  - It's apparently a common thing for frameworks to hard code which color function to use, and have the variables only
    contain the arguments. (e.g. BS and derivatives)
  - Even though this is a bad idea for multiple reasons, I don't expect common frameworks to change it soon.
  - Can be somewhat generalized. Perhaps check type of function arguments in CSS syntax?

### TO FINISH
- Decouple WordPress further (use other or no component lib)
- Combine all media query versions of the same property into a single control. This can update the iframe to match the
  media query, so that you always can see your changes applied (done but for separate controls). Visualize media queries
  in UI.

### TODO
- Properly set up dependencies
- Properly configure linting
- Write tests
- Variable actions:
  - Convert a raw value to a variable
    - First search for existing vars with same value
    - Always show these options in case of raw values (unless they're not used in selectors)
  - Search all equal raw values and replace with variable
  - Split variable into multiple
- Visualize some math functions
- More tailored controls / group properties into single control?
- Make hotkeys configurable in the UI
- Clean up internal style handling (separate styles altogether?, )
- Use `ResponsiveFrame` to render multiple themes / screen sizes at the same time
- Expand the color usages quick menu to allow picking all kinds of values. Maybe a textual widget ordered by how
  frequently used?
- Hot reloading would be nice, as reloading the page to see your changes applied will reset the iframe's scroll
  position.
- Better organizing of themes.
- Personal editor theme that is applied separately from the theme that is being edited. (detect own stylesheets?)
- Use sourcemap location and edits to auto generate a PR.
- Improve elements with a hidden or hard to access state
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
  - Or change approach altogether to update the actual rules instead?
    - Probably has the best performance
    - Solves issues with scoped custom properties of equal selector specificity (i.e. order dependent)
- Move expensive logic (regex and searching lists) into initial data extraction where possible.
- Configurable source URLs (protocol, Github, automatic detection?)
- Inspector as a separate package?
- Drop tokens onto page like Figma tokens plugin
  - Can reuse inspect function and auto apply the innermost fitting the token type.
  - If multiple options possible
    - Show dialog on nearest side of iframe (or configurable)
    - Hover an option previews it
- Visualize overridden scope values, so that you can see what happens when removed from a scope.
- Visualize spacing properties with overlay
- Allow mapping hotkeys to any reducer action
  - Since reducers are already collected for history, it should be a small step to list this
    collection and allow setting a mapping.
  - Perhaps handle actions with a payload?
    - Some values can be entered manually (e.g. increment by a certain amount, choose a particular string like for panel layout)
    - Other values could come from some sort of context (e.g. the currently focused variable control)
    - Other approach is to tie it to event listeners. Might allow defining function once. Still need to check focus probably.


## Future theme structure

Currently themes are just a list of selectors with lists of properties.
Eventually the theme should be a sort of "diff" compared to a current set of CSS files.
New files can then be generated if the diff format allows to locate the source declaration
for each item. It's unclear where the source code mapping should happen.

#### Declarations
Each item: selector + property (combined unique ID, this could be a single ID as well, anything that allows you to find the right source)
* Updated decls (including adding properties, order by convention within selector)
  * data: new value
* Removed decls
  * data: none

#### Other
* Added selectors
  * data: selector text, source position, media query
  * Translate to multiple source CSS dialects
  * Ideally a minimal description of the source position requirements. E.g. only say "after X". It's then up to
    the code generating for a particular source to deterministically figure out the exact position.
* Added media queries
  * data: condition text (maybe parsed a bit), source position
* Added animations
* Added resources (links, images, fonts)