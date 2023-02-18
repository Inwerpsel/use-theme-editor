# CSS variables based theme editor

A collection of React components and hooks that can be used standalone or together to provide theme editing capabilities
based on the contents of the stylesheets on a page.

All CSS rules that use a `var()` statement in the value are included in the UI.
It can easily be integrated into any HTML page by injecting the same script.

There's a dedicated UI element for most common CSS properties, with more to follow.
It takes all relevant data in the CSS files into account, and you can change quite a lot of it by swapping out custom props.
Eventually it will be expanded to allow any CSS edit without needing custom properties.

## Demo

> **Currently, demos live inside of `/docs` just to make them work with GitHug Pages.**

I used some open source page content that seemed ok to use.
If you're the owner of some of this content and would like to have it removed / updated,
please let me know in a new issue on this repo.

### Halfmoon ([GitHub repo](https://github.com/halfmoonui/halfmoon))

[buttons](https://inwerpsel.github.io/use-theme-editor/halfmoon/docs/buttons)

[forms](https://inwerpsel.github.io/use-theme-editor/halfmoon/docs/forms)

[grids](https://inwerpsel.github.io/use-theme-editor/halfmoon/docs/grids)

[intro](https://inwerpsel.github.io/use-theme-editor/halfmoon/docs/intro)

[sidebar](https://inwerpsel.github.io/use-theme-editor/halfmoon/docs/sidebar)

This one makes much use of chains of linked variables.
It also uses only 1 or a few selectors per custom property, which works quite well.

### Openprops ([source page](https://open-props.style/))

Just a great looking page and a great palette of values.

[home page](https://inwerpsel.github.io/use-theme-editor/openprops/home/Open%20Props_%20sub-atomic%20styles)

### Bootstrap ([source HTML](https://github.com/twbs/bootstrap/blob/main/site/content/docs/5.3/examples/cheatsheet/index.html))

[cheatsheet](https://inwerpsel.github.io/use-theme-editor/bs/cheatsheet/)

Less consistent, but still a usable result. Makes heavy use of scoped custom properties.

### Other sites

It should work for any site that uses custom properties, but you'll have to test those locally for now.
Only with the current selection of demo pages I was confident enough hosting this content on GitHub Pages
wouldn't be a problem (as the source HTML is on GitHub already).

I might in the future add a general purpose way to load other sites, though this has some obvious CORS
challenges. Luckily it's quite easy to run locally.

You should be able to check out the repo locally, save any page as HTML in the browser, and inject the script and style 
tags you see in [other example HTML pages at the end of the body](https://github.com/Inwerpsel/use-theme-editor/blob/a040386a18ab001b2add0e59610f4ae077128d36/docs/halfmoon/docs/buttons.html#L1091-L1092).

Among such pages, GitHub itself has quite interesting results in the editor.
It pushes some parts of the UI much further (performance and UX) than any other site, because a single custom property
often is used in over 100 selectors, and very large pages are frequent (e.g. PR main page).

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


## Additional packages*

\* Not fully set up as separate packages yet, but code should work as such. Setting up these packages is currently
 not a priority, but if there's interest I'd love to hear which things would be needed to get it up in a particular use case.

### [Draggable elements](https://github.com/Inwerpsel/use-theme-editor/tree/main/src/components/movable)
I have no good name for it yet (in code called MovablePanels). It makes drag and drop rearrangement in React very easy.

### [History management](https://github.com/Inwerpsel/use-theme-editor/blob/main/src/hooks/useResumableReducer.js)
Using `useSyncExternalStore`, this hook makes it possible to sync with a single history timeline,
while offering an identical function signature as `useState` and `useReducer`. Any code that uses either should just work
with history by replacing the function, and adding a string key.

* Capture any combination of separate states (simple or with reducers) into a single history timeline.
* Only elements with changes are ever rerendered when jumping between any 2 states in history.
* Some (rough) components for timeline navigation and visualization.
* Register a custom component per action to visualize in the timeline.
* Debounces everything by default (you'd never want history without it).

## How to use

Exact instructions are still to follow, so for now you need to be prepared to deal with unforeseen circumstances.
Though the setups steps are easy and require no code.

In theory, all that needs to happen is build the script (currently in example),
and load it in any HTML page, after all CSS was loaded.

Currently the editor kind of "eats" the page it's on. Eventually it will likely be on its own page,
able to load arbitrary HTML pages without a page reload.

## Status
Multiple features are currently under active development. Hence some features temporarily don't work or work improperly.
This can break some use cases.

## Known issues
- Current theme view not working (needs adaptation to selector scoped properties)
- Edits not always showing on pages that use multiple root scope selectors
- Equally specific (and so order dependent) selectors override too much (e.g. Bootstrap .btn background will override .btn-primary)
- Multiple issues with `:where` and similar selectors

*Everything after this is somewhere between a brain dump and a road map.*

---

### STALLED
- Facilitate other variables as a value
  - Needs to be aware of types, which is currently handled in a very ad-hoc way. Setting up proper type handling
    requires some focus, so I'll first wrap up other in progress stuff.

### IN PROGRESS
- Improve state management
  - Move top level state that uses useResumableReducer down
    - External store is very efficient, allows minimizing render complexity
    - Trade off: A large amount of notifiers possibly performs worse (e.g. large list => don't use in lists > certain size?)
    - Investigate impact on React's ability to render concurrently
    - Move local storage out of React this way?
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
      - How efficient is equality comparison in different cases?
      - How many keys can a store have before any significant impact on performance?
      - Is there a more efficient way to write and read this kind of data?
      - Does the current approach of using a separate object for the latest state have any benefits?
        - Compared to immediately pushing on the history stack and returning the state from that.
        - I assume minimizing operations on the history array as new actions are dispatched is worth it.
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
    - Any equally specific selector  occurring in source after the one we're overriding in the theme
      will start being overridden (i.e. it's not after that selector anymore).
    - Hence, there's probably no choice but to figure out and repeat all rules that could be affected.
    - Unless updates would actually change rules with a variable to their resolved value.
      - No additional CSS
      - Recalculations affect (potentially much) less elements, because cascading no longer needed
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
      contain the arguments. (e.g. BS and derivatives)
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
- Make keyboard shortcuts work when focus is inside the frame.
- Ensure button elements are used where appropriate.
- Better text inputs (clear button, debounce where needed)
- Show current changes compared to server (maybe integrate with "current theme" component?)
- As browser extension?
  - Address CORS (or detect + warn)
  - Address idle performance (lazy extract page variables / lazy include entire script)
- Optimize root property updates
  - Updating root causes full style recalculation
    - Doesn't work well on large pages
  - Solve by updating rules instead?
    - Probably has the best performance
    - Solves issues with scoped custom properties of equal selector specificity (i.e. order dependent)
- Move expensive logic (regex and searching lists) into initial data extraction where possible.
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
  - Restore from local storage
    - Store initial state + actions, then replay
      - more space efficient
      - minimal writes (though how to incrementally update local storage efficiently?)
      - history can rely on object equality like newly constructed
    - Some components can't reliably be resumed
      - Inspected HTML can be (slightly to completely) different
      - Could be solved partially using path of element in tree
    - Some states are inconsequential / uninteresting
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
