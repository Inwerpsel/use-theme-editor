export const getAllDefaultValues = allVars => {
  const fromAvailableVars = allVars.reduce((values, cssVar) => {
    // All should use the default value (as a best practice), but can't be guaranteed. If they're different it's hard to
    // tell which it should be. Just use the first one. No usages is not possible in theory but check existence anyway.
    // I'm hesitant to support the case of the same variable having different default values. It seems like a bad
    // practice. Instead, the CSS should use different variables for these cases.
    const supposedDefaultValue = cssVar.usages[0]?.defaultValue;

    return {
      ...values,
      [cssVar.name]: supposedDefaultValue,
    };
  }, {});

  return {
    ...fromAvailableVars,
    // ...atRuntime,
  };
};

