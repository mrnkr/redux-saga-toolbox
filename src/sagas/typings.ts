import { Observable } from '@mrnkr/promise-queue';
import { Action } from 'redux';
import { SagaIterator } from 'redux-saga';
import { ActionType, Predicate } from '@redux-saga/types';

import { Omit } from '../typings';

export interface MyAction<TPayload, TError extends Error = Error> extends Action {
  payload?: TPayload;
  cancelId?: string;
  undoId?: string;
  error?: TError;
}

export type CancelAction = Omit<MyAction<{}>, 'payload' | 'undoId' | 'error'>;
export type ErrorAction<T extends Error> = Omit<MyAction<{}, T>, 'payload' | 'cancelId' | 'undoId'>
export type UndoAction = Omit<MyAction<{}>, 'payload' | 'cancelId' | 'error'>;

export interface SingleEventSagaConfiguration<TPayload, TResult, TUndoPayload = TPayload> {
  takeEvery: ActionType | Predicate<MyAction<TPayload>>;
  cancelActionType?: string;

  loadingAction: () => Action;
  commitAction: (payload: TResult | TPayload) => MyAction<TPayload | TResult>;
  successAction: (payload?: TResult) => MyAction<TResult>;
  errorAction: <TError extends Error>(err: TError) => ErrorAction<TError>;

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
    'takeEvery' | 'cancelActionType'
  >;

export interface ObservableSagaConfiguration<TResult> {
  subscribe: ActionType | Predicate<Action>;
  cancelActionType?: string;

  observable: Observable<TResult>;
  notifyIsActiveAction: () => Action;
  nextAction: (payload: TResult) => MyAction<TResult>;
  doneAction: () => Action;
  errorAction: <TError extends Error>(err: TError) => MyAction<{}, TError>;

  timeout?: number;
}

export type ObservableSagaHandlerConfiguration<TResult> =
  Omit<ObservableSagaConfiguration<TResult>, 'subscribe' | 'cancelActionType'>;
