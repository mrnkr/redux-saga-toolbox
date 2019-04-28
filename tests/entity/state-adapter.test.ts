import sinon, { SinonSpy } from 'sinon';
import { createStateOperator, DidMutate } from '../../src/entity/state-adapter';
import { EntityState } from '../../src/entity/models';

/**
 * Specification of a factory function
 * which receives a mutator and returns
 * a modified state without mutating the
 * previous one
 */
describe('state adapter tests', () => {

  let spy: SinonSpy;
  let state: EntityState<{}>;

  beforeAll(() => {
    spy = sinon.spy();
    state = { ids: [], entities: {} };
  });

  afterEach(() => {
    spy.resetHistory();
  });

  it('should have a module', () => {
    expect(createStateOperator).toBeDefined();
  });

  it('should return the same state (same pointer) wnen nothing is mutated', () => {
    const mutator = () => {
      spy();
      return DidMutate.None;
    }
    const operator = createStateOperator(mutator);

    const result = operator({}, state);

    expect(spy.calledOnce).toBeTruthy();
    expect(result).toBe(state);
  });

  it('should change only entities (ids pointer should be the same as before)', () => {
    const mutator = () => {
      spy();
      return DidMutate.EntitiesOnly;
    }
    const operator = createStateOperator(mutator);

    const result = operator({}, state);

    expect(spy.calledOnce).toBeTruthy();
    expect(result).not.toBe(state);
    expect(result.ids).toBe(state.ids);
    expect(result.entities).not.toBe(state.entities);
  });

  it('should change both ids and entities', () => {
    const mutator = () => {
      spy();
      return DidMutate.Both;
    };
    const operator = createStateOperator(mutator);

    const result = operator({}, state);

    expect(spy.calledOnce).toBeTruthy();
    expect(result).not.toBe(state);
    expect(result.ids).not.toBe(state.ids);
    expect(result.entities).not.toBe(state.entities);
  });

});
