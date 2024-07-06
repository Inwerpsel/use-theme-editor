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

let fixedCache;
export function getFixedElements(document) {
    if (fixedCache && fixedCache.length > 0) {
        return fixedCache;
    }
    const elements = [...document.querySelectorAll('*')].filter(e => getComputedStyle(e).position === 'fixed');
    // console.log('got fixed elements', elements);
    fixedCache = elements;

    return elements;
}

let stickyCache;

export function getStickyElements(document) {
    if (stickyCache && stickyCache.length > 0) {
        return stickyCache;
    }
    const elements = [...document.querySelectorAll('*')].filter(
      (e) => 
        getComputedStyle(e).position === 'sticky' 
        // && !isInFixedOrStickyParent(e)
    );
    // console.log('got sticky elements', elements);
    stickyCache = elements;

    return elements;
}

const transition = 'transform .05s ease-out';

export function fixupFixedElements(elements, scrollOffset, screenHeight, frame) {


    if (elements[0]) {
    //   let node = elements[0];
    //   while (node.parentNode) {
    //     node = node.parentNode;
    //   }
    //   const root = node;
    //   const pageHeight = Math.max(
    //     root.clientHeight,
    //     root.scrollHeight,
    //     root.offsetHeight
    //   );
      for (const el of elements) {
        if (isInFixedOrStickyParent(el)) {
            continue;
        }
        let bottomCorrection = 0;
        const {bottom, top, height} = getComputedStyle(el);
        // console.log(el, bottom, top, screenHeight)
        if (parseInt(top.replace('px', '')) > screenHeight && parseInt(bottom.replace('px', '')) < screenHeight)  {
            bottomCorrection = frame.contentWindow.innerHeight - screenHeight;
            // console.log(el, bottomCorrection)
        }

        el.style.transform = `translateY(${scrollOffset - bottomCorrection}px)`;
        el.style.transition = transition;
        if (screenHeight < parseInt(top) + parseInt(height)) {
            el.style.maxHeight = `calc(${screenHeight}px - ${top})`;
        }
      }
    }
}

const origTransforms = new WeakMap();
function restoreOrigTransform(el) {
    el.style.transform = origTransforms.get(el);
    origTransforms.delete(el);
}

function isInFixedOrStickyParent(node) {
    let parent = node.parentNode;
    while (parent && parent.nodeName !== 'body') {
        try {
            const pos = getComputedStyle(parent).position;
            if (pos === 'fixed' || pos === 'sticky') {
                return true;
            }
            parent = parent.parentNode;
        } catch (e) {
            break;
        }
    }
    return false;
}

const origTop = new WeakMap();
const origHeight = new WeakMap();
const parentEnd = new WeakMap();

export function fixupStickyElements(elements, scrollOffset, screenHeight, frame) {
    // Every time we pass a sticky element, we can add the height if pushed, so later elements can be pushed earlier.
    let containerHeights = new WeakMap();

    for (const el of elements) {
        // if (isInFixedOrStickyParent(el)) {
        //     continue;
        // }
        // el.style.backgroundColor = 'lightblue' ;
        if (!origTransforms.has(el)) {
            origTransforms.set(el, el.style.transform);
            origTop.set(el, el.getBoundingClientRect().top);
            origHeight.set(el, el.getBoundingClientRect().height)
            parentEnd.set(el, el.parentNode.getBoundingClientRect().bottom)
        }
        const computedTop = parseInt(getComputedStyle(el).top.replace('px', ''));
        // const computedScrollMargin = parseInt(getComputedStyle(el.parentNode).scrollMarginTop.replace('px', ''));

        const elStart = origTop.get(el);

        el.style.maxHeight = `${screenHeight - computedTop}px`;
        if (scrollOffset + computedTop < elStart) {
            restoreOrigTransform(el);
            continue;
        }
        // console.log(el.offsetHeight)
        const maxOffset = parentEnd.get(el) - elStart - el.getBoundingClientRect().height;
        const pushedAmount = Math.min(maxOffset, scrollOffset - elStart + computedTop);
        if (maxOffset === pushedAmount) {
            // console.log(el, 'reached end', parentEnd.get(el), elStart, origHeight.get(el), computedTop);
        }
        // console.log(pushedAmount, maxOffset);
        let bottomCorrection = 0;
        if (el.style.top === '' && el.style.bottom !== '')  {
            // console.log('correct bottom', bottomCorrection);
            bottomCorrection = frame.contentWindow.innerHeight - screenHeight;
        }

        // console.log('N is', n);
        // el.style.transform = `translateY(${n}px)`;
        el.style.transform = `translateY(${pushedAmount - bottomCorrection}px)`;
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