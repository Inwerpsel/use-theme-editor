import { getMatchingVars } from './getMatchingVars';

const toLabel = ({id, className, tagName}) => {
  const idPart = !id ? '' : `#${ id }`;
  const noClass = !className || typeof className !== 'string';
  const classPart =  noClass ? '' : `.${ className.trim().replace(/ /g, '.') }`;

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

export const groupVars = async (vars, target) => {
  const groups = [];
  let current,
    previous = target,
    previousMatches = vars;

  // Walk up the tree to the root to assign each variable to the deepest element they apply to. Each time we go up we
  // test the remaining variables. If the current element doesn't match all anymore, the non matching are assigned to
  // the previous (one level deeper) element.
  while (current = previous.parentNode) {
    if (previousMatches.length === 0) {
      break;
    }
    const currentMatches = await getMatchingVars({ cssVars: previousMatches, target: current });

    if (currentMatches.length < previousMatches.length) {
      groups.push({
        element: previous,
        label: toLabel(previous),
        vars: previousMatches.filter(match => !currentMatches.includes(match)),
      });
      previousMatches = currentMatches;
    }

    previous = current;
  }

  return groups;
};

