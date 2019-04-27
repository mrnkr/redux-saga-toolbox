import { createUnsortedEntityAdapter } from '../../src/entity/unsorted-entity-adapter';
import { EntityStateAdapter, EntityState, Predicate, Update } from '../../src/entity/models';

interface TestItem {
  id: string;
  name: string;
}

describe('unsorted entity adapter operator tests', () => {

  let adapter: EntityStateAdapter<TestItem>;

  beforeAll(() => {
    adapter = createUnsortedEntityAdapter<TestItem>(e => e.id);
  });

  it('should have a module', () => {
    expect(createUnsortedEntityAdapter).toBeDefined();
  });

  describe('addOne tests', () => {

    it('should add new entity', () => {
      const entity = { id: '1', name: 'Potato Jr' };
      const state: EntityState<TestItem> = { ids: [], entities: {} };

      const result = adapter.addOne(entity, state);

      expect(result).toEqual({ ids: [ entity.id ], entities: { [entity.id]: entity } });
    });

    it('should not add repeated entity', () => {
      const entity = { id: '1', name: 'Potato Jr' };
      const state: EntityState<TestItem> = { ids: [ entity.id ], entities: { [entity.id]: entity } };

      const result = adapter.addOne(entity, state);

      expect(result).toBe(state);
    });

  });

  describe('addMany tests', () => {

    it('should add all new entities in the array', () => {
      const entities: TestItem[] = [ { id: '1', name: 'Potato Jr' }, { id: '2', name: 'Potato Sr' } ];
      const state: EntityState<TestItem> = { ids: [], entities: {} };

      const result = adapter.addMany(entities, state);

      expect(result).toEqual({
        ids: entities.map(e => e.id),
        entities: { [entities[0].id]: entities[0], [entities[1].id]: entities[1] }
      });
    });

    it('should add the entity that is not repeated', () => {
      const entities: TestItem[] = [ { id: '1', name: 'Potato Jr' }, { id: '2', name: 'Potato Sr' } ];
      const state: EntityState<TestItem> = { ids: [ entities[1].id ], entities: { [entities[1].id]: entities[1] } };

      const result = adapter.addMany(entities, state);

      expect(result).toEqual({
        ids: entities.map(e => e.id).reverse(),
        entities: { [entities[0].id]: entities[0], [entities[1].id]: entities[1] }
      });
    });

    it('should not add any entities', () => {
      const entities: TestItem[] = [ { id: '1', name: 'Potato Jr' }, { id: '2', name: 'Potato Sr' } ];
      const state: EntityState<TestItem> = {
        ids: entities.map(e => e.id),
        entities: { [entities[0].id]: entities[0], [entities[1].id]: entities[1] }
      };

      const result = adapter.addMany(entities, state);

      expect(result).toBe(state);
    });

  });

  describe('addAll tests', () => {

    it('should add all entities and remove previous ones', () => {
      const entities: TestItem[] = [ { id: '2', name: 'Apple' }, { id: '3', name: 'Banana' } ];
      const state: EntityState<TestItem> = {
        ids: [ '1', '2' ],
        entities: { ['1']: { id: '1', name: 'Potato Jr' }, ['2']: { id: '2', name: 'Potato Sr' } }
      };

      const result = adapter.addAll(entities, state);

      expect(result).toEqual({
        ids: entities.map(e => e.id),
        entities: { [entities[0].id]: entities[0], [entities[1].id]: entities[1] }
      });
    });

    it('should not do anything when passed an empty array', () => {
      const entities: TestItem[] = [];
      const state: EntityState<TestItem> = {
        ids: [ '1', '2' ],
        entities: { ['1']: { id: '1', name: 'Potato Jr' }, ['2']: { id: '2', name: 'Potato Sr' } }
      };

      const result = adapter.addAll(entities, state);

      expect(result).toEqual(state);
    });

  });

  describe('removeOne tests', () => {

    it('should remove the item whose key was passed', () => {
      const keyToDelete = '1';
      const state: EntityState<TestItem> = {
        ids: [ '1', '2', '3', '4', '5' ],
        entities: {
          ['1']: { id: '1', name: 'Potato Jr' },
          ['2']: { id: '2', name: 'Potato Sr' },
          ['3']: { id: '3', name: 'Apple' },
          ['4']: { id: '4', name: 'Banana' },
          ['5']: { id: '5', name: 'General Kenobi' }
        }
      };

      const result = adapter.removeOne(keyToDelete, state);

      expect(result).toEqual({
        ids: [ '2', '3', '4', '5' ],
        entities: {
          ['2']: { id: '2', name: 'Potato Sr' },
          ['3']: { id: '3', name: 'Apple' },
          ['4']: { id: '4', name: 'Banana' },
          ['5']: { id: '5', name: 'General Kenobi' }
        }
      });
    });

    it('should not remove anything', () => {
      const keyToDelete = '6';
      const state: EntityState<TestItem> = {
        ids: [ '1', '2', '3', '4', '5' ],
        entities: {
          ['1']: { id: '1', name: 'Potato Jr' },
          ['2']: { id: '2', name: 'Potato Sr' },
          ['3']: { id: '3', name: 'Apple' },
          ['4']: { id: '4', name: 'Banana' },
          ['5']: { id: '5', name: 'General Kenobi' }
        }
      };

      const result = adapter.removeOne(keyToDelete, state);

      expect(result).toBe(state);
    });

  });

  describe('removeMany tests', () => {

    it('should remove all items whose keys are in the passed array', () => {
      const keysToDelete = [ '2', '3' ];
      const state: EntityState<TestItem> = {
        ids: [ '1', '2', '3', '4', '5'],
        entities: {
          ['1']: { id: '1', name: 'Potato Jr' },
          ['2']: { id: '2', name: 'Potato Sr' },
          ['3']: { id: '3', name: 'Apple' },
          ['4']: { id: '4', name: 'Banana' },
          ['5']: { id: '5', name: 'General Kenobi' }
        }
      };

      const result = adapter.removeMany(keysToDelete, state);

      expect(result).toEqual({
        ids: [ '1', '4', '5' ],
        entities: {
          ['1']: { id: '1', name: 'Potato Jr' },
          ['4']: { id: '4', name: 'Banana' },
          ['5']: { id: '5', name: 'General Kenobi' }
        }
      });
    });

    it('should remove entities that return true when applied to the predicate', () => {
      const predicate: Predicate<TestItem> = (e: TestItem) => e.name.startsWith('Potato');
      const state: EntityState<TestItem> = {
        ids: [ '1', '2', '3', '4', '5'],
        entities: {
          ['1']: { id: '1', name: 'Potato Jr' },
          ['2']: { id: '2', name: 'Potato Sr' },
          ['3']: { id: '3', name: 'Apple' },
          ['4']: { id: '4', name: 'Banana' },
          ['5']: { id: '5', name: 'General Kenobi' }
        }
      };

      const result = adapter.removeMany(predicate, state);

      expect(result).toEqual({
        ids: [ '3', '4', '5' ],
        entities: {
          ['3']: { id: '3', name: 'Apple' },
          ['4']: { id: '4', name: 'Banana' },
          ['5']: { id: '5', name: 'General Kenobi' }
        }
      });
    })

    it('should not remove anything', () => {
      const keysToDelete = [ '7', '21' ];
      const state: EntityState<TestItem> = {
        ids: [ '1', '2', '3', '4', '5'],
        entities: {
          ['1']: { id: '1', name: 'Potato Jr' },
          ['2']: { id: '2', name: 'Potato Sr' },
          ['3']: { id: '3', name: 'Apple' },
          ['4']: { id: '4', name: 'Banana' },
          ['5']: { id: '5', name: 'General Kenobi' }
        }
      };

      const result = adapter.removeMany(keysToDelete, state);

      expect(result).toBe(state);
    });

  });

  describe('removeAll tests', () => {

    it('should remove all entities in the store', () => {
      const state: EntityState<TestItem> = {
        ids: [ '1', '2', '3', '4', '5'],
        entities: {
          ['1']: { id: '1', name: 'Potato Jr' },
          ['2']: { id: '2', name: 'Potato Sr' },
          ['3']: { id: '3', name: 'Apple' },
          ['4']: { id: '4', name: 'Banana' },
          ['5']: { id: '5', name: 'General Kenobi' }
        }
      };

      const result = adapter.removeAll(state);

      expect(result).toEqual({ ids: [], entities: {} });
    });

    it('should return the same pointer for the state was already clear', () => {
      const state: EntityState<TestItem> = { ids: [], entities: {} };

      const result = adapter.removeAll(state);

      expect(result).toBe(state);
    });

  });

  describe('updateOne tests', () => {

    it('should change name of the item', () => {
      const update: Update<TestItem> = { id: '2', changes: { name: 'John Sena' } };
      const state: EntityState<TestItem> = {
        ids: [ '1', '2', '3', '4', '5'],
        entities: {
          ['1']: { id: '1', name: 'Potato Jr' },
          ['2']: { id: '2', name: 'Potato Sr' },
          ['3']: { id: '3', name: 'Apple' },
          ['4']: { id: '4', name: 'Banana' },
          ['5']: { id: '5', name: 'General Kenobi' }
        }
      };

      const result = adapter.updateOne(update, state);

      expect(result).toEqual({
        ids: [ '1', '2', '3', '4', '5'],
        entities: {
          ['1']: { id: '1', name: 'Potato Jr' },
          ['2']: { id: '2', name: 'John Sena' },
          ['3']: { id: '3', name: 'Apple' },
          ['4']: { id: '4', name: 'Banana' },
          ['5']: { id: '5', name: 'General Kenobi' }
        }
      });
    });

    it('should update the id of the item', () => {
      const update: Update<TestItem> = { id: '2', changes: { id: '7', name: 'John Sena' } };
      const state: EntityState<TestItem> = {
        ids: [ '1', '2', '3', '4', '5'],
        entities: {
          ['1']: { id: '1', name: 'Potato Jr' },
          ['2']: { id: '2', name: 'Potato Sr' },
          ['3']: { id: '3', name: 'Apple' },
          ['4']: { id: '4', name: 'Banana' },
          ['5']: { id: '5', name: 'General Kenobi' }
        }
      };

      const result = adapter.updateOne(update, state);

      expect(result).toEqual({
        ids: [ '1', '7', '3', '4', '5'],
        entities: {
          ['1']: { id: '1', name: 'Potato Jr' },
          ['7']: { id: '7', name: 'John Sena' },
          ['3']: { id: '3', name: 'Apple' },
          ['4']: { id: '4', name: 'Banana' },
          ['5']: { id: '5', name: 'General Kenobi' }
        }
      });
    });

    it('should not change a thing', () => {
      const update: Update<TestItem> = { id: '7', changes: { name: 'Peñarol Inteligencia' } };
      const state: EntityState<TestItem> = {
        ids: [ '1', '2', '3', '4', '5'],
        entities: {
          ['1']: { id: '1', name: 'Potato Jr' },
          ['2']: { id: '2', name: 'Potato Sr' },
          ['3']: { id: '3', name: 'Apple' },
          ['4']: { id: '4', name: 'Banana' },
          ['5']: { id: '5', name: 'General Kenobi' }
        }
      };

      const result = adapter.updateOne(update, state);

      expect(result).toBe(state);
    });

  });

  describe('updateMany tests', () => {

    it('should change name of existing item and disregard the non existent one', () => {
      const updates: Update<TestItem>[] = [
        { id: '2', changes: { name: 'John Sena' } },
        { id: '7', changes: { name: 'Peñarol Inteligencia' } }
      ];
      const state: EntityState<TestItem> = {
        ids: [ '1', '2', '3', '4', '5'],
        entities: {
          ['1']: { id: '1', name: 'Potato Jr' },
          ['2']: { id: '2', name: 'Potato Sr' },
          ['3']: { id: '3', name: 'Apple' },
          ['4']: { id: '4', name: 'Banana' },
          ['5']: { id: '5', name: 'General Kenobi' }
        }
      };

      const result = adapter.updateMany(updates, state);

      expect(result).toEqual({
        ids: [ '1', '2', '3', '4', '5'],
        entities: {
          ['1']: { id: '1', name: 'Potato Jr' },
          ['2']: { id: '2', name: 'John Sena' },
          ['3']: { id: '3', name: 'Apple' },
          ['4']: { id: '4', name: 'Banana' },
          ['5']: { id: '5', name: 'General Kenobi' }
        }
      });
    });

    it('should change the id for the item', () => {
      const updates: Update<TestItem>[] = [
        { id: '2', changes: { id: '7', name: 'John Sena' } },
      ];
      const state: EntityState<TestItem> = {
        ids: [ '1', '2', '3', '4', '5'],
        entities: {
          ['1']: { id: '1', name: 'Potato Jr' },
          ['2']: { id: '2', name: 'Potato Sr' },
          ['3']: { id: '3', name: 'Apple' },
          ['4']: { id: '4', name: 'Banana' },
          ['5']: { id: '5', name: 'General Kenobi' }
        }
      };

      const result = adapter.updateMany(updates, state);

      expect(result).toEqual({
        ids: [ '1', '7', '3', '4', '5'],
        entities: {
          ['1']: { id: '1', name: 'Potato Jr' },
          ['7']: { id: '7', name: 'John Sena' },
          ['3']: { id: '3', name: 'Apple' },
          ['4']: { id: '4', name: 'Banana' },
          ['5']: { id: '5', name: 'General Kenobi' }
        }
      });
    });

    it('should not change a thing', () => {
      const updates: Update<TestItem>[] = [
        { id: '7', changes: { name: 'Peñarol Inteligencia' } }
      ];
      const state: EntityState<TestItem> = {
        ids: [ '1', '2', '3', '4', '5'],
        entities: {
          ['1']: { id: '1', name: 'Potato Jr' },
          ['2']: { id: '2', name: 'Potato Sr' },
          ['3']: { id: '3', name: 'Apple' },
          ['4']: { id: '4', name: 'Banana' },
          ['5']: { id: '5', name: 'General Kenobi' }
        }
      };

      const result = adapter.updateMany(updates, state);

      expect(result).toBe(state);
    });

  });

  describe('upsertOne tests', () => {

    it('should insert the non existent item', () => {
      const update: TestItem = { id: '7', name: 'Peñarol Inteligencia' };
      const state: EntityState<TestItem> = {
        ids: [ '1', '2', '3', '4', '5'],
        entities: {
          ['1']: { id: '1', name: 'Potato Jr' },
          ['2']: { id: '2', name: 'Potato Sr' },
          ['3']: { id: '3', name: 'Apple' },
          ['4']: { id: '4', name: 'Banana' },
          ['5']: { id: '5', name: 'General Kenobi' }
        }
      };

      const result = adapter.upsertOne(update, state);

      expect(result).toEqual({
        ids: [ '1', '2', '3', '4', '5', '7'],
        entities: {
          ['1']: { id: '1', name: 'Potato Jr' },
          ['2']: { id: '2', name: 'Potato Sr' },
          ['3']: { id: '3', name: 'Apple' },
          ['4']: { id: '4', name: 'Banana' },
          ['5']: { id: '5', name: 'General Kenobi' },
          ['7']: { id: '7', name: 'Peñarol Inteligencia' }
        }
      });
    });

    it('should change name of existing item', () => {
      const update: TestItem = { id: '2', name: 'John Sena' };
      const state: EntityState<TestItem> = {
        ids: [ '1', '2', '3', '4', '5'],
        entities: {
          ['1']: { id: '1', name: 'Potato Jr' },
          ['2']: { id: '2', name: 'Potato Sr' },
          ['3']: { id: '3', name: 'Apple' },
          ['4']: { id: '4', name: 'Banana' },
          ['5']: { id: '5', name: 'General Kenobi' }
        }
      };

      const result = adapter.upsertOne(update, state);

      expect(result).toEqual({
        ids: [ '1', '2', '3', '4', '5'],
        entities: {
          ['1']: { id: '1', name: 'Potato Jr' },
          ['2']: { id: '2', name: 'John Sena' },
          ['3']: { id: '3', name: 'Apple' },
          ['4']: { id: '4', name: 'Banana' },
          ['5']: { id: '5', name: 'General Kenobi' },
        }
      });
    });

  });

  describe('upsertMany tests', () => {

    it('should change name of existing item and insert the non existent one', () => {
      const updates: TestItem[] = [
        { id: '2', name: 'John Sena' },
        { id: '7', name: 'Peñarol Inteligencia' }
      ];
      const state: EntityState<TestItem> = {
        ids: [ '1', '2', '3', '4', '5'],
        entities: {
          ['1']: { id: '1', name: 'Potato Jr' },
          ['2']: { id: '2', name: 'Potato Sr' },
          ['3']: { id: '3', name: 'Apple' },
          ['4']: { id: '4', name: 'Banana' },
          ['5']: { id: '5', name: 'General Kenobi' }
        }
      };

      const result = adapter.upsertMany(updates, state);

      expect(result).toEqual({
        ids: [ '1', '2', '3', '4', '5', '7'],
        entities: {
          ['1']: { id: '1', name: 'Potato Jr' },
          ['2']: { id: '2', name: 'John Sena' },
          ['3']: { id: '3', name: 'Apple' },
          ['4']: { id: '4', name: 'Banana' },
          ['5']: { id: '5', name: 'General Kenobi' },
          ['7']: { id: '7', name: 'Peñarol Inteligencia' }
        }
      });
    });

    it('should insert the non existent item', () => {
      const updates: TestItem[] = [
        { id: '7', name: 'Peñarol Inteligencia' }
      ];
      const state: EntityState<TestItem> = {
        ids: [ '1', '2', '3', '4', '5'],
        entities: {
          ['1']: { id: '1', name: 'Potato Jr' },
          ['2']: { id: '2', name: 'Potato Sr' },
          ['3']: { id: '3', name: 'Apple' },
          ['4']: { id: '4', name: 'Banana' },
          ['5']: { id: '5', name: 'General Kenobi' }
        }
      };

      const result = adapter.upsertMany(updates, state);

      expect(result).toEqual({
        ids: [ '1', '2', '3', '4', '5', '7'],
        entities: {
          ['1']: { id: '1', name: 'Potato Jr' },
          ['2']: { id: '2', name: 'Potato Sr' },
          ['3']: { id: '3', name: 'Apple' },
          ['4']: { id: '4', name: 'Banana' },
          ['5']: { id: '5', name: 'General Kenobi' },
          ['7']: { id: '7', name: 'Peñarol Inteligencia' }
        }
      });
    });

    it('should change name of existing item', () => {
      const updates: TestItem[] = [
        { id: '2', name: 'John Sena' }
      ];
      const state: EntityState<TestItem> = {
        ids: [ '1', '2', '3', '4', '5'],
        entities: {
          ['1']: { id: '1', name: 'Potato Jr' },
          ['2']: { id: '2', name: 'Potato Sr' },
          ['3']: { id: '3', name: 'Apple' },
          ['4']: { id: '4', name: 'Banana' },
          ['5']: { id: '5', name: 'General Kenobi' }
        }
      };

      const result = adapter.upsertMany(updates, state);

      expect(result).toEqual({
        ids: [ '1', '2', '3', '4', '5'],
        entities: {
          ['1']: { id: '1', name: 'Potato Jr' },
          ['2']: { id: '2', name: 'John Sena' },
          ['3']: { id: '3', name: 'Apple' },
          ['4']: { id: '4', name: 'Banana' },
          ['5']: { id: '5', name: 'General Kenobi' },
        }
      });
    });

    it('should not change a thing', () => {
      const updates: TestItem[] = [];
      const state: EntityState<TestItem> = {
        ids: [ '1', '2', '3', '4', '5'],
        entities: {
          ['1']: { id: '1', name: 'Potato Jr' },
          ['2']: { id: '2', name: 'Potato Sr' },
          ['3']: { id: '3', name: 'Apple' },
          ['4']: { id: '4', name: 'Banana' },
          ['5']: { id: '5', name: 'General Kenobi' }
        }
      };

      const result = adapter.upsertMany(updates, state);

      expect(result).toBe(state);
    });

  });

  describe('map tests', () => {

    it('should change all names for \'Peñarol\'', () => {
      const predicate = (e: TestItem) => ({ ...e, name: 'Peñarol' });
      const state: EntityState<TestItem> = {
        ids: [ '1', '2', '3', '4', '5'],
        entities: {
          ['1']: { id: '1', name: 'Potato Jr' },
          ['2']: { id: '2', name: 'Potato Sr' },
          ['3']: { id: '3', name: 'Apple' },
          ['4']: { id: '4', name: 'Banana' },
          ['5']: { id: '5', name: 'General Kenobi' }
        }
      };

      const result = adapter.map(predicate, state);

      expect(result.ids.map(id => result.entities[id].name).every(name => name === 'Peñarol')).toBeTruthy();
    });

  });

});
