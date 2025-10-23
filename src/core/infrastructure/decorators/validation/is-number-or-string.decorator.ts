import { isNumber, isString, Validate, ValidatorConstraint, ValidatorConstraintInterface } from 'class-validator';

export const IS_NUMBER_OR_STRING = 'isNumberOrString';

@ValidatorConstraint({ name: IS_NUMBER_OR_STRING, async: false })
export class isNumberOrString implements ValidatorConstraintInterface {
  validate(text: unknown) {
    return isNumber(text) || isString(text);
  }

  defaultMessage() {
    return '($value) must be number or string';
  }
}

/**
 * @description This annotation has issues using QueryParams.
 */
export const IsNumberOrString = (): PropertyDecorator => Validate(isNumberOrString);
