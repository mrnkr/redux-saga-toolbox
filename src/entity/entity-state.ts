import { EntityState } from './models';

export function getInitialEntityState<V>(): EntityState<V> {
  return {
    ids: [],
    entities: {},
  };
}

export function createInitialStateFactory<V>() {
  function getInitialState<S extends object>(additionalState: S = {} as S): EntityState<V> & S {
    return { ...getInitialEntityState(), ...additionalState };
  }

  return { getInitialState };
}
