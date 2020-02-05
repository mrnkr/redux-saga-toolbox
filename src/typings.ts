import { StrictEffect } from 'redux-saga/effects';

export interface Dictionary<T> {
  [key: string]: T;
}

export type SagaIterator<TReturn> = Generator<StrictEffect, TReturn, void>;
