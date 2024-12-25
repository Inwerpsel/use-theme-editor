const supports = !!document.startViewTransition;

export const doTransition = supports ? (f => document.startViewTransition(f)) : (f: () => void) => f();
