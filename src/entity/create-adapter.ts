import { EntityAdapter, EntityDefinition } from './models';
import { createInitialStateFactory } from './entity-state';
import { createSelectorsFactory } from './state-selectors';
import { createSortedEntityAdapter } from './sorted-entity-adapter';
import { createUnsortedEntityAdapter } from './unsorted-entity-adapter';

export function createEntityAdapter<T>(options: EntityDefinition<T> = {} as any): EntityAdapter<T> {
  const { selectId, sortComparer }: EntityDefinition<T> = {
    sortComparer: false,
    selectId: (instance: any) => instance.id,
    ...options,
  };

  const stateFactory = createInitialStateFactory<T>();
  const selectorsFactory = createSelectorsFactory<T>();
  const stateAdapter = sortComparer
    ? createSortedEntityAdapter(selectId, sortComparer)
    : createUnsortedEntityAdapter(selectId);

  return {
    selectId,
    sortComparer,
    ...stateFactory,
    ...selectorsFactory,
    ...stateAdapter,
  };
}
