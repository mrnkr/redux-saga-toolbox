import { Task } from 'redux-saga';
import {
  cancel,
  take,
  spawn,
  fork,
  put,
  race,
  call,
  delay,
  cancelled,
} from 'redux-saga/effects';

import { assertValidConfig } from './validation';
import {
  PayloadAction,
  SingleEventSagaConfiguration,
  SingleEventSagaHandlerConfiguration,
  UndoAction,
  CancelAction,
} from './typings';
import { SagaIterator } from '../typings';
import { MAX_TIMEOUT } from './vars';

export function createSingleEventSaga<TPayload, TResult, TAction extends PayloadAction<TPayload>>(
  config: SingleEventSagaConfiguration<TPayload, TResult>,
) {
  assertValidConfig(config);

  const {
    takeEvery: takeActionType,
    cancelActionType,
    ...handlerConfig
  } = config;

  function* subscription(action: TAction): SagaIterator<void> {
    const handler = createSingleEventSagaHandler(handlerConfig);
    const task: unknown = yield fork(handler, action);

    if (cancelActionType) {
      yield take((a: CancelAction) =>
        a.type === cancelActionType &&
        (action.cancelId ? action.cancelId === a.cancelId : true),
      );
      yield cancel(task as Task);
    }
  }

  return function* watcher(): SagaIterator<void> {
    /* istanbul ignore next */
    while (true) {
      const action: unknown = yield take(takeActionType);
      yield spawn(subscription, action as TAction);
    }
  };
}

export function createSingleEventSagaHandler
<TPayload, TResult, TAction extends PayloadAction<TPayload>>({
  loadingAction,
  beforeAction = function* (args: any): SagaIterator<any> { return args; },
  action,
  timeout: to = MAX_TIMEOUT,
  retry = 0,
  afterAction = function* (args: any): SagaIterator<any> { return args; },
  runAfterCommit: shouldRunAfterCommit = false,
  undoThreshold = 0,
  undoActionType = '_',
  undoPayloadBuilder: buildUndoPayload = function* (args: any): SagaIterator<any> { return args; },
  undoAction = () => ({ type: '_' }),
  undoOnError = true,
  commitAction,
  successAction,
  errorAction,
}: SingleEventSagaHandlerConfiguration<TPayload, TResult>) {
  let retryCount = retry;

  function* runAction(args: Omit<TAction, 'type'>): SagaIterator<TResult | void> {
    try {
      const processedArgs = yield* beforeAction(args.payload);

      const { result, timeout }: any = yield race({
        result: call(action, processedArgs),
        timeout: delay(to),
      });

      if (timeout) {
        throw Error('Action timed out');
      }

      const processedResult: TResult = yield* afterAction(result, args.payload);

      return processedResult;
    } catch (err) {
      if (retryCount > 0) {
        retryCount = retryCount - 1;
        yield* runAction(args);
      } else {
        throw err;
      }
    }
  }

  return function* handler({ type, ...args }: TAction): SagaIterator<void> {
    let undoPayload: TPayload;

    try {
      let result: TResult;
      yield put(loadingAction());
      undoPayload = yield* buildUndoPayload(args.payload);

      if (shouldRunAfterCommit) {
        yield put(commitAction(args.payload!));

        const { commit, undo }: any = yield race({
          commit: delay(undoThreshold),
          undo: take((action: UndoAction) =>
            action.type === undoActionType &&
            (args.undoId ? action.undoId === args.undoId : true),
          ),
        });

        if (undo) {
          yield put(undoAction(undoPayload));
        }

        if (commit) {
          result = (yield* runAction(args)) as TResult;
          yield put(successAction(result));
        }
      }

      if (!shouldRunAfterCommit) {
        result = (yield* runAction(args)) as TResult;
        yield put(commitAction(result));
        yield put(successAction(result));
      }
    } catch (err) {
      yield put(errorAction(err));
      if (undoOnError) {
        yield put(undoAction(undoPayload!));
      }
    } finally {
      if ((yield cancelled()) as any) {
        yield put(errorAction(Error('Action cancelled')));
        if (undoOnError) {
          yield put(undoAction(undoPayload!));
        }
      }
    }
  };
}
