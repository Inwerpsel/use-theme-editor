// const wasRejected = result => 'rejected' === result.status;
const wasFulfilled = result => 'fulfilled' === result.status;
const wasRejected = result => 'rejected' === result.status;
const allStateSelectorsRegexp = /:(active|focus|visited|hover|disabled)/g;

const matchVar = async ( cssVar, target ) => {
  const combinedSelector = cssVar.uniqueSelectors.map( selector => {
    const isBodySelector = !!selector.match( /^body(\.[\w-]*)?$/ );

    // Prevent body selector from always showing up, unless a body or paragraph was clicked.
    const shouldIncludeStar = !isBodySelector || ['p', 'body'].includes(target.tagName.toLowerCase());
    // const shouldIncludeStar = true;

    return `${ selector }${ !shouldIncludeStar ? '' : `, ${ selector } *` }`;
    // Remove any pseudo selectors that might not match the clicked element right now.
  }).join().replace(allStateSelectorsRegexp, '').replace(/:?:(before|after)/g, '');


  if ( target.matches( combinedSelector ) ) {
    return [ cssVar ];
  }

  return [];
};

const BS_PATTERN = /^--bs-/;

export const getMatchingVars = async ( { cssVars, target } ) => {

  const startTime = performance.now();
  const uniqueVars = cssVars.reduce( ( carry, cssVar ) => {
    if (!BS_PATTERN.test(cssVar.name) && !carry.some(collected => collected.name === cssVar.name)) {
      carry.push( cssVar );
    }
    return carry;
  }, [] );

  const promises = uniqueVars.map( cssVar => matchVar(cssVar, target));

  const results = await Promise.allSettled( promises );

  const failed = results.filter(wasRejected);
  failed.length && console.warn('Failed testing some selectors.', failed);

  const arrays = results.filter( wasFulfilled ).map( result => result.value );

  console.info('matched vars in', performance.now() - startTime);

  return [].concat( ...arrays );
};

