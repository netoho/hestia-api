import { AuthService } from '../auth/jwt.auth';
import { envConfigs } from '../get-configs';
import HttpClient from '../httpClient';

export abstract class HermesClient extends HttpClient {
  protected apiUrl: string;

  constructor(
    private readonly authService: AuthService,
  ) {
    super();
    const config = envConfigs.getConfigs();
    // TODO: rename config
    const { notificationsApi: { baseUrl } } = config;
    this.apiUrl = baseUrl;
  }

  protected async getServiceToken(): Promise<string> {
    return this.authService.getJwt();
  }
}
