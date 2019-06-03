// tslint:disable: max-line-length
import { createSelector } from 'reselect';
import { EntityState, EntitySelectors } from './models';

export function createSelectorsFactory<T>() {
  function getSelectors(): EntitySelectors<T> {
    const getAll = <S extends EntityState<T>>(state: S) => state;
    const selectIds = <S extends EntityState<T>>(state: S) => state.ids;
    const selectEntities = <S extends EntityState<T>>(state: S) => state.entities;
    const selectAll = <S extends EntityState<T>>({ ids, entities }: S) => ids.map(id => entities[id]);
    const selectTotal = <S extends EntityState<T>>({ ids }: S) => ids.length;

    return {
      selectIds: createSelector([getAll], selectIds),
      selectEntities: createSelector([getAll], selectEntities),
      selectAll: createSelector([getAll], selectAll),
      selectTotal: createSelector([getAll], selectTotal),
    };
  }

  return { getSelectors };
}
