import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { animate, style, transition, trigger } from '@angular/animations';

// Angular Material Imports
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatListModule } from '@angular/material/list';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTabsModule } from '@angular/material/tabs';
import { MatExpansionModule } from '@angular/material/expansion';

// Services and Models
import { UserService } from '../../services/user';
import { User } from '../../models/user.models';

/**
 * Component for displaying detailed user information
 * Features:
 * - Comprehensive user information display
 * - Material Design card layout
 * - Tabbed interface for organized information
 * - Responsive design
 * - Animation effects
 */
@Component({
  selector: 'app-user-detail',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatDividerModule,
    MatListModule,
    MatChipsModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    MatTabsModule,
    MatExpansionModule
  ],
  templateUrl: './user-detail.html',
  styleUrl: './user-detail.css',
  animations: [
    trigger('slideIn', [
      transition(':enter', [
        style({ transform: 'translateX(100%)', opacity: 0 }),
        animate('300ms ease-out', style({ transform: 'translateX(0)', opacity: 1 }))
      ]),
      transition(':leave', [
        animate('300ms ease-in', style({ transform: 'translateX(100%)', opacity: 0 }))
      ])
    ]),
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('200ms ease-out', style({ opacity: 1 }))
      ])
    ])
  ]
})
export class UserDetail implements OnInit, OnDestroy {
  // Component state
  selectedUser: User | null = null;
  isLoading = false;

  // RxJS subscription management
  private destroy$ = new Subject<void>();

  constructor(private userService: UserService) {}

  ngOnInit(): void {
    this.subscribeToSelectedUser();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Subscribes to selected user changes
   */
  private subscribeToSelectedUser(): void {
    this.userService.selectedUser$
      .pipe(takeUntil(this.destroy$))
      .subscribe(user => {
        this.selectedUser = user;
      });

    this.userService.loading$
      .pipe(takeUntil(this.destroy$))
      .subscribe(loading => {
        this.isLoading = loading;
      });
  }

  /**
   * Clears the selected user
   */
  clearSelection(): void {
    this.userService.clearSelection();
  }

  /**
   * Gets user initials for avatar
   * @param name - The user's full name
   * @returns Two character initials
   */
  getUserInitials(name: string): string {
    if (!name) return '??';
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return parts[0][0] + parts[1][0];
    }
    return name.substring(0, 2).toUpperCase();
  }

  /**
   * Formats the full address
   * @param address - The address object
   * @returns Formatted address string
   */
  getFullAddress(address: any): string {
    if (!address) return 'N/A';
    return `${address.street}, ${address.suite}, ${address.city}, ${address.zipcode}`;
  }

  /**
   * Opens email client with pre-filled email
   * @param email - The email address
   */
  sendEmail(email: string): void {
    window.location.href = `mailto:${email}`;
  }

  /**
   * Opens phone dialer or app
   * @param phone - The phone number
   */
  callPhone(phone: string): void {
    // Remove any non-numeric characters except + and -
    const cleanedPhone = phone.replace(/[^0-9+-]/g, '');
    window.location.href = `tel:${cleanedPhone}`;
  }

  /**
   * Opens website in new tab
   * @param website - The website URL
   */
  openWebsite(website: string): void {
    // Ensure the URL has a protocol
    const url = website.startsWith('http') ? website : `https://${website}`;
    window.open(url, '_blank');
  }

  /**
   * Opens Google Maps with the user's location
   * @param address - The address object
   */
  openMap(address: any): void {
    if (!address) return;

    const query = `${address.street}, ${address.city}, ${address.zipcode}`;
    const encodedQuery = encodeURIComponent(query);
    window.open(`https://www.google.com/maps/search/?api=1&query=${encodedQuery}`, '_blank');
  }

  /**
   * Opens precise coordinates in Google Maps
   * @param geo - The geo object with lat and lng
   */
  openCoordinates(geo: any): void {
    if (!geo || !geo.lat || !geo.lng) return;
    window.open(`https://www.google.com/maps?q=${geo.lat},${geo.lng}`, '_blank');
  }

  /**
   * Copies text to clipboard
   * @param text - The text to copy
   * @param type - The type of content being copied
   */
  copyToClipboard(text: string, type: string): void {
    navigator.clipboard.writeText(text).then(() => {
      // You could show a snackbar here for feedback
      console.log(`${type} copied to clipboard`);
    });
  }

  /**
   * Gets icon for contact method
   * @param type - The contact type
   * @returns Material icon name
   */
  getContactIcon(type: string): string {
    const icons: Record<string, string> = {
      email: 'email',
      phone: 'phone',
      website: 'language',
      address: 'location_on'
    };
    return icons[type] || 'info';
  }

  /**
   * Formats company information for display
   * @param company - The company object
   * @returns Formatted company details array
   */
  getCompanyDetails(company: any): { label: string; value: string; icon: string }[] {
    if (!company) return [];

    return [
      { label: 'Company Name', value: company.name, icon: 'business' },
      { label: 'Catchphrase', value: company.catchPhrase, icon: 'format_quote' },
      { label: 'Business', value: company.bs, icon: 'work' }
    ];
  }

  /**
   * Gets tab count for badges
   * @param tab - The tab name
   * @returns Count of items in that tab
   */
  getTabBadgeCount(tab: string): number {
    if (!this.selectedUser) return 0;

    switch (tab) {
      case 'contact':
        return 4; // Email, Phone, Website, Address
      case 'company':
        return 3; // Name, Catchphrase, BS
      case 'address':
        return 2; // Address, Coordinates
      default:
        return 0;
    }
  }
}