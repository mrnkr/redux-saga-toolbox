import { SagaIterator, Task } from 'redux-saga';
import { cancel, takeEvery, takeLatest, put, race, call, delay, cancelled, take } from 'redux-saga/effects';
import { assertValidConfig } from './validation';
import { Omit, MyAction, SingleEventSagaConfiguration, SingleEventSagaHandlerConfiguration, UndoAction } from './typings';

const ONE_SECOND = 1000;
const ONE_MINUTE = 60 * ONE_SECOND;
const ONE_HOUR = 60 * ONE_MINUTE;

const MAX_TIMEOUT = ONE_HOUR;

export function createSingleEventSaga<TPayload, TResult>(config: SingleEventSagaConfiguration<TPayload, TResult>) {
  assertValidConfig(config);

  const {
    takeEvery: takeEveryActionType,
    takeLatest: takeLatestActionType,
    cancelActionType,
    ...handlerConfig
  } = config;

  let task: Task;
  const handler = createSingleEventSagaHandler(handlerConfig);

  function* cancelSaga() {
    yield cancel(task);
  }

  return function* watcher(): SagaIterator {
    if (takeEveryActionType)
      task = yield takeEvery(takeEveryActionType, handler);

    if (takeLatestActionType)
      task = yield takeLatest(takeLatestActionType, handler);

    if (cancelActionType)
      yield takeLatest(cancelActionType, cancelSaga);
  }
}

export function createSingleEventSagaHandler<TPayload, TResult, TAction extends MyAction<TPayload>>({
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
  errorAction
}: SingleEventSagaHandlerConfiguration<TPayload, TResult>) {
  function* runAction(args: Omit<TAction, 'type'>): SagaIterator {
    try {
      const processedArgs = yield* beforeAction(args.payload);

      const { result, timeout } = yield race({
        result: call(action, processedArgs),
        timeout: delay(to)
      });

      if (timeout)
        throw new Error('Action timed out');

      const processedResult: TResult = yield* afterAction(result, args.payload);

      return processedResult;
    } catch (err) {
      if (retry > 0) {
        retry--;
        yield* runAction(args);
      } else
        throw err;
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
            (args.undoId ? action.undoId === args.undoId : true)
          )
        });

        if (undo)
          yield put(undoAction(undoPayload));

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
      if (undoOnError)
        yield put(undoAction(undoPayload!));
    } finally {
      if (yield cancelled()) {
        yield put(errorAction(new Error('Action cancelled')));
        if (undoOnError)
          yield put(undoAction(undoPayload!));
      }

    }
  }
}
