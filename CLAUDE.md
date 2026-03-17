# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a professional Angular 21 application showcasing modern web development best practices. It implements a complete user management system with Material Design, reactive programming, and comprehensive state management. The app fetches data from JSONPlaceholder API and provides advanced search, filtering, pagination, and detailed user views.

## Essential Commands

### Development
```bash
npm start          # Start dev server on http://localhost:4200/
npm run build      # Production build to dist/
npm run watch      # Build in watch mode with development config
```

### Testing
```bash
npm test           # Run unit tests with Vitest
ng test --include='**/user.spec.ts'  # Run specific test file
```

## Architecture & Key Patterns

### Component Architecture
The app uses Angular 21's standalone components pattern with NO NgModules.

**Component Hierarchy:**
- `App` (root) → Material toolbar, theme toggle, responsive layout
  - `UserList` → Material data table with search, filters, pagination, sorting
  - `UserDetail` → Tabbed interface with contact, company, location details

### Service Layer
**UserService** (`src/app/services/user.ts`):
- Comprehensive state management with BehaviorSubjects
- Reactive data streams (allUsers$, filteredUsers$, selectedUser$, loading$, error$)
- Advanced filtering by search term, company, city
- Sorting functionality (name, email, username, company)
- Pagination support with page size options
- HTTP response caching (5-minute TTL)
- Error handling with retry mechanism

**ErrorHandlerService** (`src/app/services/error-handler.service.ts`):
- Centralized error management
- Material Snackbar notifications
- Automatic retry with exponential backoff
- User-friendly error messages
- Error logging for debugging

### State Management Pattern
**BehaviorSubject-based reactive state:**
```typescript
private allUsersSubject = new BehaviorSubject<User[]>([]);
public readonly allUsers$ = this.allUsersSubject.asObservable();
```

**Subscription cleanup with takeUntil:**
```typescript
private destroy$ = new Subject<void>();

ngOnInit() {
  this.service.data$.pipe(
    takeUntil(this.destroy$)
  ).subscribe();
}

ngOnDestroy() {
  this.destroy$.next();
  this.destroy$.complete();
}
```

### Data Models
**User interface** defined in `src/app/models/user.models.ts`:
- User (id, name, username, email, address, phone, website, company)
- Address (street, suite, city, zipcode, geo)
- Company (name, catchPhrase, bs)

## Implemented Features

### Core Functionality
✅ **Reactive Search with Debouncing**
- `debounceTime(300)` + `distinctUntilChanged()` operators
- Real-time filtering as user types
- Searches across name, username, email, company

✅ **Advanced Filtering**
- Dynamic company filter (dropdown)
- Dynamic city filter (dropdown)
- Combined filters with search
- Clear filters functionality

✅ **Material Data Table**
- Sortable columns (name, email, username, company)
- Pagination (5, 10, 25, 50 items per page)
- Row selection with visual feedback
- Responsive design

✅ **User Detail View**
- Tabbed interface (Contact, Company, Location)
- Interactive actions (email, call, website, maps)
- Copy to clipboard functionality
- GPS coordinates display
- Material cards and expansion panels

✅ **State Management**
- BehaviorSubjects for all state
- Shared service communication between components
- Selected user persistence across views
- Loading and error states

✅ **Professional UI/UX**
- Material Design throughout
- Dark/light theme toggle with localStorage persistence
- Skeleton loading animations
- Error handling with retry buttons
- Empty states ("No users found")
- CSV export functionality

### Technical Implementation

**HTTP Configuration:**
- `provideHttpClient(withInterceptorsFromDi())` in app.config.ts
- `provideAnimations()` for Material animations

**Theme Management:**
- Renderer2 for DOM manipulation
- LocalStorage for preference persistence
- System theme detection
- Body class toggling (dark-theme/light-theme)

**Responsive Layout:**
- CSS Grid for list/detail split view
- Breakpoints: 1200px, 992px, 768px, 480px
- Mobile-first approach
- Adaptive navigation

## Important Implementation Notes

1. **No NgModules** - All components are standalone with explicit imports

