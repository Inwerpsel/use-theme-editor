# Experimental CSS variables based theme editor

This is a WIP theme editor that allows creating a theming UI for CSS variables based entirely on the built CSS files,
with no configuration needed to add a new setting. It works in the following way:
- Extract `var` usages from the accessible stylesheets. A usage has the selector, CSS property and default value.
- When you alt + click an element it is matched against all selectors of all variables. This can be done efficiently by
  combining all selectors for a variable with `,` and doing a single `element.match(selectors)`. To ensure we match all
  variables of parents too, each selector is also tested with ` *` appended.
- Next it travels up the DOM tree by testing doing the same matching on each parent. This only needs to match against 
  the variables we previously filtered, and not against all known variables like the first element. Each time a jump to 
  a parent matches less variables than the sibling we just visited, this means those "missing" variables can be
  attributed to that previous sibling.

