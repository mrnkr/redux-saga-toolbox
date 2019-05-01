import isUndefined from 'lodash/isUndefined';
import negate from 'lodash/negate';
import { SagaIterator } from 'redux-saga';
import { Effect, cancel, takeEvery, takeLatest, put, race, call, delay } from 'redux-saga/effects';
import { MyAction, SingleEventSagaConfiguration, SingleEventSagaHandlerConfiguration } from './typings';

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

  let task: any;
  const handler = createSingleEventSagaHandler(handlerConfig);

  function* cancelSaga(): Iterable<Effect> {
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
  timeout: to = Number.MAX_SAFE_INTEGER,
  afterAction = function* (args): SagaIterator { return args; },
  runAfterCommit: shouldRunAfterCommit = false,
  commitAction,
  successAction,
  errorAction
}: SingleEventSagaHandlerConfiguration<T, R>) {
  function* runAction(args: Pick<A, Exclude<keyof A, 'type'>>): SagaIterator {
    const processedArgs = yield* beforeAction(args.payload!);

    const { result, timeout } = yield race({
      result: call(action, processedArgs),
      timeout: delay(to)
    });

    if (timeout)
      throw new Error('Action timed out');

    const processedResult: R = yield* afterAction(result);

    return processedResult;
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
    }
  }
}
