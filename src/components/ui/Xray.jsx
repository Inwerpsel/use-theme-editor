import { Fragment, useContext, useEffect, useInsertionEffect, useLayoutEffect, useRef, useState } from "react";
import { get, use } from "../../state";
import { toNode, toPath } from "../../functions/nodePath";
import { ThemeEditorContext } from "../ThemeEditor";
import { Checkbox } from "../controls/Checkbox";
import { useLocalStorage } from "../../hooks/useLocalStorage";
import { getGroupsForElement, nukePointerEventsNone } from "../../initializeThemeEditor";
import { focusInspectedGroup } from "../ResizableFrame";
import { doTransition } from "../../functions/viewTransition";

function commonAncestor(...nodes) {
    let common = nodes[0];

    for (const node of nodes) {
        if (node === common) continue;
        if (common.contains(node)) continue;
        while (true) {
            common = common.parentNode;
            if (common.matches('html,body')) {
                break;
            }
            if (common.contains(node)) {
                break;
            }
        }
    }

    return common;
}

function trackDeepest(element) {
  if (!element.contains(deepestClicked)) {
    deepestClicked = element;
  }
}

let deepestClicked;

function Inspect({frameRef, loaded}) {
    const { frameClickBehavior, openFirstOnInspect } = get;
    const [path, setPath] = use.inspectedPath();
    const [, setOpenGroups] = use.openGroups();
  
    useEffect(() => {
      const doc = frameRef.current?.contentWindow.document;
      if (!doc) return;
      function listener(event) {
        if (frameClickBehavior === 'alt' && !event.altKey) {
          return;
        }
        const element = event.target;
        const currentNode = toNode(path, doc);
        event.preventDefault();
        event.stopPropagation();
        if (element === currentNode || element.contains(currentNode)) {
            nukePointerEventsNone(element);
            return;
        };
        trackDeepest(element);
        const newPath = toPath(element, doc)

        doTransition(() => {
          setPath(newPath);
          focusInspectedGroup();
          // hydrate inspection
          const groups = getGroupsForElement(element)
          if (openFirstOnInspect) {
            setOpenGroups(
              {
                [groups[0].label]: true,
              },
              { skipHistory: true, appendOnly: true }
            );
          }
    
          event.preventDefault();
          event.stopPropagation();
          nukePointerEventsNone(element);
          // document.querySelector('.area:has(.group-list)')?.scrollTo(0, 0);
        });
      }
  
      doc.addEventListener('click', listener);
      return () => {
        doc.removeEventListener('click', listener);
      }
    }, [frameClickBehavior, loaded, openFirstOnInspect, path]);
  
}

function tally(element) {
  const directDescendants =  [...element.children];
  const totalDescendants = element.querySelectorAll('*').length;

  const totalNodes = element.childNodes.length;
  const emptyTextNodes = [...element.childNodes].filter(n => (n.nodeType === Node.TEXT_NODE) && n.wholeText.trim() === '').length;
  const textNodes = totalNodes - directDescendants.length - emptyTextNodes;

  return {
    directDescendants,
    totalDescendants,
    textNodes,
    emptyTextNodes,
    groupedDescendants: directDescendants.reduce((grouped, el) => {
      const last = grouped.at(-1);
      if (last && last[0]?.tagName === el.tagName) {
        last.push(el);
      } else {
        grouped.push([el]);
      }
      return grouped;
    }, []),
  };
}

function Descendant({el, index, xrayRef}) {
  const [inspectedPath, setInspectedPath] = use.inspectedPath();
  const newPath = [...inspectedPath, [el.tagName, index]];
  const doc = xrayRef.current?.contentWindow.document;
  let node;
  try {
    node = toNode(newPath, doc);
  } catch (e) {
    return null;
  }
  const type = el.tagName.toLowerCase();

  if (type === 'style' || type === 'script') return;

  const hasLongId = el.id?.length > 32;

  // Ids longer than 32 are probably a UUID and take too much space.
  const idSuffix = (!el.id || hasLongId) ? '' : `#${el.id}`

  const isHidden = !node.checkVisibility();

  const isLatest = node === deepestClicked || node.contains(deepestClicked);
  const ref = useRef();

  useLayoutEffect(() => {
    if (isLatest) {
      ref.current?.scrollIntoView({block: 'center'});
    }
  }, []);

  return (
    <button
      {...{ref}}
      key={el}
      className="monospace-code"
      style={{
        background: isLatest ? 'lightblue' : null,
        textDecoration:  isHidden ? 'underline red' : null,
        viewTransitionName: `inspected${inspectedPath.length + 1}-${index}`,
      }}
      // title={isHidden && 'Element is currently not visible'}
      title={hasLongId && el.id}
      onMouseEnter={() => {
        for (const el of doc.querySelectorAll(
          '.highlight-descendant'
        )) {
          el.classList.toggle('highlight-descendant', false);
        }
        node.classList.toggle('highlight-descendant', true);
        node.scrollIntoView({
          block: 'nearest',
          inline: 'nearest',
          behavior: 'smooth',
        });
      }}
      onMouseLeave={() => {
        node.classList.toggle('highlight-descendant', false);
      }}
      onClick={() => {
        doTransition(() => {
          node.classList.toggle('highlight-descendant', false);
          setInspectedPath(newPath);
          focusInspectedGroup();
          setTimeout(() => {
            node.scrollIntoView({
              block: 'center',
              inline: 'center',
              // behavior: 'smooth',
            });
          }, 1);
          trackDeepest(node);
        });
      }}
    >
      {type}
      {idSuffix}
    </button>
  );

}

