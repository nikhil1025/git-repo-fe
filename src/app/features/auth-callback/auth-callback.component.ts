import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { IntegrationService } from '../../core/services/integration.service';

@Component({
  selector: 'app-auth-callback',
  imports: [CommonModule, MatProgressSpinnerModule],
  templateUrl: './auth-callback.component.html',
  styleUrl: './auth-callback.component.scss',
})
export class AuthCallbackComponent implements OnInit {
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService,
    private integrationService: IntegrationService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe((params) => {
      const code = params['code'];

      if (code) {
        this.authService.handleCallback(code).subscribe({
          next: (integration) => {
            // console.log('Authentication successful:', integration);
            this.snackBar.open('GitHub connected successfully! Starting data sync...', 'Close', {
              duration: 5000,
            });
            
            this.integrationService.syncGithubData(integration._id).subscribe({
              next: (response) => {
                const stats = response.stats || {};
                const message = `Initial sync complete! Orgs: ${stats.organizations || 0}, Repos: ${stats.repositories || 0}, Commits: ${stats.commits || 0}, PRs: ${stats.pullRequests || 0}, Issues: ${stats.issues || 0}, Users: ${stats.users || 0}`;
                this.snackBar.open(message, 'Close', {
                  duration: 5000,
                });
              },
              error: (error) => {
                // console.error('Failed to sync GitHub data:', error);
                this.snackBar.open('Warning: Initial data sync failed. You can retry from the integration panel.', 'Close', {
                  duration: 5000,
                });
              },
              complete: () => {
                this.router.navigate(['/integration']);
              }
            });
          },
          error: (error) => {
            // console.error('Authentication failed:', error);
            this.snackBar.open('Failed to connect GitHub', 'Close', {
              duration: 5000,
            });
            this.router.navigate(['/integration']);
          },
        });
      } else {
        this.snackBar.open('No authorization code received', 'Close', {
          duration: 3000,
        });
        this.router.navigate(['/integration']);
      }
    });
  }
}
