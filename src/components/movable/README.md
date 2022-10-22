# "Movable" React Components

This will probably become a standalone package. It provides a way to drag and drop React elements into other parent elements, and persist the arrangement in local storage.

```javascript
import React, {Fragment} from 'react'
import {MoveablePanels, Area, MoveControls, Drawer} from './Area.js';

return <MoveablePanels>
    <Area id="area1">
        <div>I can be dragged between area1, area2 and area3.</div>
        <MyCustomComponent>Hey, me as well!</MyCustomComponent>
        <OtherComponent title="We can be literally any React element (except Area and MoveablePanels)."/>
        <ul>
            <li>We'll always stay under ul</li>
            <li>As only the direct descendant of an Area can be moved</li>
        </ul>
        <Fragment>
            <h2>This Fragment</h2>
            <p>Will also move as a whole because the fragment is the direct descendant of the Area.</p>
            <p>Even though it has no HTML element associated with it.</p>
        </Fragment>
    </Area>
    <div>
        <Area id="area2">
            <p>An area can be anywhere inside the MoveablePanels container.</p>
            <p>As long as you don't put an area inside another area.</p>
        </Area>
    </div>
    <Area id="area3">
        // Comes with components to control moving, which themselves can be moved between areas.
        <MoveControls/>
    </Area>
    // The Drawer is a special area that has an open toggle.
    // Components you move into here won't render at all, if the drawer is closed.
    // It's still WIP and might be replaced with per area visibility settings.
    <Drawer/>
</MoveablePanels>
```

All you have to do is add the `MoveablePanels` component to the outer boundary (likely your `App` componeont),
add some `Area` elements, and put any React element inside them. As long as their CSS allows them to be dragged,
you can drag them into any of the other areas, into any position relative to the elements already in that area.

You don't need to provide / call any functions or hooks for this to work. The state is managed internally in `MoveablePanels`.

### Intended use case
You just want the ability to re-arrange your UI and have it persist in local storage.
You don't mind that the area component includes the HTML elements for you.
This should work with any React component, regardless of how the state is managed (* see below for local state).

If any of the following is not true, this d&d solution is probably not the right one.

- You're OK with using the default bitmap drag image.
  - It looks exactly like the component, and the transparency makes for a great UX.
  - The performance is best case, and allows for much more other smooth animation.
- Dragged components don't use local state, or it's ok to lose it when location changes.
  - This just because of how React portals work. You can work around it by lifting up state. You probably 
    want this kind of solution anyway to persist UI state between page refreshes.
- It's expected that elements can live in any area.
  - For simplicity there's no configurability yet.
- You don't need the area context inside most elements.
  - If you plan to use the UI state yourself a lot, it's probably better to integrate that with 
    other state solutions, if any, and use a `ref` based library.

## Motivation

The goal is to make drag and drop re-parenting as simple as possible.

As I was adding more and more UI elements to the theme editor,
having to reposition them in code became a bottleneck.
However the need for repositioning is there, even during development.
If you need to test how any 2 UI elements affect each other,
that goes very slow if they're on opposite sides of your screen.

Most current React drag and drop implementations do either of these:

- Focus on lists, where the components don't store the state for you. You need to provide event handlers.
- Position freely using XY coordinates.

What I really need was the ability to move a particular element into another place in the DOM tree. And some control over which elements can be dragged, and which elements can host other elements.

It seems a more or less natural use case for React Portals, and indeed they do the job well here.

I'm not sure if it's a viable approach beyond this use case in development,
given the challenge of identifying the dragged components as new updates are released.

## Challenges

### React has no option to portal to a specific position

As a result, portaled elements go into a random position (based on what other elements happen to be rendering before, during and after).
I assume React has no way of assuring the relative positions of elements, but I didn't thoroughly validate this assumption.

I got around this at first using the CSS `order` property. While it works relatively well, it has some not-so-nice side effects.
For example the HTML structure not matching the page will definitely lead to confusion, especially if someone is not familiar with the `order` property.
There's also a good chance that using the `order` property leads to bugs in edge cases, or cross browser differences, though I didn't yet observe any.

I then realized that if React isn't bothered by other portals coming into the same element, the same should go for manually changing
the element's position in the parent. So this currently happens in a layout effect.

I preserved the order for now as it causes the layout to immediately be accurate, instead of only when the layout effect has run.

### Hard to avoid wrapper elements

It makes it easier to make certain things about drag and drop work.

## Performance

Even though these components were initially built just as a tool, with no focus on performance, I was happy to 
discover it performs quite well in pretty much every aspect.

This is because the `Area` components just pass through the children that are defined at the top leve of the app.
The `MovablePanels` component lives just below this top level. As a result, changing the arrangement will properly
be reflected in every part of the tree without needing to re-render the app component.

So React doesn't need to start at the root of your tree to update the UI. But it also is able to avoid rendering
all area elements, except ones that move to another location. Every element's wrapping `DispatchedElement` does
trigger a render of each element, but React is able to instantly bailout on them with no performance cost. It's 
literally the same object (referentially), with the same props it's getting from the app component (if any).

There is a very small amount of overhead per element (< 0.1ms), which is there regardless of whether the element is shown or not.
This overhead is much more pronounced on the dev build of React.
In fact on the production build the combined overhead of all elements doesn't exceed 0.1ms.
For the majority of cases this will be utterly negligible.
But if there would be hundreds of hidden elements it could start adding up. But it's likely still negligible
compared to the code that renders this many elements.

There is also some amount of work that will be useless if the component never gets unhidden. This will add to
the app's load time, however I can't imagine this being used in a context where first load is that crucial. In the 
theme editor its impact is orders of magnitude smaller than the current performance bottlenecks.

One positive effect of this is that it reduces the amount of work that still needs to happen if the component
does get shown.


## IN PROGRESS
- Save and restore arrangements

## TODO NEXT

## TODO
- Proper multi package repo setup
- Minimize essential base CSS needed for Areas to work. If a rule is required, but the value is opionated, use a CSS variable.
- Move non required CSS rules to a "theme" file, if any.
- Reduce wrapper elements where preferable.
- Refactor hastily written ordering and positioning code.
- Improve API for storing the position data (decouple local storage)
- Handle changes to Area structure better. Ideally without requiring an ID be provided for each element in the area. Currently it uses the index + current area ID.
- Avoid jump when scrollbar appears
- Shrinkable components (use context to allow early returning a compact version of a component)