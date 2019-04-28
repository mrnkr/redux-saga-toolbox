import { createInitialStateFactory } from '../../src/entity/entity-state';
import { EntityState } from '../../src/entity/models';

describe('entity state tests', () => {

  let getInitialState: <S extends object>(additionalState?: S) => EntityState<{}> & S;

  beforeAll(() => {
    getInitialState = createInitialStateFactory<{}>().getInitialState;
  });

  describe('getInitialState tests', () => {

    it('should return an empty entity state', () => {
      const result = getInitialState();
      expect(result).toEqual({ ids: [], entities: {} });
    });

    it('should return an empty entity state with some extras', () => {
      const extras = { loading: false, error: null };
      const result = getInitialState(extras);
      expect(result).toEqual({ ids: [], entities: {}, ...extras });
    });

  });

});
