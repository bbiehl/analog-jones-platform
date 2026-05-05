import { ChangeDetectionStrategy, Component, inject, signal, viewChild } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatSidenavModule, MatSidenav } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { UserStore } from '@aj/core';

@Component({
  selector: 'app-shell',
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    MatToolbarModule,
    MatSidenavModule,
    MatListModule,
    MatIconModule,
    MatButtonModule,
    MatDividerModule,
  ],
  templateUrl: './shell.html',
  styleUrl: './shell.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Shell {
  private readonly breakpointObserver = inject(BreakpointObserver);
  private readonly router = inject(Router);
  protected readonly userStore = inject(UserStore);
  protected readonly isMobile = signal(false);
  protected readonly sidenav = viewChild<MatSidenav>('sidenav');

  protected readonly navLinks = [
    { path: '/dashboard', label: 'Dashboard', icon: 'dashboard' },
    { path: '/users', label: 'Users', icon: 'people' },
    { path: '/episodes', label: 'Episodes', icon: 'podcasts' },
    { path: '/categories', label: 'Categories', icon: 'category' },
    { path: '/genres', label: 'Genres', icon: 'books_movies_and_music' },
    { path: '/tags', label: 'Tags', icon: 'label' },
  ];

  constructor() {
    this.breakpointObserver
      .observe([Breakpoints.Handset])
      .pipe(takeUntilDestroyed())
      .subscribe((result) => {
        this.isMobile.set(result.matches);
      });
  }

  protected closeSidenav(): void {
    this.sidenav()?.close();
  }

  protected async onSignOut(): Promise<void> {
    await this.userStore.signOut();
    this.router.navigate(['/login']);
  }
}
