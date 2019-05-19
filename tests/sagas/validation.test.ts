import { assertValidConfig } from '../../src/sagas/validation';
import { SingleEventSagaConfiguration } from '../../src/sagas/typings';

describe('single event saga config validation tests', () => {

  let minimumValidConfiguration: SingleEventSagaConfiguration<{}, {}>;

  beforeAll(() => {
    minimumValidConfiguration = {
      takeEvery: 'REQUEST',
      loadingAction: () => ({ type: 'LOADING' }),
      commitAction: payload => ({ payload, type: 'COMMIT' }),
      successAction: payload => ({ payload, type: 'SUCCESS' }),
      errorAction: error => ({ error, type: 'ERROR' }),
      action: () => ({ data: ['hello', 'there'] }),
    };
  });

  beforeEach(() => {
    console.warn = jest.fn();
  });

  it('should have a module', () => {
    expect(assertValidConfig).toBeDefined();
  });

  describe('assertValidConfig tests', () => {

    it('should not throw when provided with a valid configuration', () => {
      expect(() => assertValidConfig(minimumValidConfiguration))
        .not
        .toThrow();
    });

    it('should throw when not provided with a forking action', () => {
      const config = { ...minimumValidConfiguration };
      delete config.takeEvery;

      expect(() => assertValidConfig(config))
        .toThrow();
    });

    it('should throw when not provided with a loading action', () => {
      const config = { ...minimumValidConfiguration };
      delete config.loadingAction;

      expect(() => assertValidConfig(config))
        .toThrow();
    });

    it('should throw when not provided with a commit action', () => {
      const config = { ...minimumValidConfiguration };
      delete config.commitAction;

      expect(() => assertValidConfig(config))
        .toThrow();
    });

    it('should throw when not provided with a success action', () => {
      const config = { ...minimumValidConfiguration };
      delete config.successAction;

      expect(() => assertValidConfig(config))
        .toThrow();
    });

    it('should throw when not provided with an error action', () => {
      const config = { ...minimumValidConfiguration };
      delete config.errorAction;

      expect(() => assertValidConfig(config))
        .toThrow();
    });

    it('should throw when not provided with an action', () => {
      const config = { ...minimumValidConfiguration };
      delete config.action;

      expect(() => assertValidConfig(config))
        .toThrow();
    });

    it('should warn when provided with an undo action but threshold is too small', () => {
      const config = {
        ...minimumValidConfiguration,
        runAfterCommit: true,
        undoActionType: 'UNDO',
        undoThreshold: 100,
      };

      assertValidConfig(config);
      expect(console.warn)
        .toHaveBeenCalledWith(
          'An undo action is provided but the user is being given too little time to undo!',
        );
    });

    it('should warn when provided with an undo action but action runs before committing', () => {
      const config = { ...minimumValidConfiguration, undoActionType: 'UNDO', undoThreshold: 5000 };

      assertValidConfig(config);
      expect(console.warn)
        .toHaveBeenCalledWith(
          'Running before commit does not allow for undoing actions',
        );
    });

    it('should not print warnings when config is set to silent', () => {
      const config = {
        ...minimumValidConfiguration,
        undoActionType: 'UNDO',
        undoThreshold: 5000,
        silent: true,
      };

      assertValidConfig(config);
      expect(console.warn).not.toHaveBeenCalled();
    });

  });

});
