type Constructor<T> = new (...args: any[]) => T;

export const wrapWithTryCatch = <T extends object> (
  errorHandler: (error: any) => void,
  constructor: Constructor<T>,
  ...constructorParams: any[]
): T => {
  return new Proxy(new constructor(...constructorParams),
    {
      get(target: any, prop: any) {
        const original = target[prop];
        if (typeof original === 'function') {
          return async function (...args: any) {
            try {
              return await original.apply(target, args);
            } catch (e) {
              errorHandler(e);
            }
          };
        }
        return original;
      },
    },
  );
};
