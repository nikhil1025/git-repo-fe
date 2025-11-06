export interface Integration {
  _id: string;
  userId: string;
  provider: string;
  accessToken?: string;
  connectedAt: Date;
  lastSyncedAt?: Date;
  status: 'active' | 'disconnected';
  githubUser: GithubUser;
}

export interface GithubUser {
  id: number;
  login: string;
  name: string;
  email: string;
  avatar_url: string;
  html_url: string;
}

export interface IntegrationStatus {
  isConnected: boolean;
  integration?: Integration;
  connectedAt?: Date;
}
