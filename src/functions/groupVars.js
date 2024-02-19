import { scopesByProperty } from './collectRuleVars';
import { getMatchingScopes } from './getMatchingScopes';
import { getMatchingVars } from './getMatchingVars';
import { HIGHLIGHT_CLASS } from './highlight';

export const toLabel = (element) => {
  const {id, tagName, classList} = element;
  const idPart = !id ? '' : `#${ id }`;
  const classPart =  [...classList].filter(c=>c!==HIGHLIGHT_CLASS).map(c=>`.${c}`).join('').replaceAll(/([^\w-.])/g, '\\$1');

  const selector = tagName.toLowerCase() + idPart + classPart;
  let suffix;
  try {
    const others = [...document.querySelectorAll(selector)];
    if (others.length === 1) {
      suffix = '';
    } else {
      for (let i = 1; i <= others.length; i++) {

      }
      const index = others.indexOf(element) + 1;
      suffix = ` (${index}/${others.length})`;
    }
  } catch (error) {
    // The above selector should work, however there's cases where the classlist contains things that are not
    // accepted as a valid selector.
    // The example that made me run into this was using "1_3" in the classList.
    console.log(error);
  }

  return `${selector.replaceAll('.', '\n.')}${suffix}`;
};

export const sortForUI = (
  {name: nameA, maxSpecific: maxSpecificA},
  {name: nameB, maxSpecific: maxSpecificB},
) => {
  const reg = /--(?<element>\w+(-?-\w+)*)(--(?<state>(active|focus|visited|hover|disabled)))?--(?<prop>\w+(-\w+)*)/;

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

export const groupVars = (vars, target, allVars) => {
  const groups = [];
  // 
  const labelCounts = {};
  let current,
    previous = target,
    previousMatches = vars;

  // const times = [];
  // Walk up the tree to the root to assign each variable to the deepest element they apply to. Each time we go up we
  // test the remaining variables. If the current element doesn't match all anymore, the non matching are assigned to
  // the previous (one level deeper) element.
  while (current = previous.parentNode) {
    if (previousMatches.length === 0) {
      break;
    }
    const currentMatches = getMatchingVars({ cssVars: previousMatches, target: current });

    const previousInlineStyles = {};
    let previousHasInlineStyles = false;
    for (const propname of previous.style) {
      previousHasInlineStyles = true;
      previousInlineStyles[propname] = previous.style[propname];
    }

    const currentMatchesLess = currentMatches.length < previousMatches.length;
    // times.push(performance.now() - tStart);
    const isSvg = previous.tagName === 'svg';
    const isInSvg = !isSvg && !!previous.closest('svg');
    const isImage = previous.tagName === 'IMG';

     if (isImage || isSvg || isInSvg || previousHasInlineStyles || currentMatchesLess) {
      const element = previous;
      const vars = !currentMatchesLess ? [] : previousMatches.filter(match => !currentMatches.includes(match));
      const scopes = !currentMatchesLess ? [] : getMatchingScopes(element, allVars, groups);

      const labelText = toLabel(element);
      const count = labelCounts[labelText] || 0;
      labelCounts[labelText] = count + 1;
      const label = labelText + (count === 0 ? '' : `#${count}`);

      const elHtml = isInSvg ? svgPartHtml(element) : !isSvg ? null : element.outerHTML + '<div style="display:none"><svg>' +
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

      groups.push({
        element,
        elSrc: element.getAttribute('src'),
        elSrcset: element.getAttribute('srcset'),
        elAlt: element.getAttribute('alt'),
        elHtml,
        elWidth: !isSvg ? null : element.getBoundingClientRect().width,
        // Previously this was `element.title`, however if a form element contains an input with name "title",
        // that DOM element would be returned. This causes a crash when this data is sent as a message.
        elTitle: element.getAttribute('title'),
        isRootElement: element.tagName === 'HTML' || element.tagName === 'BODY',
        label,
        vars: vars.map((v) => {
          let currentScope;
          for (const key in scopesByProperty[v.name] || {}) {
            if (scopes?.some((s) => s.selector === key)) {
              currentScope = key;
            }
          }

          return {
            ...v,
            currentScope,
          };
        }),
        scopes,
        inlineStyles: !previousHasInlineStyles ? null : previousInlineStyles,
      });
      previousMatches = currentMatches;
      // times.push([label, performance.now() - tStart])
    }

    previous = current;
    
  }
  // console.log(groups)
  // console.log(times)

  return groups;
};

