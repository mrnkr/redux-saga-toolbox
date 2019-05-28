import mapValues from 'lodash/mapValues';

import {
  FORM_REGISTER,
  FORM_CHANGE,
  FORM_VALIDATING,
  FORM_VALIDATED,
  FORM_SUBMIT,
} from './action-types';
import {
  FormRegisterAction,
  FormChangeAction,
  FormChangeDTO,
  FormAction,
  FormSubmitAction,
  FormInitialConfiguration,
  FormValidatedAction,
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
