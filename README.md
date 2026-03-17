# User Management System

A professional Angular 21 application demonstrating modern web development best practices with Material Design, reactive programming, and comprehensive state management.

## Overview

This application showcases a complete user management system built with the latest Angular features, including standalone components, signals, and the new control flow syntax. It fetches user data from the JSONPlaceholder API and provides an intuitive interface for browsing, searching, and viewing detailed user information.

## Features

### Core Functionality
- **Real-time Search** - Instant user filtering with debouncing (300ms) and distinctUntilChanged operators
- **Advanced Filtering** - Filter users by company and city with dynamic dropdown menus
- **Sortable Data Table** - Click column headers to sort by name, email, username, or company
- **Pagination** - Customizable page sizes (5, 10, 25, 50 items per page)
- **Detailed User View** - Comprehensive user information display with tabbed interface
- **Data Export** - Export filtered user data to CSV format

### UI/UX Features
- **Material Design** - Professional Angular Material components throughout
- **Dark/Light Theme** - Toggle between themes with preference persistence
- **Skeleton Loading** - Professional loading states with animated skeletons
- **Error Handling** - Retry mechanism with user-friendly error messages
- **Responsive Design** - Mobile-first approach with adaptive layouts
- **Smooth Animations** - Fade-in, slide-in, and transition effects

### Technical Highlights
- **Reactive State Management** - BehaviorSubjects for centralized state
- **Smart Component Architecture** - Container and presentational component pattern
- **RxJS Best Practices** - Proper subscription management with takeUntil pattern
- **Type Safety** - Strict TypeScript configuration
- **Error Boundaries** - Comprehensive error handling with retry logic
- **Caching** - 5-minute cache for API responses
- **Accessibility** - ARIA labels, keyboard navigation, and screen reader support

## Tech Stack

### Core Technologies
- **Angular 21.2** - Latest version with standalone components
- **TypeScript 5.9** - Strict mode enabled
- **RxJS 7.8** - Reactive programming
- **Angular Material 21.2** - UI component library

### Development Tools
- **Vitest 4.0** - Fast unit testing framework
- **Prettier 3.8** - Code formatting
- **Angular CLI 21.2** - Build and development tooling

### Architecture Patterns
- Standalone Components
- Service-based State Management
- Reactive Programming with Observables
- Smart/Dumb Component Pattern
- Dependency Injection
- OnPush Change Detection (optimized)

## Getting Started

