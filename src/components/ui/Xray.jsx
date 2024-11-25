import { Fragment, useContext, useEffect, useLayoutEffect, useRef, useState } from "react";
import { get, use } from "../../state";
import { toNode, toPath } from "../../functions/nodePath";
import { ThemeEditorContext } from "../ThemeEditor";
import { Checkbox } from "../controls/Checkbox";
import { useLocalStorage } from "../../hooks/useLocalStorage";
import { getGroupsForElement, nukePointerEventsNone } from "../../initializeThemeEditor";

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
        const newPath = toPath(element, doc)
        setPath(newPath);
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
        document.querySelector('.area:has(.group-list)')?.scrollTo(0, 0);
      }
  
      doc.addEventListener('click', listener);
      return () => {
        doc.removeEventListener('click', listener);
      }
    }, [frameClickBehavior, loaded, openFirstOnInspect, path]);
  
}

function tally(element) {
  const directDescendants =  element.children.length;
  const totalDescendants = element.querySelectorAll('*').length;

  const totalNodes = element.childNodes.length;
  const textNodes = totalNodes - directDescendants;

  return {
    directDescendants,
    totalDescendants,
    textNodes,
  };
}

function Stats() {
  const {inspectedPath}= get;
  const { frameRef } = useContext(ThemeEditorContext);

  const doc = frameRef.current?.contentWindow.document;
  if (!doc) return null;
  try {
    const node = toNode(inspectedPath, doc);
    const stats = tally(node, doc);

    return (
      <div>
        <code>
          {stats.directDescendants > 0 && <span>direct: {stats.directDescendants} </span>}
          {stats.totalDescendants > stats.directDescendants && <span>all: {stats.totalDescendants} </span>}
          {stats.textNodes > 0 && <span>text: {stats.textNodes}</span>}
        </code>
      </div>
    );
  } catch (e) {
    return null;
  }
}

function GoUp() {
  const [, setOpenGroups] = use.openGroups();
  const { openFirstOnInspect } = get;
  const [path, setPath] = use.inspectedPath();
  const { frameRef } = useContext(ThemeEditorContext);

  return (
    <button
      disabled={path.length === 0}
      onClick={(e) => {
        if (!frameRef.current) return; // Should not happen

        const parentPath = path.slice(0, -1);
        setPath(parentPath);
        if (openFirstOnInspect) {
          try {
            const parent = toNode(parentPath, frameRef.current.contentWindow.document);
            const groups = getGroupsForElement(parent)
            if (openFirstOnInspect) {
              setOpenGroups(
                {
                  [groups[0].label]: true,
                },
                { skipHistory: true, appendOnly: true }
              );
            }
          } catch (e) {
            console.log('Failed getting node', e)
          }
        }
      }}
    >
      go up ({path.length})
    </button>
  );
}

export function Xray() {
    const { width, height, inspectedPath: path } = get;
    const [frameLoaded, setFrameLoaded] = useState(false);
    const {
        xrayFrameRef: ref,
    } = useContext(ThemeEditorContext);
    const src = window.location.href;
    // const [scale, setScale] = useState(0.1);
    const [saved, setSaved] = useLocalStorage('savedNodes', []);
    const [showSaved, setShowSaved] = useLocalStorage('showSavedNodes', true);
    const [zoomOut, setZoomOut] = useLocalStorage('xrayzoomout', true);
    const [on, setOn] = useState(true);
    const [nodeWidth, setNodeWidth] = useState(parseInt(width));
    const [nodeHeight, setNodeHeight] = useState(parseInt(height));
    const [nodeTop, setNodeTop] = useState(0);
    const [nodeLeft, setNodeLeft] = useState(0);
    const _scale = 400 / nodeWidth;
    const minScale = 1.6;
    const scale = zoomOut ? _scale: Math.max(minScale, _scale);
    const maxHeight = nodeHeight * scale + 12;

    useLayoutEffect(() => {
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
        if (!node.matches('html, body')) {
            let common = commonAncestor(...savedNodes, node);
            node.classList.add('xray');
            const rect = common.getBoundingClientRect(); 
            setNodeWidth(rect.right - rect.left + 24);
            setNodeHeight(rect.bottom - rect.top + 24);
            setNodeTop(rect.top * -1);
            setNodeLeft(rect.left * -1);
        }
      } catch (e) {
        console.log(e, path);
      }
    }, [path, frameLoaded, saved, showSaved]);

    function isCurrentPath(somePath) {
        return somePath.toString() === path.toString();
    }
    const isSaved = saved.some(isCurrentPath);

    useEffect(() => {
        if (frameLoaded) {
            const doc = ref.current?.contentWindow.document;
            for (const a of doc.querySelectorAll('a')) {
                a.href = '#';
            }
            doc.addEventListener('mousedown', e => {e.preventDefault(); e.stopPropagation()}, {capture: true})
        }
    }, [frameLoaded]);

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
              <GoUp />
              
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
          <Stats />
        </div>
        {on && (
          <div
            style={{
              maxHeight,
              overflowY: 'hidden',
              overflowX: (scale > minScale || zoomOut ) ? 'hidden' : 'visible',
              visibility: !frameLoaded ? 'hidden' : 'visible',
              background: 'white',
            }}
          >
            <div
              style={{
                scale: `${scale}`,
                transform: `translateX(${16 + nodeLeft}px) translateY(${
                  12 + nodeTop
                }px)`,
                transformOrigin: 'top left',
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
                    maxWidth: 'none',
                  },
                }}
              />
            </div>
          </div>
        )}
      </div>
    );
}

Xray.fName = 'Xray';