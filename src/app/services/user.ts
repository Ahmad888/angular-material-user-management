import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError, of } from 'rxjs';
import { catchError, tap, map, delay, retry } from 'rxjs/operators';
import { User } from '../models/user.models';
import { ErrorHandlerService } from './error-handler.service';

/**
 * Interface for paginated data response
 */
export interface PaginatedData<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/**
 * Sorting options for users
 */
export interface UserSortOptions {
  field: 'name' | 'email' | 'username' | 'company';
  direction: 'asc' | 'desc';
}

/**
 * Filter options for users
 */
export interface UserFilterOptions {
  searchTerm?: string;
  companyFilter?: string;
  cityFilter?: string;
}

/**
 * Service state interface
 */
export interface UserServiceState {
  users: User[];
  selectedUser: User | null;
  loading: boolean;
  error: string | null;
  filters: UserFilterOptions;
  sort: UserSortOptions;
  pagination: {
    page: number;
    pageSize: number;
    total: number;
  };
}

/**
 * Service for managing user data and state
 * Provides reactive state management, pagination, sorting, and filtering
 */
@Injectable({
  providedIn: 'root',
})
export class UserService {
  private readonly API_URL = 'https://jsonplaceholder.typicode.com/users';

  // State management subjects
  private allUsersSubject = new BehaviorSubject<User[]>([]);
  private filteredUsersSubject = new BehaviorSubject<User[]>([]);
  private selectedUserSubject = new BehaviorSubject<User | null>(null);
  private loadingSubject = new BehaviorSubject<boolean>(false);
  private errorSubject = new BehaviorSubject<string | null>(null);
  private sortOptionsSubject = new BehaviorSubject<UserSortOptions>({
    field: 'name',
    direction: 'asc'
  });
  private paginationSubject = new BehaviorSubject({
    page: 0,
    pageSize: 10,
    total: 0
  });

  // Public observables
  public readonly allUsers$ = this.allUsersSubject.asObservable();
  public readonly filteredUsers$ = this.filteredUsersSubject.asObservable();
  public readonly selectedUser$ = this.selectedUserSubject.asObservable();
  public readonly loading$ = this.loadingSubject.asObservable();
  public readonly error$ = this.errorSubject.asObservable();
  public readonly sortOptions$ = this.sortOptionsSubject.asObservable();
  public readonly pagination$ = this.paginationSubject.asObservable();

  // Cache management
  private lastFetchTime: number | null = null;
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  constructor(
    private http: HttpClient,
    private errorHandler: ErrorHandlerService
  ) {}

  /**
   * Fetches users from the API with caching support
   * @param forceRefresh - Force a fresh fetch even if cached data exists
   * @returns Observable of User array
   */
  getUsers(forceRefresh = false): Observable<User[]> {
    // Check if we have cached data and it's still valid
    if (!forceRefresh && this.isCacheValid() && this.allUsersSubject.value.length > 0) {
      return of(this.allUsersSubject.value);
    }

    this.loadingSubject.next(true);
    this.errorSubject.next(null);

    return this.http.get<User[]>(this.API_URL).pipe(
      // Add artificial delay to showcase loading states
      delay(300),
      retry(2), // Retry up to 2 times on failure
      tap(users => {
        this.allUsersSubject.next(users);
        this.filteredUsersSubject.next(users);
        this.lastFetchTime = Date.now();
        this.updatePaginationTotal(users.length);
        this.loadingSubject.next(false);
      }),
      catchError(error => this.handleError(error)),
      tap(() => this.loadingSubject.next(false))
    );
  }

  /**
   * Refreshes user data from the API
   * @returns Observable of User array
   */
  refreshUsers(): Observable<User[]> {
    return this.getUsers(true);
  }

  /**
   * Sets the currently selected user
   * @param user - The user to select or null to clear selection
   */
  setSelectedUser(user: User | null): void {
    this.selectedUserSubject.next(user);
  }

  /**
   * Gets a user by ID
   * @param id - The user ID
   * @returns The user or undefined if not found
   */
  getUserById(id: number): User | undefined {
    return this.allUsersSubject.value.find(user => user.id === id);
  }

