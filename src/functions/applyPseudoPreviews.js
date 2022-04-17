const PROP_REGEX = /\w+(-\w+)*$/;

export const applyPseudoPreviews = (defaultValues, resolvedValues, previewPseudoVars) =>
  Object.keys(defaultValues).reduce((values, k) => {

    const withoutProperty = k.replace(PROP_REGEX, '').replace(/-+$/, '');
    let elementState = previewPseudoVars[withoutProperty + '--'];

    if (!elementState) {
      return values;
    }

    elementState = elementState.replace(/-/g, '');
    const propName = (k.match(PROP_REGEX) || [null])[0];

    const varToPreview = Object.keys(defaultValues).find(k => {
      const lastPart =
        k
          .replace(withoutProperty, '')
          .replace(/^-+/, '');

      if (!lastPart.startsWith(elementState)) {
        return false;
      }
      const defaultProperty =
        lastPart
          .replace(`${elementState}--`, '')
          .replace(/^-+/, '');

      return defaultProperty === propName;
    });

    if (!varToPreview) {
      return values;
    }

    const tmpValue = values[varToPreview] || defaultValues[varToPreview];

    // Set the regular property to what the pseudo-element's value is.
    return {
      ...values,
      [k]: tmpValue,
    };
  }, resolvedValues);

