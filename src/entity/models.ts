export type Comparer<T> = (a: T, b: T) => string;

export type IdSelector<T> = (model: T) => string;

export interface Dictionary<T> {
  [id: string]: T;
}

export interface Update<T> {
  id: string;
  changes: Partial<T>;
}

export type Predicate<T> = (entity: T) => boolean;

export type EntityMap<T> = (entity: T) => T;

export interface EntityState<T> {
  ids: string[];
  entities: Dictionary<T>;
}

export interface EntityDefinition<T> {
  selectId: IdSelector<T>;
  sortComparer: false | Comparer<T>;
}

export type StateOperator<V, R> = <S extends EntityState<V>>(arg: R, state: S) => S;

export interface EntityStateAdapter<T> {
  addOne: StateOperator<T, T>;
  addMany: StateOperator<T, T[]>;
  addAll: StateOperator<T, T[]>;

  removeOne: StateOperator<T, string>;
  removeMany: StateOperator<T, string[] | Predicate<T>>;
  removeAll<S extends EntityState<T>>(state: S): S;

  updateOne: StateOperator<T, Update<T>>;
  updateMany: StateOperator<T, Update<T>[]>;

  upsertOne: StateOperator<T, T>;
  upsertMany: StateOperator<T, T[]>;

  map: StateOperator<T, EntityMap<T>>;
}

export interface EntitySelectors<T> {
  selectIds: <S extends EntityState<T>>(state: S) => string[];
  selectEntities: <S extends EntityState<T>>(state: S) => Dictionary<T>;
  selectAll: <S extends EntityState<T>>(state: S) => T[];
  selectTotal: <S extends EntityState<T>>(state: S) => number;
}

export interface EntityAdapter<T> extends EntityStateAdapter<T> {
  selectId: IdSelector<T>;
  sortComparer: false | Comparer<T>;
  getInitialState(): EntityState<T>;
  getInitialState<S extends object>(state: S): EntityState<T> & S;
  getSelectors(): EntitySelectors<T>;
}
