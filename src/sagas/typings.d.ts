import { Action } from 'redux';
import { SagaIterator } from 'redux-saga';
import { Effect } from 'redux-saga/effects';

export type Omit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>;

export interface MyAction<T> extends Action {
  payload?: T;
  error?: any;
}

export interface UndoAction extends Action {
  undoId?: string;
}

export interface SingleEventSagaConfiguration<TPayload, TResult, TUndoPayload = TPayload> {
  takeEvery?: string;
  takeLatest?: string;
  cancelActionType?: string;

  loadingAction: () => Action;
  commitAction: (payload: TResult | TPayload) => MyAction<TPayload | TResult>;
  successAction: (payload?: TResult) => MyAction<TResult>;
  errorAction: (err: any) => MyAction<TPayload>;

  runAfterCommit?: boolean;
  timeout?: number;
  retry?: number;

  undoOnError?: boolean;
  undoThreshold?: number;
  undoActionType?: string;
  undoId?: string;
  undoAction?: (payload: TUndoPayload) => MyAction<TUndoPayload>;
  undoPayloadBuilder?: (args?: TPayload) => SagaIterator;

  beforeAction?: (args?: TPayload) => SagaIterator;
  afterAction?: (res: any, args?: TPayload) => SagaIterator;

  action: (args?: any) => any;
}

export type SingleEventSagaHandlerConfiguration<TPayload, TResult, TUndoPayload = TPayload> =
  Omit<SingleEventSagaConfiguration<TPayload, TResult, TUndoPayload>, 'takeEvery' | 'takeLatest' | 'cancelActionType'>
