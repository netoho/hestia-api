import { IBrokerPublicProfile, IBroker, IUser, IRfc } from '@Src/core/domain/broker.interface';
import { AuthService } from '@Src/core/infrastructure/auth/jwt.auth';
import HttpClient from '@Src/core/infrastructure/httpClient';
import { Service } from 'typedi';

import { envConfigs } from '../get-configs';

@Service()
export class BackendIADClient extends HttpClient {
  private apiUrl: string;

  constructor(
    private readonly authService: AuthService,
  ) {
    super();
    const config = envConfigs.getConfigs();

    const { coreApi: { baseUrl } } = config;
    this.apiUrl = baseUrl;
  }

  protected async getServiceToken(): Promise<string> {
    return this.authService.getJwt();
  }

  async getPublicProfile(brokerId: number): Promise<IBrokerPublicProfile> {
    const path = `${this.apiUrl}/v1/public/brokers/${brokerId}/`;

    const profile = await this.get<IBrokerPublicProfile>(path, 'BackendIADClient.getPublicProfile');

    return profile;
  }

  async getBrokersByCustomer(customerId: number): Promise<number[]> {
    const path = `${this.apiUrl}/v1/internal/brokers_by_customer/?customerId=${customerId}`;
    const token = await this.getServiceToken();
    this.setAuthorization(token);
    const brokers = await this.get<number[]>(path, 'BackendIADClient.getBrokersByCustomer');
    return brokers;
  }

  async getPrivateBrokerProfile(brokerId: number): Promise<IBroker> {
    const path = `${this.apiUrl}/v1/internal/brokers/${brokerId}/`;
    const token = await this.getServiceToken();
    this.setAuthorization(token);
    const profile = await this.get<IBroker>(path, 'BackendIADClient.getPrivateBrokerProfile');
    return profile;
  }

  async getUserInfo(user_id: number): Promise<IUser> {
    const path = `${this.apiUrl}/v1/internal/users/${user_id}/`;
    const token = await this.getServiceToken();
    this.setAuthorization(token);
    return await this.get<IUser>(path, 'BackendIADClient.getUserInfo');
  }

    async getRfc(user_id: number): Promise<IRfc> {
        const path = `${this.apiUrl}/v1/public/rfc/?user_id=${user_id}`;
        return await this.get<IRfc>(path, 'BackendIADClient.getRfc');
    }
}
