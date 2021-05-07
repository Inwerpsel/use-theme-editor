# Usage

### Getting an element's settings

If you `alt + click` an element, you will get all variables that apply to the element you clicked or any of its parents.
These by default are grouped per HTML element.

For example if your page has a header with a variable background color, within it a left section with also a variable
background color, then in that section a button (also with some options).

`header > div.header-left-side (with options) > button (with options)`

Then you will see 3 different groups corresponding to each element. The deepest element (in this case the button) is
displayed at the top and opened already.

If there are elements in the tree that don't have any options, these will not be shown. E.g.

`header > div (with no options) > div (also no options) > div.header-left-side (with options) > button (with options)`

This will display the same 3 groups as the first example. If options are added to one of those 2 elements, it will
result in a 4th group being shown.

If there are no options for the element you clicked or any of its parents, no groups will be shown.

### Locating opened elements on the page

Hovering the title of each group will highlight the corresponding element on the page. Note that this is only the
element you last clicked (or parent of). The same options could also apply to other elements on the page, but these are
not highlighted.

This currently does not work in responsive mode, but can be fixed to do so.

It's a very quick implementation that just sets a border, so this is likely to make the whole layout jiggle. I'll
replace it with something that doesn't change the layout, but for now this seems acceptable, given there's otherwise no
way to locate the element again.

### Undo/redo behavior

You can undo changes by pressing `ctrl + Z` (or `cmd + Z`). For now the history is NOT preserved across page loads, so
refreshing the page will prevent you from undoing earlier changes.

After undoing changes, you can redo them again using `ctrl + shift + Z` (or `cmd + shift + Z`).

Each change you make in the editor is applied immediately, so also "fluid" rapid changes, for example dragging the color
picker to a different color. While dragging you see the color applied immediately, but the history will only include the
"final" color you land on. This way the history stays manageable and navigable. This is done by using a 700ms timeout.

Note that this is only local history and not saved on the server. Versioning of themes saved on the server is not
included yet, but may be supported (to some degree) by this library at a later point.

### Draggable overlay

If you click and hold the overlay (outside a list element), you can drag it around the screen. It will (try to) avoid
going off-screen by adjusting the maximum height, however the implementation currently is a bit buggy. It doesn't take
the resizable server themes into account so if you make that one too big it gets pushed off the bottom of the screen.

### Responsive view

If you check the checkbox at the top (or press `alt + v`), you switch to a responsive mode where the site is displayed
in an iframe with any dimensions. If you need to work with a screen size bigger than your current screen, you can use
the slider at the top to scale down this frame. On the right you have some preset screen sizes. You can also manually
enter width and height, or use the bottom right square with your mouse to drag it to different dimensions.

### "Group by last clicked element" checkbox

You can toggle off this checkbox to switch to another "mode", where all previously matched variables are displayed in a
single list (instead of grouped). When clicking multiple elements, these are all appended to this list (as opposed to
the "grouped" mode which only includes the last clicked element). You can individually close options in this list using
the minus sign on the right. This was the first mode I created, the grouped mode is a lot more convenient, but I
preserved it because it could be handy in some cases.

## Saving a theme on the server

There is currently a quick way included to save themes and view the differences/changes with local themes. Whenever the
theme name field matches the name of a theme on the server, it's considered to be the same. So if you save it, it will
overwrite that theme on the server.

You can save by clicking the "Save" button, or by pressing `alt + s`. The button will prompt you to confirm the save, to
prevent accidentally overwriting a theme on the server. If you use the keyboard shortcut it does not prompt you and
immediately saves (since it's a lot less likely to press the combination by accident).

If you have changes compared to the version on the server, you will see `(*)` behind its name. Then you'll also get a
prompt when clicking the "switch" button of another theme, to prevent you from losing these changes.

If no theme with that name exists on the server, the button will say "Upload" instead, and upload the theme without
requiring confirmation.

Next to each theme on the server there's a button to delete it (with confirmation), and a button to switch to it.

## Comparing themes

If you hover any theme in the list, it will be compared with what you currently have in the editor. This works the same
way for all themes on the server. You can use this comparison for different purposes.

### Seeing your current changes

If you hover the currently selected one, you will see a summary of the changes you made. You can use this to check
before saving to the server.

### Comparing multiple themes

You can also use this comparison to see the differences among multiple themes. If you switch to theme `a`, and hover
over theme `b`, you will see how theme `a` is different from theme `b`. If you hover the `default` theme (which is
basically empty), you see all the options the current theme is setting.

This is just a very quick implementation that puts the info in the title attribute. So it's not very user-friendly, but
it's better than nothing for now :). This will be made more robust in a future iteration.

## Known limitations/bugs

There are no known issues that prevent it from being unusable, but given this is an early version, there's a few things
to watch out for, and a few things that for now require more "manual" work.

- There is no local storage "namespace", so if multiple sites run on the same domain, it will currently read and apply
  the last theme you edited to all sites that have the theme editor.
- The selectors for a variable currently often increase the width of the overlay if they are long, resulting in the
  overlay scrolling horizontally. Will be replaced with a better way of visualizing these.
- The responsive view still uses the same overlay as the "embedded view". This is only because the responsive view was
  created more recently, and will be replaced with a fixed UI that can more efficiently use available space.
- Switching to a different theme can be "undone" like other actions, but it won't switch the theme name back to the
  previous one. This will likely be solved by adding a history per theme name if it was saved already. For now, you have
  to watch out a bit after you press undo after switching a theme, so that you don't accidentally overwrite a theme with
  another theme when saving.
- In a few rare cases the logic for filtering the most specific property doesn't pick the right one. Because of that, I
  preserved a checkbox at the top to disable this filtering ("Show only specific properties"). Once these cases are
  solved, the checkbox will likely be removed.
- No Google Fonts integration. The font picker is currently disabled because it crashes when the value is not found in
  Google Fonts. Also picking a new font from Google Fonts doesn't ensure the font is actually available on the page.
  This integration will be finished later.
- No UI for setting a variable to another variable. It's supported, but you have to enter the variable name manually in
  the text field at the bottom. This will be added, but it still needs to be shaped how that UI would look like.
  Probably it will be created as part of the "theme-builder-builder" functionality.
- Media queries are taken into account to some degree, but the UI currently doesn't visualize that a setting applies
  only to a certain screen size range. For now, you have to check the name of variables for this info.
