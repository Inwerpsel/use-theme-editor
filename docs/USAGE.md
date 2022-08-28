# Usage

## Getting an element's settings

If you click an element in the content frame (or `alt + click` an element outside of it),
you will get all variables that apply to the element or any of its parents.

### Grouping

These by default are grouped per HTML element.

For example if your page has a header with a variable background color, within it a left section with also a variable
background color, then in that section a button (also with some options).

`header > div.header-left-side (with options) > button (with options)`

Then you will see 3 different groups corresponding to each element. The deepest element (in this case the button) is
displayed at the top and opened already.

If there are elements in the tree that don't have any options, these will not be shown. E.g.

`header > div (with no options) > div (also no options) > div.header-left-side (with options) > button (with options)`

This will display the same 3 groups as the first example. If new code is pushed that adds options to one of the 2
elements that previously had none, the theme editor will start displaying a 4th group.

If there are no options for the element you clicked or any of its parents, no groups will be shown.
This doesn't happen frequently as most of the time there's at least some styles on the root element or body.

### Locating opened elements on the page

Hovering the title of each group will highlight the corresponding element on the page. Note that this is only the
element you last clicked (or parent of). The same options could also apply to other elements on the page, but these are
not highlighted.

### Locating other elements affected by a variable

To find other elements that may be affected by a certain variable, press the "Show selectors" button at the bottom.
This will allow you to find all elements that would be affected by this variable on the page. Since this matches by
selector, it can occur that elements are shown where there is a more specific variable overriding it. For example an 
`a` selector will also match buttons (unless it's using `:not(.btn)`).

Another way a variable can be used is in another variable. In that case these other references are shown as the first
thing when you open the variable control. This way you're sure to not miss it before you start changing the value.
Only in a few cases this usually has a long list.

### Undo/redo behavior

You can undo changes by pressing `ctrl + Z` (or `cmd + Z`). For now the history is NOT preserved across page loads, so
refreshing the page will prevent you from undoing earlier changes.

After undoing changes, you can redo them again using `ctrl + shift + Z` (or `cmd + shift + Z`).

Each change you make in the editor is applied immediately, so also "fluid" rapid changes, for example dragging the color
picker to a different color. While dragging you see the color applied immediately, but the history will only include the
"final" color you land on. This way the history stays manageable and navigable. This is done by using a 700ms timeout.

Note that this is only local history and not saved on the server. Versioning of themes saved on the server is not
included yet, but may be supported (to some degree) by this library at a later point. Preferably in a VCS.

### Resizable content frame

If you need to work with a screen size bigger than your current screen, you can use the slider at the top to
scale down this frame.

On the right you have some preset screen sizes. You can also manually enter width and height, or use the bottom right
square with your mouse to drag it to different dimensions.

The scale is stored per screen resolution. For now this results in buggy behavior while manually resizing the frame
if it's scaled down. Most of the time you'll just want to use one of the preset options.

### Current theme view

The current theme component lists all individual values in the theme. These are grouped by selector, which works well
most of the time, but only if the CSS doesn't use too much slightly different selectors (or different groupings).

Pseudo selectors (and some other stuff) is also removed, which usually works as most people nest their state selectors
witih SCSS. And even if it's not the case it's usually consistent, so removing them ends us with exactly the "normal"
selector.

For example, in most frameworks you'll find all button properties grouped together, but in some cases there's 10 or 
more different groups matching `.btn`, because there were also other classes in the selector.

You can make this list include every variable that is used by the page. Even large lists render fast, however changing
a theme value quickly (e.g. dragging a color slider) while the whole list is open will cause stuttering. In my testing
this only happened from upward of about 1000 controls being displayed, and it was still manageable. Still, for optimal
performance it's best to not have this view open while making fluid changes.

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

### Copying a theme on the server

Just type something else in the theme name field, and upload it as a new theme.

## Rearranging the UI

The editor consists of multiple areas, arranged around the content frame.

There's a checkbox somewhere allowing you to make the UI elements draggable.
This allows you to drag any element from one of the areas to any other.

On the whole page only 2 things can't be dragged:
- content frame
- drawer + button

For now this is just a ring around the content with a limited width. The height also makes it impractical to put long
controls in the upper or bottom areas, but you can do it.

The "Drawer" is a special area that is closed by default. It opens automatically while dragging an element,
allowing you to remove UI elements you don't use. As a bonus, elements in the drawer don't render at all,
which allows for adding large amounts of optional UI elements.

The arrangement is saved in local storage. However because of how it currently generates identifiers, code changes
that change the structure will invalidate (parts of) this arrangement. In some cases it could cause existing elements
to move to another area.

## Known limitations/bugs

There are no known issues that prevent it from being unusable, but given this is an early version, there's a few things
to watch out for, and a few things that for now require more "manual" work.

- Switching to a different theme can be "undone" like other actions, but it won't switch the theme name back to the
  previous one. This will likely be solved by adding a history per theme name if it was saved already. For now, you have
  to watch out a bit after you press undo after switching a theme, so that you don't accidentally overwrite a theme with
  another theme when saving.
- In a few rare cases the logic for filtering the most specific variable doesn't pick the right one.
- No Google Fonts integration. The font picker is currently disabled because it crashes when the value is not found in
  Google Fonts. Also picking a new font from Google Fonts doesn't ensure the font is actually available on the page.
  This integration will be finished later.
- No UI for setting a variable to another variable. It's supported, but you have to enter the variable name manually in
  the text field at the bottom. This will be added, but it still needs to be shaped how that UI would look like.
  Probably it will be created as part of the "theme-builder-builder" functionality.
- Media queries are taken into account to some degree, but the UI currently doesn't visualize that a setting applies
  only to a certain screen size range. For now, you have to check the name of variables for this info.
