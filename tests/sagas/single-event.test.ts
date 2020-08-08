import { Action } from 'redux';
import { call, put } from 'redux-saga/effects';
import { expectSaga } from 'redux-saga-test-plan';
import { SagaIterator } from '../../src/typings';
import { createSingleEventSaga, createSingleEventSagaHandler } from '../../src/sagas/single-event';
import { SingleEventSagaHandlerConfiguration, PayloadAction } from '../../src/sagas/typings';

describe('single event saga factory test', () => {

  type T1 = { data: string };
  let emptyHandlerConfig: SingleEventSagaHandlerConfiguration<{}, { data: string[] }>;
  let nonEmptyHandlerConfig: SingleEventSagaHandlerConfiguration<T1, { data: string[] }>;

  beforeAll(() => {
    emptyHandlerConfig = {
      loadingAction: () => ({ type: 'LOADING' }),
      commitAction: payload => ({ payload, type: 'COMMIT' }),
      successAction: payload => ({ payload, type: 'SUCCESS' }),
      errorAction: error => ({ error, type: 'ERROR' }),
      action: () => ({ data: ['hello', 'there'] }),
      silent: true,
    };

    nonEmptyHandlerConfig = {
      loadingAction: () => ({ type: 'LOADING' }),
      commitAction: payload => ({ payload, type: 'COMMIT' }),
      successAction: payload => ({ payload, type: 'SUCCESS' }),
      errorAction: error => ({ error, type: 'ERROR' }),
      action: () => ({ data: ['hello', 'there'] }),
      silent: true,
    };
  });

  it('should have a module', () => {
    expect(createSingleEventSaga).toBeDefined();
  });

  describe('createSingleEventSaga tests', () => {

    it('should dispatch the forking action', () => {
      const watcher = createSingleEventSaga({
        takeEvery: 'REQUEST',
        ...emptyHandlerConfig,
      });

      const expectedFirstActionInForkedSaga = { type: 'LOADING' };

      return expectSaga(watcher)
        .put(expectedFirstActionInForkedSaga)
        .dispatch({ type: 'REQUEST' })
        .silentRun();
    });

    it('should accept a predicate as its argument', () => {
      const watcher = createSingleEventSaga({
        takeEvery: action => action.type === 'REQUEST',
        ...emptyHandlerConfig,
      });

      const expectedFirstActionInForkedSaga = { type: 'LOADING' };

      return expectSaga(watcher)
        .put(expectedFirstActionInForkedSaga)
        .dispatch({ type: 'REQUEST' })
        .silentRun();
    });

    it('should allow cancelling actions manually', () => {
      const watcher = createSingleEventSaga({
        takeEvery: 'REQUEST',
        ...emptyHandlerConfig,
        action: () => new Promise(resolve => setTimeout(() => resolve(), 50)),
        cancelActionType: 'CANCEL',
      });

      return expectSaga(watcher)
        .put({ type: 'ERROR', error: Error('Action cancelled') })
        .dispatch({ type: 'REQUEST' })
        .delay(30)
        .dispatch({ type: 'CANCEL' })
        .silentRun();
    });

    it('should cancel for the cancelId is a match', () => {
      const watcher = createSingleEventSaga({
        takeEvery: 'REQUEST',
        ...emptyHandlerConfig,
        action: () => new Promise(resolve => setTimeout(() => resolve(), 50)),
        cancelActionType: 'CANCEL',
      });

      return expectSaga(watcher)
        .put({ type: 'ERROR', error: Error('Action cancelled') })
        .dispatch({ type: 'REQUEST', cancelId: '0462318473' })
        .delay(30)
        .dispatch({ type: 'CANCEL', cancelId: '0462318473' })
        .silentRun();
    });

    it('should not cancel for the cancelId is not a match', () => {
      const watcher = createSingleEventSaga({
        takeEvery: 'REQUEST',
        ...emptyHandlerConfig,
        action: () => new Promise(resolve => setTimeout(() => resolve(), 50)),
        cancelActionType: 'CANCEL',
      });

      return expectSaga(watcher)
        .not.put({ type: 'ERROR', error: Error('Action cancelled') })
        .dispatch({ type: 'REQUEST', cancelId: '0462318473' })
        .delay(30)
        .dispatch({ type: 'CANCEL', cancelId: '3783787042' })
        .silentRun();
    });

    it('should undo upon cancellation', () => {
      const watcher = createSingleEventSaga({
        takeEvery: 'REQUEST',
        ...emptyHandlerConfig,
        action: () => new Promise(resolve => setTimeout(() => resolve(), 50)),
        cancelActionType: 'CANCEL',
        undoAction: () => ({ type: 'UNDO' }),
      });

      return expectSaga(watcher)
        .put({ type: 'ERROR', error: Error('Action cancelled') })
        .put({ type: 'UNDO' })
        .dispatch({ type: 'REQUEST' })
        .delay(30)
        .dispatch({ type: 'CANCEL' })
        .silentRun();
    });

    it('should not undo upon cancellation', () => {
      const watcher = createSingleEventSaga({
        takeEvery: 'REQUEST',
        ...emptyHandlerConfig,
        action: () => new Promise(resolve => setTimeout(() => resolve(), 50)),
        cancelActionType: 'CANCEL',
        undoOnError: false,
        undoAction: () => ({ type: 'UNDO' }),
      });

      return expectSaga(watcher)
        .put({ type: 'ERROR', error: Error('Action cancelled') })
        .not.put({ type: 'UNDO' })
        .dispatch({ type: 'REQUEST' })
        .delay(30)
        .dispatch({ type: 'CANCEL' })
        .silentRun();
    });

  });

  describe('createSingleEventSagaHandler tests', () => {

    it('should have the following behavior in normal cases', () => {
      const requestAction: Action = { type: 'REQUEST' };
      const fakeData = { data: ['hello', 'there'] };
      const handler = createSingleEventSagaHandler(emptyHandlerConfig);

      return expectSaga(handler, requestAction)
        .provide([
          [call(emptyHandlerConfig.action, null), fakeData],
        ])
        .put({ type: 'LOADING' })
        .put({ type: 'COMMIT', payload: fakeData })
        .put({ type: 'SUCCESS', payload: fakeData })
        .run();
    });

    it('should commit args when running after commit', () => {
      const requestAction: PayloadAction<T1> = {
        type: 'REQUEST',
        payload: { data: 'We\'re clones!' },
      };
      const fakeData = { data: ['hello', 'there'] };
      const handler = createSingleEventSagaHandler({
        ...emptyHandlerConfig,
        runAfterCommit: true,
      });

      return expectSaga(handler, requestAction)
        .put({ type: 'LOADING' })
        .put({ type: 'COMMIT', payload: requestAction.payload })
        .put({ type: 'SUCCESS', payload: fakeData })
        .run();
    });

    it('should call the action with the action\'s payload as args', () => {
      const requestAction: PayloadAction<T1> = {
        type: 'REQUEST',
        payload: { data: 'We\'re clones!' },
      };
      const fakeData = { data: ['hello', 'there'] };
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
      const requestAction: PayloadAction<T1> = {
        type: 'REQUEST',
        payload: { data: 'We\'re clones!' },
      };
      const handler = createSingleEventSagaHandler({
        ...nonEmptyHandlerConfig,
        *beforeAction(args): SagaIterator<{ data: string }> {
          yield put({ type: 'PROCESSING_ARGS', payload: { ...args } });
          return { data: 'We fight, we win!' };
        },
      });

      return expectSaga(handler, requestAction)
        .put({ type: 'PROCESSING_ARGS', payload: requestAction.payload })
        .call(nonEmptyHandlerConfig.action, { data: 'We fight, we win!' })
        .run();
    });

    it('should process result after running the action', () => {
      const requestAction: PayloadAction<T1> = {
        type: 'REQUEST',
        payload: { data: 'We\'re clones!' },
      };
      const fakeData = { data: ['hello', 'there'] };
      const handler = createSingleEventSagaHandler({
        ...nonEmptyHandlerConfig,
        *afterAction(res): SagaIterator<{ data: string[] }> {
          yield put({ type: 'PROCESSING_RESULT', payload: { ...res } });
          return { data: ['general', 'kenobi'] };
        },
      });

      return expectSaga(handler, requestAction)
        .put({ type: 'PROCESSING_RESULT', payload: fakeData })
        .put({ type: 'COMMIT', payload: { data: ['general', 'kenobi'] } })
        .run();
    });

    it('should allow processing result using args as parameter after running action', () => {
      const requestAction: PayloadAction<T1> = {
        type: 'REQUEST',
        payload: { data: 'We\'re clones!' },
      };
      const fakeData = { data: ['hello', 'there'] };
      const handler = createSingleEventSagaHandler({
        ...nonEmptyHandlerConfig,
        *afterAction(res, args): SagaIterator<{ data: string[] }> {
          yield put({ type: 'PROCESSING_RESULT', payload: { res, args } });
          return { data: ['general', 'kenobi'] };
        },
      });

      return expectSaga(handler, requestAction)
        .put({ type: 'PROCESSING_RESULT', payload: { res: fakeData, args: requestAction.payload } })
        .put({ type: 'COMMIT', payload: { data: ['general', 'kenobi'] } })
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
              retryCount = retryCount - 1;
              reject(Error('Hehe'));
            } else {
              resolve();
            }
          });
        },
        retry: 3,
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
        undoAction: () => ({ type: 'UNDO' }),
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
        undoAction: () => ({ type: 'UNDO' }),
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
        undoAction: () => ({ type: 'UNDO' }),
      });

      return expectSaga(handler, requestAction)
        .delay(140)
        .dispatch({ type: 'REQUEST_UNDO' })
        .not.put({ type: 'UNDO' })
        .put({ type: 'COMMIT', payload: undefined })
        .run();
    });

    it('should process the undo payload after loading', () => {
      const requestAction: PayloadAction<T1> = { type: 'REQUEST', payload: { data: 'Hello' } };
      const handler = createSingleEventSagaHandler({
        ...nonEmptyHandlerConfig,
        runAfterCommit: true,
        undoThreshold: 120,
        undoActionType: 'REQUEST_UNDO',
        undoAction: payload => ({ payload, type: 'UNDO' }),
        *undoPayloadBuilder(): SagaIterator<{ data: string }> { return { data: 'Bye' }; },
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
        action: () => { throw Error('Harry Potter is dead!'); },
        undoAction: () => ({ type: 'UNDO' }),
      });

      return expectSaga(handler, requestAction)
        .put({ type: 'ERROR', error: Error('Harry Potter is dead!') })
        .put({ type: 'UNDO' })
        .run();
    });

    it('should not undo on error', () => {
      const requestAction: Action = { type: 'REQUEST' };
      const handler = createSingleEventSagaHandler({
        ...emptyHandlerConfig,
        action: () => { throw Error('Harry Potter is dead!'); },
        undoOnError: false,
        undoAction: () => ({ type: 'UNDO' }),
      });

      return expectSaga(handler, requestAction)
        .put({ type: 'ERROR', error: Error('Harry Potter is dead!') })
        .not.put({ type: 'UNDO' })
        .run();
    });

    it('should undo for the undoId is a match', () => {
      const requestAction: PayloadAction<{}> = { type: 'REQUEST', undoId: '0462318473' };
      const handler = createSingleEventSagaHandler({
        ...emptyHandlerConfig,
        runAfterCommit: true,
        undoAction: () => ({ type: 'UNDO' }),
        undoActionType: 'REQUEST_UNDO',
        undoThreshold: 120,
      });

      return expectSaga(handler, requestAction)
        .delay(80)
        .dispatch({ type: 'REQUEST_UNDO', undoId: '0462318473' })
        .put({ type: 'UNDO' })
        .not.put({ type: 'SUCCESS', payload: { data: ['hello', 'there'] } })
        .run();
    });

    it('should not undo for the undoId is different', () => {
      const requestAction: PayloadAction<{}> = { type: 'REQUEST', undoId: '0462318473' };
      const handler = createSingleEventSagaHandler({
        ...emptyHandlerConfig,
        runAfterCommit: true,
        undoThreshold: 120,
        undoActionType: 'REQUEST_UNDO',
        undoAction: () => ({ type: 'UNDO' }),
      });

      return expectSaga(handler, requestAction)
        .delay(80)
        .dispatch({ type: 'REQUEST_UNDO', undoId: '3783787042' })
        .not.put({ type: 'UNDO' })
        .put({ type: 'SUCCESS', payload: { data: ['hello', 'there'] } })
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
              retryCount = retryCount - 1;
              reject(Error('Hehe'));
            } else {
              resolve();
            }
          });
        },
        retry: 3,
      });

      return expectSaga(handler, requestAction)
        .put({ type: 'ERROR', error: Error('Hehe') })
        .run();
    });

    it('should timeout after 100ms of waiting', () => {
      const requestAction: Action = { type: 'REQUEST' };
      const handler = createSingleEventSagaHandler({
        ...emptyHandlerConfig,
        action: () => new Promise(resolve => setTimeout(() => resolve(), 130)),
        timeout: 100,
      });

      return expectSaga(handler, requestAction)
        .put({ type: 'LOADING' })
        .delay(110)
        .put({ type: 'ERROR', error: Error('Action timed out') })
        .run();
    });

    it('should handle errors properly', () => {
      const requestAction: Action = { type: 'REQUEST' };
      const handler = createSingleEventSagaHandler({
        ...emptyHandlerConfig,
        action: () => { throw Error('Harry Potter is dead!'); },
      });

      return expectSaga(handler, requestAction)
        .put({ type: 'LOADING' })
        .put({ type: 'ERROR', error: Error('Harry Potter is dead!') })
        .run();
    });

  });

});
