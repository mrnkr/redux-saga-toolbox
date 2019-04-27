import sinon from 'sinon';
import { createStateOperator, DidMutate } from '../../src/entity/state-adapter';

/**
 * Specification of a factory function
 * which receives a mutator and returns
 * a modified state without mutating the
 * previous one
 */
describe('state adapter tests', () => {

  it('should have a module', () => {
    expect(createStateOperator).toBeDefined();
  });

  it('should return the same state (same pointer) wnen nothing is mutated', () => {
    const spy = sinon.spy();
    const mutator = () => {
      spy();
      return DidMutate.None;
    }
    const state = { ids: [], entities: {} };
    const operator = createStateOperator(mutator);

    const result = operator({}, state);

    expect(spy.calledOnce).toBeTruthy();
    expect(result).toBe(state);
  });

  it('should change only entities (ids pointer should be the same as before)', () => {
    const spy = sinon.spy();
    const mutator = () => {
      spy();
      return DidMutate.EntitiesOnly;
    }
    const state = { ids: [], entities: {} };
    const operator = createStateOperator(mutator);

    const result = operator({}, state);

    expect(spy.calledOnce).toBeTruthy();
    expect(result).not.toBe(state);
    expect(result.ids).toBe(state.ids);
    expect(result.entities).not.toBe(state.entities);
  });

  it('should change both ids and entities', () => {
    const spy = sinon.spy();
    const mutator = () => {
      spy();
      return DidMutate.Both;
    };
    const state = { ids: [], entities: {} };
    const operator = createStateOperator(mutator);

    const result = operator({}, state);

    expect(spy.calledOnce).toBeTruthy();
    expect(result).not.toBe(state);
    expect(result.ids).not.toBe(state.ids);
    expect(result.entities).not.toBe(state.entities);
  });

});
