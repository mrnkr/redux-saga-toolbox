import {
  FORM_REGISTER,
  FORM_CHANGE,
  FORM_VALIDATING,
  FORM_VALIDATED,
  FORM_CLEAR,
  FORM_FIELD_FOCUS,
  FORM_FIELD_BLUR,
} from './action-types';
import {
  FormState,
  FormAction,
  FormRegisterAction,
  Form,
  FormChangeAction,
  FormValidatedAction,
  FormField,
  FormFieldFocusAction,
  FormFieldBlurAction,
} from './typings';
import { Dictionary } from '../typings';

function assertDictionary(val: string[] | Dictionary<string>): Dictionary<string> {
  if (val.constructor === Array) {
    const retVal: Dictionary<string> = {};
    (val as string[]).forEach((key) => { retVal[key] = ''; });
    return retVal;
  }

  return val as Dictionary<string>;
}

function createFormWithDefaultValues(name: string, fieldInitializer: Dictionary<string>): Form {
  const fields: Dictionary<FormField> = {};

  Object
    .keys(fieldInitializer)
    .forEach((key) => {
      fields[key] = {
        name: key,
        value: fieldInitializer[key],
        dirty: false,
        focused: false,
        valid: true,
      };
    });

  return {
    name,
    fields,
    dirty: false,
    valid: true,
    validating: false,
  };
}

function updateFields(
  fields: Dictionary<FormField>,
  payload: Dictionary<{ value: string } | { valid: boolean } | { focused: boolean }>,
): Dictionary<FormField> {
  const retVal = { ...fields };

  Object
    .keys(payload)
    .forEach((key) => {
      retVal[key] = {
        ...retVal[key],
        ...payload[key],
        dirty: retVal[key].dirty || !!(<any>payload[key]).value,
      };
    });

  return retVal;
}

function isFormValid(fields: Dictionary<FormField>): boolean {
  return Object
    .keys(fields)
    .reduce(
      (acum: boolean, cur: string) => acum && fields[cur].valid,
      true,
    );
}

export function formReducer(state: FormState = {}, action: FormAction): FormState {
  switch (action.type) {
    case FORM_REGISTER:
      const registerAction = <FormRegisterAction>action;

      if (state[action.formName]) {
        return state;
      }

      return {
        ...state,
        [action.formName]: createFormWithDefaultValues(
          action.formName,
          assertDictionary(registerAction.fields),
        ),
      };
    case FORM_CHANGE:
    case FORM_FIELD_FOCUS:
    case FORM_FIELD_BLUR:
    case FORM_VALIDATED:
      const changeAction =
        <FormChangeAction | FormValidatedAction | FormFieldFocusAction | FormFieldBlurAction>action;
      const fields = updateFields(state[action.formName].fields, changeAction.payload);
      return {
        ...state,
        [action.formName]: {
          ...state[action.formName],
          fields,
          dirty: true,
          validating: false,
          valid: isFormValid(fields),
        },
      };
    case FORM_VALIDATING:
      return {
        ...state,
        [action.formName]: {
          ...state[action.formName],
          validating: true,
        },
      };
    case FORM_CLEAR:
      if (!(action.formName in state)) {
        return state;
      }

      const nextState = { ...state };
      delete nextState[action.formName];
      return nextState;
    default:
      return state;
  }
}
