import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { UserStore } from '../../../../../../libs/user/user.store';

@Component({
  selector: 'app-login',
  imports: [MatButtonModule, MatIconModule, MatProgressSpinnerModule],
  templateUrl: './login.html',
  styleUrl: './login.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Login {
  protected readonly userStore = inject(UserStore);
  private readonly router = inject(Router);

  protected async onSignIn(): Promise<void> {
    await this.userStore.signIn();

    // Wait for the auth listener to fetch the user doc from Firestore
    while (!this.userStore.authReady()) {
      await new Promise((resolve) => setTimeout(resolve, 50));
    }

    if (this.userStore.isAdmin()) {
      this.router.navigate(['/dashboard']);
    } else {
      this.router.navigate(['/access-denied']);
    }
  }
}
