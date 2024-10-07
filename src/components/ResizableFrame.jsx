import React, { useContext, useEffect, useState } from 'react';
import { use, get } from '../state';
import {ThemeEditorContext} from './ThemeEditor';
import { Tutorial } from '../_unstable/Tutorial';
import { toNode, toPath } from '../functions/nodePath';
import { getGroupsForElement, nukePointerEventsNone } from '../initializeThemeEditor';
import { addHighlight, removeHighlight } from '../functions/highlight';
import { ACTIONS, editTheme } from '../hooks/useThemeEditor';

const wrapperMargin = 16;

let lastInspectedTime = 0;

function InspectOnClick({frameRef, loaded}) {
  const { frameClickBehavior, openFirstOnInspect } = get;
  const [path, setPath] = use.inspectedPath();
  const [, setOpenGroups] = use.openGroups();

  useEffect(() => {
    const doc = frameRef.current?.contentWindow.document;
    if (!doc) return;
    function listener(event) {
      // if (frameClickBehavior === 'alt' && !event.altKey) {
      //   return;
      // }
      const element = event.target;
      const newPath = toPath(element)
      if (newPath === path) {
        return;
      }
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
      lastInspectedTime = performance.now()
      addHighlight(element);
      setTimeout(() => {
        removeHighlight(element);
      }, 700);
      nukePointerEventsNone(element);
      element.scrollIntoView({
        block: 'nearest',
        inline: 'end',
        behavior: 'smooth',
      });
    }

    doc.addEventListener('click', listener);
    return () => {
      doc.removeEventListener('click', listener);
    }
  }, [frameClickBehavior, loaded]);

  useEffect(() => {
    if (performance.now() - lastInspectedTime < 400) {
      return;
    }
    try {

      const element = toNode(path, frameRef.current?.contentWindow.document);
      if (!element || element.nodeName === 'BODY' || element.nodeName === 'HTML') {
        return;
      }
      element.scrollIntoView({
        block: 'center',
        inline: 'start',
        // behavior: 'smooth',
      });

      addHighlight(element);
      const timeout = setTimeout(() => {
        removeHighlight(element);
      }, 700);

      return () => {
        clearTimeout(timeout);
        removeHighlight(element);
      }
    } catch (e) {
    }
  }, [path, loaded]);
}

function DropColors({frameRef, loaded}) {
  const dispatch = editTheme();

  useEffect(() => {
    const doc = frameRef.current?.contentWindow.document;
    if (!doc) return;
    function listener(event) {
      // console.log(event, event.dataTransfer, event.dataTransfer?.getData('varName'))
      const value = event.dataTransfer.getData('value') || event.dataTransfer.getData('text/plain');
      // If you drag any link or image and immediately drop it on the page, it will have a link here.
      // I didn't come across any valid custom prop value starting with "http".
      // URLs are always enclosed in "url()" in custom props.
      if (!value || value.startsWith('http') ) return
      const target = event.target;
      // 🐢
      const groups = getGroupsForElement(target);

      const options = [];

      let i = 0;
      for (const group of groups) {
        i++;
        const colorProps = ['background-color', 'background', 'background-image', 'color', 'border-color', 'outline-color']
        for (const prop of colorProps) {
          for (const v of group.vars) {
            if (v.maxSpecific?.property === prop && !v.isRawValue && v.usages[0]?.isFullProperty) {
              options.push({
                element: i,
                property: prop,
                varName: v.name,
                scope: group.scopes.find((s) =>
                  s.scopeVars.some((sv) => sv.name === v.name)
                )?.selector,
              });
            }
          }
        }
      }
      if (options.length === 0) return;
      const [firstOption, ...otherOptions] = options;
      dispatch({
        type: ACTIONS.set,
        payload: {
          name: firstOption.varName,
          scope: firstOption.scope,
          value,
          alternatives: otherOptions,
        },
      })
      event.stopPropagation();
    }
    
    doc.addEventListener('drop', listener);
    doc.addEventListener('dragenter', preventDefault);
    doc.addEventListener('dragover', preventDefault);
    return () => {
      doc.removeEventListener('drop', listener);
      doc.removeEventListener('dragenter', preventDefault);
      doc.removeEventListener('dragover', preventDefault);
    }
  }, [loaded]);
}

function preventDefault(event) {
  event.preventDefault();
}

export const ResizableFrame = props => {
  const {
    src,
  } = props;

  const {
    frameRef,
  } = useContext(ThemeEditorContext);
  const [loaded, setLoaded] = use.frameLoaded();

  const [width, setWidth] = use.width();
  const [height, setHeight] = use.height();
  const scale = get.scales[`${width}x${height}`] || 1;

  return <div
    style={{ overflow: 'hidden' }}
    className='responsive-frame-outer-container'
  >
    <div
      className='responsive-frame-container'
      onMouseMove={ (event) => {
        if (event.buttons !== 1 || event.currentTarget.className !== 'responsive-frame-container') {
          return;
        }
        const newHeight = parseInt(event.currentTarget.style.height.replace('px', '')) - wrapperMargin;
        const newWidth = parseInt(event.currentTarget.style.width.replace('px', '')) - wrapperMargin;
        if (isNaN(newHeight) || isNaN(newWidth)) {
          // Quick fix to prevent tutorial buttons from triggering this shitty old code in some cases.
          return;
        }
        setHeight(newHeight);
        setWidth(newWidth);
      }}
      style={ {
        transform: `scale(${scale})`,
        resize: 'both',
        minWidth: '200px',
        // Quick fix, calc doesn't really make sense here.
        width: `max(calc(${ wrapperMargin + parseInt(width) }px * ${scale}), ${ wrapperMargin + parseInt(width) }px)`,
        minHeight: '200px',
        height: `${ wrapperMargin + parseInt(height) }px`,
        overflow: 'hidden',
        padding: '0',
        boxSizing: 'border-box',
      } }
    >
      {tutorial}
      <iframe
        onLoad={() => setLoaded(true)}
        className='responsive-frame'
        ref={frameRef}
        { ...{ src, width: parseInt(width), height: parseInt(height) } }
      />
      <InspectOnClick {...{frameRef, loaded}} />
      <DropColors {...{frameRef, loaded}} />
    </div>
  </div>;
};

const tutorial = (
  <Tutorial
    el={ResizableFrame}
    tasks={[
      (get) => ['Click any element on the page', get.inspectedPath !== ''],
    ]}
  >
    Select an element here to see all its styles.
  </Tutorial>
);