import {
  EntityDefinition,
  Comparer,
  IdSelector,
  EntityAdapter,
} from './models';
import { createInitialStateFactory } from './entity-state';
import { createSelectorsFactory } from './state-selectors';
import { createUnsortedEntityAdapter } from './unsorted-entity-adapter';

export function createEntityAdapter<T>(
  options: {
    selectId?: IdSelector<T>;
    sortComparer?: false | Comparer<T>;
  } = {}
): EntityAdapter<T> {
  const { selectId, sortComparer }: EntityDefinition<T> = {
    sortComparer: false,
    selectId: (instance: any) => instance.id,
    ...options,
  };

  const stateFactory = createInitialStateFactory<T>();
  const selectorsFactory = createSelectorsFactory<T>();
  // const stateAdapter = sortComparer
  //   ? createSortedStateAdapter(selectId, sortComparer)
  //   : createUnsortedEntityAdapter(selectId);
  const stateAdapter = createUnsortedEntityAdapter(selectId);

  return {
    selectId,
    sortComparer,
    ...stateFactory,
    ...selectorsFactory,
    ...stateAdapter,
  };
}
