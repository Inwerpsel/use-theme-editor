import { scopesByProperty } from './collectRuleVars';
import { getMatchingScopes } from './getMatchingScopes';
import { getMatchingVars } from './getMatchingVars';
import { HIGHLIGHT_CLASS } from './highlight';

export const toLabel = ({id, tagName, classList}) => {
  const idPart = !id ? '' : `#${ id }`;
  const classPart =  [...classList].filter(c=>c!==HIGHLIGHT_CLASS).map(c=>`\n.${c}`).join('');

  return tagName.toLowerCase() + idPart + classPart;
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

    if (previousHasInlineStyles || currentMatchesLess) {
      const element = previous;
      const vars = !currentMatchesLess ? [] : previousMatches.filter(match => !currentMatches.includes(match));
      const scopes = !currentMatchesLess ? [] : getMatchingScopes(element, allVars, groups);

      const labelText = toLabel(element);
      const count = labelCounts[labelText] || 0;
      labelCounts[labelText] = count + 1;
      const label = labelText + (count === 0 ? '' : `#${count}`);

      groups.push({
        element,
        elSrc: element.src,
        elSrcset: element.srcset,
        elAlt: element.alt,
        elTitle: element.title,
        isRootElement: element.tagName === 'HTML' || element.tagName === 'BODY',
        label,
        vars: vars.map(v => {
          let currentScope;
          for (const key in scopesByProperty[v.name] || {}) {
            if (scopes?.some((s) => s.selector === key)) {
              currentScope = key;
            }
          }

          return ({
            ...v,
            currentScope,
          });
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

