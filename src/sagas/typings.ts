import { Action } from 'redux';
import { ActionType, Predicate } from '@redux-saga/types';

import { SagaIterator } from '../typings';

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
  undoPayloadBuilder?: (args?: TPayload) => SagaIterator<TUndoPayload>;

  beforeAction?: (args?: TPayload) => SagaIterator<any>;
  afterAction?: (res: any, args?: TPayload) => SagaIterator<TResult>;

  action: (args?: any) => any;

  silent?: boolean;
}

export type SingleEventSagaHandlerConfiguration<TPayload, TResult, TUndoPayload = TPayload> =
  Omit<
    SingleEventSagaConfiguration<TPayload, TResult, TUndoPayload>,
    'takeEvery' | 'cancelActionType'
  >;
