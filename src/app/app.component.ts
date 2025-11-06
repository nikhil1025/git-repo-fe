import { Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatToolbarModule } from '@angular/material/toolbar';
import { Router, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, MatToolbarModule, MatButtonModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {
  title = 'GitHub Integration';

  constructor(private router: Router) {}

  navigateToIntegration(): void {
    this.router.navigate(['/integration']);
  }

  navigateToData(): void {
    this.router.navigate(['/data']);
  }
}
