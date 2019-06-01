import mapValues from 'lodash/mapValues';

import { Form, FormField, FormState } from './typings';
import { Dictionary } from '../typings';

export function selectValues(state: FormState, formName: string): Dictionary<string> {
  if (!state[formName]) {
    return {};
  }

  return mapValues(state[formName].fields, field => field.value);
}

export function selectFields(state: FormState, formName: string): Dictionary<FormField> {
  if (!state[formName]) {
    return {};
  }

  return state[formName].fields;
}

export function selectAll(state: FormState, formName: string): Form {
  return state[formName];
}
