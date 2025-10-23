export type Queryable<T> = {
  [P in keyof T]?: T[P] | T[P][];
};
