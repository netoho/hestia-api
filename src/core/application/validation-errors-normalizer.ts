import { ValidationError } from 'class-validator';

export const flatValidationErrorMessage = (validationErrors: ValidationError[]): Array<string> => {
  const constraints: Array<string> = [];

  const getConstraints = (validationErrors: ValidationError[] | undefined) => {
    if (validationErrors) {
      validationErrors.forEach((validationError: ValidationError) => {
        if (validationError.children?.length === 0) {
          if (validationError.constraints) constraints.push(...Object.values(validationError.constraints));
        }
        getConstraints(validationError.children);
      });
    };
  };

  getConstraints(validationErrors);
  return constraints;
};
