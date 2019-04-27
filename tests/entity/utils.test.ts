import { selectIdValue } from '../../src/entity/utils';

describe('utils test', () => {

  describe('selectIdValue tests', () => {

    it('should return id given the passed predicate', () => {
      const key = selectIdValue({ id: 'a', name: 'b' }, e => e.id);
      expect(key).toEqual('a');
    });

    it('should throw when no id is provided', () => {
      expect(() => selectIdValue({}, (e: any) => e.id)).toThrow();
    });

  });

});
