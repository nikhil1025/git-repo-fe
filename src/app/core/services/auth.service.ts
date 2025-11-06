import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { Integration, IntegrationStatus } from '../models/integration';
import { HttpService } from './http.service';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly USER_ID_KEY = 'github_user_id';
  private integrationStatusSubject =
    new BehaviorSubject<IntegrationStatus | null>(null);
  public integrationStatus$ = this.integrationStatusSubject.asObservable();

  constructor(private httpService: HttpService) {}

  getAuthUrl(): Observable<{ authUrl: string }> {
    // Backend sends 'id' but frontend expects '_id'
    return this.httpService.get<{ authUrl: string }>('/auth/auth-url');
  }

  handleCallback(code: string): Observable<Integration> {
    return this.httpService.post<any>('/auth/callback', { code }).pipe(
      map((response) => {
        const integration = response.integration;
        if (integration && integration.id && !integration._id) {
          integration._id = integration.id;
        }
        return integration;
      }),
      tap((integration) => {
        this.setUserId(integration.userId);
        this.integrationStatusSubject.next({
          isConnected: true,
          integration: integration,
          connectedAt: integration.connectedAt,
        });
      })
    );
  }

  getIntegrationStatus(userId: string): Observable<IntegrationStatus> {
    return this.httpService.get<any>('/auth/status', { userId }).pipe(
      map((response) => {
        let integration = response.integration;

        if (integration && integration.id && !integration._id) {
          integration._id = integration.id;
        }

        const status: IntegrationStatus = {
          isConnected: response.connected || false,
          integration: integration || undefined,
          connectedAt:
            response.connectedAt || response.integration?.connectedAt,
        };
        return status;
      }),
      tap((status) => this.integrationStatusSubject.next(status))
    );
  }

  getUserId(): string | null {
    return localStorage.getItem(this.USER_ID_KEY);
  }

  setUserId(userId: string): void {
    localStorage.setItem(this.USER_ID_KEY, userId);
  }

  clearUserId(): void {
    localStorage.removeItem(this.USER_ID_KEY);
    this.integrationStatusSubject.next(null);
  }

  redirectToGithubAuth(): void {
    this.getAuthUrl().subscribe({
      next: (response) => {
        window.location.href = response.authUrl;
      },
      error: (error) => {
        console.error('Failed to get auth URL:', error);
      },
    });
  }
}
