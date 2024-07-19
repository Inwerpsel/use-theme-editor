import { toNode, toPath } from "./nodePath";

// Todo (some done but with issues):
// - Fix sometimes incorrect caching: for some reason some examples first get detected as fixed, then as sticky
// - Collect height added by previous sticky elements, and push following sticky elements down by that amount
// - Determine end of parent and don't push sticky elements inside of it beyond that
// - Detect fixed elements positioned relative to bottom of page,
//   and correct them to be relative to bottom of selected frame
// - Sync the scroll position of deeper elements between both frames.
//   Common case is sticky sidebar menu with many items.
// - Account for existing `transform` on elements: don't replace but adjust the values.

// Some pages rely on trying several times before fixed or sticky elements are picked up.
// Could be styles added later, nodes added later, or classes being changed.
// We're try this many times whenever the list was empty.
// Just a quick fix though, this has to be more robust.
const MAX_TRIES = 20;
let triedFixed = 0, triedSticky = 0;

let fixedCache;
export function getFixedElements(document) {
    if (fixedCache?.length === 0) {
        triedFixed++;
        if (triedFixed === MAX_TRIES) {
            return [];
        }
    }
    if (fixedCache && fixedCache.length > 0) {
        return fixedCache;
    }
    const elements = [...document.querySelectorAll('*')].filter(e => getComputedStyle(e).position === 'fixed');
    fixedCache = elements.filter(el => !elements.some(other => other !== el && other.contains(el)));

    return fixedCache;
}

let stickyCache;

function isInFixedElement(el, fixedElements) {
    let ancestor = el.parentNode;
    while (ancestor) {
        if (fixedElements.includes(ancestor)) {
            return true;
        }
        ancestor = ancestor.parentNode;
    }
    return false;
}

export function getStickyElements(document, fixedElements) {
    if (stickyCache?.length === 0) {
        triedSticky++;
        if (triedSticky === MAX_TRIES) {
            return [];
        }
    }
    if (stickyCache && stickyCache.length > 0) {
        return stickyCache;
    }
    const elements = [...document.querySelectorAll('*')].filter(
      (el) => 
        getComputedStyle(el).position === 'sticky' 
        && !isInFixedElement(el, fixedElements)
    );
    stickyCache = elements;

    return elements;
}

const transition = 'transform .07s ease-out';

export function fixupFixedElements(elements, scrollOffset, screenHeight, frame) {
    // const pushedElements = new WeakSet();

    for (const el of elements) {
        // if (pushedElements.has(el.parentNode)) {
        //     continue;
        // }
        let bottomCorrection = 0;
        const {bottom, top, height} = getComputedStyle(el);
        if (height === '0px') {
            continue;
        }
        if (parseInt(top.replace('px', '')) > screenHeight && parseInt(bottom.replace('px', '')) < screenHeight)  {
            bottomCorrection = frame.contentWindow.innerHeight - screenHeight;
        }
        const pushedAmount = scrollOffset - bottomCorrection; 
        // if (pushedAmount !== 0) {
        //     pushedElements.add(el);
        // }

        el.style.transform = `translateY(${pushedAmount}px)`;
        el.style.transition = transition;
        if (screenHeight < parseInt(top) + parseInt(height)) {
            el.style.maxHeight = `${screenHeight - parseInt(top)}px`;
        }
    }
}

const origTransforms = new WeakMap();
function restoreOrigTransform(el) {
    el.style.transform = origTransforms.get(el);
    // origTransforms.delete(el);
}

const origTop = new WeakMap();
const origHeight = new WeakMap();
const containerEnd = new WeakMap();

export function fixupStickyElements(elements, scrollOffset, screenHeight, frame) {
    const pushedElements = new WeakSet();

    for (const el of elements) {
        if (el.offsetHeight === 0) {
            continue;
        }
        let container = el.parentNode, insideMoved = false, s;
        while (s = getComputedStyle(container), s.display === 'contents' || s.display === '') {
            // Special case where the container acts as though it's not there.
            // As a result, we need to use its parent to calculate available space.
            container = container.parentNode;
            if (container.nodeName === 'BODY') {
                break;
            }
        }

        if (container.parentNode.nodeName === 'TABLE') {
            container = container.parentNode;
        }

        let ancestor = el.parentNode;
        while (ancestor) {
            if (pushedElements.has(ancestor)) {
                insideMoved = true;
                break;
            }
            ancestor = ancestor.parentNode;
        }
        // if (pushedElements.has(el.parentNode)) {
        //     // This fixes the MDN example pages, but I'm not sure if it's the right thing to do.
        //     // In these demo pages, they actually applied the same class to an element and its immediate
        //     // descendant, so it's probably by mistake. Without this check it would apply some things twice.
        //     // TODO: check what is the expected behavior with nested sticky/fixed elements.
        //     continue;
        // }
        // el.style.backgroundColor = 'lightblue' ;
        if (!origTransforms.has(el)) {
            origTransforms.set(el, el.style.transform);
            origTop.set(el, el.getBoundingClientRect().top);
            origHeight.set(el, el.getBoundingClientRect().height)
            containerEnd.set(el, container.getBoundingClientRect().bottom)
        }
        const computedTop = parseInt(getComputedStyle(el).top.replace('px', ''));

        const elStart = origTop.get(el);

        el.style.maxHeight = `${screenHeight - computedTop}px`;

        if (insideMoved) {
            continue;
        }
        if ((scrollOffset + computedTop) < elStart) {
            restoreOrigTransform(el);
            continue;
        }
        const end = containerEnd.get(el);
        const elHeight = el.getBoundingClientRect().height;
        const maxOffset =  end - elHeight - elStart;

        el.classList.contains('sidebar') && console.log({scrollOffset, maxOffset, end, computedTop, h: elHeight})
        if (scrollOffset > end) {
            restoreOrigTransform(el);
            continue;
        }

        const pushedAmount = Math.min(maxOffset, scrollOffset - elStart + computedTop);
        if (pushedAmount > 0) {
            pushedElements.add(el);
        }

        el.style.transform = `translateY(${pushedAmount}px)`;
        el.style.transition = transition;

        // Below is a stab at syncing fixed/sticky elements internal scroll position.
        // This is quite common, for example sticky menus of documentation sites.

        // const emitOwnScroll = (event) => {
        //     const path = toPath(event.target);
        //     const y = event.target.scrollY;
        //     console.log(path,y);
        // }

        // const elInOtherFrame = toNode(
        //   toPath(el, frameRef.current.contentWindow.document),
        //   frameRef.current.contentWindow.document
        // );
        // if (!elInOtherFrame) continue;

        // if (listener.has(el)) {
        //     elInOtherFrame.removeEventListener('scroll', listener.get(el));
        //     listener.delete(el);
        // }
        // elInOtherFrame.addEventListener('scroll', emitOwnScroll);
        // listener.set(el, emitOwnScroll);
    }
}