import { useEffect } from 'react';

let globalsHooks;
let hookSetters = {};
/**
 * Splits a camelCase or PascalCase word into individual words separated by spaces.
 * @param {Object} word
 * @returns {String}
 */
function splitCamelCase(word) {
  let output,
    i,
    l,
    capRe = /[A-Z]/;
  if (typeof word !== 'string') {
    throw new Error('The "word" parameter must be a string.');
  }
  output = [];
  for (i = 0, l = word.length; i < l; i += 1) {
    if (i === 0) {
      output.push(word[i].toUpperCase());
    } else {
      if (i > 0 && capRe.test(word[i])) {
        output.push(' ');
      }
      output.push(word[i]);
    }
  }
  return output.join('');
}

export const state = {
  _dynamic: (base) => {
    if (globalsHooks) {
      for (const k of Object.keys(globalsHooks)) {
        if (!hookSetters.hasOwnProperty(k)) {
          continue;
        }
        base[splitCamelCase(k).toLocaleLowerCase()] = (...v) => {
          let actualValue;
          if (v.length === 1) {
            actualValue = v[0];
          } else {
            actualValue = v.join(' ');
          }
          if (actualValue === '') {
            return;
          }
          if (typeof actualValue === 'string' && actualValue.trim() === 'nothing') {
            actualValue = '';
          }
          hookSetters[k](actualValue, {debounceTime: 3000});
        };
      }
    }
    return base;
  },
};

export function SpeakGlobalHooks({ hooks }) {
  globalsHooks = hooks;

  return Object.entries(hooks).map(([name, hook]) => (
    <PopulateSetter {...{ name, hook }} />
  ));
}

function PopulateSetter({name, hook}) {
  const [value, setter] = hook();
  useEffect(() => {
    const type = typeof value;
    if (type === 'object' || type === 'array' || !setter) {
      return;
    }
    hookSetters[name] = setter;
    // return () => {
    //   delete hookSetters[name];
    // };
  }, []);
  return null;
}
