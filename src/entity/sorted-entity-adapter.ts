import { Comparer, EntityMap, EntityState, EntityStateAdapter, IdSelector, Update } from './models';
import { createStateOperator, DidMutate } from './state-adapter';
import { createUnsortedEntityAdapter } from './unsorted-entity-adapter';
import { selectIdValue } from './utils';

export function createSortedEntityAdapter<T>(
  selectId: IdSelector<T>, sort: Comparer<T>,
): EntityStateAdapter<T> {

  type R = EntityState<T>;

  const { removeOne, removeMany, removeAll } = createUnsortedEntityAdapter(selectId);

  function addOneMutator(entity: T, state: R): DidMutate {
    return addManyMutator([entity], state);
  }

  function addManyMutator(entities: T[], state: R): DidMutate {
    const models = entities.filter(
      e => !(selectIdValue(e, selectId) in state.entities),
    );

    if (models.length === 0) {
      return DidMutate.None;
    }

    merge(models, state);
    return DidMutate.Both;
  }

  function addAllMutator(entities: T[], state: R): DidMutate {
    state.entities = {};
    state.ids = [];

    addManyMutator(entities, state);

    return DidMutate.Both;
  }

  function updateOneMutator(change: Update<T>, state: R): DidMutate {
    return updateManyMutator([change], state);
  }

  function takeUpdated(entities: T[], update: Update<T>, state: R): boolean {
    if (!(update.id in state.entities)) {
      return false;
    }

    const original = state.entities[update.id];
    const updated = { ...original, ...update.changes };
    const newKey = selectIdValue(updated, selectId);

    delete state.entities[update.id];

    entities.push(updated);

    return newKey !== update.id;
  }

  function updateManyMutator(changes: Update<T>[], state: R): DidMutate {
    const entities: T[] = [];

    const didMutateIds = changes.filter(chg => takeUpdated(entities, chg, state)).length > 0;

    if (entities.length === 0) {
      return DidMutate.None;
    } {
      const originalIds = state.ids;
      const updatedIndexes: any[] = [];
      state.ids = state.ids.filter((id: any, index: number) => {
        if (id in state.entities) {
          return true;
        }
        updatedIndexes.push(index);
        return false;

      });

      merge(entities, state);

      if (
        !didMutateIds &&
        updatedIndexes.every((i: number) => state.ids[i] === originalIds[i])
      ) {
        return DidMutate.EntitiesOnly;
      }
      return DidMutate.Both;

    }
  }

  function upsertOneMutator(entity: T, state: R): DidMutate {
    return upsertManyMutator([entity], state);
  }

  function upsertManyMutator(entities: T[], state: R): DidMutate {
    const added: any[] = [];
    const updated: any[] = [];

    for (const entity of entities) {
      const id = selectIdValue(entity, selectId);
      if (id in state.entities) {
        updated.push({ id, changes: entity });
      } else {
        added.push(entity);
      }
    }

    const didMutateByUpdated = updateManyMutator(updated, state);
    const didMutateByAdded = addManyMutator(added, state);

    switch (true) {
      case didMutateByAdded === DidMutate.None &&
        didMutateByUpdated === DidMutate.None:
        return DidMutate.None;
      case didMutateByAdded === DidMutate.Both ||
        didMutateByUpdated === DidMutate.Both:
        return DidMutate.Both;
      default:
        return DidMutate.EntitiesOnly;
    }
  }

  function mapMutator(predicate: EntityMap<T>, state: R): DidMutate {
    const updates: Update<T>[] = state.ids.reduce(
      (changes: any[], id: string | number) => {
        const change = predicate(state.entities[id]);
        if (change !== state.entities[id]) {
          changes.push({ id, changes: change });
        }
        return changes;
      },
      [],
    );

    return updateManyMutator(updates, state);
  }

  function merge(models: T[], state: R): void {
    models.sort(sort);

    const ids: any[] = [];

    let i = 0;
    let j = 0;

    while (i < models.length && j < state.ids.length) {
      const model = models[i];
      const modelId = selectIdValue(model, selectId);
      const entityId = state.ids[j];
      const entity = state.entities[entityId];

      if (sort(model, entity) <= 0) {
        ids.push(modelId);
        i = i + 1;
      } else {
        ids.push(entityId);
        j = j + 1;
      }
    }

    if (i < models.length) {
      state.ids = ids.concat(models.slice(i).map(selectId));
    } else {
      state.ids = ids.concat(state.ids.slice(j));
    }

    models.forEach((model) => {
      state.entities[selectId(model)] = model;
    });
  }

  return {
    removeOne,
    removeMany,
    removeAll,
    addOne: createStateOperator(addOneMutator),
    addMany: createStateOperator(addManyMutator),
    addAll: createStateOperator(addAllMutator),
    updateOne: createStateOperator(updateOneMutator),
    updateMany: createStateOperator(updateManyMutator),
    upsertOne: createStateOperator(upsertOneMutator),
    upsertMany: createStateOperator(upsertManyMutator),
    map: createStateOperator(mapMutator),
  };

}
