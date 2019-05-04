import { Action } from 'redux';
import { SagaIterator } from 'redux-saga';
import { Effect } from 'redux-saga/effects';

export type Omit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>;

export interface MyAction<T> extends Action {
  payload?: T;
  error?: any;
}

export interface SingleEventSagaConfiguration<T, R> {
  takeEvery?: string;
  takeLatest?: string;
  cancelActionType?: string;

  loadingAction: () => Action;
  commitAction: (payload: R | T) => MyAction<T | R>;
  successAction: (payload?: R) => MyAction<R>;
  errorAction: (err: any) => MyAction<T>;

  runAfterCommit?: boolean;
  timeout?: number;
  retry?: number;

  beforeAction?: (args?: T) => SagaIterator;
  afterAction?: (res: any, args?: T) => SagaIterator;

  action: (args?: any) => any;
}

export type SingleEventSagaHandlerConfiguration<T, R> =
  Omit<SingleEventSagaConfiguration<T, R>, 'takeEvery' | 'takeLatest' | 'cancelActionType'>
