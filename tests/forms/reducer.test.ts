import * as FormActions from '../../src/forms/actions';
import { formReducer } from '../../src/forms/reducer';
import { Dictionary } from '../../src/typings';

describe('form reducer tests', () => {

  it('should have a module', () => {
    expect(formReducer).toBeDefined();
  });

  it('should initialize a form', () => {
    const state = {};
    const action = FormActions.registerForm({
      formName: 'my-form',
      fields: ['email', 'password'],
      validator: () => Promise.resolve({ email: true, password: true }),
      onSubmit: (values: Dictionary<string>) => ({ values, type: 'SUBMITTED' }),
    });

    expect(formReducer(state, action)).toEqual({
      'my-form': {
        name: 'my-form',
        fields: {
          email: {
            name: 'email',
            value: '',
            dirty: false,
            focused: false,
            valid: false,
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
    });
  });

  it('should update a value within a form', () => {
    const state = {
      'my-form': {
        name: 'my-form',
        fields: {
          email: {
            name: 'email',
            value: '',
            valid: false,
            dirty: false,
            focused: false,
          },
          password: {
            name: 'password',
            value: '',
            valid: false,
            dirty: false,
            focused: false,
          },
        },
        dirty: false,
        valid: false,
        validating: false,
      },
    };
    const action = FormActions.onFormChange({
      formName: 'my-form',
      fieldName: 'email',
      nextValue: 'potato@mailinator.com',
    });

    const result = formReducer(state, action);
    expect(result['my-form'].fields['password']).toBe(state['my-form'].fields['password']);
    expect(result).toEqual({
      'my-form': {
        name: 'my-form',
        fields: {
          email: {
            name: 'email',
            value: 'potato@mailinator.com',
            dirty: true,
            focused: false,
            valid: false,
          },
          password: {
            name: 'password',
            value: '',
            dirty: false,
            focused: false,
            valid: false,
          },
        },
        dirty: true,
        valid: false,
        validating: false,
      },
    });
  });

  it('should mark form as currently validating', () => {
    const state = {
      'my-form': {
        name: 'my-form',
        fields: {
          email: {
            name: 'email',
            value: '',
            valid: false,
            dirty: false,
            focused: false,
          },
          password: {
            name: 'password',
            value: '',
            valid: false,
            dirty: false,
            focused: false,
          },
        },
        dirty: false,
        valid: false,
        validating: false,
      },
    };
    const action = FormActions.formValidating('my-form');

    const result = formReducer(state, action);
    expect(result['my-form'].fields).toBe(state['my-form'].fields);
    expect(result).toEqual({
      'my-form': {
        name: 'my-form',
        fields: {
          email: {
            name: 'email',
            value: '',
            valid: false,
            dirty: false,
            focused: false,
          },
          password: {
            name: 'password',
            value: '',
            valid: false,
            dirty: false,
            focused: false,
          },
        },
        dirty: false,
        valid: false,
        validating: true,
      },
    });
  });

  it('should update form validity', () => {
    const state = {
      'my-form': {
        name: 'my-form',
        fields: {
          email: {
            name: 'email',
            value: 'potato@mailinator.com',
            dirty: true,
            focused: false,
            valid: false,
          },
          password: {
            name: 'password',
            value: '',
            dirty: false,
            focused: false,
            valid: false,
          },
        },
        dirty: true,
        valid: false,
        validating: false,
      },
    };
    const action = FormActions.formValidated(
      'my-form',
      {
        email: true,
        password: false,
      },
    );

    expect(formReducer(state, action)).toEqual({
      'my-form': {
        name: 'my-form',
        fields: {
          email: {
            name: 'email',
            value: 'potato@mailinator.com',
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
        dirty: true,
        valid: false,
        validating: false,
      },
    });
  });

  it('should mark field as focused', () => {
    const state = {
      'my-form': {
        name: 'my-form',
        fields: {
          email: {
            name: 'email',
            value: 'potato@mailinator.com',
            dirty: true,
            focused: false,
            valid: false,
          },
          password: {
            name: 'password',
            value: '',
            dirty: false,
            focused: false,
            valid: false,
          },
        },
        dirty: true,
        valid: false,
        validating: false,
      },
    };
    const action = FormActions.formFieldFocus('my-form', { password: { focused: true } });

    const result = formReducer(state, action);
    expect(result['my-form'].fields['email']).toBe(state['my-form'].fields['email']);
    expect(result).toEqual({
      'my-form': {
        name: 'my-form',
        fields: {
          email: {
            name: 'email',
            value: 'potato@mailinator.com',
            dirty: true,
            focused: false,
            valid: false,
          },
          password: {
            name: 'password',
            value: '',
            dirty: false,
            focused: true,
            valid: false,
          },
        },
        dirty: true,
        valid: false,
        validating: false,
      },
    });
  });

  it('should register form field blur', () => {
    const state = {
      'my-form': {
        name: 'my-form',
        fields: {
          email: {
            name: 'email',
            value: 'potato@mailinator.com',
            dirty: true,
            focused: false,
            valid: false,
          },
          password: {
            name: 'password',
            value: '',
            dirty: false,
            focused: true,
            valid: false,
          },
        },
        dirty: true,
        valid: false,
        validating: false,
      },
    };
    const action = FormActions.formFieldBlur('my-form', { password: { focused: false } });

    const result = formReducer(state, action);
    expect(result['my-form'].fields['email']).toBe(state['my-form'].fields['email']);
    expect(result).toEqual({
      'my-form': {
        name: 'my-form',
        fields: {
          email: {
            name: 'email',
            value: 'potato@mailinator.com',
            dirty: true,
            focused: false,
            valid: false,
          },
          password: {
            name: 'password',
            value: '',
            dirty: false,
            focused: false,
            valid: false,
          },
        },
        dirty: true,
        valid: false,
        validating: false,
      },
    });
  });

  it('should clear (unregister) a form', () => {
    const state = {
      'my-form': {
        name: 'my-form',
        fields: {
          email: {
            name: 'email',
            value: 'potato@mailinator.com',
            dirty: true,
            focused: false,
            valid: true,
          },
          password: {
            name: 'password',
            value: 'patata2',
            dirty: true,
            focused: false,
            valid: true,
          },
        },
        dirty: true,
        valid: true,
        validating: false,
      },
    };
    const action = FormActions.clearForm('my-form');

    expect(formReducer(state, action)).toEqual({});
  });

  it('should do nothing', () => {
    const state = {
      'my-form': {
        name: 'my-form',
        fields: {
          email: {
            name: 'email',
            value: 'potato@mailinator.com',
            dirty: true,
            focused: false,
            valid: false,
          },
          password: {
            name: 'password',
            value: '',
            dirty: false,
            focused: false,
            valid: false,
          },
        },
        dirty: true,
        valid: false,
        validating: false,
      },
    };
    const action = FormActions.submitForm('my-form');

    expect(formReducer(state, action)).toBe(state);
  });

  it('should affect only the form specified', () => {
    const state = {
      'my-form': {
        name: 'my-form',
        fields: {
          email: {
            name: 'email',
            value: '',
            dirty: false,
            focused: false,
            valid: false,
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
    const action = FormActions.registerForm({
      formName: 'another-form',
      fields: ['name', 'password'],
      validator: () => Promise.resolve({ name: true, password: true }),
      onSubmit: (values: Dictionary<string>) => ({ values, type: 'SUBMITTED' }),
    });

    const result = formReducer(state, action);
    expect(result['my-form']).toBe(state['my-form']);
    expect(result).toEqual({
      'my-form': {
        name: 'my-form',
        fields: {
          email: {
            name: 'email',
            value: '',
            dirty: false,
            focused: false,
            valid: false,
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
      'another-form': {
        name: 'another-form',
        fields: {
          name: {
            name: 'name',
            value: '',
            dirty: false,
            focused: false,
            valid: false,
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
    });
  });

  it('should not do anything when registering already registered form', () => {
    const state = {
      'my-form': {
        name: 'my-form',
        fields: {
          email: {
            name: 'email',
            value: '',
            dirty: false,
            focused: false,
            valid: false,
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
    const action = FormActions.registerForm({
      formName: 'my-form',
      fields: ['email', 'password'],
      validator: () => Promise.resolve({ email: true, password: true }),
      onSubmit: (values: Dictionary<string>) => ({ values, type: 'SUBMITTED' }),
    });

    const result = formReducer(state, action);
    expect(result['my-form']).toBe(state['my-form']);
    expect(result).toBe(state);
  });

});
