import { Action } from 'redux';
import { Dictionary, Omit } from '../typings';

export type Validator = ((values: Dictionary<string>) => Promise<Dictionary<boolean>>);
export type SubmissionHandler<T extends Action = Action> = ((values: Dictionary<string>) => T);

export interface FormAction extends Action {
  formName: string;
}

export interface FormRegisterAction<T extends Action = Action> extends FormAction {
  fields: string[];
  validator: Validator;
  onSubmit: SubmissionHandler<T>;
}

export interface FormChangeAction extends FormAction {
  payload: Dictionary<{ value: string }>;
}

export interface FormValidatedAction extends FormAction {
  payload: Dictionary<{ valid: boolean }>;
}

export type FormSubmitAction = FormAction;
export type FormInitialConfiguration = Omit<FormRegisterAction, 'type'>;

export interface FormChangeDTO {
  formName: string;
  fieldName: string;
  nextValue: string;
}

export type FormState = Dictionary<Form>;

export interface Form {
  name: string;
  fields: Dictionary<FormField>;
  dirty: boolean;
  focused: boolean;
  valid: boolean;
  validating: boolean;
}

export interface FormField {
  name: string;
  value: string;
  dirty: boolean;
  focused: boolean;
  valid: boolean;
}
