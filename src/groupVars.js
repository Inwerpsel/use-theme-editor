import { getMatchingVars } from './getMatchingVars';

const toLabel = element => {
  const idPart = !element.id ? '' : `#${ element.id }`;
  const classPart = typeof element.className !== 'string' ? '' : `.${ element.className.trim().replace(/ /g, '.') }`;

  return element.tagName.toLowerCase() + idPart + classPart;
};

export const byNameStateProp = ({name: nameA},{name: nameB}) => {
  const reg = /--(?<element>\w+(-?-\w+)*)(--(?<state>(active|focus|visited|hover|disabled)))?--(?<prop>\w+(-\w+)*)/;

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

  const {element: elementA, state: stateA, prop: propA } = matchA.groups;
  const {element: elementB, state: stateB, prop: propB } = matchB.groups;

  if (propA !== propB) {
    return propA < propB ? -1 : 1;
  }
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

