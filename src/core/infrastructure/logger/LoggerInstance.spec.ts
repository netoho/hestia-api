import { LoggerInstance } from './LoggerInstance';

describe('singleton test', () => {
  it('should return the same instance', () => {
    const i1 = LoggerInstance.instance;
    const i2 = LoggerInstance.instance;

    expect(i1).toBe(i2);
  });
});
