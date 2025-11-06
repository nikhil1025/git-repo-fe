import { TestBed } from '@angular/core/testing';

import { GithubDataService } from './github-data.service';

describe('GithubDataService', () => {
  let service: GithubDataService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(GithubDataService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
