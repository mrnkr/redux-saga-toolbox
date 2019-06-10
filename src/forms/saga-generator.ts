import mapValues from 'lodash/mapValues';
import { SagaIterator, TakeableChannel } from 'redux-saga';
import {
  take,
  spawn,
  put,
  call,
  throttle,
  select,
  cancel,
} from 'redux-saga/effects';

import {
  FORM_REGISTER,
  FORM_CHANGE,
  FORM_SUBMIT,
} from './action-types';
import {
  formValidating,
  formValidated,
  clearForm,
} from './actions';
import {
  Form,
  FormAction,
  FormRegisterAction,
  FormChangeAction,
  Validator,
} from './typings';
import { Dictionary } from '../typings';

export function createFormSaga(): () => SagaIterator {
  function ofType(type: string, formName: string): TakeableChannel<FormAction> {
    return ((action: FormAction) =>
      action.type === type &&
      action.formName === formName) as any;
  }

  function* getFieldsForForm(formName: string) {
    const form: Form = yield select(({ forms }) => forms[formName]);
    const fields: Dictionary<string> = mapValues(form.fields, field => field.value);
    return fields;
  }

  function* validate(fields: Dictionary<string>, formName: string, validator: Validator) {
    yield put(formValidating(formName));
    const validation: Dictionary<boolean> = yield call(validator, fields);
    yield put(formValidated(formName, validation));
    return Object.keys(validation).reduce((acum, cur) => acum && validation[cur], true);
  }

  function* handleNewValue(action: FormRegisterAction, _: FormChangeAction) {
    const fields = yield* getFieldsForForm(action.formName);
    yield* validate(fields, action.formName, action.validator);
  }

  function* subscription(action: FormRegisterAction) {
    const task = yield throttle(500, ofType(FORM_CHANGE, action.formName), handleNewValue, action);

    if (yield take(ofType(FORM_SUBMIT, action.formName))) {
      const fields = yield call(getFieldsForForm, action.formName);
      const isValid = yield* validate(fields, action.formName, action.validator);

      if (!isValid) {
        return;
      }

      yield cancel(task);
      yield put(action.onSubmit(fields));
      if (action.unregisterOnSubmit) {
        yield put(clearForm(action.formName));
      }
    }
  }

  return function* watcher(): SagaIterator {
    while (true) {
      const action: FormRegisterAction = yield take(FORM_REGISTER);
      yield spawn(subscription, action);
    }
  };
}
