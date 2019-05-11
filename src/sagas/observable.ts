import { PromiseQueue } from '@mrnkr/promise-queue';
import { SagaIterator, Task } from 'redux-saga';
import { cancel, cancelled, takeLatest, race, call, delay, fork, put } from 'redux-saga/effects';

import { ObservableSagaConfiguration, ObservableSagaHandlerConfiguration } from './typings';
import { MAX_TIMEOUT } from './vars';

export function createObservableSaga<TResult>(
  config: ObservableSagaConfiguration<TResult>,
) {
  const { subscribe, cancelActionType, ...handlerConfig } = config;

  let task: Task;
  const handler = createObservableSagaHandler(handlerConfig);

  function* cancelSaga() {
    yield cancel(task);
  }

  return function* watcher(): SagaIterator {
    task = yield takeLatest(subscribe, handler);

    if (cancelActionType) {
      yield takeLatest(cancelActionType, cancelSaga);
    }
  };
}

export function createObservableSagaHandler<TResult>({
  observable,
  nextAction,
  doneAction,
  errorAction,
  timeout: to = MAX_TIMEOUT,
}: ObservableSagaHandlerConfiguration<TResult>) {
  const queue = new PromiseQueue<TResult>(observable);

  function* handleValue(value: TResult): SagaIterator {
    yield put(nextAction(value));
  }

  function* awaitNextValue(): SagaIterator {
    const { nextValue, timeout } = yield race({
      nextValue: call(queue.next),
      timeout: delay(to),
    });

    if (timeout) {
      const err =
        Error(`Observable has been inactive for longer than ${to}ms and has been cancelled`);
      queue.cancel(err);
      throw err;
    }

    if (nextValue) {
      yield fork(handleValue, nextValue);
    }
  }

  return function* handler(): SagaIterator {
    try {
      /* istanbul ignore next */
      while (true) {
        yield* awaitNextValue();
      }
    } catch (err) {
      yield put(errorAction(err));
    } finally {
      if (queue.isComplete) {
        yield put(doneAction());
      } else if (yield cancelled()) {
        queue.cancel(Error('Action cancelled'));
        yield put(errorAction(Error('Action cancelled')));
      }
    }
  };
}
