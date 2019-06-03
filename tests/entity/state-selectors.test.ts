import { createSelectorsFactory } from '../../src/entity/state-selectors';
import { EntitySelectors, EntityState } from '../../src/entity/models';
import { TestItem } from './typings';

/**
 * Specification of some general use
 * selectors to use with entity state
 */
describe('state selectors tests', () => {

  let selectors: EntitySelectors<TestItem>;
  let state: EntityState<TestItem>;

  beforeAll(() => {
    selectors = createSelectorsFactory<TestItem>().getSelectors();
    state = {
      ids: ['1', '2', '3', '4', '5'],
      entities: {
        ['1']: { id: '1', name: 'Potato Jr' },
        ['2']: { id: '2', name: 'Potato Sr' },
        ['3']: { id: '3', name: 'Apple' },
        ['4']: { id: '4', name: 'Banana' },
        ['5']: { id: '5', name: 'General Kenobi' },
      },
    };
  });

  it('should have a module', () => {
    expect(createSelectorsFactory).toBeDefined();
  });

  describe('selectIds tests', () => {

    it('should return the array of ids', () => {
      const result = selectors.selectIds(state);
      expect(result).toBe(state.ids);
    });

  });

  describe('selectEntities tests', () => {

    it('should return the map of entities', () => {
      const result = selectors.selectEntities(state);
      expect(result).toBe(state.entities);
    });

  });

  describe('selectAll tests', () => {

    it('should return an array of entities', () => {
      const result = selectors.selectAll(state);
      expect(result).toEqual(state.ids.map(id => state.entities[id]));
    });

    it('should return the same pointer when asked twice', () => {
      const firstSelect = selectors.selectAll(state);
      const secondSelect = selectors.selectAll(state);
      expect(firstSelect).toBe(secondSelect);
    });

  });

  describe('selectTotal tests', () => {

    it('should return the number of entities in store', () => {
      const result = selectors.selectTotal(state);
      expect(result).toBe(state.ids.length);
    });

  });

});
