import { SagaIterator } from 'redux-saga';
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
  MyAction,
  SingleEventSagaConfiguration,
  SingleEventSagaHandlerConfiguration,
  UndoAction,
  CancelAction,
} from './typings';
import { Omit } from '../typings';
import { MAX_TIMEOUT } from './vars';

export function createSingleEventSaga<TPayload, TResult, TAction extends MyAction<TPayload>>(
  config: SingleEventSagaConfiguration<TPayload, TResult>,
) {
  assertValidConfig(config);

  const {
    takeEvery: takeActionType,
    cancelActionType,
    ...handlerConfig
  } = config;

  function* subscription(action: TAction): SagaIterator {
    const handler = createSingleEventSagaHandler(handlerConfig);
    const task = yield fork(handler, action);

    if (cancelActionType) {
      yield take((a: CancelAction) =>
        a.type === cancelActionType &&
        (action.cancelId ? action.cancelId === a.cancelId : true),
      );
      yield cancel(task);
    }
  }

  return function* watcher(): SagaIterator {
    /* istanbul ignore next */
    while (true) {
      const action = yield take(takeActionType);
      yield spawn(subscription, action);
    }
  };
}

export function createSingleEventSagaHandler
<TPayload, TResult, TAction extends MyAction<TPayload>>({
  loadingAction,
  beforeAction = function* (args): SagaIterator { return args; },
  action,
  timeout: to = MAX_TIMEOUT,
  retry = 0,
  afterAction = function* (args): SagaIterator { return args; },
  runAfterCommit: shouldRunAfterCommit = false,
  undoThreshold = 0,
  undoActionType = '_',
  undoPayloadBuilder: buildUndoPayload = function* (args): SagaIterator { return args; },
  undoAction = () => ({ type: '_' }),
  undoOnError = true,
  commitAction,
  successAction,
  errorAction,
}: SingleEventSagaHandlerConfiguration<TPayload, TResult>) {
  let retryCount = retry;

  function* runAction(args: Omit<TAction, 'type'>): SagaIterator {
    try {
      const processedArgs = yield* beforeAction(args.payload);

      const { result, timeout } = yield race({
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

  return function* handler({ type, ...args }: TAction): SagaIterator {
    let undoPayload: TPayload;

    try {
      let result: TResult;
      yield put(loadingAction());
      undoPayload = yield* buildUndoPayload(args.payload);

      if (shouldRunAfterCommit) {
        yield put(commitAction(args.payload!));

        const { commit, undo } = yield race({
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
          result = yield* runAction(args);
          yield put(successAction(result));
        }
      }

      if (!shouldRunAfterCommit) {
        result = yield* runAction(args);
        yield put(commitAction(result));
        yield put(successAction(result));
      }
    } catch (err) {
      yield put(errorAction(err));
      if (undoOnError) {
        yield put(undoAction(undoPayload!));
      }
    } finally {
      if (yield cancelled()) {
        yield put(errorAction(Error('Action cancelled')));
        if (undoOnError) {
          yield put(undoAction(undoPayload!));
        }
      }
    }
  };
}
