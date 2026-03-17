import { TestBed } from '@angular/core/testing';
import { MatSnackBar, MatSnackBarRef } from '@angular/material/snack-bar';
import { ErrorHandlerService, ErrorType } from './error-handler.service';
import { of, throwError } from 'rxjs';

describe('ErrorHandlerService', () => {
  let service: ErrorHandlerService;
  let snackBar: jasmine.SpyObj<MatSnackBar>;
  let snackBarRef: jasmine.SpyObj<MatSnackBarRef<any>>;

  beforeEach(() => {
    const snackBarSpy = jasmine.createSpyObj('MatSnackBar', ['open']);
    const snackBarRefSpy = jasmine.createSpyObj('MatSnackBarRef', ['onAction']);
    snackBarRefSpy.onAction.and.returnValue(of(undefined));

    TestBed.configureTestingModule({
      providers: [
        ErrorHandlerService,
        { provide: MatSnackBar, useValue: snackBarSpy }
      ]
    });

    service = TestBed.inject(ErrorHandlerService);
    snackBar = TestBed.inject(MatSnackBar) as jasmine.SpyObj<MatSnackBar>;
    snackBarRef = snackBarRefSpy;
    snackBar.open.and.returnValue(snackBarRef);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('showError', () => {
    it('should display error message with dismiss action when retry is false', () => {
      const errorMessage = 'Test error';

      service.showError(errorMessage, false);

      expect(snackBar.open).toHaveBeenCalledWith(
        errorMessage,
        'DISMISS',
        jasmine.objectContaining({
          duration: 5000,
          horizontalPosition: 'center',
          verticalPosition: 'bottom',
          panelClass: ['error-snackbar']
        })
      );
    });

    it('should display error message with retry action when retry is true', () => {
      const errorMessage = 'Test error with retry';
      const retryCallback = jasmine.createSpy('retryCallback');

      service.showError(errorMessage, true, retryCallback);

      expect(snackBar.open).toHaveBeenCalledWith(
        errorMessage,
        'RETRY',
        jasmine.objectContaining({
          duration: undefined,
          horizontalPosition: 'center',
          verticalPosition: 'bottom',
          panelClass: ['error-snackbar']
        })
      );
    });

    it('should execute retry callback when retry action is clicked', () => {
      const errorMessage = 'Test error with retry';
      const retryCallback = jasmine.createSpy('retryCallback');

      service.showError(errorMessage, true, retryCallback);

      // Simulate clicking the retry action
      snackBarRef.onAction().subscribe();

      expect(retryCallback).toHaveBeenCalled();
    });
  });

  describe('showSuccess', () => {
    it('should display success message', () => {
      const message = 'Operation successful';

      service.showSuccess(message);

      expect(snackBar.open).toHaveBeenCalledWith(
        message,
        'OK',
        jasmine.objectContaining({
          duration: 3000,
          panelClass: ['success-snackbar']
        })
      );
    });
  });

  describe('showInfo', () => {
    it('should display info message', () => {
      const message = 'Information message';

      service.showInfo(message);

      expect(snackBar.open).toHaveBeenCalledWith(
        message,
        'OK',
        jasmine.objectContaining({
          duration: 3000,
          panelClass: ['info-snackbar']
        })
      );
    });
  });

  describe('handleHttpError', () => {
    it('should return connection error message for status 0', () => {
      const error = { status: 0 };
      const result = service.handleHttpError(error);
      expect(result).toBe('Unable to connect to the server. Please check your internet connection.');
    });

    it('should return appropriate message for 400 error', () => {
      const error = { status: 400 };
      const result = service.handleHttpError(error);
      expect(result).toBe('Invalid request. Please check your input.');
    });

    it('should return appropriate message for 401 error', () => {
      const error = { status: 401 };
      const result = service.handleHttpError(error);
      expect(result).toBe('You are not authorized to perform this action.');
    });

    it('should return appropriate message for 404 error', () => {
      const error = { status: 404 };
      const result = service.handleHttpError(error);
      expect(result).toBe('The requested resource was not found.');
    });

    it('should return appropriate message for 500 error', () => {
      const error = { status: 500 };
      const result = service.handleHttpError(error);
      expect(result).toBe('Server error. Please try again later.');
    });

    it('should return default message for unknown error codes', () => {
      const error = { status: 418 }; // I'm a teapot
      const result = service.handleHttpError(error);
      expect(result).toBe('An unexpected error occurred. Please try again.');
    });
  });

  describe('getErrorType', () => {
    it('should return NETWORK for status 0', () => {
      const error = { status: 0 };
      expect(service.getErrorType(error)).toBe(ErrorType.NETWORK);
    });

    it('should return NETWORK for 5xx errors', () => {
      const error = { status: 503 };
      expect(service.getErrorType(error)).toBe(ErrorType.NETWORK);
    });

    it('should return API for 4xx errors', () => {
      const error = { status: 404 };
      expect(service.getErrorType(error)).toBe(ErrorType.API);
    });

    it('should return VALIDATION for ValidationError', () => {
      const error = { name: 'ValidationError' };
      expect(service.getErrorType(error)).toBe(ErrorType.VALIDATION);
    });

    it('should return UNKNOWN for other errors', () => {
      const error = { message: 'Some error' };
      expect(service.getErrorType(error)).toBe(ErrorType.UNKNOWN);
    });
  });

  describe('logError', () => {
    it('should log error to console in development mode', () => {
      spyOn(console, 'error');
      const error = new Error('Test error');
      const context = 'Test context';

      service.logError(error, context);

      expect(console.error).toHaveBeenCalledWith(
        'Error logged:',
        jasmine.objectContaining({
          context,
          error: jasmine.objectContaining({
            message: 'Test error'
          })
        })
      );
    });

    it('should handle errors without message property', () => {
      spyOn(console, 'error');
      const error = { status: 500 };

      service.logError(error);

      expect(console.error).toHaveBeenCalledWith(
        'Error logged:',
        jasmine.objectContaining({
          error: jasmine.objectContaining({
            message: 'Unknown error'
          })
        })
      );
    });
  });

  describe('retryWithBackoff', () => {
    it('should retry failed requests with exponential backoff', (done) => {
      let attemptCount = 0;
      const source$ = new Observable(observer => {
        attemptCount++;
        if (attemptCount < 3) {
          observer.error({ status: 503 });
        } else {
          observer.next('Success');
          observer.complete();
        }
      });

      source$.pipe(
        service.retryWithBackoff(3)
      ).subscribe({
        next: (result) => {
          expect(result).toBe('Success');
          expect(attemptCount).toBe(3);
          done();
        },
        error: () => {
          fail('Should not error after successful retry');
        }
      });
    });

    it('should not retry for excluded status codes', (done) => {
      const source$ = throwError(() => ({ status: 404 }));

      source$.pipe(
        service.retryWithBackoff(3)
      ).subscribe({
        next: () => {
          fail('Should not succeed');
        },
        error: (error) => {
          expect(error.status).toBe(404);
          done();
        }
      });
    });

    it('should fail after max retries exceeded', (done) => {
      let attemptCount = 0;
      const source$ = new Observable(observer => {
        attemptCount++;
        observer.error({ status: 503 });
      });

      source$.pipe(
        service.retryWithBackoff(2)
      ).subscribe({
        next: () => {
          fail('Should not succeed');
        },
        error: (error) => {
          expect(error.status).toBe(503);
          expect(attemptCount).toBe(3); // Initial attempt + 2 retries
          expect(snackBar.open).toHaveBeenCalledWith(
            'Maximum retry attempts reached. Please try again later.',
            jasmine.any(String),
            jasmine.any(Object)
          );
          done();
        }
      });
    });
  });
});