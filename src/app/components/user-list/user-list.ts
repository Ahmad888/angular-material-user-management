import { Component, OnInit, OnDestroy, ViewChild, AfterViewInit } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Subject } from 'rxjs';
import { takeUntil, debounceTime, distinctUntilChanged, tap } from 'rxjs/operators';
import { animate, state, style, transition, trigger } from '@angular/animations';

// Angular Material Imports
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginatorModule, MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatSortModule, MatSort, Sort } from '@angular/material/sort';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSelectModule } from '@angular/material/select';
import { MatBadgeModule } from '@angular/material/badge';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

// Services and Models
import { UserService, UserSortOptions } from '../../services/user';
import { ErrorHandlerService } from '../../services/error-handler.service';
import { User } from '../../models/user.models';

/**
 * Component for displaying and managing the user list
 * Features:
 * - Real-time search with debouncing
 * - Sortable columns
 * - Pagination
 * - Material Design table
 * - Loading states with skeletons
 * - Error handling with retry
 */
@Component({
  selector: 'app-user-list',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatInputModule,
    MatFormFieldModule,
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule,
    MatCardModule,
    MatChipsModule,
    MatTooltipModule,
    MatSelectModule,
    MatBadgeModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './user-list.html',
  styleUrl: './user-list.css',
  animations: [
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(10px)' }),
        animate('300ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
      ])
    ]),
    trigger('slideIn', [
      transition(':enter', [
        style({ transform: 'translateX(-100%)' }),
        animate('200ms ease-out', style({ transform: 'translateX(0)' }))
      ])
    ])
  ]
})
export class UserList implements OnInit, OnDestroy, AfterViewInit {
  // ViewChild references for Material components
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  // Form controls
  searchControl = new FormControl('');
  companyFilterControl = new FormControl('');
  cityFilterControl = new FormControl('');

  // Data source for Material table
  dataSource = new MatTableDataSource<User>([]);

  // Table configuration
  displayedColumns: string[] = ['id', 'name', 'username', 'email', 'company', 'city', 'actions'];
  pageSizeOptions = [5, 10, 25, 50];

  // Component state
  isLoading = false;
  hasError = false;
  errorMessage = '';
  totalUsers = 0;
  filteredCount = 0;
  selectedUser: User | null = null;

  // Filter options
  uniqueCompanies: string[] = [];
  uniqueCities: string[] = [];

  // Skeleton loading array for displaying loading placeholders
  skeletonRows = Array(5).fill(0);

  // RxJS subscription management
  private destroy$ = new Subject<void>();

  constructor(
    private userService: UserService,
    private errorHandler: ErrorHandlerService
  ) {}

  ngOnInit(): void {
    this.initializeSubscriptions();
    this.loadUsers();
  }

