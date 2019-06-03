import { selectAll, selectFields, selectValues } from '../../src/forms/selectors';
import { FormState } from '../../src/forms/typings';

describe('form selector tests', () => {

  let state: FormState;

  beforeAll(() => {
    state = {
      'my-form': {
        name: 'my-form',
        fields: {
          email: {
            name: 'email',
            value: 'joselito@mailinator.com',
            dirty: true,
            focused: false,
            valid: true,
          },
          password: {
            name: 'password',
            value: '',
            dirty: false,
            focused: false,
            valid: false,
          },
        },
        dirty: false,
        valid: false,
        validating: false,
      },
    };
  });

  it('should have a module', () => {
    expect(selectAll).toBeDefined();
    expect(selectFields).toBeDefined();
    expect(selectValues).toBeDefined();
  });

  describe('selectAll tests', () => {

    it('should select the entire form object', () => {
      expect(selectAll('my-form')({ forms: state })).toBe(state['my-form']);
    });

    it('should return undefined when form does not exist', () => {
      expect(selectAll('another-form')({ forms: state })).toBeUndefined();
    });

  });

  describe('selectValues tests', () => {

    it('should retrieve a dictionary of values', () => {
      expect(selectValues('my-form')({ forms: state })).toEqual({
        email: 'joselito@mailinator.com',
        password: '',
      });
    });

    it('should always return the same pointer for the same form', () => {
      const firstSelected = selectValues('my-form')({ forms: state });
      const secondSelected = selectValues('my-form')({ forms: state });
      expect(firstSelected).toBe(secondSelected);
    });

    it('should return {} when form does not exist', () => {
      expect(selectValues('another-form')({ forms: state })).toEqual({});
    });

  });

  describe('selectFields tests', () => {

    it('should a dictionary of field objects', () => {
      expect(selectFields('my-form')({ forms: state })).toBe(state['my-form'].fields);
    });

    it('should return {} when form does not exist', () => {
      expect(selectFields('another-form')({ forms: state })).toBeUndefined();
    });

  });

});
