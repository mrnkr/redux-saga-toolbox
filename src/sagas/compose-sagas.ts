import { SagaIterator } from 'redux-saga';

export function composeSagas<T1, T2, T3>(s1: (a: T1) => SagaIterator, s2: (b: T2) => SagaIterator) {
  return function* composed(a: T1): SagaIterator {
    const res1: T2 = yield* s1(a);
    const res2: T3 = yield* s2(res1);
    return res2;
  };
}
