export const reducerOf = actions => (state, {type, payload}) => {
  state.verbose && console.log('Received action', type, 'with payload', payload);

  const name = typeof type === 'function' ? type.name : type;

  if (typeof actions[name] !== 'function') {
    throw new Error(`No handler for action ${name}`);
  }

  return actions[name](state, payload);
};
