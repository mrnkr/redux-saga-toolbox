import { PromiseQueue } from '@mrnkr/promise-queue';
import { SagaIterator } from 'redux-saga';
import { cancel, cancelled, take, spawn, race, call, delay, fork, put } from 'redux-saga/effects';

import {
  ObservableSagaConfiguration,
  ObservableSagaHandlerConfiguration,
  MyAction,
  CancelAction,
} from './typings';
import { MAX_TIMEOUT } from './vars';

export function createObservableSaga<TResult>(
  config: ObservableSagaConfiguration<TResult>,
) {
  const { subscribe, cancelActionType, ...handlerConfig } = config;

  function* subscription(action: MyAction<TResult>): SagaIterator {
    const handler = createObservableSagaHandler(handlerConfig);
    const task = yield fork(handler);

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
      const action = yield take(subscribe);
      yield spawn(subscription, action);
    }
  };
}

export function createObservableSagaHandler<TResult>({
  observable,
  notifyIsActiveAction,
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

    const { value, done } = nextValue;

    if (done) {
      return;
    }

    yield fork(handleValue, value);
  }

  return function* handler(): SagaIterator {
    try {
      yield put(notifyIsActiveAction());

      while (!queue.isComplete) {
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
