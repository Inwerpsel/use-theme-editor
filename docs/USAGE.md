# Usage

### Getting an element's settings

If you alt + click an element, you will get all variables that apply to the element you clicked or any of its parents.
These by default are grouped per HTML element.

For example if your page have a header with a variable background color, within it a left section with also a variable
background color, then in that section a button (also with some options).

`header > div.header-left-side (with options) > button (with options)`

Then you will see 3 different groups corresponding to each element. The deepest element (in this case the button) is
displayed at the top and opened already.

If there are elements in the tree that don't have any settings, these will not be shown. E.g.

`header > div (with no options) > div (also no options) > div.header-left-side (with options) > button (with options)`

This will display the same 3 groups as the first example. If options are added to one of those 2 elements, it will
result in a 4th group being shown.

If there are no options for the element you clicked or any of its parents, no groups will be shown.

### Undo/redo behavior

You can undo changes by pressing ctrl + Z (or cmd + Z). For now the history is NOT preserved across page loads, so
refreshing the page will prevent you from undoing earlier changes.

After undoing changes, you can redo them again using ctrl + shift + Z (or cmd + shift + Z).

Note that this is only local history and not saved on the server. Versioning of themes saved on the server is not
included yet, but may be supported (to some degree) by this library at a later point.

### Draggable overlay

If you click and hold the overlay (outside a list element), you can drag it around the screen. It will (try to) avoid
going off-screen by adjusting the maximum height, however the implementation currently is a bit buggy. It doesn't take
the resizable server themes into account so if you make that one too big it gets pushed off the bottom of the screen.

### Responsive view

If you check the checkbox at the top (or press alt + v), you switch to a responsive mode where the site is displayed in
an iframe with any dimensions. If you need to work with a screen size bigger than your current screen, you can use the
slider at the top to scale down this frame.

### "Group by last clicked element" checkbox

You can toggle off this checkbox to switch to another "mode", where all previously matched variables are displayed in a
single list (instead of grouped). When clicking multiple elements, these are all appended to this list (as opposed to
the "grouped" mode which only includes the last clicked element). You can individually close options in this list using
the minus sign on the right. This was the first mode I created, the grouped mode is a lot more convenient, but I
preserved it because it could be handy in some cases.

## Known limitations/bugs

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
- In some cases the "future" (i.e.)
