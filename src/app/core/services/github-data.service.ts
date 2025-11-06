import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { CollectionField, DataRequest, DataResponse } from '../models/ag-grid';
import { AuthService } from './auth.service';
import { HttpService } from './http.service';

@Injectable({
  providedIn: 'root',
})
export class GithubDataService {
  constructor(
    private httpService: HttpService,
    private authService: AuthService
  ) {}

  private getUserId(): string {
    const userId = this.authService.getUserId();
    if (!userId) {
      console.warn('No userId found - user may need to authenticate');
    }
    return userId || '';
  }

  getCollections(): Observable<string[]> {
    const userId = this.getUserId();
    return this.httpService
      .get<{ collections: string[] }>('/data/collections', { userId })
      .pipe(map((response) => response.collections || []));
  }

  getCollectionData<T>(
    collectionName: string,
    request: DataRequest
  ): Observable<DataResponse<T>> {
    const userId = this.getUserId();
    return this.httpService.get<DataResponse<T>>(
      `/data/collections/${collectionName}`,
      {
        ...request,
        userId,
      }
    );
  }

  getCollectionFields(collectionName: string): Observable<CollectionField[]> {
    const userId = this.getUserId();
    return this.httpService
      .get<any>(`/data/collections/${collectionName}/fields`, { userId })
      .pipe(
        map((response) => {
          if (Array.isArray(response)) {
            return response;
          }
          if (response && Array.isArray(response.fields)) {
            return response.fields;
          }
          // console.error('Unexpected response format:', response);
          return [];
        })
      );
  }

  globalSearch(searchValue: string): Observable<any> {
    const userId = this.getUserId();
    return this.httpService.post('/data/search', { 
      searchValue,
      userId 
    });
  }
}
