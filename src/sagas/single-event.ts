import isUndefined from 'lodash/isUndefined';
import negate from 'lodash/negate';
import { SagaIterator, Task } from 'redux-saga';
import { cancel, takeEvery, takeLatest, put, race, call, delay, cancelled } from 'redux-saga/effects';
import { Omit, MyAction, SingleEventSagaConfiguration, SingleEventSagaHandlerConfiguration } from './typings';

const ONE_SECOND = 1000;
const ONE_MINUTE = 60 * ONE_SECOND;
const ONE_HOUR = 60 * ONE_MINUTE;

const MAX_TIMEOUT = ONE_HOUR;
const isDefined = negate(isUndefined);

export function createSingleEventSaga<T, R>({
  takeEvery: takeEveryActionType,
  takeLatest: takeLatestActionType,
  cancelActionType,
  ...handlerConfig
}: SingleEventSagaConfiguration<T, R>) {
  if (isDefined(takeEveryActionType) && isDefined(takeLatestActionType))
    throw new Error('Using takeEvery and takeLatest in the same watcher is not possible');

  if (isUndefined(takeEveryActionType) && isUndefined(takeLatestActionType))
    throw new Error('Not listening to any actions is unsupported (not to mention useless...)');

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

export function createSingleEventSagaHandler<T, R, A extends MyAction<T>>({
  loadingAction,
  beforeAction = function* (args): SagaIterator { return args; },
  action,
  timeout: to = MAX_TIMEOUT,
  retry = 0,
  afterAction = function* (args): SagaIterator { return args; },
  runAfterCommit: shouldRunAfterCommit = false,
  commitAction,
  successAction,
  errorAction
}: SingleEventSagaHandlerConfiguration<T, R>) {
  function* runAction(args: Omit<A, 'type'>): SagaIterator {
    try {
      const processedArgs = yield* beforeAction(args.payload);

      const { result, timeout } = yield race({
        result: call(action, processedArgs),
        timeout: delay(to)
      });

      if (timeout)
        throw new Error('Action timed out');

      const processedResult: R = yield* afterAction(result, args.payload);

      return processedResult;
    } catch (err) {
      if (retry > 0) {
        retry--;
        yield* runAction(args);
      } else
        throw err;
    }
  }

  return function* handler({ type, ...args }: A): SagaIterator {
    try {
      let result: R;
      yield put(loadingAction());

      if (!shouldRunAfterCommit)
        result = yield* runAction(args);

      yield put(commitAction(result! || args.payload!));

      if (shouldRunAfterCommit)
        result = yield* runAction(args);

      yield put(successAction(result!));
    } catch (err) {
      yield put(errorAction(err));
    } finally {
      if (yield cancelled())
        yield put(errorAction(new Error('Action cancelled')));
    }
  }
}