function Stats({xrayRef}) {
  const {inspectedPath} = get;
  const { frameRef } = useContext(ThemeEditorContext);

  const doc = frameRef.current?.contentWindow.document;
  if (!doc) return null;
  try {
    const node = toNode(inspectedPath, doc);
    const stats = tally(node, doc);
    // const idSuffix = !node.id ? '' : `#${node.id}`

    return (
      <div style={{maxHeight: '170px', overflow: 'auto'}}>
        {/* <code key={node} style={{float: 'right', borderWidth: '3px'}} className="monospace-code">{node.tagName.toLocaleLowerCase()}{idSuffix}</code> */}
        <code style={{float: 'right'}}>
          {stats.directDescendants.length > 0 && <span> direct: {stats.directDescendants.length} </span>}
          {(stats.totalDescendants > stats.directDescendants.length) && <span> all: {stats.totalDescendants} </span>}
          {stats.textNodes > 0 && <span style={{fontWeight: 'bold'}}> text: {stats.textNodes}</span>}
          {/* {stats.textNodes > 0 && stats.emptyTextNodes > 0 && <span style={{fontWeight: 'bold', color: 'gray'}}> empty text: {stats.emptyTextNodes}</span>} */}
        </code>
        {stats.directDescendants.map((el, index) => <Descendant {...{el, index, xrayRef}}/>)}
      </div>
    );
  } catch (e) {
    // console.log('STATS FAILED', e);
    return null;
  }
}

function GoUp() {
  const [selectMode, setSelectMode] = use.elementSelectionMode();
  const [, setOpenGroups] = use.openGroups();
  const { openFirstOnInspect } = get;
  const [path, setPath] = use.inspectedPath();
  const { frameRef } = useContext(ThemeEditorContext);

  return (
    <button
      style={{float: 'right', position: 'sticky', top: 0, outline: selectMode ? '4px solid indigo' : null}}
      disabled={path.length === 0}
      onBlur={e=> {
        setTimeout(() => {
          setSelectMode(false)
        }, 200);
      }}
      onClick={(e) => {
        if (!frameRef.current) return; // Should not happen

        // doTransition(() => {
          const parentPath = path.slice(0, -1);
          setSelectMode(parentPath.length > 0);
          setPath(parentPath);
          focusInspectedGroup();
          const parent = toNode(parentPath, frameRef.current.contentWindow.document);
          if (openFirstOnInspect) {
            try {
              const groups = getGroupsForElement(parent)
              setOpenGroups(
                {
                  [groups[0].label]: true,
                },
                { skipHistory: true, appendOnly: true }
              );
            } catch (e) {
              console.log('Failed getting node', e)
            }
          }
        // });
        // setTimeout(() => {
        //   parent.scrollIntoView({block: 'start', inline: 'start', behavior: 'smooth'});
        // }, 100);
      }}
    >
      go up ({path.length})
    </button>
  );
}

