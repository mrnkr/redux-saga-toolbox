import isUndefined from 'lodash/isUndefined';
import negate from 'lodash/negate';
import { SingleEventSagaConfiguration } from './typings';

const isDefined = negate(isUndefined);

export function assertValidConfig<TPayload, TResult>(
  config: SingleEventSagaConfiguration<TPayload, TResult>,
): void {
  assertForkingAction(config);
  assertMinimumRequiredHandlerConfiguration(config);

  if (!config.silent) {
    warnIfUndoThresholdIsTooLittle(config);
    warnIfAllowingUndoRunningBeforeCommit(config);
  }
}

function assertForkingAction<TPayload, TResult>({
  takeEvery,
}: SingleEventSagaConfiguration<TPayload, TResult>): void {
  if (!isDefined(takeEvery)) {
    throw Error('A forking action is required');
  }
}

function assertMinimumRequiredHandlerConfiguration<TPayload, TResult>(
  config: SingleEventSagaConfiguration<TPayload, TResult>,
): void {
  if (isUndefined(config.loadingAction)) {
    throw Error('No loading action provided');
  }

  if (isUndefined(config.commitAction)) {
    throw Error('No commit action provided');
  }

  if (isUndefined(config.successAction)) {
    throw Error('No success action provided');
  }

  if (isUndefined(config.errorAction)) {
    throw Error('No error action provided');
  }

  if (isUndefined(config.action)) {
    throw Error('No action provided');
  }
}

function warnIfUndoThresholdIsTooLittle<TPayload, TResult>(
  config: SingleEventSagaConfiguration<TPayload, TResult>
): void {
  if (isDefined(config.undoActionType) && config.undoThreshold! <= 3000) {
    console.warn('An undo action is provided but the user is being given too little time to undo!');
  }
}

function warnIfAllowingUndoRunningBeforeCommit<TPayload, TResult>(
  config: SingleEventSagaConfiguration<TPayload, TResult>
): void {
  if (!config.runAfterCommit && isDefined(config.undoActionType)) {
    console.warn('Running before commit does not allow for undoing actions');
  }
}
