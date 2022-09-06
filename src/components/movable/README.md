## "Movable" React Components

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

## Motivation

The goal is to make drag and drop re-parenting as simple as possible.

As I was adding more and more UI elements to the theme editor,
having to reposition them in code became a bottleneck.
However the need for repositioning is there, even during development.
If you need to test how any 2 UI elements affect each other,
that goes very slow if they're on opposite sides of your screen.

Most current React drag and drop implementations do either of these:

* Focus on lists, where the components don't store the state for you. You need to provide event handlers.
* Position freely using XY coordinates.

What I really need was the ability to move a particular element into another place in the DOM tree. And some control over which elements can be dragged, and which elements can host other elements.

It seems a more or less natural use case for React Portals, and indeed they do the job well here.

I'm not sure if it's a viable approach beyond this use case in development,
given the challenge of identifying the dragged components as new updates are released.

## Challenges

### React has no option to portal to a specific position

As a result, portaled elements go into a random position (based on what other elements happen to be rendering). I assume React has no way of assuring the relative positions of elements, but I didn't thoroughly validate this assumption.

I got around this for now using the CSS `order` property. While it works relatively well, it has some not-so-nice side effects. For example the HTML structure not matching the page will definitely lead to confusion, especially if someone is not familiar with the `order` property.

Nevertheless these side effects stay limited to development, and with `order` the page looks and acts as though the HTML elements were in that order.

### Hard to avoid wrapper elements

## Todo

* Minimize the essential base CSS needed for the areas to work.
* If a rule is required, but the value is opionated, use a CSS variable.
* Move non required CSS rules to a "theme" file, if any.
* Try reduce wrapper elements where possible.
* Refactor hastily written ordering and positioning code.
* Improve API for storing the position data
* Handle changes to Area structure better. Ideally without requiring an ID be provided for each element in the area. Currently it uses the index + current area ID.
* Write cha