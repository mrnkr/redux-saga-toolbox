import { expectSaga } from 'redux-saga-test-plan';
import { createSingleEventSaga } from '../../src/sagas/single-event';
import { SingleEventSagaHandlerConfiguration } from '../../src/sagas/typings';

describe('single event saga factory test', () => {

  it('should have a module', () => {
    expect(createSingleEventSaga).toBeDefined();
  });

  describe('createSingleEventSaga tests', () => {

    it('should dispatch the forking action', () => {
      const handlerConfig: SingleEventSagaHandlerConfiguration<{}, string[]> = {
        loadingAction: () => ({ type: 'LOADING' }),
        commitAction: payload => ({ type: 'COMMIT', payload }),
        successAction: payload => ({ type: 'SUCCESS', payload }),
        errorAction: error => ({ type: 'ERROR', error }),
        action: () => ({ data: [ 'hello', 'there' ] })
      };

      const watcher = createSingleEventSaga({
        takeEvery: 'REQUEST',
        ...handlerConfig
      });


      return expectSaga(watcher)
        .put({ type: 'LOADING' })
        .dispatch({ type: 'REQUEST' })
        .run();
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

})