2. **Material Module Imports** - Each component imports only what it needs:
   - MatTableModule, MatPaginatorModule, MatSortModule
   - MatCardModule, MatButtonModule, MatIconModule
   - MatFormFieldModule, MatInputModule, MatSelectModule
   - MatChipsModule, MatTooltipModule, MatProgressBarModule
   - MatTabsModule, MatExpansionModule, MatListModule, etc.

3. **RxJS Operators** - Extensively used:
   - `takeUntil` - subscription cleanup
   - `debounceTime` - input debouncing
   - `distinctUntilChanged` - duplicate prevention
   - `catchError` - error handling
   - `tap` - side effects
   - `map` - data transformation
   - `retry` - automatic retries

4. **New Angular 21 Syntax:**
   - `@if`, `@for` control flow (not *ngIf, *ngFor)
   - Signals for reactive state (`signal()`, `computed()`)
   - `inject()` function for dependency injection

5. **Animations:**
   - `@angular/animations` used for slide-in, fade-in effects
   - Material animations for table rows, tabs, expansions

6. **No Axios** - Uses Angular HttpClient exclusively

## File Organization

```
components/[component-name]/
├── [component-name].ts       # Component class with comprehensive logic
├── [component-name].html     # Template with Material components
├── [component-name].css      # Component-specific styles
└── [component-name].spec.ts  # Unit tests
```

Services and models in dedicated directories under `src/app/`.

## Configuration Files

- **angular.json**: Vite-based build with production/development configs
- **tsconfig.json**: Strict mode TypeScript with ES2022 target
- **.prettierrc**: 100 char line width, single quotes, Angular parser
- **VS Code**: Debug configs for serve and test in `.vscode/launch.json`

## Development Guidelines

### When Adding New Features:
1. Follow standalone component pattern
2. Import only required Material modules
3. Use BehaviorSubjects for state management
4. Implement proper subscription cleanup
5. Add loading and error states
6. Use TypeScript strict typing
7. Add comprehensive JSDoc comments
8. Follow existing naming conventions
9. Implement responsive design
10. Add appropriate animations

### Best Practices in Use:
- OnPush change detection (where beneficial)
- TrackBy functions for *ngFor optimization
- Reactive forms for user input
- Service-based state management
- Smart/dumb component pattern
- SOLID principles
- DRY code
- Accessibility (ARIA labels, keyboard nav)

## Known Patterns

### Component Communication:
```typescript
// Service-based (current approach)
this.userService.setSelectedUser(user);
this.userService.selectedUser$.subscribe(user => {...});
```

### Search Implementation:
```typescript
this.searchControl.valueChanges.pipe(
  takeUntil(this.destroy$),
  debounceTime(300),
  distinctUntilChanged(),
  tap(() => this.applyFilters())
).subscribe();
```

### Error Handling:
```typescript
catchError(error => {
  this.errorHandler.handleHttpError(error);
  this.errorHandler.showError(message, true, () => this.retry());
  return of([]);
});
```

## Testing Setup

- **Framework**: Vitest 4.0 (not Karma/Jasmine)
- **Test files**: `*.spec.ts` alongside components
- **Coverage**: Tests written for ErrorHandlerService
- **Mocking**: Use jasmine.createSpyObj for service mocks

## Current State

**Production-Ready Features:**
- ✅ Complete user list with search, filter, sort, pagination
- ✅ Detailed user view with tabbed interface
- ✅ Material Design UI throughout
- ✅ Dark/light theme toggle
- ✅ Error handling with retry
- ✅ Responsive design
- ✅ Skeleton loading states
- ✅ CSV export
- ✅ Professional layout with toolbar and footer

**Potential Enhancements:**
- Add comprehensive unit tests (currently minimal)
- Implement routing for detail view
- Add user CRUD operations
- Implement authentication
- Add more advanced data visualizations

## Dependencies

**Production:**
- Angular 21.2 (core, common, forms, router, animations)
- Angular Material 21.2
- Angular CDK 21.2
- RxJS 7.8
- TypeScript 5.9

**Development:**
- Angular CLI 21.2
- Vitest 4.0
- Prettier 3.8
- jsdom 28.0

## API Integration

**Endpoint:** `https://jsonplaceholder.typicode.com/users`

**Response caching:** 5-minute TTL to reduce API calls

**Error handling:** Automatic retry (2 attempts) with user-friendly messages