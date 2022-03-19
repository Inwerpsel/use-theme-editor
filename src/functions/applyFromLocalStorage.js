const lastRead = {};

export const applyFromLocalStorage = (key) => {
  let storedVars;
  const json = localStorage.getItem( key );

  if (lastRead[key] === json) {
    return;
  }

  try {
    storedVars = JSON.parse(json);
  } catch (e) {
    console.log(json);
  }

  if (!storedVars) {
    return;
  }

  Object.keys(storedVars).forEach(name => {
    const value = storedVars[name];
    document.documentElement.style.setProperty(name, value);
  });

  const customProps = Object.entries(document.documentElement.style).filter(([, k]) => {
    return !!('string' === typeof k && k.match(/^--/));
  });

  customProps.forEach(([, k]) => {
    if (!Object.keys(storedVars).includes(k)) {
      document.documentElement.style.removeProperty(k);
    }
  });
  lastRead[key] = json;
};