  ngAfterViewInit(): void {
    // Connect Material Sort and Paginator to data source
    if (this.dataSource) {
      this.dataSource.paginator = this.paginator;
      this.dataSource.sort = this.sort;
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Initializes all component subscriptions
   */
  private initializeSubscriptions(): void {
    // Subscribe to search control changes with debouncing
    this.searchControl.valueChanges
      .pipe(
        takeUntil(this.destroy$),
        debounceTime(300), // Wait 300ms after user stops typing
        distinctUntilChanged(), // Only emit if value is different from previous
        tap(searchTerm => this.applyFilters())
      )
      .subscribe();

    // Subscribe to company filter changes
    this.companyFilterControl.valueChanges
      .pipe(
        takeUntil(this.destroy$),
        tap(() => this.applyFilters())
      )
      .subscribe();

    // Subscribe to city filter changes
    this.cityFilterControl.valueChanges
      .pipe(
        takeUntil(this.destroy$),
        tap(() => this.applyFilters())
      )
      .subscribe();

    // Subscribe to loading state
    this.userService.loading$
      .pipe(takeUntil(this.destroy$))
      .subscribe(loading => {
        this.isLoading = loading;
      });

    // Subscribe to error state
    this.userService.error$
      .pipe(takeUntil(this.destroy$))
      .subscribe(error => {
        this.hasError = !!error;
        this.errorMessage = error || '';
      });

    // Subscribe to selected user
    this.userService.selectedUser$
      .pipe(takeUntil(this.destroy$))
      .subscribe(user => {
        this.selectedUser = user;
      });

    // Subscribe to filtered users for the table
    this.userService.filteredUsers$
      .pipe(takeUntil(this.destroy$))
      .subscribe(users => {
        this.dataSource.data = users;
        this.filteredCount = users.length;
      });

    // Subscribe to all users for total count
    this.userService.allUsers$
      .pipe(takeUntil(this.destroy$))
      .subscribe(users => {
        this.totalUsers = users.length;
        this.uniqueCompanies = this.userService.getUniqueCompanies();
        this.uniqueCities = this.userService.getUniqueCities();
      });
  }

  /**
   * Loads users from the service
   */
  loadUsers(): void {
    this.userService.getUsers().subscribe();
  }

  /**
   * Refreshes the user list
   */
  refreshUsers(): void {
    this.clearFilters();
    this.userService.refreshUsers().subscribe();
  }

  /**
   * Applies all active filters
   */
  private applyFilters(): void {
    const searchTerm = this.searchControl.value || '';
    const companyFilter = this.companyFilterControl.value || '';
    const cityFilter = this.cityFilterControl.value || '';

    this.userService.filterUsers(searchTerm, {
      companyFilter,
      cityFilter
    });
  }

  /**
   * Clears all filters
   */
  clearFilters(): void {
    this.searchControl.setValue('', { emitEvent: false });
    this.companyFilterControl.setValue('', { emitEvent: false });
    this.cityFilterControl.setValue('', { emitEvent: false });
    this.userService.clearFilters();
  }

  /**
   * Handles sort change from Material Sort
   * @param sort - The sort event from Material Sort
   */
  onSortChange(sort: Sort): void {
    if (sort.active && sort.direction) {
      const field = this.mapSortField(sort.active);
      if (field) {
        this.userService.sortUsers(field, sort.direction as 'asc' | 'desc');
      }
    }
  }

  /**
   * Maps Material table column to service sort field
   * @param column - The column name from Material table
   * @returns The corresponding sort field
   */
  private mapSortField(column: string): UserSortOptions['field'] | null {
    const mapping: Record<string, UserSortOptions['field']> = {
      'name': 'name',
      'email': 'email',
      'username': 'username',
      'company': 'company'
    };
    return mapping[column] || null;
  }

  /**
   * Handles user selection
   * @param user - The selected user
   */
  selectUser(user: User): void {
    this.userService.setSelectedUser(user);
  }

  /**
   * Handles view details action
   * @param user - The user to view details for
   * @param event - The click event
   */
  viewDetails(user: User, event: Event): void {
    event.stopPropagation(); // Prevent row click
    this.selectUser(user);
  }

  /**
   * Gets display text for results count
   * @returns Formatted results text
   */
  getResultsText(): string {
    if (this.filteredCount === this.totalUsers) {
      return `Showing all ${this.totalUsers} users`;
    }
    return `Showing ${this.filteredCount} of ${this.totalUsers} users`;
  }

  /**
   * Checks if any filters are active
   * @returns true if filters are active
   */
  hasActiveFilters(): boolean {
    return !!(this.searchControl.value ||
              this.companyFilterControl.value ||
              this.cityFilterControl.value);
  }

  /**
   * Gets badge count for active filters
   * @returns Number of active filters
   */
  getActiveFilterCount(): number {
    let count = 0;
    if (this.searchControl.value) count++;
    if (this.companyFilterControl.value) count++;
    if (this.cityFilterControl.value) count++;
    return count;
  }

  /**
   * Formats company display with shortened BS
   * @param company - The company object
   * @returns Formatted company string
   */
  formatCompany(company: any): string {
    if (!company) return 'N/A';
    const bs = company.bs || '';
    const shortBs = bs.length > 30 ? bs.substring(0, 30) + '...' : bs;
    return `${company.name}`;
  }

  /**
   * Gets tooltip text for company
   * @param company - The company object
   * @returns Full company details
   */
  getCompanyTooltip(company: any): string {
    if (!company) return 'N/A';
    return `${company.name}\n${company.catchPhrase}\n${company.bs}`;
  }

  /**
   * Gets initials for user avatar
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
   * Handles retry action for failed requests
   */
  retry(): void {
    this.hasError = false;
    this.loadUsers();
  }

  /**
   * Exports user data to CSV
   */
  exportToCSV(): void {
    const users = this.dataSource.filteredData || this.dataSource.data;
    if (users.length === 0) {
      this.errorHandler.showInfo('No data to export');
      return;
    }

    // Create CSV content
    const headers = ['ID', 'Name', 'Username', 'Email', 'Phone', 'Company', 'City', 'Website'];
    const rows = users.map(user => [
      user.id,
      user.name,
      user.username,
      user.email,
      user.phone,
      user.company.name,
      user.address.city,
      user.website
    ]);

    let csvContent = headers.join(',') + '\n';
    rows.forEach(row => {
      csvContent += row.map(cell => `"${cell}"`).join(',') + '\n';
    });

    // Create download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `users_${new Date().getTime()}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    this.errorHandler.showSuccess(`Exported ${users.length} users to CSV`);
  }

  /**
   * Tracks users by ID for *ngFor optimization
   * @param index - The index
   * @param user - The user object
   * @returns The unique identifier
   */
  trackByUserId(index: number, user: User): number {
    return user.id;
  }
}