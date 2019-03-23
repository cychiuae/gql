type Unpromise<T> = {
  [K in keyof T]: T[K] extends Promise<infer V> ? V : T[K]
};

export async function props<T>(t: T): Promise<Unpromise<T>> {
  const keys = Object.keys(t);
  const values = await Promise.all(Object.values(t));
  const output: any = {};
  for (let i = 0; i < keys.length; ++i) {
    const key = keys[i];
    const value = values[i];
    output[key] = value;
  }
  return output;
}
