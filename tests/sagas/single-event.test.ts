import { Action } from 'redux';
import { SagaIterator } from 'redux-saga';
import { call, put } from 'redux-saga/effects';
import { expectSaga } from 'redux-saga-test-plan';
import { createSingleEventSaga, createSingleEventSagaHandler } from '../../src/sagas/single-event';
import { SingleEventSagaHandlerConfiguration, MyAction } from '../../src/sagas/typings';

describe('single event saga factory test', () => {

  let emptyHandlerConfig: SingleEventSagaHandlerConfiguration<{}, string[]>;
  let nonEmptyHandlerConfig: SingleEventSagaHandlerConfiguration<{ data: string }, string[]>;

  beforeAll(() => {
    emptyHandlerConfig = {
      loadingAction: () => ({ type: 'LOADING' }),
      commitAction: payload => ({ type: 'COMMIT', payload }),
      successAction: payload => ({ type: 'SUCCESS', payload }),
      errorAction: error => ({ type: 'ERROR', error }),
      action: () => ({ data: [ 'hello', 'there' ] })
    };

    nonEmptyHandlerConfig = {
      loadingAction: () => ({ type: 'LOADING' }),
      commitAction: payload => ({ type: 'COMMIT', payload }),
      successAction: payload => ({ type: 'SUCCESS', payload }),
      errorAction: error => ({ type: 'ERROR', error }),
      action: () => ({ data: [ 'hello', 'there' ] })
    };
  });

  it('should have a module', () => {
    expect(createSingleEventSaga).toBeDefined();
  });

  describe('createSingleEventSaga tests', () => {

    it('should dispatch the forking action', () => {
      const watcher = createSingleEventSaga({
        takeEvery: 'REQUEST',
        ...emptyHandlerConfig
      });

      const expectedFirstActionInForkedSaga = { type: 'LOADING' };

      return expectSaga(watcher)
        .put(expectedFirstActionInForkedSaga)
        .dispatch({ type: 'REQUEST' })
        .silentRun();
    });

    it('should allow cancelling actions manually', () => {
      const watcher = createSingleEventSaga({
        takeLatest: 'REQUEST',
        ...emptyHandlerConfig,
        action: () => new Promise((resolve) => setTimeout(() => resolve(), 50)),
        cancelActionType: 'CANCEL'
      });

      return expectSaga(watcher)
        .put({ type: 'ERROR', error: new Error('Action cancelled') })
        .dispatch({ type: 'REQUEST' })
        .delay(30)
        .dispatch({ type: 'CANCEL' })
        .silentRun();
    });

    it('should undo upon cancellation', () => {
      const watcher = createSingleEventSaga({
        takeLatest: 'REQUEST',
        ...emptyHandlerConfig,
        action: () => new Promise((resolve) => setTimeout(() => resolve(), 50)),
        cancelActionType: 'CANCEL',
        undoAction: () => ({ type: 'UNDO' })
      });

      return expectSaga(watcher)
        .put({ type: 'ERROR', error: new Error('Action cancelled') })
        .put({ type: 'UNDO' })
        .dispatch({ type: 'REQUEST' })
        .delay(30)
        .dispatch({ type: 'CANCEL' })
        .silentRun();
    });

    it('should not undo upon cancellation', () => {
      const watcher = createSingleEventSaga({
        takeLatest: 'REQUEST',
        ...emptyHandlerConfig,
        action: () => new Promise((resolve) => setTimeout(() => resolve(), 50)),
        cancelActionType: 'CANCEL',
        undoOnError: false,
        undoAction: () => ({ type: 'UNDO' })
      });

      return expectSaga(watcher)
        .put({ type: 'ERROR', error: new Error('Action cancelled') })
        .not.put({ type: 'UNDO' })
        .dispatch({ type: 'REQUEST' })
        .delay(30)
        .dispatch({ type: 'CANCEL' })
        .silentRun();
    });

    it('should throw when not provided a forking action', () => {
      expect(() => createSingleEventSaga({ } as any))
        .toThrow();
    });

    it('should throw when provided two forking actions', () => {
      expect(() => createSingleEventSaga({
        takeEvery: 'REQUEST',
        takeLatest: 'REQUEST'
      } as any))
        .toThrow();
    });

  });

  describe('createSingleEventSagaHandler tests', () => {

    it('should have the following behavior in normal cases', () => {
      const requestAction: Action = { type: 'REQUEST' };
      const fakeData = { data: [ 'hello', 'there' ] };
      const handler = createSingleEventSagaHandler(emptyHandlerConfig);

      return expectSaga(handler, requestAction)
        .provide([
          [ call(emptyHandlerConfig.action, null), fakeData ]
        ])
        .put({ type: 'LOADING' })
        .put({ type: 'COMMIT', payload: fakeData })
        .put({ type: 'SUCCESS', payload: fakeData })
        .run();
    });

    it('should commit args when running after commit', () => {
      const requestAction: MyAction<{ data: string }> = { type: 'REQUEST', payload: { data: 'We\'re clones!' } };
      const fakeData = { data: [ 'hello', 'there' ] };
      const handler = createSingleEventSagaHandler({
        ...emptyHandlerConfig,
        runAfterCommit: true
      });

      return expectSaga(handler, requestAction)
        .put({ type: 'LOADING' })
        .put({ type: 'COMMIT', payload: requestAction.payload })
        .put({ type: 'SUCCESS', payload: fakeData })
        .run();
    });

    it('should call the action with the action\'s payload as args', () => {
      const requestAction: MyAction<{ data: string }> = { type: 'REQUEST', payload: { data: 'We\'re clones!' } };
      const fakeData = { data: [ 'hello', 'there' ] };
      const handler = createSingleEventSagaHandler({
        ...emptyHandlerConfig,
      });

      return expectSaga(handler, requestAction)
        .put({ type: 'LOADING' })
        .call(emptyHandlerConfig.action, requestAction.payload)
        .put({ type: 'COMMIT', payload: fakeData })
        .put({ type: 'SUCCESS', payload: fakeData })
        .run();
    });

    it('should process arguments before running the action', () => {
      const requestAction: MyAction<{ data: string }> = { type: 'REQUEST', payload: { data: 'We\'re clones!' } };
      const handler = createSingleEventSagaHandler({
        ...nonEmptyHandlerConfig,
        beforeAction: function* (args): SagaIterator {
          yield put({ type: 'PROCESSING_ARGS', payload: { ...args } });
          return { data: 'We fight, we win!' };
        }
      });

      return expectSaga(handler, requestAction)
        .put({ type: 'PROCESSING_ARGS', payload: requestAction.payload })
        .call(nonEmptyHandlerConfig.action, { data: 'We fight, we win!' })
        .run();
    });

    it('should process result after running the action', () => {
      const requestAction: MyAction<{ data: string }> = { type: 'REQUEST', payload: { data: 'We\'re clones!' } };
      const fakeData = { data: [ 'hello', 'there' ] };
      const handler = createSingleEventSagaHandler({
        ...nonEmptyHandlerConfig,
        afterAction: function* (res): SagaIterator {
          yield put({ type: 'PROCESSING_RESULT', payload: { ...res } });
          return { data: [ 'general', 'kenobi' ] };
        }
      });

      return expectSaga(handler, requestAction)
        .put({ type: 'PROCESSING_RESULT', payload: fakeData })
        .put({ type: 'COMMIT', payload: { data: [ 'general', 'kenobi' ] } })
        .run();
    });

    it('should allow processing result using args as parameter after running action', () => {
      const requestAction: MyAction<{ data: string }> = { type: 'REQUEST', payload: { data: 'We\'re clones!' } };
      const fakeData = { data: [ 'hello', 'there' ] };
      const handler = createSingleEventSagaHandler({
        ...nonEmptyHandlerConfig,
        afterAction: function* (res, args): SagaIterator {
          yield put({ type: 'PROCESSING_RESULT', payload: { res, args } });
          return { data: [ 'general', 'kenobi' ] };
        }
      });

      return expectSaga(handler, requestAction)
        .put({ type: 'PROCESSING_RESULT', payload: { res: fakeData, args: requestAction.payload } })
        .put({ type: 'COMMIT', payload: { data: [ 'general', 'kenobi' ] } })
        .run();
    });

    it('should allow retrying of the action', () => {
      let retryCount = 3;
      const requestAction: Action = { type: 'REQUEST' };
      const handler = createSingleEventSagaHandler({
        ...emptyHandlerConfig,
        action: () => {
          return new Promise((resolve, reject) => {
            if (retryCount > 0) {
              retryCount--;
              reject(new Error('Hehe'));
            } else {
              resolve();
            }
          });
        },
        retry: 3
      });

      return expectSaga(handler, requestAction)
        .put({ type: 'COMMIT', payload: undefined })
        .run();
    });

    it('should give the user 120ms to undo their action', () => {
      const requestAction: Action = { type: 'REQUEST' };
      const handler = createSingleEventSagaHandler({
        ...emptyHandlerConfig,
        runAfterCommit: true,
        undoThreshold: 120,
        undoActionType: 'REQUEST_UNDO',
        undoAction: () => ({ type: 'UNDO' })
      });

      return expectSaga(handler, requestAction)
        .delay(80)
        .dispatch({ type: 'REQUEST_UNDO' })
        .put({ type: 'UNDO' })
        .not.put({ type: 'SUCCESS' })
        .run();
    });

    it('should commit after having given the user 120ms to undo their action', () => {
      const requestAction: Action = { type: 'REQUEST' };
      const handler = createSingleEventSagaHandler({
        ...emptyHandlerConfig,
        runAfterCommit: true,
        undoThreshold: 120,
        undoActionType: 'REQUEST_UNDO',
        undoAction: () => ({ type: 'UNDO' })
      });

      return expectSaga(handler, requestAction)
        .not.put({ type: 'UNDO' })
        .put({ type: 'COMMIT', payload: undefined })
        .run();
    });

    it('should not take the undo action after 120ms', () => {
      const requestAction: Action = { type: 'REQUEST' };
      const handler = createSingleEventSagaHandler({
        ...emptyHandlerConfig,
        runAfterCommit: true,
        undoThreshold: 120,
        undoActionType: 'REQUEST_UNDO',
        undoAction: () => ({ type: 'UNDO' })
      });

      return expectSaga(handler, requestAction)
        .delay(140)
        .dispatch({ type: 'REQUEST_UNDO' })
        .not.put({ type: 'UNDO' })
        .put({ type: 'COMMIT', payload: undefined })
        .run();
    });

    it('should process the undo payload after loading', () => {
      const requestAction: MyAction<{ data: string }> = { type: 'REQUEST', payload: { data: 'Hello' } };
      const handler = createSingleEventSagaHandler({
        ...nonEmptyHandlerConfig,
        runAfterCommit: true,
        undoThreshold: 120,
        undoActionType: 'REQUEST_UNDO',
        undoAction: (payload) => ({ type: 'UNDO', payload }),
        undoPayloadBuilder: function* (): SagaIterator { return { data: 'Bye' } }
      });

      return expectSaga(handler, requestAction)
        .delay(80)
        .dispatch({ type: 'REQUEST_UNDO' })
        .put({ type: 'UNDO', payload: { data: 'Bye' } })
        .run();
    });

    it('should undo on error', () => {
      const requestAction: Action = { type: 'REQUEST' };
      const handler = createSingleEventSagaHandler({
        ...emptyHandlerConfig,
        action: () => { throw new Error('Harry Potter is dead!') },
        undoAction: () => ({ type: 'UNDO' })
      });

      return expectSaga(handler, requestAction)
        .put({ type: 'ERROR', error: new Error('Harry Potter is dead!') })
        .put({ type: 'UNDO' })
        .run();
    });

    it('should not undo on error', () => {
      const requestAction: Action = { type: 'REQUEST' };
      const handler = createSingleEventSagaHandler({
        ...emptyHandlerConfig,
        action: () => { throw new Error('Harry Potter is dead!') },
        undoOnError: false,
        undoAction: () => ({ type: 'UNDO' })
      });

      return expectSaga(handler, requestAction)
        .put({ type: 'ERROR', error: new Error('Harry Potter is dead!') })
        .not.put({ type: 'UNDO' })
        .run();
    });

    it('should undo for the undoId is equal', () => {
      const requestAction: Action = { type: 'REQUEST' };
      const handler = createSingleEventSagaHandler({
        ...emptyHandlerConfig,
        runAfterCommit: true,
        undoThreshold: 120,
        undoActionType: 'REQUEST_UNDO',
        undoId: '1577158118',
        undoAction: () => ({ type: 'UNDO' })
      });

      return expectSaga(handler, requestAction)
        .delay(80)
        .dispatch({ type: 'REQUEST_UNDO', undoId: '1577158118' })
        .put({ type: 'UNDO' })
        .not.put({ type: 'SUCCESS', payload: { data: [ 'hello', 'there' ] } })
        .run();
    });

    it('should not undo for the undoId is different', () => {
      const requestAction: Action = { type: 'REQUEST' };
      const handler = createSingleEventSagaHandler({
        ...emptyHandlerConfig,
        runAfterCommit: true,
        undoThreshold: 120,
        undoActionType: 'REQUEST_UNDO',
        undoId: '1577158118',
        undoAction: () => ({ type: 'UNDO' })
      });

      return expectSaga(handler, requestAction)
        .delay(80)
        .dispatch({ type: 'REQUEST_UNDO', undoId: '3783787042' })
        .not.put({ type: 'UNDO' })
        .put({ type: 'SUCCESS', payload: { data: [ 'hello', 'there' ] } })
        .run();
    });

    it('should not resolve in time', () => {
      let retryCount = 4;
      const requestAction: Action = { type: 'REQUEST' };
      const handler = createSingleEventSagaHandler({
        ...emptyHandlerConfig,
        action: () => {
          return new Promise((resolve, reject) => {
            if (retryCount > 0) {
              retryCount--;
              reject(new Error('Hehe'));
            } else {
              resolve();
            }
          });
        },
        retry: 3
      });

      return expectSaga(handler, requestAction)
        .put({ type: 'ERROR', error: new Error('Hehe') })
        .run();
    });

    it('should timeout after 100ms of waiting', () => {
      const requestAction: Action = { type: 'REQUEST' };
      const handler = createSingleEventSagaHandler({
        ...emptyHandlerConfig,
        action: () => new Promise((resolve) => setTimeout(() => resolve(), 130)),
        timeout: 100
      });

      return expectSaga(handler, requestAction)
        .put({ type: 'LOADING' })
        .delay(110)
        .put({ type: 'ERROR', error: new Error('Action timed out') })
        .run();
    });

    it('should handle errors properly', () => {
      const requestAction: Action = { type: 'REQUEST' };
      const handler = createSingleEventSagaHandler({
        ...emptyHandlerConfig,
        action: () => { throw new Error('Harry Potter is dead!') }
      });

      return expectSaga(handler, requestAction)
        .put({ type: 'LOADING' })
        .put({ type: 'ERROR', error: new Error('Harry Potter is dead!') })
        .run();
    });

  });

})
