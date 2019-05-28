import mapValues from 'lodash/mapValues';

import { Form, FormField, FormState } from './typings';
import { Dictionary } from '../typings';

export function selectValues(state: FormState, formName: string): Dictionary<string> {
  return mapValues(state[formName].fields, field => field.value);
}

export function selectFields(state: FormState, formName: string): Dictionary<FormField> {
  return state[formName].fields;
}

export function selectAll(state: FormState, formName: string): Form {
  return state[formName];
}
