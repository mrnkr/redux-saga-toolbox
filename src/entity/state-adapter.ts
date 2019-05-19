import cloneDeep from 'lodash/cloneDeep';
import { EntityState, StateOperator } from './models';

export enum DidMutate {
  EntitiesOnly,
  Both,
  None,
}

export function createStateOperator<V, R>(
  mutator: (arg: R, state: EntityState<V>,
) => DidMutate): StateOperator<V, R> {
  return <S extends EntityState<V>>(arg: R, state: S) => {
    const copiedState = cloneDeep(state);
    const result = mutator(arg, copiedState);

    switch (result) {
      case DidMutate.EntitiesOnly:
        return {
          ...state,
          entities: copiedState.entities,
        };
      case DidMutate.Both:
        return copiedState;
      case DidMutate.None:
        return state;
    }
  };
}
