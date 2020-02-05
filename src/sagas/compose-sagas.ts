import { SagaIterator } from '../typings';

export function composeSagas<T1, T2, T3>(s1: (a: T1) => SagaIterator<T2>, s2: (b: T2) => SagaIterator<T3>) {
  return function* composed(a: T1): SagaIterator<T3> {
    const res1: T2 = yield* s1(a);
    const res2: T3 = yield* s2(res1);
    return res2;
  };
}