  /**
   * Filters users based on search term and other criteria
   * @param searchTerm - The search term to filter by
   * @param additionalFilters - Additional filter options
   */
  filterUsers(searchTerm: string, additionalFilters?: Partial<UserFilterOptions>): void {
    let filtered = [...this.allUsersSubject.value];

    // Apply search term filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(user =>
        user.name.toLowerCase().includes(term) ||
        user.username.toLowerCase().includes(term) ||
        user.email.toLowerCase().includes(term) ||
        user.company.name.toLowerCase().includes(term)
      );
    }

    // Apply company filter if provided
    if (additionalFilters?.companyFilter) {
      filtered = filtered.filter(user =>
        user.company.name.toLowerCase().includes(additionalFilters.companyFilter!.toLowerCase())
      );
    }

    // Apply city filter if provided
    if (additionalFilters?.cityFilter) {
      filtered = filtered.filter(user =>
        user.address.city.toLowerCase().includes(additionalFilters.cityFilter!.toLowerCase())
      );
    }

    // Apply current sorting
    filtered = this.applySorting(filtered);

    this.filteredUsersSubject.next(filtered);
    this.updatePaginationTotal(filtered.length);

    // Reset to first page when filtering
    this.paginationSubject.next({
      ...this.paginationSubject.value,
      page: 0,
      total: filtered.length
    });
  }

  /**
   * Sorts users by specified field and direction
   * @param field - The field to sort by
   * @param direction - The sort direction
   */
  sortUsers(field: UserSortOptions['field'], direction: UserSortOptions['direction'] = 'asc'): void {
    this.sortOptionsSubject.next({ field, direction });

    const sorted = this.applySorting([...this.filteredUsersSubject.value]);
    this.filteredUsersSubject.next(sorted);
  }

  /**
   * Applies sorting to a user array
   * @param users - The users to sort
   * @returns Sorted user array
   */
  private applySorting(users: User[]): User[] {
    const { field, direction } = this.sortOptionsSubject.value;

    return users.sort((a, b) => {
      let aValue: string | number;
      let bValue: string | number;

      switch (field) {
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'email':
          aValue = a.email.toLowerCase();
          bValue = b.email.toLowerCase();
          break;
        case 'username':
          aValue = a.username.toLowerCase();
          bValue = b.username.toLowerCase();
          break;
        case 'company':
          aValue = a.company.name.toLowerCase();
          bValue = b.company.name.toLowerCase();
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return direction === 'asc' ? 1 : -1;
      return 0;
    });
  }

  /**
   * Gets paginated users based on current page and page size
   * @returns Observable of PaginatedData containing users
   */
  getPaginatedUsers(): Observable<PaginatedData<User>> {
    return this.filteredUsers$.pipe(
      map(users => {
        const { page, pageSize } = this.paginationSubject.value;
        const start = page * pageSize;
        const end = start + pageSize;
        const paginatedUsers = users.slice(start, end);

        return {
          data: paginatedUsers,
          total: users.length,
          page,
          pageSize,
          totalPages: Math.ceil(users.length / pageSize)
        };
      })
    );
  }

  /**
   * Updates pagination settings
   * @param page - The page number (0-indexed)
   * @param pageSize - The number of items per page
   */
  setPagination(page: number, pageSize: number): void {
    this.paginationSubject.next({
      ...this.paginationSubject.value,
      page,
      pageSize
    });
  }

  /**
   * Updates the total count for pagination
   * @param total - The total number of items
   */
  private updatePaginationTotal(total: number): void {
    this.paginationSubject.next({
      ...this.paginationSubject.value,
      total
    });
  }

  /**
   * Clears the selected user
   */
  clearSelection(): void {
    this.selectedUserSubject.next(null);
  }

  /**
   * Clears all filters and resets to original data
   */
  clearFilters(): void {
    this.filteredUsersSubject.next([...this.allUsersSubject.value]);
    this.updatePaginationTotal(this.allUsersSubject.value.length);
    this.paginationSubject.next({
      ...this.paginationSubject.value,
      page: 0
    });
  }

  /**
   * Gets unique company names from all users
   * @returns Array of unique company names
   */
  getUniqueCompanies(): string[] {
    const companies = new Set(this.allUsersSubject.value.map(user => user.company.name));
    return Array.from(companies).sort();
  }

  /**
   * Gets unique cities from all users
   * @returns Array of unique city names
   */
  getUniqueCities(): string[] {
    const cities = new Set(this.allUsersSubject.value.map(user => user.address.city));
    return Array.from(cities).sort();
  }

  /**
   * Checks if the cache is still valid
   * @returns true if cache is valid, false otherwise
   */
  private isCacheValid(): boolean {
    if (!this.lastFetchTime) return false;
    return Date.now() - this.lastFetchTime < this.CACHE_DURATION;
  }

  /**
   * Handles HTTP errors
   * @param error - The HTTP error response
   * @returns Observable that emits an empty array
   */
  private handleError(error: HttpErrorResponse): Observable<User[]> {
    const errorMessage = this.errorHandler.handleHttpError(error);
    this.errorSubject.next(errorMessage);
    this.errorHandler.showError(errorMessage, true, () => {
      this.refreshUsers().subscribe();
    });
    this.errorHandler.logError(error, 'UserService.getUsers');
    return of([]);
  }

  /**
   * Gets the current state snapshot
   * @returns Current state of the service
   */
  getState(): UserServiceState {
    return {
      users: this.allUsersSubject.value,
      selectedUser: this.selectedUserSubject.value,
      loading: this.loadingSubject.value,
      error: this.errorSubject.value,
      filters: {
        searchTerm: '',
        companyFilter: '',
        cityFilter: ''
      },
      sort: this.sortOptionsSubject.value,
      pagination: this.paginationSubject.value
    };
  }

  /**
   * Resets the service to initial state
   */
  reset(): void {
    this.allUsersSubject.next([]);
    this.filteredUsersSubject.next([]);
    this.selectedUserSubject.next(null);
    this.loadingSubject.next(false);
    this.errorSubject.next(null);
    this.sortOptionsSubject.next({ field: 'name', direction: 'asc' });
    this.paginationSubject.next({ page: 0, pageSize: 10, total: 0 });
    this.lastFetchTime = null;
  }
}