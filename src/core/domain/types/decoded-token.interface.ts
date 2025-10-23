export interface DecodedToken {
  user_id: number;
  user_full_name: string;
  username: string;
  mailbox: string | null;
  roles: string[];
  plans: any[];
  exp: number;
  real_user: string;
  orig_iat: number;
}
