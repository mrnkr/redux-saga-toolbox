import mapValues from 'lodash/mapValues';
import memoize from 'lodash/memoize';
import { createSelector } from 'reselect';

import { Form, FormField, FormState } from './typings';
import { Dictionary } from '../typings';

export const getFormByName =
  <S extends { forms: FormState }>(formName: string) =>
    (state: S) =>
      !!state ? state.forms[formName] : undefined;

export const selectValues = memoize((formName: string) => createSelector(
  [getFormByName(formName)],
  (state?: Form): Dictionary<string> => {
    if (!state) {
      return {};
    }

    return mapValues(state.fields, field => field.value);
  },
));

export const selectFields = memoize((formName: string) => createSelector(
  [getFormByName(formName)],
  (state?: Form): Dictionary<FormField> | undefined => {
    return state ? state.fields : undefined;
  },
));

export const selectAll = memoize((formName: string) => createSelector(
  [getFormByName(formName)],
  (state?: Form): Form | undefined => {
    return state;
  },
));
