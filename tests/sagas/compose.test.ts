import { SagaIterator } from 'redux-saga';
import { expectSaga } from 'redux-saga-test-plan';
import { composeSagas } from '../../src/sagas/compose-sagas';

describe('saga composition tests', () => {

  type T1 = { data: string };
  type T2 = T1 & { auth?: string };
  type T3 = T2 & { contentType: string };

  function* auth(action: T1): SagaIterator {
    return {
      ...action,
      auth: 'It\'s a me! Mario!',
    };
  }

  function* moreData(action: T2): SagaIterator {
    return {
      ...action,
      data: `${action.data} and more!`,
    };
  }

  function* contentType(action: T2): SagaIterator {
    return {
      ...action,
      contentType: 'application/json',
    };
  }

  it('should have a module', () => {
    expect(composeSagas).toBeDefined();
  });

  describe('composeSagas tests', () => {

    it('should take two sagas and return the composition of both', () => {
      const composed = composeSagas(auth, moreData);
      expect(composed).toBeDefined();
    });

    it('should behave the same as doing s2(s1(a))', () => {
      const composed = composeSagas<T1, T2, T2>(
        auth, moreData,
      );

      return expectSaga(composed, { data: 'We\'re clones' })
        .returns({
          data: 'We\'re clones and more!',
          auth: 'It\'s a me! Mario!',
        })
        .run();
    });

    it('should be possible to compose with compositions', () => {
      const comp1 = composeSagas<T1, T2, T2>(
        auth, moreData,
      );
      const composed = composeSagas<T1, T2, T3>(
        comp1,
        contentType,
      );

      return expectSaga(composed, { data: 'We\'re clones' })
        .returns({
          data: 'We\'re clones and more!',
          auth: 'It\'s a me! Mario!',
          contentType: 'application/json',
        })
        .run();
    });

  });

});
