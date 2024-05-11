type Payload = {[index: string]: any};

type SingleReducer<T> = (previousState: T, payload: Payload) => T

export type Action<T> = {type: SingleReducer<T>, payload: Payload }

type CombinedReducer<T> = (previousState: T, action: Action<T>) => T

type Actions<T> = {
  [index: string]: SingleReducer<T>
};

export function reducerOf<T>(actions: Actions<T>): CombinedReducer<T> {

  return function (state: T, { type, payload }) {
    const name = typeof type === 'function' ? type.name : type;

    if (typeof actions[name] !== 'function') {
      throw new Error(`No handler for action ${name}`);
    }

    return actions[name](state, payload);
  }
};