### Prerequisites
- Node.js 18.x or higher
- npm 10.x or higher

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/user-management-angular.git
cd user-management-angular
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm start
```

4. Open your browser and navigate to `http://localhost:4200/`

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm start` | Start development server on http://localhost:4200/ |
| `npm run build` | Build for production in `dist/` directory |
| `npm run watch` | Build in watch mode with development configuration |
| `npm test` | Run unit tests with Vitest |

## Project Structure

```
src/
├── app/
│   ├── components/
│   │   ├── user-list/          # User list with search and filters
│   │   │   ├── user-list.ts
│   │   │   ├── user-list.html
│   │   │   ├── user-list.css
│   │   │   └── user-list.spec.ts
│   │   └── user-detail/        # Detailed user information
│   │       ├── user-detail.ts
│   │       ├── user-detail.html
│   │       ├── user-detail.css
│   │       └── user-detail.spec.ts
│   ├── services/
│   │   ├── user.ts             # User data and state management
│   │   ├── user.spec.ts
│   │   ├── error-handler.service.ts
│   │   └── error-handler.service.spec.ts
│   ├── models/
│   │   └── user.models.ts      # TypeScript interfaces
│   ├── app.ts                  # Root component
│   ├── app.config.ts           # App configuration
│   └── app.routes.ts           # Routing configuration
├── styles.css                  # Global styles
└── index.html                  # HTML entry point
```

## Key Implementation Details

### Reactive Search
The search functionality implements debouncing and distinctUntilChanged to optimize performance:

```typescript
this.searchControl.valueChanges.pipe(
  takeUntil(this.destroy$),
  debounceTime(300),
  distinctUntilChanged(),
  tap(searchTerm => this.applyFilters())
).subscribe();
```

### State Management
Centralized state management using BehaviorSubjects:

```typescript
private allUsersSubject = new BehaviorSubject<User[]>([]);
private selectedUserSubject = new BehaviorSubject<User | null>(null);
public readonly allUsers$ = this.allUsersSubject.asObservable();
public readonly selectedUser$ = this.selectedUserSubject.asObservable();
```

### Error Handling
Comprehensive error handling with retry mechanism:

```typescript
return this.http.get<User[]>(this.API_URL).pipe(
  delay(300),
  retry(2),
  catchError(error => this.handleError(error))
);
```

### Subscription Management
Proper cleanup to prevent memory leaks:

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

## Best Practices Demonstrated

### Angular Best Practices
- ✅ Standalone components (no NgModules)
- ✅ OnPush change detection strategy
- ✅ Smart/dumb component architecture
- ✅ Proper lifecycle hook usage
- ✅ TrackBy functions for *ngFor optimization
- ✅ Signals for reactive state

### TypeScript Best Practices
- ✅ Strict mode enabled
- ✅ Comprehensive interface definitions
- ✅ Type-safe HTTP responses
- ✅ Proper use of generics
- ✅ JSDoc documentation

### RxJS Best Practices
- ✅ takeUntil for subscription management
- ✅ debounceTime for performance
- ✅ distinctUntilChanged to avoid duplicates
- ✅ catchError for error handling
- ✅ BehaviorSubject for state management

### Code Quality
- ✅ Single Responsibility Principle
- ✅ DRY (Don't Repeat Yourself)
- ✅ SOLID principles
- ✅ Comprehensive error handling
- ✅ Accessibility compliance (ARIA, keyboard nav)

## Features Breakdown

### User List Component
- Material data table with sorting
- Real-time search with debouncing
- Company and city filters
- Pagination with customizable page sizes
- Export to CSV functionality
- Loading skeletons
- Error state with retry button
- Empty state handling

### User Detail Component
- Tabbed interface (Contact, Company, Location)
- Interactive actions (email, call, website)
- Google Maps integration
- Copy to clipboard functionality
- GPS coordinates display
- Responsive card layout

### Error Handler Service
- Centralized error management
- User-friendly error messages
- Automatic retry with exponential backoff
- Material snackbar notifications
- Error logging for debugging

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Performance Optimizations

- OnPush change detection
- TrackBy functions in loops
- Lazy loading (ready for routing)
- HTTP response caching (5 minutes)
- Debounced search inputs
- Virtual scrolling ready
- Bundle size optimization

## Accessibility

- ARIA labels and roles
- Keyboard navigation support
- Screen reader compatibility
- Focus management
- Sufficient color contrast
- Responsive text sizing

## Future Enhancements

- [ ] Add comprehensive unit tests (80%+ coverage)
- [ ] Implement user CRUD operations
- [ ] Add advanced analytics dashboard
- [ ] Implement real authentication
- [ ] Add user avatar uploads
- [ ] WebSocket for real-time updates
- [ ] Progressive Web App (PWA) support
- [ ] Internationalization (i18n)
- [ ] Advanced data visualization
- [ ] User preferences persistence

## API Reference

This application uses the [JSONPlaceholder](https://jsonplaceholder.typicode.com/) API for demo data.

**Endpoint:** `GET https://jsonplaceholder.typicode.com/users`

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is open source and available under the [MIT License](LICENSE).

## Contact & Links

- **Portfolio:** [Your Portfolio URL]
- **LinkedIn:** [Your LinkedIn]
- **GitHub:** [@yourusername](https://github.com/yourusername)
- **Live Demo:** [Demo URL if deployed]

## Acknowledgments

- Angular Team for the amazing framework
- Material Design for the beautiful components
- JSONPlaceholder for the free API
- The open-source community

---

**Built with ❤️ using Angular 21 and Material Design**