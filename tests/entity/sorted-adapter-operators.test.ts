import omit from 'lodash/omit';
import omitBy from 'lodash/omitBy';
import { createSortedEntityAdapter } from '../../src/entity/sorted-entity-adapter';
import { EntityStateAdapter, EntityState, Predicate, Update } from '../../src/entity/models';
import { SortableTestItem } from './typings';

describe('sorted entity adapter operator tests', () => {

  let adapter: EntityStateAdapter<SortableTestItem>;
  let state: EntityState<SortableTestItem>;

  beforeAll(() => {
    adapter = createSortedEntityAdapter<SortableTestItem>(
      e => e.id, (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
    );

    state = { ids: [], entities: {} };
    state = adapter.addOne(
      {
        id: '1',
        name: 'Potato Jr',
        createdAt: new Date(2016, 8, 12),
      },
      state,
    );
    state = adapter.addOne(
      {
        id: '2',
        name: 'Potato Sr',
        createdAt: new Date(2015, 10, 22),
      },
      state,
    );
    state = adapter.addOne(
      {
        id: '3',
        name: 'Apple',
        createdAt: new Date(2016, 8, 25),
      },
      state,
    );
    state = adapter.addOne(
      {
        id: '4',
        name: 'Banana',
        createdAt: new Date(2018, 2, 24),
      },
      state,
    );
    state = adapter.addOne(
      {
        id: '5',
        name: 'General Kenobi',
        createdAt: new Date(2016, 11, 3),
      },
      state,
    );
  });

  it('should have a module', () => {
    expect(createSortedEntityAdapter).toBeDefined();
  });

  describe('addOne tests', () => {

    it('should add new entity', () => {
      const entity = { id: '6', name: 'Darth Maul', createdAt: new Date(2017, 4, 16) };

      const result = adapter.addOne(entity, state);

      expect(result).toEqual({
        ids: ['4', '6', '5', '3', '1', '2'],
        entities: { ...state.entities, ['6']: entity },
      });
    });

    it('should not add repeated entity', () => {
      const entity = { id: '1', name: 'Potato Jr', createdAt: new Date(2016, 8, 12) };

      const result = adapter.addOne(entity, state);

      expect(result).toBe(state);
    });

  });

  describe('addMany tests', () => {

    it('should add all new entities in the array', () => {
      const entities: SortableTestItem[] = [
        { id: '6', name: 'Master Windu', createdAt: new Date(2018, 3, 1) },
        { id: '7', name: 'El gordo de la colombe', createdAt: new Date(2015, 11, 2) },
      ];

      const result = adapter.addMany(entities, state);

      expect(result).toEqual({
        ids: ['6', '4', '5', '3', '1', '7', '2'],
        entities: {
          ...state.entities,
          [entities[0].id]: entities[0],
          [entities[1].id]: entities[1],
        },
      });
    });

    it('should add the entity that is not repeated', () => {
      const entities: SortableTestItem[] = [
        { id: '1', name: 'Potato Jr', createdAt: new Date(2016, 8, 12) },
        { id: '6', name: 'Gordo de la colombe', createdAt: new Date(2015, 11, 2) },
      ];

      const result = adapter.addMany(entities, state);

      expect(result).toEqual({
        ids: ['4', '5', '3', '1', '6', '2'],
        entities: {
          ...state.entities,
          [entities[1].id]: entities[1],
        },
      });
    });

    it('should not add any entities', () => {
      const entities: SortableTestItem[] = [
        { id: '1', name: 'Potato Jr', createdAt: new Date(2016, 8, 12) },
        { id: '2', name: 'Potato Sr', createdAt: new Date(2015, 10, 22) },
      ];

      const result = adapter.addMany(entities, state);

      expect(result).toBe(state);
    });

  });

  describe('addAll tests', () => {

    it('should add all entities and remove previous ones', () => {
      const entities: SortableTestItem[] = [
        { id: '2', name: 'Apple', createdAt: new Date(2016, 6, 24) },
        { id: '3', name: 'Banana', createdAt: new Date(2019, 2, 31) },
      ];

      const result = adapter.addAll(entities, state);

      expect(result).toEqual({
        ids: entities.map(e => e.id).reverse(),
        entities: { [entities[0].id]: entities[0], [entities[1].id]: entities[1] },
      });
    });

    it('should not do anything when passed an empty array', () => {
      const entities: SortableTestItem[] = [];

      const result = adapter.addAll(entities, state);

      expect(result).toBe(state);
    });

  });

  describe('removeOne tests', () => {

    it('should remove the item whose key was passed', () => {
      const keyToDelete = '1';

      const result = adapter.removeOne(keyToDelete, state);

      expect(result).toEqual({
        ids: state.ids.filter(id => id !== keyToDelete),
        entities: omit(state.entities, [keyToDelete]),
      });
    });

    it('should not remove anything', () => {
      const keyToDelete = '6';

      const result = adapter.removeOne(keyToDelete, state);

      expect(result).toBe(state);
    });

  });

  describe('removeMany tests', () => {

    it('should remove all items whose keys are in the passed array', () => {
      const keysToDelete = ['2', '3'];

      const result = adapter.removeMany(keysToDelete, state);

      expect(result).toEqual({
        ids: state.ids.filter(id => !keysToDelete.includes(id)),
        entities: omit(state.entities, keysToDelete),
      });
    });

    it('should remove entities that return true when applied to the predicate', () => {
      const predicate: Predicate<SortableTestItem> =
        (e: SortableTestItem) => e.name.startsWith('Potato');

      const result = adapter.removeMany(predicate, state);

      expect(result).toEqual({
        ids: state.ids.filter(id => !predicate(state.entities[id])),
        entities: omitBy(state.entities, predicate),
      });
    });

    it('should not remove anything', () => {
      const keysToDelete = ['7', '21'];

      const result = adapter.removeMany(keysToDelete, state);

      expect(result).toBe(state);
    });

  });

  describe('removeAll tests', () => {

    it('should remove all entities in the store', () => {
      const result = adapter.removeAll(state);

      expect(result).toEqual({ ids: [], entities: {} });
    });

    it('should return the same pointer for the state was already clear', () => {
      const state: EntityState<SortableTestItem> = { ids: [], entities: {} };

      const result = adapter.removeAll(state);

      expect(result).toBe(state);
    });

  });

  describe('updateOne tests', () => {

    it('should change name of the item', () => {
      const update: Update<SortableTestItem> = { id: '2', changes: { name: 'John Sena' } };

      const result = adapter.updateOne(update, state);

      expect(result).toEqual({
        ids: [...state.ids],
        entities: {
          ...state.entities,
          ['2']: { id: '2', name: 'John Sena', createdAt: new Date(2015, 10, 22) },
        },
      });
    });

    it('should update the id of the item', () => {
      const update: Update<SortableTestItem> = { id: '2', changes: { id: '7', name: 'John Sena' } };

      const result = adapter.updateOne(update, state);

      expect(result).toEqual({
        ids: state.ids.map(id => id === '2' ? '7' : id),
        entities: {
          ...omit(state.entities, ['2']),
          ['7']: { id: '7', name: 'John Sena', createdAt: new Date(2015, 10, 22) },
        },
      });
    });

    it('should reorder the ids for the sorting attribute was changed', () => {
      const update: Update<SortableTestItem> = {
        id: '2',
        changes: { createdAt: new Date(2019, 0, 1) },
      };

      const result = adapter.updateOne(update, state);

      expect(result).toEqual({
        ids: ['2', ...state.ids.filter(id => id !== '2')],
        entities: {
          ...omit(state.entities, ['2']),
          ['2']: { id: '2', name: 'Potato Sr', createdAt: new Date(2019, 0, 1) },
        },
      });
    });

    it('should not change a thing', () => {
      const update: Update<SortableTestItem> = {
        id: '7',
        changes: { name: 'Peñarol Inteligencia' },
      };

      const result = adapter.updateOne(update, state);

      expect(result).toBe(state);
    });

  });

  describe('updateMany tests', () => {

    it('should change name of existing item and disregard the non existent one', () => {
      const updates: Update<SortableTestItem>[] = [
        { id: '2', changes: { name: 'John Sena' } },
        { id: '7', changes: { name: 'Peñarol Inteligencia' } },
      ];

      const result = adapter.updateMany(updates, state);

      expect(result).toEqual({
        ids: [...state.ids],
        entities: {
          ...state.entities,
          ['2']: { id: '2', name: 'John Sena', createdAt: new Date(2015, 10, 22) },
        },
      });
    });

    it('should change the id for the item', () => {
      const updates: Update<SortableTestItem>[] = [
        { id: '2', changes: { id: '7', name: 'John Sena' } },
      ];

      const result = adapter.updateMany(updates, state);

      expect(result).toEqual({
        ids: state.ids.map(id => id === '2' ? '7' : id),
        entities: {
          ...omit(state.entities, ['2']),
          ['7']: { id: '7', name: 'John Sena', createdAt: new Date(2015, 10, 22) },
        },
      });
    });

    it('should reorder the ids for the sorting attribute was changed', () => {
      const updates: Update<SortableTestItem>[] = [
        { id: '2', changes: { createdAt: new Date(2021, 0, 1) } },
        { id: '4', changes: { createdAt: new Date(2015, 2, 22) } },
      ];

      const result = adapter.updateMany(updates, state);

      expect(result).toEqual({
        ids: ['2', '5', '3', '1', '4'],
        entities: {
          ...omit(state.entities, ['2', '4']),
          ['2']: { id: '2', name: 'Potato Sr', createdAt: new Date(2021, 0, 1) },
          ['4']: { id: '4', name: 'Banana', createdAt: new Date(2015, 2, 22) },
        },
      });
    });

    it('should not change a thing', () => {
      const updates: Update<SortableTestItem>[] = [
        { id: '7', changes: { name: 'Peñarol Inteligencia' } },
      ];

      const result = adapter.updateMany(updates, state);

      expect(result).toBe(state);
    });

  });

  describe('upsertOne tests', () => {

    it('should insert the non existent item', () => {
      const update: SortableTestItem = {
        id: '7',
        name: 'Peñarol Inteligencia',
        createdAt: new Date(2017, 5, 2),
      };

      const result = adapter.upsertOne(update, state);

      expect(result).toEqual({
        ids: ['4', '7', '5', '3', '1', '2'],
        entities: {
          ...state.entities,
          ['7']: { id: '7', name: 'Peñarol Inteligencia', createdAt: new Date(2017, 5, 2) },
        },
      });
    });

    it('should change name of existing item', () => {
      const update: SortableTestItem = {
        id: '2',
        name: 'John Sena',
        createdAt: new Date(2015, 10, 22),
      };

      const result = adapter.upsertOne(update, state);

      expect(result).toEqual({
        ids: [...state.ids],
        entities: {
          ...state.entities,
          ['2']: { id: '2', name: 'John Sena', createdAt: new Date(2015, 10, 22) },
        },
      });
    });

    it('should reorder ids for sorting attribute was changed', () => {
      const update: SortableTestItem = {
        id: '2',
        name: 'Potato Sr',
        createdAt: new Date(2019, 0, 1),
      };

      const result = adapter.upsertOne(update, state);

      expect(result).toEqual({
        ids: ['2', ...state.ids.filter(id => id !== '2')],
        entities: {
          ...omit(state.entities, ['2']),
          ['2']: { id: '2', name: 'Potato Sr', createdAt: new Date(2019, 0, 1) },
        },
      });
    });

  });

  describe('upsertMany tests', () => {

    it('should change name of existing item and insert the non existent one', () => {
      const updates: SortableTestItem[] = [
        { id: '2', name: 'John Sena', createdAt: new Date(2015, 10, 22) },
        { id: '7', name: 'Peñarol Inteligencia', createdAt: new Date(2015, 11, 29) },
      ];

      const result = adapter.upsertMany(updates, state);

      expect(result).toEqual({
        ids: ['4', '5', '3', '1', '7', '2'],
        entities: {
          ...state.entities,
          ['2']: { id: '2', name: 'John Sena', createdAt: new Date(2015, 10, 22) },
          ['7']: { id: '7', name: 'Peñarol Inteligencia', createdAt: new Date(2015, 11, 29) },
        },
      });
    });

    it('should insert the non existent item', () => {
      const updates: SortableTestItem[] = [
        { id: '7', name: 'Peñarol Inteligencia', createdAt: new Date(2015, 11, 29) },
      ];

      const result = adapter.upsertMany(updates, state);

      expect(result).toEqual({
        ids: ['4', '5', '3', '1', '7', '2'],
        entities: {
          ...state.entities,
          ['7']: { id: '7', name: 'Peñarol Inteligencia', createdAt: new Date(2015, 11, 29) },
        },
      });
    });

    it('should change name of existing item', () => {
      const updates: SortableTestItem[] = [
        { id: '2', name: 'John Sena', createdAt: new Date(2015, 10, 22) },
      ];

      const result = adapter.upsertMany(updates, state);

      expect(result).toEqual({
        ids: [...state.ids],
        entities: {
          ...state.entities,
          ['2']: { id: '2', name: 'John Sena', createdAt: new Date(2015, 10, 22) },
        },
      });
    });

    it('should insert non existent item and reorder ids for sorting attribute was changed', () => {
      const updates: SortableTestItem[] = [
        { id: '2', name: 'Potato Sr', createdAt: new Date(2021, 0, 1) },
        { id: '7', name: 'Peñarol Inteligencia', createdAt: new Date(2016, 11, 29) },
      ];

      const result = adapter.upsertMany(updates, state);

      expect(result).toEqual({
        ids: ['2', '4', '7', '5', '3', '1'],
        entities: {
          ...state.entities,
          ['2']: { id: '2', name: 'Potato Sr', createdAt: new Date(2021, 0, 1) },
          ['7']: { id: '7', name: 'Peñarol Inteligencia', createdAt: new Date(2016, 11, 29) },
        },
      });
    });

    it('should not change a thing', () => {
      const updates: SortableTestItem[] = [];

      const result = adapter.upsertMany(updates, state);

      expect(result).toBe(state);
    });

  });

  describe('map tests', () => {

    it('should change all names for \'Peñarol\'', () => {
      const predicate = (e: SortableTestItem) => ({ ...e, name: 'Peñarol' });

      const result = adapter.map(predicate, state);

      expect(
        result
          .ids
          .map(id => result.entities[id].name)
          .every(name => name === 'Peñarol'),
        ).toBeTruthy();
    });

    it('should reorder ids for sorting attribute was changed in many entities', () => {
      const predicate = (e: SortableTestItem) => e.createdAt.getFullYear() === 2016 ? ({
        ...e,
        createdAt: new Date(
          e.createdAt.getFullYear() + 3,
          e.createdAt.getMonth(),
          e.createdAt.getDate(),
        ),
      }) : e;

      const result = adapter.map(predicate, state);

      expect(result.ids).toEqual(['5', '3', '1', '4', '2']);
    });

  });

});
