import mapValues from 'lodash/mapValues';

import {
  FORM_REGISTER,
  FORM_CHANGE,
  FORM_FIELD_FOCUS,
  FORM_FIELD_BLUR,
  FORM_VALIDATING,
  FORM_VALIDATED,
  FORM_SUBMIT,
  FORM_CLEAR,
} from './action-types';
import {
  FormRegisterAction,
  FormChangeAction,
  FormChangeDTO,
  FormAction,
  FormSubmitAction,
  FormInitialConfiguration,
  FormValidatedAction,
  FormFieldFocusAction,
  FormFieldBlurAction,
} from './typings';
import { Dictionary } from '../typings';

export function registerForm(config: FormInitialConfiguration): FormRegisterAction {
  return {
    ...config,
    type: FORM_REGISTER,
  };
}

export function onFormChange(change: FormChangeDTO): FormChangeAction {
  return {
    formName: change.formName,
    payload: { [change.fieldName]: { value: change.nextValue } },
    type: FORM_CHANGE,
  };
}

export function formFieldFocus(
  formName: string,
  payload: Dictionary<{ focused: true }>,
): FormFieldFocusAction {
  return {
    formName,
    payload,
    type: FORM_FIELD_FOCUS,
  };
}

export function formFieldBlur(
  formName: string,
  payload: Dictionary<{ focused: false }>,
): FormFieldBlurAction {
  return {
    formName,
    payload,
    type: FORM_FIELD_BLUR,
  };
}

export function formValidating(formName: string): FormAction {
  return {
    formName,
    type: FORM_VALIDATING,
  };
}

export function formValidated(formName: string, result: Dictionary<boolean>): FormValidatedAction {
  return {
    formName,
    payload: mapValues(result, val => ({ valid: val })),
    type: FORM_VALIDATED,
  };
}

export function submitForm(formName: string): FormSubmitAction {
  return {
    formName,
    type: FORM_SUBMIT,
  };
}

export function clearForm(formName: string): FormAction {
  return {
    formName,
    type: FORM_CLEAR,
  };
}
