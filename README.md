# `use-theme-editor`: Your app is your design system, your pages are your designs

Are you tired of slow design iterations, keeping designs up to date, and oversimplified mockups that miss 99% of your app's complexity?
Do you have a waterfall process just so that you can update a few colors?
Do you need to have your designers spend literal months setting up and maintaining a separate design system that duplicates information already encoded in the source code?

With this repo you can directly use your content to inspect every part of the design and create new design variations.

This works on literally any HTML page, whether it's from a SSR, SPA, CMS... It parses all CSS on the page and makes it
browsable.

You can use this repo in various ways:
- Integrate the standalone theme editor page with almost no coding required (exact steps to follow)
- Import 1 function in your own app
- Anything in between the previous options


https://github.com/Inwerpsel/use-theme-editor/assets/7604138/2d0e5e6f-3e8c-4aeb-95e2-011204e9e8c2


## Status

While in general most functionality is quite stable, various parts are being worked on at the moment. If you'd like to
make use of this repo in any form, but can't find everything you need to set it up (be it documentation or
functionality), feel free to open a new issue describing your needs and they'll be prioritized.

## Demo

> I used some open source page content that seemed ok to use.
If you're the owner of some of this content and would like to have it removed / updated,
please let me know in a [new issue](https://github.com/Inwerpsel/use-theme-editor/issues/new) on this repo.

### Openprops ([source](https://open-props.style/))

<details>
  <summary>Info/instructions</summary>

  #### What works well?
  - Most complete palette of custom properties
  - Great design
  - Mostly short and readable selectors (I just love `small.green-badge` and `circle#sun`)
  - Modern CSS
  - A few pretty advanced use cases (gradients with noisefilters, > 4 border radii blobs, )
  #### What doesn't work well?
  - Special heading style applies also to editor headings. Looks a bit broken but also cute so I didn't intervene yet.
  - Over-usage of `:where()` (e.g. `:where(html)`), currently leading to a few bugs in the inspector (e.g. selector locator doesn't properly handle this)
  - Almost no semantic tokens (e.g. button-color), so adding aliases doesn't really make sense here. It also
  makes drag and dropping values pretty much useless: you'd get something like `--orange: var(--purple)`.
  - Some inline styles (e.g. border radius) not properly handled
</details>

[🖌 Home page](https://inwerpsel.github.io/use-theme-editor/openprops/home/)

### Halfmoon ([source](https://github.com/halfmoonui/halfmoon))

<details>
  <summary>Info/instructions</summary>

  #### What works well?
  - Enormous amount of custom properties => able to edit almost every part of the design.
  - Mostly 1 selector per custom property => easy to understand info in the UI
  - Great demonstration of linking variables in various ways (chains of 3 or 4 variables that actually make sense)
  - Only defines values in the `:root` scope => easier to understand and less bugs in the editor
  #### What doesn't work well?
  - A very large portion (~1/3 of the ~1500) of variables are just a dark mode version of something that has a light
  mode version. Since the whole point of custom props is theming, dark mode should have been a theme
  consisting entirely of custom props. Since the editor only loads the light mode, it should only show
  the light mode variants. You can remove the annoying `lm` prefix from the displayed variables.
  - The approach is sometimes a bit contrived, with a lot of variables defined "just in case". This inflates
  the CSS if you never end up overriding. This is not a problem if the eventual production build filters these.
  E.g. `--lm-button-danger-bg-image-hover: none` (similar exists for every state of every variant of button, for both light and dark mode)
  - The documentation site still relies on a few overrides that don't use custom props, which kind of spoils the experience.
</details>

[🖌 Buttons](https://inwerpsel.github.io/use-theme-editor/halfmoon/docs/buttons)
[🖌 Forms](https://inwerpsel.github.io/use-theme-editor/halfmoon/docs/forms)
[🖌 Sidebar](https://inwerpsel.github.io/use-theme-editor/halfmoon/docs/sidebar)

### Bootstrap ([source](https://github.com/twbs/bootstrap/blob/main/site/content/docs/5.3/examples/cheatsheet/index.html))

<details>
  <summary>Info/instructions</summary>

  #### What works well?
  - Properties defined in non-root scope. While this approach has some drawbacks too, the result here is pretty good overall.
  - Mostly quite consistent in how similar things are implemented
  - Great for testing alias creation (but has issue in few cases, see below)
  #### What doesn't work well?
  - Quite a lot of custom properties are overridden with regular rules
  - Uses `!important` quite heavily.
  - Creating aliases has the wrong result sometimes, because the added CSS rules cannot yet properly respect
  order, and thus specificity. Specifically this happens if you change properties that should be overridden
  by a more specfic scope. For example: `.btn` and `.btn-primary`. This currently happens if you create an alias
  for a property on `.btn`.
</details>

#### Big page with most things
[🖌 Cheatsheet](https://inwerpsel.github.io/use-theme-editor/bs/cheatsheet/)
#### Smaller pages
[🖌 album](https://inwerpsel.github.io/use-theme-editor/bs/album)
[🖌 blog](https://inwerpsel.github.io/use-theme-editor/bs/blog)
[🖌 carousel](https://inwerpsel.github.io/use-theme-editor/bs/carousel)
[🖌 checkout](https://inwerpsel.github.io/use-theme-editor/bs/checkout)
[🖌 cover](https://inwerpsel.github.io/use-theme-editor/bs/cover)
[🖌 dashboard](https://inwerpsel.github.io/use-theme-editor/bs/dashboard)
[🖌 dropdowns](https://inwerpsel.github.io/use-theme-editor/bs/dropdowns)
[🖌 features](https://inwerpsel.github.io/use-theme-editor/bs/features)
[🖌 footers](https://inwerpsel.github.io/use-theme-editor/bs/footers)
[🖌 grid](https://inwerpsel.github.io/use-theme-editor/bs/grid)
[🖌 headers](https://inwerpsel.github.io/use-theme-editor/bs/headers)
[🖌 heroes](https://inwerpsel.github.io/use-theme-editor/bs/heroes)
[🖌 jumbotron](https://inwerpsel.github.io/use-theme-editor/bs/jumbotron)
[🖌 list-groups](https://inwerpsel.github.io/use-theme-editor/bs/list-groups)
[🖌 masonry](https://inwerpsel.github.io/use-theme-editor/bs/masonry)
[🖌 modals](https://inwerpsel.github.io/use-theme-editor/bs/modals)
[🖌 navbar-bottom](https://inwerpsel.github.io/use-theme-editor/bs/navbar-bottom)
[🖌 navbar-fixed](https://inwerpsel.github.io/use-theme-editor/bs/navbar-fixed)
[🖌 navbar-static](https://inwerpsel.github.io/use-theme-editor/bs/navbar-static)
[🖌 navbars](https://inwerpsel.github.io/use-theme-editor/bs/navbars)
[🖌 navbars-offcanvas](https://inwerpsel.github.io/use-theme-editor/bs/navbars-offcanvas)
[🖌 offcanvas-navbar (sic)](https://inwerpsel.github.io/use-theme-editor/bs/offcanvas-navbar)
[🖌 pricing](https://inwerpsel.github.io/use-theme-editor/bs/pricing)
[🖌 product](https://inwerpsel.github.io/use-theme-editor/bs/product)
[🖌 rtl](https://inwerpsel.github.io/use-theme-editor/bs/rtl)
[🖌 sidebars](https://inwerpsel.github.io/use-theme-editor/bs/sidebars)
[🖌 sign-in](https://inwerpsel.github.io/use-theme-editor/bs/sign-in)
[🖌 starter-template](https://inwerpsel.github.io/use-theme-editor/bs/starter-template)
[🖌 sticky-footer](https://inwerpsel.github.io/use-theme-editor/bs/sticky-footer)
[🖌 sticky-footer-navbar](https://inwerpsel.github.io/use-theme-editor/bs/sticky-footer-navbar)

### Mozilla developers

<details>
  <summary>Info/instructions</summary>

  #### What works well?
  - A lot of real world complex markup and variants
  - Clean and semantic markup
  - Relatively successful mix of root and non-root scoped custom properties (doesn't seem inconsistent or confusing)
  #### What doesn't work well?
  - Specificity related bug prevents created aliases from being picked up in the editor in some cases.
  Possible related to the `:root:not(.light):not(.dark)` selector
</details>

[🖌 How CSS is structured](https://inwerpsel.github.io/use-theme-editor/mozilladocs/how-is-css-structured/)
[🖌 Basic math in JavaScript — numbers and operators](https://inwerpsel.github.io/use-theme-editor/mozilladocs/jsmath/)
[🖌 @media hover](https://inwerpsel.github.io/use-theme-editor/mozilladocs/media-hover/)
[🖌 Using CSS custom properties](https://inwerpsel.github.io/use-theme-editor/mozilladocs/use-custom-properties/)

### Pico CSS

<details>
  <summary>Info/instructions</summary>

  #### What works well?
  - Most semantic markup ever, makes for very short inspector titles (maybe even too short)
  #### What doesn't work well?
  - `--background-color` is defined in a few scopes. Because of how the inspector currently works,
  it will only show such variable on the topmost element. Unfortunately this affects buttons.
  - Some custom properties are defined in too hairy selectors. E.g. `[role="link"]:is([aria-current], :hover, :active, :focus), a:is([aria-current], :hover, :active, :focus)`
  - Some not so sensible defaults
 
</details>

[🖌 accordions](https://inwerpsel.github.io/use-theme-editor/pico/docs/accordions.html)
[🖌 buttons](https://inwerpsel.github.io/use-theme-editor/pico/docs/buttons.html)
[🖌 cards](https://inwerpsel.github.io/use-theme-editor/pico/docs/cards.html)
[🖌 classless](https://inwerpsel.github.io/use-theme-editor/pico/docs/classless.html)
[🖌 containers](https://inwerpsel.github.io/use-theme-editor/pico/docs/containers.html)
[🖌 customization](https://inwerpsel.github.io/use-theme-editor/pico/docs/customization.html)
[🖌 dropdowns](https://inwerpsel.github.io/use-theme-editor/pico/docs/dropdowns.html)
[🖌 forms](https://inwerpsel.github.io/use-theme-editor/pico/docs/forms.html)
[🖌 grid](https://inwerpsel.github.io/use-theme-editor/pico/docs/grid.html)
[🖌 home](https://inwerpsel.github.io/use-theme-editor/pico/docs/home.html)
[🖌 loading](https://inwerpsel.github.io/use-theme-editor/pico/docs/loading.html)
[🖌 modal](https://inwerpsel.github.io/use-theme-editor/pico/docs/modal.html)
[🖌 navs](https://inwerpsel.github.io/use-theme-editor/pico/docs/navs.html)
[🖌 progress](https://inwerpsel.github.io/use-theme-editor/pico/docs/progress.html)
[🖌 rtl](https://inwerpsel.github.io/use-theme-editor/pico/docs/rtl.html)
[🖌 scroller](https://inwerpsel.github.io/use-theme-editor/pico/docs/scroller.html)
[🖌 tables](https://inwerpsel.github.io/use-theme-editor/pico/docs/tables.html)
[🖌 themes](https://inwerpsel.github.io/use-theme-editor/pico/docs/themes.html)
[🖌 tooltips](https://inwerpsel.github.io/use-theme-editor/pico/docs/tooltips.html)
[🖌 typography](https://inwerpsel.github.io/use-theme-editor/pico/docs/typography.html)
[🖌 we-love-classes](https://inwerpsel.github.io/use-theme-editor/pico/docs/we-love-classes.html)

### Other sites

It should work for any site (even complex sites like GitHub, StackOverflow, YouTube), but you'll have to test those locally for now.
Only with the current selection of demo pages I was confident enough hosting this content on GitHub Pages
wouldn't be a problem (as the source HTML is on GitHub already).

I might in the future add a general purpose way to load other sites, though this has some obvious CORS
challenges. Luckily it's quite easy to run locally.

Just save any page as HTML in the browser, into the `/docs` folder, and inject the script and style 
tags you see in [other example HTML pages at the end of the body](https://github.com/Inwerpsel/use-theme-editor/blob/a040386a18ab001b2add0e59610f4ae077128d36/docs/halfmoon/docs/buttons.html#L1091-L1092).

## Features
* Plug and play: can be added to any page of an app
* Good performance even on huge pages
* Detailed information
* Many editing options
* Easily locate all other elements affected by a change
* Screen switcher on variables with a media query
* Link variables to other variables to create a design system
* Switch themes while deep inspecting
* Reposition or hide any UI element with drag and drop


## Embedded packages*

\* Not fully set up as separate packages yet, but code should work as such.

### [Draggable elements](https://github.com/Inwerpsel/use-theme-editor/tree/main/src/components/movable)
I have no good name for it yet (in code called MovablePanels). It makes drag and drop rearrangement in React very easy.

### [State management with history](https://github.com/Inwerpsel/use-theme-editor/blob/main/src/hooks/useResumableReducer.tsx)
Using `useSyncExternalStore`, these hooks make it possible to put multiple pieces of state into a single history timeline,
while offering a similar function signature as `useState` and `useReducer`. Any code that uses either should just work
with history by replacing the function, and adding a string key.

* Capture any combination of separate states (simple or with reducers) into a single timeline.
* Only elements with changes are ever rerendered when jumping between any 2 states in history.
* Some (rough) components for timeline navigation and visualization.
* Register a custom component per action to visualize in the timeline.
* Debounces everything by default (you'd never want history without it).

## Known issues
A few components are not (fully) working at the moment, mostly because they depend on other changes, but also some small bugs.

- Current theme view not working (needs adaptation to selector scoped properties)
- Not all references in other variables are listed
- Import/export exports wrong data format.
- Add alias for raw values not working.

<details>
<summary>
  Here's a long list / braindump of some in progress work and ideas. I'll gradually convert some to issues.
</summary>

### IN PROGRESS
- Improve state management
  - Move top level state that uses useResumableReducer down
    - Complex state (open groups) vs many keys (open variable controls) vs reducer (theme editor)?
      - complex state (without reducer):
        - pro: less work performed by store, less keys to change detect, stable amount of instances
        - con: can't replay fine grained, causes more elements to render (same issue as Context), shifts burden to consumer
      - many keys:
        - pro: maximally targeted renders, easy to replay / compare with other states
        - con: need to generate complex key, lists can potentially have thousands of items
      - reducer:
        - pro: components can use dispatched actions (history view), replayable unless semantically impossible
        - con: more coupled state, hard to detect whether 2 states are equivalent, replay requires error handling
    - Questions on useResumableReducer
  - Decouple state implementations in movable panels so it can be used standalone
    - Maybe better with reducer?

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
    - For now this is solved using `!important`, which surprisingly seems to work 100% of the time.
    - However, an even better solution is to take full control over the stylesheets on the page so
      that no overriding rules are needed.
      - No additional CSS rules
      - Recalculations affect (often much) less elements, because cascading no longer needed
      - No specificity challenges at all
      - Also supports regular CSS edits

- Determine / infer property types
  - examples + libs
    - https://github.com/mdn/yari/blob/main/kumascript/macros/CSSSyntax.ejs
    - https://github.com/w3c/webref/tree/main/packages/css
    - https://github.com/csstree/csstree
    - https://github.com/mdn/data/
  - "De facto" type system?
    - A variable gets its type from the intersection of all CSS properties it's used on.
      - Seems hard to parse from allowed syntaxes? Perhaps not a problem in most cases?
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
  - Support typing of variables surrounded by just 1 function
    - It's apparently a common thing for frameworks to hard code which color function to use, and have the variables only
      contain the arguments. (e.g. BS and derivatives, mostly in DaisyUI)
    - Even though this is a bad idea for multiple reasons, I don't expect common frameworks to change it soon.
    - Can be somewhat generalized. Perhaps check type of function arguments in CSS syntax?

### TO FINISH
- Combine all media query versions of the same property into a single control. This can update the iframe to match the
  media query, so that you always can see your changes applied (done but for separate controls). Visualize media queries
  in UI.

### TODO
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
- Show current changes compared to server (maybe integrate with "current theme" component?)
- As browser extension?
  - Address CORS (or detect + warn)
  - Address idle performance (lazy extract page variables / lazy include entire script)
- Optimize root property updates
  - Updating root causes full style recalculation
    - Doesn't work well on large pages
    - e.g. Halfmoon
  - Could modify the CSS to work differently with the same result
- Drop tokens onto page like Figma tokens plugin
  - Can reuse inspect function and auto apply the innermost fitting the token type.
  - If multiple options possible
    - Show dialog on nearest side of iframe (or configurable)
    - Hover an option previews it
- Visualize overridden scope values, so that you can see what happens when removed from a scope.
  - However, it shouldn't result in a devtools like experience, where over half of what's shown is overridden rules.
- Allow mapping hotkeys to any reducer action
  - Since reducers are already collected for history, it should be a small step to list this
    collection and allow setting a mapping.
  - Perhaps handle actions with a payload?
    - Some values can be entered manually (e.g. increment by a certain amount, choose a particular string like for panel layout)
    - Other values could come from some sort of context (e.g. the currently focused variable control)
    - Other approach is to tie it to event listeners. Might allow defining function once. Still need to check focus probably.
- History actions
  - Clear newer / older separately
  - Clear specific state members
    - Apply the most recent state to all members in history.
  - Squash
  - Different edit modes when in the past
    - Current mode: discard future, prompt first if offset > 5
    - Optional prompt?
    - Save any "chopped" off futures?
    - Options determining which scenario (e.g. save when > 3 edits, discard when < 2)
  - Keep alternate futures and merge them like branches
- Restore history from local storage
  - Store initial state + actions, then replay
    - more space efficient
    - minimal writes (though how to incrementally update local storage efficiently?)
    - history can rely on object equality like newly constructed
  - Some components can't reliably be resumed
    - Inspected HTML can be (slightly to completely) different
    - Could be solved partially using path of element in tree
- Some history states are inconsequential / uninteresting
  - E.g. open an editor UI window and close it with no changes
  - hard to detect if this is the case

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
  * Translate to multiple source CSS dialects (where?)
  * Ideally a minimal description of the source position requirements. E.g. only say "after X". It's then up to
    the code generating for a particular source to deterministically figure out the exact position.
* Added media queries
  * data: condition text (maybe parsed a bit), source position
* Added animations
* Added resources (links, images, fonts)

</details>
