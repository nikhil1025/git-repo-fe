import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { IntegrationStatus } from '../../../core/models/integration';
import { AuthService } from '../../../core/services/auth.service';
import { IntegrationService } from '../../../core/services/integration.service';
import { SharedModule } from '../../../shared/shared.module';

@Component({
  selector: 'app-integration-panel',
  templateUrl: './integration-panel.component.html',
  styleUrl: './integration-panel.component.scss',
  standalone: true,
  imports: [CommonModule, SharedModule],
})
export class IntegrationPanelComponent implements OnInit {
  integrationStatus: IntegrationStatus | null = null;
  isLoading = false;
  isExpanded = false;
  userId: string | null = null;

  constructor(
    private authService: AuthService,
    private integrationService: IntegrationService,
    private snackBar: MatSnackBar,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.userId = this.authService.getUserId();

    this.authService.integrationStatus$.subscribe((status) => {
      this.integrationStatus = status;
      this.isLoading = false;
    });

    if (this.userId) {
      this.loadIntegrationStatus();
    }
  }

  loadIntegrationStatus(): void {
    if (!this.userId) return;

    this.isLoading = true;
    this.authService.getIntegrationStatus(this.userId).subscribe({
      next: (status) => {
        this.integrationStatus = status;
        this.isLoading = false;
      },
      error: (error) => {
        // console.error('Failed to load integration status:', error);
        this.isLoading = false;
        this.snackBar.open('Failed to load integration status', 'Close', {
          duration: 3000,
        });
      },
    });
  }

  connectGithub(): void {
    this.authService.redirectToGithubAuth();
  }

  removeIntegration(): void {
    if (!this.integrationStatus?.integration?._id) {
      // console.error('No integration ID found');
      this.snackBar.open('No integration found to remove', 'Close', {
        duration: 3000,
      });
      return;
    }

    if (
      confirm(
        'Are you sure you want to remove this integration? All synced data will be deleted.'
      )
    ) {
      this.isLoading = true;
      const integrationId = this.integrationStatus.integration._id;

      // console.log('Removing integration:', integrationId);

      this.integrationService.removeIntegration(integrationId).subscribe({
        next: (response) => {
          // console.log('Integration removed:', response);
          this.integrationStatus = null;
          this.authService.clearUserId();
          this.isLoading = false;

          const deletedCount = response.deletedDocuments || 0;
          this.snackBar.open(
            `Integration removed! Deleted ${deletedCount} documents.`,
            'Close',
            { duration: 5000 }
          );
        },
        error: (error) => {
          // console.error('Failed to remove integration:', error);
          this.isLoading = false;
          this.snackBar.open(
            `Failed to remove integration: ${
              error.error?.message || error.message
            }`,
            'Close',
            { duration: 5000 }
          );
        },
      });
    }
  }

  resyncIntegration(): void {
    if (!this.integrationStatus?.integration?._id) {
      // console.error('No integration ID found');
      this.snackBar.open('No integration found to resync', 'Close', {
        duration: 3000,
      });
      return;
    }

    this.isLoading = true;
    const integrationId = this.integrationStatus.integration._id;

    // console.log('Resyncing integration:', integrationId);

    this.integrationService.syncGithubData(integrationId).subscribe({
      next: (response) => {
        // console.log('Sync response:', response);
        this.loadIntegrationStatus();
        this.isLoading = false;

        const stats = response.stats || {};
        const message = `Sync complete! Orgs: ${
          stats.organizations || 0
        }, Repos: ${stats.repositories || 0}, Commits: ${
          stats.commits || 0
        }, PRs: ${stats.pullRequests || 0}, Issues: ${
          stats.issues || 0
        }, Users: ${stats.users || 0}`;
        this.snackBar.open(message, 'Close', {
          duration: 5000,
        });
      },
      error: (error) => {
        // console.error('Failed to sync GitHub data:', error);
        this.isLoading = false;
        this.snackBar.open(
          `Failed to sync: ${error.error?.message || error.message}`,
          'Close',
          { duration: 5000 }
        );
      },
    });
  }
}
