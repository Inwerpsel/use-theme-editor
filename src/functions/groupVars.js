import { getMatchingScopes } from './getMatchingScopes';
import { getMatchingVars } from './getMatchingVars';
import { HIGHLIGHT_CLASS } from './highlight';
import { toPath } from './nodePath';

export const toLabel = (element) => {
  const {id, tagName, classList} = element;
  const type = tagName.toLowerCase();
  const idPart = !id ? '' : `#${ id }`;

  if (type === 'body' || type === 'html') {
    return type;
  }
  
  const classPart =  [...classList].filter(c=>c!==HIGHLIGHT_CLASS).map(c=>`.${c}`.replaceAll(/([^\w-.])/g, '\\$1')).join(' ');

  const selector = tagName.toLowerCase() + idPart + '\n' + classPart;
  let suffix = '';

  const body = element.closest('body')

  try {
    if (!idPart) {
      const others = [...body.querySelectorAll(selector.replaceAll(/\s+/g, ''))];
      if (others.length === 1) {
        suffix = '';
      } else {
        for (let i = 1; i <= others.length; i++) {

        }
        const index = others.indexOf(element) + 1;
        suffix = ` (${index}/${others.length})`;
      }
    }
  } catch (error) {
    // The above selector should work, however there's cases where the classlist contains things that are not
    // accepted as a valid selector.
    // The example that made me run into this was using "1_3" in the classList.
    console.log(error);
  }

  return `${selector}${suffix}`;
};

export const sortForUI = (
  {name: nameA, maxSpecific: maxSpecificA},
  {name: nameB, maxSpecific: maxSpecificB},
) => {
  const reg = /--(?<element>\w+(-?-\w+)*)(--(?<state>(active|focus|visited|hover|disabled)))?--(?<prop>\w+(-\w+)*)/;

  // const aHasDis = nameA.includes('disabled');
  // const bHasDis = nameB.includes('disabled');

  // // Attempt to push disabled state as far as possible.
  // if (aHasDis && !bHasDis) {
  //   return 1;
  // } else if (bHasDis && !aHasDis) {
  //   return -1;
  // }
  const {media: mediaA, property: propA} = maxSpecificA;
  const {media: mediaB, property: propB} = maxSpecificB;

  if (propA !== propB) {
    return propA < propB ? -1 : 1;
  }

  if (mediaA !== mediaB) {
    if (!mediaA) {
      return -1;
    }
    if (!mediaB) {
      return 1;
    }
    return mediaA.localeCompare(mediaB, 'en', {numeric: true});
  }

  const matchA = nameA.match(reg);
  const matchB = nameB.match(reg);

  if (!matchA && !matchB) {
    // Compare names if they don't match regex.
    return nameA < nameB ? -1 : 1;
  }

  if (!matchA) {
    return 1;
  }

  if (!matchB) {
    return -1;
  }

  const {element: elementA, state: stateA } = matchA.groups;
  const {element: elementB, state: stateB } = matchB.groups;

  if (elementA !== elementB) {
    return elementA < elementB ? -1 : 1;
  }

  return stateA < stateB ? -1 : 1;
};

