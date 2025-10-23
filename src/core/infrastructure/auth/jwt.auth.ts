import timers from 'node:timers/promises';

import * as jose from 'jose';
import { DateTime } from 'luxon';
import { Service } from 'typedi';

import { envConfigs } from '../get-configs';

@Service()
export class AuthService {
  private readonly secret: Uint8Array;
  private readonly algorithm: 'HS256' = 'HS256';
  private readonly ttl: number;
  private readonly origin: string;

  private currentToken: string;

  constructor() {
    const config = envConfigs.getConfigs();

    const {
      auth: { jwt: { ttl, secret, origin } },
    } = config;

    this.ttl = ttl;
    this.origin = origin;
    this.secret = new TextEncoder().encode(secret);

    this.initRefreshToken().catch(console.error);
  }

  private async initRefreshToken() {
    this.currentToken = await this.generateAuthorizationToken();

    // eslint-disable-next-line @typescript-eslint/no-unused-vars, no-unused-vars
    for await (const _ of timers.setInterval((this.ttl - 20) * 1000, Date.now())) {
        // TODO: add a circuit breaker logic
        try {
            this.currentToken = await this.generateAuthorizationToken();
        } catch (error) {
            console.error(error);
        }
    }
  }

  private getExpirationUnix(): number {
    const exp = DateTime.utc().plus({ seconds: this.ttl }).toSeconds();

    return exp;
  }

  private async generateAuthorizationToken() {
    const jwt = await new jose.SignJWT({ origin: this.origin })
      .setProtectedHeader({ alg: this.algorithm })
      .setIssuedAt()
      .setIssuer('financeApi')
      // .setAudience('audience')
      .setExpirationTime(this.getExpirationUnix())
      .sign(this.secret);

    return jwt;
  }

  public async getJwt(): Promise<string> {
    if (!this.currentToken) {
      return this.generateAuthorizationToken();
    }

    return this.currentToken;
  }
}
