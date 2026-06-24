import { ChangeDetectionStrategy, Component, inject, signal, viewChild } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  NavigationCancel,
  NavigationEnd,
  NavigationError,
  NavigationStart,
  Router,
  RouterLink,
  RouterLinkActive,
  RouterOutlet,
} from '@angular/router';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatSidenavModule, MatSidenav } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { NgOptimizedImage } from '@angular/common';

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
    MatProgressBarModule,
    NgOptimizedImage,
  ],
  templateUrl: './shell.html',
  styleUrl: './shell.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Shell {
  private readonly breakpointObserver = inject(BreakpointObserver);
  private readonly router = inject(Router);
  protected readonly isMobile = signal(false);
  // True while a route navigation is resolving. A blocking resolver (e.g. the
  // episode detail fetch) can otherwise leave the previous page on screen with
  // no feedback, making the app feel frozen; the toolbar progress bar shows
  // motion whenever a navigation is in flight.
  protected readonly navigating = signal(false);
  protected readonly sidenav = viewChild<MatSidenav>('sidenav');

  protected readonly navLinks = [
    { path: '/', label: 'Home', exact: true },
    { path: '/episodes', label: 'Episodes', exact: false },
    { path: '/explorer', label: 'Explorer', exact: false },
  ];

  protected readonly footerLinks = [
    { path: '/', label: 'Home' },
    { path: '/episodes', label: 'Episodes' },
    { path: '/explorer', label: 'Explorer' },
    { path: '/contact', label: 'Contact' },
    { path: '/terms', label: 'Terms of Use' },
    { path: '/privacy', label: 'Privacy Policy' },
  ];

  constructor() {
    this.breakpointObserver
      .observe([Breakpoints.Handset])
      .pipe(takeUntilDestroyed())
      .subscribe((result) => {
        this.isMobile.set(result.matches);
      });

    this.router.events.pipe(takeUntilDestroyed()).subscribe((event) => {
      if (event instanceof NavigationStart) {
        this.navigating.set(true);
      } else if (
        event instanceof NavigationEnd ||
        event instanceof NavigationCancel ||
        event instanceof NavigationError
      ) {
        this.navigating.set(false);
      }
    });
  }

  protected readonly currentYear = new Date().getFullYear();

  protected closeSidenav(): void {
    this.sidenav()?.close();
  }
}
