import { Component, OnInit, signal, Renderer2, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';

// Angular Material Imports
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';

// Components
import { UserList } from './components/user-list/user-list';
import { UserDetail } from './components/user-detail/user-detail';

/**
 * Root application component
 * Features:
 * - Material Design toolbar
 * - Responsive layout with sidenav
 * - Theme toggle (light/dark)
 * - Grid layout for list and detail views
 */
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    MatToolbarModule,
    MatSidenavModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatMenuModule,
    MatDividerModule,
    MatSlideToggleModule,
    UserList,
    UserDetail
  ],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit {
  // Application title
  protected readonly title = signal('User Management System');

  // Theme management
  isDarkTheme = signal(false);

  // Layout management
  showDetail = signal(true);
  isMobile = signal(false);

  // Inject Renderer for theme manipulation
  private renderer = inject(Renderer2);

  ngOnInit(): void {
    this.initializeTheme();
    this.checkMobileView();
    this.setupResponsiveListener();
  }

  /**
   * Initializes the theme based on user preference or system setting
   */
  private initializeTheme(): void {
    // Check localStorage for saved theme preference
    const savedTheme = localStorage.getItem('theme');

    if (savedTheme) {
      this.isDarkTheme.set(savedTheme === 'dark');
    } else {
      // Check system preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      this.isDarkTheme.set(prefersDark);
    }

    this.applyTheme();
  }

  /**
   * Toggles between light and dark theme
   */
  toggleTheme(): void {
    this.isDarkTheme.update(current => !current);
    this.applyTheme();

    // Save preference to localStorage
    localStorage.setItem('theme', this.isDarkTheme() ? 'dark' : 'light');
  }

  /**
   * Applies the current theme to the document
   */
  private applyTheme(): void {
    if (this.isDarkTheme()) {
      this.renderer.addClass(document.body, 'dark-theme');
      this.renderer.removeClass(document.body, 'light-theme');
    } else {
      this.renderer.addClass(document.body, 'light-theme');
      this.renderer.removeClass(document.body, 'dark-theme');
    }
  }

  /**
   * Checks if the current viewport is mobile
   */
  private checkMobileView(): void {
    this.isMobile.set(window.innerWidth <= 768);
  }

  /**
   * Sets up responsive listener for window resize
   */
  private setupResponsiveListener(): void {
    window.addEventListener('resize', () => {
      this.checkMobileView();
    });
  }

  /**
   * Toggles the detail panel visibility
   */
  toggleDetailPanel(): void {
    this.showDetail.update(current => !current);
  }

  /**
   * Gets the current year for footer
   * @returns Current year as number
   */
  getCurrentYear(): number {
    return new Date().getFullYear();
  }

  /**
   * Opens GitHub repository
   */
  openGitHub(): void {
    window.open('https://github.com/yourusername/user-management-angular', '_blank');
  }

  /**
   * Opens API documentation
   */
  openApiDocs(): void {
    window.open('https://jsonplaceholder.typicode.com/', '_blank');
  }

  /**
   * Shows about dialog (could be implemented as a Material Dialog)
   */
  showAbout(): void {
    // This could open a Material Dialog with app information
    console.log('Angular User Management System v1.0.0');
  }
}