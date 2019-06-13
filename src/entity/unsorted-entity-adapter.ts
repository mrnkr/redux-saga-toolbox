import {
  EntityState,
  IdSelector,
  EntityStateAdapter,
  Predicate,
  Update,
  EntityMap,
} from './models';
import { DidMutate, createStateOperator } from './state-adapter';
import { selectIdValue } from './utils';

export function createUnsortedEntityAdapter<T>(selectId: IdSelector<T>): EntityStateAdapter<T> {

  type R = EntityState<T>;

  function addOneMutator(entity: T, state: R): DidMutate {
    const key = selectIdValue(entity, selectId);

    if (key in state.entities) {
      return DidMutate.None;
    }

    state.ids.push(key);
    state.entities[key] = entity;

    return DidMutate.Both;
  }

  function addManyMutator(entities: T[], state: R): DidMutate {
    return entities
      .map(e => addOneMutator(e, state))
      .some(res => res === DidMutate.Both) ? DidMutate.Both : DidMutate.None;
  }

  function addAllMutator(entities: T[], state: R): DidMutate {
    state.ids = [];
    state.entities = {};

    addManyMutator(entities, state);

    return DidMutate.Both;
  }

  function removeOneMutator(key: string, state: R): DidMutate {
    return removeManyMutator([key], state);
  }

  function removeManyMutator(keysOrPredicate: string[] | Predicate<T>, state: R): DidMutate {
    const keys = keysOrPredicate instanceof Array ?
      keysOrPredicate :
      state.ids.filter(id => keysOrPredicate(state.entities[id]));
    let result = DidMutate.None;

    for (const key of keys) {
      if (key in state.entities) {
        state.ids.splice(state.ids.indexOf(key), 1);
        delete state.entities[key];
        result = DidMutate.Both;
      }
    }

    return result;
  }

  function removeAll<S extends R>(state: R): S {
    if (state.ids.length === 0) {
      return state as S;
    }

    return {
      ...state,
      ids: [] as string[],
      entities: {},
    } as S;
  }

  function takeNewKey(keys: { [id: string]: string }, update: Update<T>, state: R): boolean {
    const original = state.entities[update.id];
    const updated: T = { ...original, ...update.changes };
    const newKey = selectIdValue(updated, selectId);
    const hasNewKey = newKey !== update.id;

    if (hasNewKey) {
      keys[update.id] = newKey;
      delete state.entities[update.id];
    }

    state.entities[newKey] = updated;

    return hasNewKey;
  }

  function updateOneMutator(update: Update<T>, state: R): DidMutate {
    return updateManyMutator([update], state);
  }

  function updateManyMutator(updates: Update<T>[], state: R): DidMutate {
    const newKeys: { [id: string]: string } = {};

    // tslint:disable-next-line: no-parameter-reassignment
    updates = updates.filter(update => update.id in state.entities);

    const didMutateEntities = updates.length > 0;

    if (didMutateEntities) {
      const didMutateIds =
        updates.filter(update => takeNewKey(newKeys, update, state)).length > 0;

      if (didMutateIds) {
        state.ids = state.ids.map((id: any) => newKeys[id] || id);
        return DidMutate.Both;
      }

      return DidMutate.EntitiesOnly;
    }

    return DidMutate.None;
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

    if (didMutateByAdded === DidMutate.None && didMutateByUpdated === DidMutate.None) {
      return DidMutate.None;
    }

    if (didMutateByAdded === DidMutate.Both || didMutateByUpdated === DidMutate.Both) {
      return DidMutate.Both;
    }

    return DidMutate.EntitiesOnly;
  }

  function mapMutator(map: EntityMap<T>, state: R): DidMutate {
    const changes: Update<T>[] = state.ids.reduce(
      (changes: any[], id: string | number) => {
        const change = map(state.entities[id]);
        if (change !== state.entities[id]) {
          changes.push({ id, changes: change });
        }
        return changes;
      },
      [],
    );
    const updates = changes.filter(({ id }) => id in state.entities);

    return updateManyMutator(updates, state);
  }

  return {
    removeAll,
    addOne: createStateOperator(addOneMutator),
    addMany: createStateOperator(addManyMutator),
    addAll: createStateOperator(addAllMutator),
    removeOne: createStateOperator(removeOneMutator),
    removeMany: createStateOperator(removeManyMutator),
    updateOne: createStateOperator(updateOneMutator),
    updateMany: createStateOperator(updateManyMutator),
    upsertOne: createStateOperator(upsertOneMutator),
    upsertMany: createStateOperator(upsertManyMutator),
    map: createStateOperator(mapMutator),
  };
}
