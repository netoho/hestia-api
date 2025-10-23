import { DecodedToken } from '@Src/core/domain/types/decoded-token.interface';
import { createParamDecorator } from 'routing-controllers';

/**
 * Allow to assign current user's roles to variable
 */
export function RolesReq() {
    return createParamDecorator({
      required: true,
      value: action => {
        const token: DecodedToken = action.request.user;
        return token.roles;
      },
    });
}
