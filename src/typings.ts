export interface Dictionary<T> {
  [key: string]: T;
}

export type Omit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>;
