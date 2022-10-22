// It is assumed that property was returned by the given rule.
// This will only happen with an empty value if a corresponding shorthand was used.
// Hence this function uses these assumptions to improve performance.
export function resolveOriginalShorthand(property, rule) {
  let shorthandProperty = property,
    shorthandValue = '',
    longBorderProperty = !/^border\-\w+-/.test(property)
      ? ''
      : property.replace(/(.*-)*/, ''),
    didBorder = false,
    usableBorderEndProperty =
      longBorderProperty !== '' && !['source', 'slice', 'outset', 'repeat'].includes(longBorderProperty);

  if (longBorderProperty === 'radius') {
    // Border radius is (I hope) the only property where removing parts from the right
    // would lead to the wrong shorthand.
    // Luckily there's just one option and it has to be this one if the rule's style
    // listed an empty longhand radius property.
    return ['border-radius', rule.style['border-radius']];
  }

  const anomalousShorthand = getAnomalousShorthand(property);
  if (anomalousShorthand) {
    return [anomalousShorthand, rule.style[anomalousShorthand]];
  }

  while (shorthandValue === '' || typeof shorthandValue === 'undefined') {
    const nextPiece = shorthandProperty.replace(/-\w+$/, '');

    if (nextPiece === shorthandProperty) {
      // Stop if no more words were removed.
      break;
    }

    const nextIsBorder = nextPiece === 'border';
    shorthandProperty =
      nextIsBorder && !didBorder && usableBorderEndProperty
        ? // Shove in the other border property we missed.
          `border-${longBorderProperty}`
        : nextPiece;

    didBorder = nextIsBorder || didBorder;
    shorthandValue = rule.style[shorthandProperty];
  }

  return [shorthandProperty, shorthandValue];
}

function getAnomalousShorthand(property) {
  // I excluded `grid-area`, as it conflicts with `grid-column` and `grid-row`.
  // It's the only such problem I came across among all shorthands currently
  // listed on https://developer.mozilla.org/en-US/docs/Web/CSS/grid-area.

  switch (property) {
    case 'column-count':
    case 'column-width':
      return 'columns';

    case 'flex-direction':
    case 'flex-wrap':
      return 'flex-flow';

    case 'line-height':
      return 'font';

    case 'row-gap':
    case 'column-gap':
      return 'gap';

    case 'grid-column-end':
    case 'grid-column-start':
      return 'grid-column';

    case 'grid-row-end':
    case 'grid-row-start':
      return 'grid-row';

    case 'align-content':
    case 'justify-content':
      return 'place-content';

    case 'align-items':
    case 'justify-items':
      return 'place-items';
  }
}