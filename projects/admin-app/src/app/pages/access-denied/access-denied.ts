import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { UserStore } from '../../../../../../libs/user/user.store';

@Component({
  selector: 'app-access-denied',
  imports: [MatButtonModule, MatIconModule],
  templateUrl: './access-denied.html',
  styleUrl: './access-denied.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AccessDenied {
  private readonly userStore = inject(UserStore);
  private readonly router = inject(Router);

  protected async onSignOut(): Promise<void> {
    await this.userStore.signOut();
    this.router.navigate(['/login']);
  }
}
