import { ChangeDetectionStrategy, Component, inject, signal, viewChild } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatSidenavModule, MatSidenav } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
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
    NgOptimizedImage,
  ],
  templateUrl: './shell.html',
  styleUrl: './shell.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Shell {
  private readonly breakpointObserver = inject(BreakpointObserver);
  protected readonly isMobile = signal(false);
  protected readonly sidenav = viewChild<MatSidenav>('sidenav');

  protected readonly navLinks = [
    { path: '/', label: 'Home', exact: true },
    { path: '/episodes', label: 'Episodes', exact: false },
    { path: '/tags', label: 'Tags', exact: false },
  ];

  protected readonly footerLinks = [
    { path: '/', label: 'Home' },
    { path: '/episodes', label: 'Episodes' },
    { path: '/tags', label: 'Tags' },
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
  }

  protected readonly currentYear = new Date().getFullYear();

  protected closeSidenav(): void {
    this.sidenav()?.close();
  }
}
