import { BehaviorSubject } from 'rxjs';
import { createObservableSaga, createObservableSagaHandler } from '../../src/sagas/observable';
import {
  ObservableSagaHandlerConfiguration,
} from '../../src/sagas/typings';
import { expectSaga } from 'redux-saga-test-plan';

describe('observable saga tests', () => {

  let happyHandlerConfig: ObservableSagaHandlerConfiguration<number>;
  let handlerWithErrorConfig: ObservableSagaHandlerConfiguration<number>;
  let handlerWithTimeout: ObservableSagaHandlerConfiguration<number>;

  beforeEach(() => {
    let i = 0;
    const behaviorSubject = new BehaviorSubject<number>(i);

    const interval = setInterval(
      () => {
        if (i < 10) {
          i = i + 1;
          behaviorSubject.next(i);
        } else {
          clearInterval(interval);
          behaviorSubject.complete();
        }
      },
      2,
    );

    happyHandlerConfig = {
      observable: behaviorSubject.asObservable(),
      notifyIsActiveAction: () => ({ type: 'MARK_AS_ACTIVE' }),
      nextAction: val => ({ type: 'NEXT', payload: val }),
      doneAction: () => ({ type: 'DONE' }),
      errorAction: error => ({ error, type: 'ERROR' }),
    };
  });

  beforeEach(() => {
    let i = 0;
    const behaviorSubject = new BehaviorSubject<number>(i);

    const interval = setInterval(
      () => {
        if (i < 6) {
          i = i + 1;
          behaviorSubject.next(i);
        } else {
          clearInterval(interval);
          behaviorSubject.error(Error('Hehe'));
        }
      },
      2,
    );

    handlerWithErrorConfig = {
      observable: behaviorSubject.asObservable(),
      notifyIsActiveAction: () => ({ type: 'MARK_AS_ACTIVE' }),
      nextAction: val => ({ type: 'NEXT', payload: val }),
      doneAction: () => ({ type: 'DONE' }),
      errorAction: error => ({ error, type: 'ERROR' }),
    };
  });

  beforeEach(() => {
    const behaviorSubject = new BehaviorSubject<number>(0);

    setTimeout(
      () => {
        behaviorSubject.next(1);

        setTimeout(
          () => {
            behaviorSubject.next(3);
          },
          120,
        );
      },
      60,
    );

    handlerWithTimeout = {
      observable: behaviorSubject.asObservable(),
      notifyIsActiveAction: () => ({ type: 'MARK_AS_ACTIVE' }),
      nextAction: val => ({ type: 'NEXT', payload: val }),
      doneAction: () => ({ type: 'DONE' }),
      errorAction: error => ({ error, type: 'ERROR' }),
      timeout: 80,
    };
  });

  it('should have a module', () => {
    expect(createObservableSaga).toBeDefined();
  });

  describe('createObservableSaga tests', () => {

    it('should dispatch the forking action', () => {
      const watcher = createObservableSaga({
        subscribe: 'SUBSCRIBE',
        ...happyHandlerConfig,
      });

      return expectSaga(watcher)
        .dispatch({ type: 'SUBSCRIBE' })
        .put({ type: 'MARK_AS_ACTIVE' })
        .put({ type: 'NEXT', payload: 2 })
        .put({ type: 'DONE' })
        .not.put({ type: 'ERROR' })
        .silentRun();
    });

    it('should allow for manual cancellation', () => {
      const watcher = createObservableSaga({
        subscribe: 'SUBSCRIBE',
        cancelActionType: 'CANCEL',
        ...happyHandlerConfig,
      });

      return expectSaga(watcher)
        .dispatch({ type: 'SUBSCRIBE' })
        .delay(10)
        .dispatch({ type: 'CANCEL' })
        .put({ type: 'MARK_AS_ACTIVE' })
        .put({ type: 'NEXT', payload: 2 })
        .not.put({ type: 'NEXT', payload: 7 })
        .put({ type: 'ERROR', error: Error('Action cancelled') })
        .not.put({ type: 'DONE' })
        .silentRun();
    });

    it('should cancel for the cancelId is a match', () => {
      const watcher = createObservableSaga({
        subscribe: 'SUBSCRIBE',
        cancelActionType: 'CANCEL',
        ...happyHandlerConfig,
      });

      return expectSaga(watcher)
        .put({ type: 'ERROR', error: Error('Action cancelled') })
        .dispatch({ type: 'SUBSCRIBE', cancelId: '0462318473' })
        .delay(10)
        .dispatch({ type: 'CANCEL', cancelId: '0462318473' })
        .silentRun();
    });

    it('should not cancel for the cancelId is not a match', () => {
      const watcher = createObservableSaga({
        subscribe: 'SUBSCRIBE',
        cancelActionType: 'CANCEL',
        ...happyHandlerConfig,
      });

      return expectSaga(watcher)
        .not.put({ type: 'ERROR', error: Error('Action cancelled') })
        .dispatch({ type: 'SUBSCRIBE', cancelId: '0462318473' })
        .delay(10)
        .dispatch({ type: 'CANCEL', cancelId: '3783787042' })
        .silentRun();
    });

    it('should be able to run after having been cancelled', () => {
      const watcher = createObservableSaga({
        subscribe: 'SUBSCRIBE',
        cancelActionType: 'CANCEL',
        ...happyHandlerConfig,
      });

      return expectSaga(watcher)
        .dispatch({ type: 'SUBSCRIBE' })
        .delay(4)
        .dispatch({ type: 'CANCEL' })
        .delay(8)
        .dispatch({ type: 'SUBSCRIBE' })
        .put({ type: 'ERROR', error: Error('Action cancelled') })
        .put({ type: 'NEXT', payload: 8 })
        .put({ type: 'DONE' })
        .silentRun();
    });

  });

  describe('createObservableSagaHandler tests', () => {

    it('should have the following behavior in normal cases', () => {
      const handler = createObservableSagaHandler(happyHandlerConfig);

      return expectSaga(handler)
        .put({ type: 'MARK_AS_ACTIVE' })
        .put({ type: 'NEXT', payload: 1 })
        .put({ type: 'NEXT', payload: 9 })
        .not.put({ type: 'ERROR' })
        .put({ type: 'DONE' })
        .silentRun();
    });

    it('should handle errors', () => {
      const handler = createObservableSagaHandler(handlerWithErrorConfig);

      return expectSaga(handler)
        .put({ type: 'MARK_AS_ACTIVE' })
        .put({ type: 'NEXT', payload: 3 })
        .not.put({ type: 'NEXT', payload: 8 })
        .put({ type: 'ERROR', error: Error('Hehe') })
        .not.put({ type: 'DONE' })
        .silentRun();
    });

    it('should handle user defined timeout', () => {
      const handler = createObservableSagaHandler(handlerWithTimeout);

      return expectSaga(handler)
        .put({ type: 'MARK_AS_ACTIVE' })
        .put({ type: 'NEXT', payload: 1 })
        .put({
          type: 'ERROR',
          error: Error('Observable has been inactive for longer than 80ms and has been cancelled'),
        })
        .not.put({ type: 'NEXT', payload: 3 })
        .not.put({ type: 'DONE' })
        .not.put({ type: 'ERROR', error: Error('Action cancelled') })
        .silentRun();
    });

  });

});
