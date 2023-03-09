import { definedValues } from "./collectRuleVars";

export const getAllDefaultValues = allVars => {
  const fromAvailableVars = allVars.reduce((values, {name, usages}) => {
    // All should use the default value (as a best practice), but can't be guaranteed. If they're different it's hard to
    // tell which it should be. Just use the first one.
    // I'm hesitant to support the case of the same variable having different default values. It seems like a bad
    // practice. Instead, the CSS should use different variables for these cases.
    const supposedDefaultValue = usages[0]?.defaultValue;

    if (supposedDefaultValue === null) {
      // It has no default value in the var call.
      return values;
    }

    values[name] = supposedDefaultValue;

    return values;
  }, {});

  return fromAvailableVars;
};
