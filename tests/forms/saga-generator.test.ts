import { expectSaga } from 'redux-saga-test-plan';

import * as FormActions from '../../src/forms/actions';
import { createFormSaga } from '../../src/forms/saga-generator';
import { FormInitialConfiguration, FormState } from '../../src/forms/typings';
import { Dictionary } from '../../src/typings';

describe('form saga generator tests', () => {

  let initialConfig1: FormInitialConfiguration;
  let initialConfig2: FormInitialConfiguration;
  let initialConfig3: FormInitialConfiguration;
  let wrongInitialConfig: FormInitialConfiguration;
  let testState: { forms: FormState };

  beforeAll(() => {
    initialConfig1 = {
      formName: 'my-form',
      fields: ['email', 'password'],
      unregisterOnSubmit: true,
      validator: () => Promise.resolve({ email: true, password: true }),
      onSubmit: (values: Dictionary<string>) => ({ values, type: 'SUBMITTED' }),
    };

    initialConfig2 = {
      formName: 'another-form',
      fields: ['name', 'password'],
      unregisterOnSubmit: true,
      validator: () => Promise.resolve({ name: true, password: true }),
      onSubmit: (values: Dictionary<string>) => ({ values, type: 'SUBMITTED' }),
    };

    initialConfig3 = {
      formName: 'my-form',
      fields: ['email', 'password'],
      unregisterOnSubmit: false,
      validator: () => Promise.resolve({ email: true, password: true }),
      onSubmit: (values: Dictionary<string>) => ({ values, type: 'SUBMITTED' }),
    };

    wrongInitialConfig = {
      formName: 'my-form',
      fields: ['email', 'password'],
      unregisterOnSubmit: true,
      validator: () => Promise.resolve({ email: false, password: true }),
      onSubmit: (values: Dictionary<string>) => ({ values, type: 'SUBMITTED' }),
    };
  });

  beforeAll(() => {
    testState = {
      forms: {
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
          valid: false,
          validating: false,
        },
      },
    };
  });

  it('should have a module', () => {
    expect(createFormSaga).toBeDefined();
  });

  it('should behave like this in normal scenarios', () => {
    const watcher = createFormSaga();

    return expectSaga(watcher)
      .withState(testState)
      .dispatch(FormActions.registerForm(initialConfig1))
      .dispatch(FormActions.onFormChange({
        formName: initialConfig1.formName,
        fieldName: 'email',
        nextValue: 'a',
      }))
      .dispatch(FormActions.submitForm(initialConfig1.formName))
      .put(FormActions.formValidating(initialConfig1.formName))
      .put(FormActions.formValidated(initialConfig1.formName, { email: true, password: true }))
      .put(initialConfig1.onSubmit({ email: '', password: '' }))
      .put(FormActions.clearForm(initialConfig1.formName))
      .silentRun();
  });

  it('should not submit when invalid', () => {
    const watcher = createFormSaga();

    return expectSaga(watcher)
      .withState(testState)
      .dispatch(FormActions.registerForm(wrongInitialConfig))
      .dispatch(FormActions.onFormChange({
        formName: wrongInitialConfig.formName,
        fieldName: 'email',
        nextValue: 'a',
      }))
      .dispatch(FormActions.submitForm(wrongInitialConfig.formName))
      .put(FormActions.formValidating(wrongInitialConfig.formName))
      .put(FormActions.formValidated(wrongInitialConfig.formName, { email: false, password: true }))
      .not.put(wrongInitialConfig.onSubmit({ email: '', password: '' }))
      .silentRun();
  });

  it('should submit the right form', () => {
    const watcher = createFormSaga();

    return expectSaga(watcher)
      .withState(testState)
      .dispatch(FormActions.registerForm(initialConfig1))
      .dispatch(FormActions.registerForm(initialConfig2))
      .dispatch(FormActions.submitForm(initialConfig2.formName))
      .put(FormActions.formValidating(initialConfig2.formName))
      .put(FormActions.formValidated(initialConfig2.formName, { name: true, password: true }))
      .put(initialConfig1.onSubmit({ email: '', password: '' }))
      .silentRun();
  });

  it('should validate every 500ms of inactivity', () => {
    const watcher = createFormSaga();

    return expectSaga(watcher)
      .withState(testState)
      .dispatch(FormActions.registerForm(initialConfig1))
      .dispatch(FormActions.onFormChange({
        formName: wrongInitialConfig.formName,
        fieldName: 'email',
        nextValue: 'a',
      }))
      .dispatch(FormActions.onFormChange({
        formName: wrongInitialConfig.formName,
        fieldName: 'email',
        nextValue: 'b',
      }))
      .delay(550)
      .dispatch(FormActions.onFormChange({
        formName: wrongInitialConfig.formName,
        fieldName: 'email',
        nextValue: 'c',
      }))
      .put(FormActions.formValidating(wrongInitialConfig.formName))
      .put(FormActions.formValidated(wrongInitialConfig.formName, { email: true, password: true }))
      .silentRun();
  });

  it('should validate every 500ms and also before submission', () => {
    const watcher = createFormSaga();

    return expectSaga(watcher)
      .withState(testState)
      .dispatch(FormActions.registerForm(wrongInitialConfig))
      .dispatch(FormActions.onFormChange({
        formName: wrongInitialConfig.formName,
        fieldName: 'email',
        nextValue: 'a',
      }))
      .dispatch(FormActions.onFormChange({
        formName: wrongInitialConfig.formName,
        fieldName: 'email',
        nextValue: 'b',
      }))
      .delay(550)
      .dispatch(FormActions.onFormChange({
        formName: wrongInitialConfig.formName,
        fieldName: 'email',
        nextValue: 'c',
      }))
      .delay(300)
      .dispatch(FormActions.submitForm(wrongInitialConfig.formName))
      .put(FormActions.formValidating(wrongInitialConfig.formName))
      .put(FormActions.formValidated(wrongInitialConfig.formName, { email: false, password: true }))
      .not.put(wrongInitialConfig.onSubmit({ email: '', password: '' }))
      .silentRun();
  });

  it('should behave like this when told not to clear on submit', () => {
    const watcher = createFormSaga();

    return expectSaga(watcher)
      .withState(testState)
      .dispatch(FormActions.registerForm(initialConfig3))
      .dispatch(FormActions.onFormChange({
        formName: initialConfig1.formName,
        fieldName: 'email',
        nextValue: 'a',
      }))
      .dispatch(FormActions.submitForm(initialConfig1.formName))
      .put(FormActions.formValidating(initialConfig1.formName))
      .put(FormActions.formValidated(initialConfig1.formName, { email: true, password: true }))
      .put(initialConfig1.onSubmit({ email: '', password: '' }))
      .not.put(FormActions.clearForm(initialConfig1.formName))
      .silentRun();
  });

});