function svgPartHtml(part) {
  let html = part.outerHTML, el = part;
  while (el.tagName !== 'svg') {
    el = el.parentNode;
    html = el.cloneNode(false).outerHTML.replace(/<\//, html + '</');
  }
  return html;
}

const cache = new WeakMap();

function inheritedInlineStyles(element, excluded) {
  let parent = element, styles = {};
  while (parent.parentNode?.style) {
    parent = parent.parentNode;
    for (const propname of parent.style) {
      if ((propname in excluded)|| propname in styles) continue;
      styles[propname] = parent.style.getPropertyValue(propname);
    } 
  }
  return styles;
}

export const groupVars = (vars, target, allVars) => {
  const groups = [];
  // 
  const labelCounts = {};
  let current,
    previous = target,
    previousMatches = vars;

  // Walk up the tree to the root to assign each variable to the deepest element they apply to. Each time we go up we
  // test the remaining variables. If the current element doesn't match all anymore, the non matching are assigned to
  // the previous (one level deeper) element.
  while (current = previous.parentNode) {
    const element = previous;
    // if (cache.has(element)) {
    //   // It SHOULD be impossible to find an element in cache if any of its parents are not in cache.
    //   groups.push(cache.get(element));
    //   previous = current;
    //   continue;
    // }
    if (previousMatches.length === 0) {
      break;
    }
    const currentMatches = getMatchingVars({ cssVars: previousMatches, target: current });

    const previousInlineStyles = {};
    let previousHasInlineStyles = false;
    for (const propname of element.style) {
      previousHasInlineStyles = true;
      previousInlineStyles[propname] = element.style.getPropertyValue(propname);
    }

    const currentMatchesLess = currentMatches.length < previousMatches.length;
    const isSvg = element.tagName === 'svg';
    const isInSvg = !isSvg && !!element.closest('svg');
    const isImage = element.tagName === 'IMG';
    const isDeepest = element === target;

     if (isDeepest || isImage || isSvg || isInSvg || previousHasInlineStyles || currentMatchesLess) {
      const vars = !currentMatchesLess ? [] : previousMatches.filter(match => !currentMatches.includes(match));
      const scopes = !currentMatchesLess ? [] : getMatchingScopes(element, allVars, groups);

      const labelText = toLabel(element);
      const count = labelCounts[labelText] || 0;
      labelCounts[labelText] = count + 1;
      const label = labelText + (count === 0 ? '' : `#${count}`);

      const html = 
        isInSvg 
          ? svgPartHtml(element) 
          : !isSvg 
          ? null 
          : element.outerHTML + '<div style="display:none"><svg>' +
          // Also grab HTML of each referenced symbol.
            [...element.childNodes].reduce(
              (html, node) =>
                {
                  if (node.nodeName !== 'use') {
                    return html;
                  }
                  const id = node.href.baseVal.replace('#', '')
                  const dep = document.getElementById(id);
                  return html + dep?.outerHTML || '';
                },
              ''
            ) +  '</svg></div>';

      const isRootElement = element.tagName === 'HTML' || element.tagName === 'BODY'
      const newGroup = {
        element,
        path: toPath(element),
        elementInfo: {
          src: element.getAttribute('src'),
          srcset: element.getAttribute('srcset'),
          imgWidth: element.naturalWidth,
          imgHeight: element.naturalHeight,
          alt: element.getAttribute('alt'),
          html: html,
          width: !isSvg ? null : element.getBoundingClientRect().width,
          // Previously this was `element.title`, however if a form element contains an input with name "title",
          // that DOM element would be returned. This causes a crash when this data is sent as a message.
          title: element.getAttribute('title'),
        },
        computedStyles: {
          fontFamily: getComputedStyle(element).fontFamily,
        },
        isRootElement,
        isDeepest,
        textContent: isDeepest && [...element.childNodes].some(el => el.nodeType === 3 && el.textContent.trim() !== '') ? element.textContent.trim() : '',
        label,
        vars: vars.map((v) => {
          let currentScope, max;
          for (const {scopeVars, selector} of scopes) {
            if (scopeVars.some(sv=>sv.name===v.name)) {
              currentScope = selector;
              break;
            }
          }
          // let currentScope, otherScopes = [];
          // for (const {scopeVars, selector} of scopes) {
          //   if (selector === ':root'  || selector === 'html' || selector === ':where(html)') {
          //     continue;
          //   }
          //   if (scopeVars.some(sv=>sv.name===v.name)) {
          //     if (currentScope) {
          //       otherScopes.push(selector);
          //     } else {
          //       currentScope = selector;
          //     }
          //   }
          // }

          return {
            ...v,
            currentScope,
            // otherScopes,
          };
        }),
        scopes,
        // Provide non-root custom prop values for the previews.
        inlineStyles: previousInlineStyles,
        inheritedInlineStyles: inheritedInlineStyles(element, previousInlineStyles),
      };
      groups.push(newGroup);
      // cache.set(element, newGroup);
      previousMatches = currentMatches;
    }

    previous = current;
  }

  return groups;
};

