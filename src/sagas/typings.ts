import { Observable } from '@mrnkr/promise-queue';
import { Action } from 'redux';
import { SagaIterator } from 'redux-saga';

export type Omit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>;

export interface MyAction<TPayload> extends Action {
  payload?: TPayload;
  undoId?: string;
  error?: Error;
}

export type UndoAction = Omit<MyAction<{}>, 'payload' | 'error'>;

export interface SingleEventSagaConfiguration<TPayload, TResult, TUndoPayload = TPayload> {
  takeEvery?: string;
  takeLatest?: string;
  cancelActionType?: string;

  loadingAction: () => Action;
  commitAction: (payload: TResult | TPayload) => MyAction<TPayload | TResult>;
  successAction: (payload?: TResult) => MyAction<TResult>;
  errorAction: (err: Error) => MyAction<{}>;

  runAfterCommit?: boolean;
  timeout?: number;
  retry?: number;

  undoOnError?: boolean;
  undoThreshold?: number;
  undoActionType?: string;
  undoAction?: (payload: TUndoPayload) => MyAction<TUndoPayload>;
  undoPayloadBuilder?: (args?: TPayload) => SagaIterator;

  beforeAction?: (args?: TPayload) => SagaIterator;
  afterAction?: (res: any, args?: TPayload) => SagaIterator;

  action: (args?: any) => any;

  silent?: boolean;
}

export type SingleEventSagaHandlerConfiguration<TPayload, TResult, TUndoPayload = TPayload> =
  Omit<
    SingleEventSagaConfiguration<TPayload, TResult, TUndoPayload>,
    'takeEvery' | 'takeLatest' | 'cancelActionType'
  >;

export interface ObservableSagaConfiguration<TResult> {
  subscribe: string;
  cancelActionType?: string;

  observable: Observable<TResult>;
  nextAction: (payload: TResult) => MyAction<TResult>;
  doneAction: () => Action;
  errorAction: (err: Error) => MyAction<{}>;

  timeout?: number;
}

export type ObservableSagaHandlerConfiguration<TResult> =
  Omit<ObservableSagaConfiguration<TResult>, 'subscribe' | 'cancelActionType'>;
