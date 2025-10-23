import { DecodedToken } from '@Src/core/domain/types/decoded-token.interface';
import { createParamDecorator } from 'routing-controllers';

/**
 * Allow to assign current user data to variable (optional - can be undefined)
 */
export function OptionalUserReq() {
  return createParamDecorator({
    required: false,
    value: (action) => {
      const token: DecodedToken | undefined = action.request.user;
      return token;
    },
  });
}