export function Xray() {
    const { width, height, inspectedPath: path, themeEditor: {scopes} } = get;
    const [frameLoaded, setFrameLoaded] = useState(false);
    const {
      // frameRef,
      xrayFrameRef: ref,
    } = useContext(ThemeEditorContext);
    const src = window.location.href;
    // const [scale, setScale] = useState(0.1);
    const [saved, setSaved] = useLocalStorage('savedNodes', []);
    const [showSaved, setShowSaved] = useLocalStorage('showSavedNodes', true);
    const [zoomOut, setZoomOut] = useLocalStorage('xrayzoomout', true);
    const [on, setOn] = useLocalStorage('xrayon', true);
    const [nodeWidth, setNodeWidth] = useState(parseInt(width));
    const [nodeHeight, setNodeHeight] = useState(parseInt(height));
    const [nodeTop, setNodeTop] = useState(0);
    // console.log(nodeTop);
    const [nodeLeft, setNodeLeft] = useState(0);
    const _scale = 400 / nodeWidth;
    const minScale = 1.6;
    const maxScale = 14;
    const scale = Math.min(maxScale, zoomOut ? _scale: Math.max(minScale, _scale));
    // const _prevScale = useRef(null);
    // const prevScale = _prevScale.current;
    // _prevScale.current = scale;
    const maxHeight = Math.min(
      500,
      Math.min(nodeHeight, height) * scale + 12,
    );

    useInsertionEffect(() => {
      if (!frameLoaded) {
        return;
      }
      const doc = ref.current?.contentWindow.document;
      const html = doc?.documentElement;
      if (!html) return;
      html.classList.toggle('doxray', true);
      for (const el of doc.querySelectorAll('.xray')) {
        el.classList.remove('xray');
      }

      const savedNodes = [];
      if (showSaved) {
        for (const s of saved) {
          try {
            const node = toNode(s, doc);
            node.classList.add('xray');
            savedNodes.push(node);
          } catch (e) {
            console.log(e, path);
          }
        }
      }

      if (!path) return;
      try {
        const node = toNode(path, doc);
        // const origNode = toNode(path, frameRef.current.contentWindow.document);
        if (!node.matches('html')) {
          // const origRect = origNode.getBoundingClientRect();
          // node.style.width = `${origRect.right - origRect.left}px`;
          // node.style.height = `${origRect.bottom - origRect.top}px`;
          trackDeepest(node);
          // let common = commonAncestor(...savedNodes, node);
          node.classList.add('xray');
          const rect = node.getBoundingClientRect(); 
          const nodeWidth = rect.right - rect.left + 24;
          const isWide = nodeWidth > width;
          setNodeWidth(nodeWidth);
          const nodeHeight = rect.bottom - rect.top + 24;
          const isTall = nodeHeight > height;
          setNodeHeight(nodeHeight);
          setNodeTop(rect.top * -1);
          setNodeLeft(rect.left * -1);
          const t= setTimeout(() => {
            // const isOverflowingX = !zoomOut && _scale < minScale;
            // node?.scrollIntoView({block: 'center', inline: isOverflowingX ? 'start' : 'center'})
            node?.scrollIntoView({
              block: isTall ? 'start' : 'nearest',
              inline: isWide ? 'start' : 'nearest',
              // behavior: 'smooth',
            });
          }, 100);
          return () => {clearTimeout(t)};
        }
      } catch (e) {
        // console.log(e, path);
      }
    }, [path, frameLoaded, saved, showSaved, scopes, width, height, zoomOut]);

    function isCurrentPath(somePath) {
        return somePath.toString() === path.toString();
    }
    const isSaved = saved.some(isCurrentPath);

    useEffect(() => {
        if (frameLoaded) {
            const doc = ref.current?.contentWindow.document;
            for (const a of doc.querySelectorAll('a')) {
                try {
                  a.href = '#';
                } catch (e) {

                }
            }
            doc.addEventListener('mousedown', e => {e.preventDefault(); e.stopPropagation()}, {capture: true})
        }
    }, [frameLoaded]);

    // const isFirst = prevScale === null;
    // const isZoomout = scale < prevScale;

    return (
      <div style={{ maxWidth: 400 }}>
        {!on && <h3 style={{ display: 'inline-block' }}>Xray</h3>}
        <div>
          <Checkbox
            controls={[
              on,
              (v) => {
                setOn(v);
                if (!v) setFrameLoaded(false);
              },
            ]}
          >
            Enable
          </Checkbox>
          {on && (
            <Fragment>
              <Checkbox title="min zoom level 1.6" controls={[zoomOut, setZoomOut]}>Zoom out to fit</Checkbox>
              <GoUp />
              <br />
              <Checkbox
                controls={[
                  isSaved,
                  () => {
                    setSaved(
                      isSaved
                        ? saved.filter((p) => !isCurrentPath(p))
                        : [...saved, path]
                    );
                  },
                ]}
              >
                Save
              </Checkbox>
              <Checkbox controls={[showSaved, setShowSaved]}>Show saved</Checkbox>
              
              {showSaved && (
                <button
                  disabled={saved.length === 0}
                  onClick={() => setSaved([])}
                >
                  Clear saved ({saved.length})
                </button>
              )}
              {/* <button onClick={e => {}}>next</button> */}
            </Fragment>
          )}
          {on &&<Stats xrayRef={ref}/>}
        </div>
        {on && (
          <div
            style={{
              maxHeight,
              // transition: (isZoomout || isFirst) ? null : 'max-height .1s ease-out',
              overflowY: 'hidden',
              overflowX: (scale > minScale || zoomOut ) ? 'hidden' : 'visible',
              visibility: !frameLoaded ? 'hidden' : 'visible',
              clear: 'both',
            }}
          >
            <div
              style={{
                scale: `${scale}`,
                // transition: (isZoomout || isFirst) ? null : 'scale .1s ease-in .0s, transform ease-in .1s .0s',
                // transition: (isZoomout || isFirst) ? null : 'scale .1s ease-in .0s',
                // transition: 'scale .2s ease-out',
                // translate: `${12 + nodeLeft}px ${12 + nodeTop}px`,
                transform: `translateX(${(12 + nodeLeft) }px) translateY(${
                  12  + (Math.max(-maxHeight + 12, nodeTop)) 
                }px)`,
                transformOrigin: 'top left',
                // transformOrigin: 'top right',
                // transformOrigin: 'center center',
              }}
            >
              <Inspect {...{ frameRef: ref, loaded: frameLoaded }} />
              <iframe
                onLoad={() => {
                  setFrameLoaded(true);
                }}
                resizable
                {...{
                  src,
                  ref,
                  width,
                  height,
                  style: {
                    width,
                    maxWidth: 'none',
                    background: 'white',
                  },
                }}
              />
            </div>
          </div>
        )}
        <span>scale: {scale.toFixed(2)} </span>
      </div>
    );
}

Xray.fName = 'Xray';