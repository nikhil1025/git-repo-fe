import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpService } from './http.service';

@Injectable({
  providedIn: 'root',
})
export class IntegrationService {
  constructor(private httpService: HttpService) {}

  removeIntegration(integrationId: string): Observable<any> {
    return this.httpService.delete(`/integration/${integrationId}`);
  }

  resyncIntegration(integrationId: string): Observable<any> {
    return this.httpService.post(`/integration/${integrationId}/resync`, {});
  }

  syncGithubData(integrationId: string): Observable<any> {
    return this.httpService.post(`/github/sync/${integrationId}`, {});
  }
}
