import { expectSaga } from 'redux-saga-test-plan';

import * as FormActions from '../../src/forms/actions';
import { createFormSaga } from '../../src/forms/saga-generator';
import { FormInitialConfiguration, FormState } from '../../src/forms/typings';
import { Dictionary } from '../../src/typings';

describe('form saga generator tests', () => {

  let initialConfig1: FormInitialConfiguration;
  let initialConfig2: FormInitialConfiguration;
  let testState: FormState;

  beforeAll(() => {
    initialConfig1 = {
      formName: 'my-form',
      fields: ['email', 'password'],
      validator: () => Promise.resolve({ email: true, password: true }),
      onSubmit: (values: Dictionary<string>) => ({ values, type: 'SUBMITTED' }),
    };
    initialConfig2 = {
      formName: 'another-form',
      fields: ['name', 'password'],
      validator: () => Promise.resolve({ name: true, password: true }),
      onSubmit: (values: Dictionary<string>) => ({ values, type: 'SUBMITTED' }),
    };
  });

  beforeAll(() => {
    testState = {
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
        focused: false,
        valid: false,
        validating: false,
      },
      'another-form': {
        name: 'another-form',
        fields: {
          email: {
            name: 'name',
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
        focused: false,
        valid: false,
        validating: false,
      },
    };
  });

  it('should have a module', () => {
    expect(createFormSaga).toBeDefined();
  });

  it('should behave like this in normal scenarios', () => {
    const watcher = createFormSaga();
    expectSaga(watcher)
      .withState(testState)
      .dispatch(FormActions.registerForm(initialConfig1))
      .delay(200)
      .dispatch(FormActions.onFormChange({
        formName: initialConfig1.formName,
        fieldName: initialConfig1.fields[0],
        nextValue: 'a',
      }))
      .delay(600)
      .put(FormActions.formValidating(initialConfig1.formName))
      .put(FormActions.formValidated(initialConfig1.formName, { email: true, password: true }))
      .dispatch(FormActions.submitForm(initialConfig1.formName))
      .put(initialConfig1.onSubmit({ email: '', password: '' }))
      .silentRun();
  });

  it('should submit only the appropriate form', () => {
    const watcher = createFormSaga();
    expectSaga(watcher)
      .withState(testState)
      .dispatch(FormActions.registerForm(initialConfig1))
      .dispatch(FormActions.registerForm(initialConfig2))
      .delay(200)
      .dispatch(FormActions.onFormChange({
        formName: initialConfig2.formName,
        fieldName: initialConfig2.fields[0],
        nextValue: 'a',
      }))
      .delay(600)
      .put(FormActions.formValidating(initialConfig2.formName))
      .put(FormActions.formValidated(initialConfig2.formName, { name: true, password: true }))
      .dispatch(FormActions.submitForm(initialConfig2.formName))
      .put(initialConfig2.onSubmit({ name: '', password: '' }))
      .silentRun();
  });

});
