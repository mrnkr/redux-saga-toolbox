import * as FormActions from '../../src/forms/actions';
import * as FormActionTypes from '../../src/forms/action-types';
import { FormInitialConfiguration } from '../../src/forms/typings';
import { Dictionary } from '../../src/typings';

describe('form action tests', () => {

  let initialConfig: FormInitialConfiguration;

  beforeAll(() => {
    initialConfig = {
      formName: 'my-form',
      fields: ['email', 'password'],
      unregisterOnSubmit: true,
      validator: () => Promise.resolve({ email: true, password: true }),
      onSubmit: (values: Dictionary<string>) => ({ values, type: 'SUBMITTED' }),
    };
  });

  it('should have a module', () => {
    expect(FormActions).toBeDefined();
  });

  it('should return a form registration action', () => {
    const action = FormActions.registerForm(initialConfig);

    expect(action).toEqual({
      ...initialConfig,
      type: FormActionTypes.FORM_REGISTER,
    });
  });

  it('should return a form change action', () => {
    const action = FormActions.onFormChange({
      formName: initialConfig.formName,
      fieldName: 'email',
      nextValue: 'patato@mailinator.com',
    });

    expect(action).toEqual({
      type: FormActionTypes.FORM_CHANGE,
      formName: initialConfig.formName,
      payload: { email: { value: 'patato@mailinator.com' } },
    });
  });

  it('should return a form field on focus action', () => {
    const action = FormActions.formFieldFocus(
      initialConfig.formName,
      {
        email: { focused: true },
      },
    );
    expect(action).toEqual({
      type: FormActionTypes.FORM_FIELD_FOCUS,
      formName: initialConfig.formName,
      payload: { email: { focused: true } },
    });
  });

  it('should return a form field on blur action', () => {
    const action = FormActions.formFieldBlur(
      initialConfig.formName,
      {
        email: { focused: false },
      },
    );
    expect(action).toEqual({
      type: FormActionTypes.FORM_FIELD_BLUR,
      formName: initialConfig.formName,
      payload: { email: { focused: false } },
    });
  });

  it('should return a form validating action', () => {
    const action = FormActions.formValidating(initialConfig.formName);
    expect(action).toEqual({
      type: FormActionTypes.FORM_VALIDATING,
      formName: initialConfig.formName,
    });
  });

  it('should return a form validated action', () => {
    const action = FormActions.formValidated(
      initialConfig.formName,
      {
        email: true,
        password: false,
      },
    );
    expect(action).toEqual({
      type: FormActionTypes.FORM_VALIDATED,
      formName: initialConfig.formName,
      payload: { email: { valid: true }, password: { valid: false } },
    });
  });

  it('should return a form submission action', () => {
    const action = FormActions.submitForm(initialConfig.formName);
    expect(action).toEqual({
      type: FormActionTypes.FORM_SUBMIT,
      formName: initialConfig.formName,
    });
  });

});
