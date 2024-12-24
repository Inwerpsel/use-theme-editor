export function furthest(element, selector) {
  let closest = element.closest(selector);

  while (closest?.parentNode?.closest) {
    const parentClosest = closest.parentNode.closest(selector);

    if (parentClosest) {
      closest = parentClosest;
    } else {
      break;
    }
  }

  return closest;
}
