import { Action } from 'redux';
import { SagaIterator } from 'redux-saga';
import { Effect } from 'redux-saga/effects';

export interface MyAction<T> extends Action {
  payload?: T;
  error?: any;
}

export interface SingleEventSagaConfiguration<T, R> {
  takeEvery?: any;
  takeLatest?: any;

  loadingAction: () => Action;
  commitAction: (payload: R | T) => MyAction<T | R>;
  successAction: (payload?: R) => MyAction<R>;
  errorAction: (err: any) => MyAction<T>;

  runAfterCommit?: boolean;
  timeout?: number;
  cancelActionType?: string;

  beforeAction?: (args: T) => SagaIterator;
  afterAction?: (args: any) => SagaIterator;

  action: (args: any) => any;
}

type SingleEventSagaHandlerConfiguration<T, R> =
  Pick<
    SingleEventSagaConfiguration<T, R>,
    Exclude<
      keyof SingleEventSagaConfiguration<T, R>,
      'takeEvery' | 'takeLatest' | 'cancelActionType'
    >
  >
