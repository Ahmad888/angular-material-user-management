import { Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Observable, throwError, timer } from 'rxjs';
import { mergeMap, retryWhen, finalize } from 'rxjs/operators';

/**
 * Error types for categorizing different kinds of errors
 */
export enum ErrorType {
  NETWORK = 'NETWORK',
  API = 'API',
  VALIDATION = 'VALIDATION',
  UNKNOWN = 'UNKNOWN'
}

/**
 * Interface for error messages with retry capability
 */
export interface ErrorMessage {
  message: string;
  type: ErrorType;
  canRetry?: boolean;
  retryCallback?: () => void;
}

/**
 * Service for centralized error handling across the application
 * Provides user-friendly error messages and retry mechanisms
 */
@Injectable({
  providedIn: 'root'
})
export class ErrorHandlerService {
  private readonly DEFAULT_ERROR_MESSAGE = 'An unexpected error occurred. Please try again.';
  private readonly RETRY_DELAY = 1000; // Initial retry delay in ms
  private readonly MAX_RETRIES = 3;

  constructor(private snackBar: MatSnackBar) {}

  /**
   * Displays an error message to the user using Material Snackbar
   * @param error - The error to display
   * @param canRetry - Whether to show a retry action
   * @param retryCallback - Function to call when retry is clicked
   */
  showError(error: string | ErrorMessage, canRetry = false, retryCallback?: () => void): void {
    const errorMessage = typeof error === 'string'
      ? error
      : error.message;

    const action = canRetry && retryCallback ? 'RETRY' : 'DISMISS';

    const snackBarRef = this.snackBar.open(errorMessage, action, {
      duration: canRetry ? undefined : 5000,
      horizontalPosition: 'center',
      verticalPosition: 'bottom',
      panelClass: ['error-snackbar']
    });

    if (canRetry && retryCallback) {
      snackBarRef.onAction().subscribe(() => {
        retryCallback();
      });
    }
  }

  /**
   * Shows a success message
   * @param message - The success message to display
   */
  showSuccess(message: string): void {
    this.snackBar.open(message, 'OK', {
      duration: 3000,
      horizontalPosition: 'center',
      verticalPosition: 'bottom',
      panelClass: ['success-snackbar']
    });
  }

  /**
   * Shows an info message
   * @param message - The info message to display
   */
  showInfo(message: string): void {
    this.snackBar.open(message, 'OK', {
      duration: 3000,
      horizontalPosition: 'center',
      verticalPosition: 'bottom',
      panelClass: ['info-snackbar']
    });
  }

  /**
   * Handles HTTP errors and returns user-friendly messages
   * @param error - The HTTP error response
   * @returns User-friendly error message
   */
  handleHttpError(error: any): string {
    if (error.status === 0) {
      return 'Unable to connect to the server. Please check your internet connection.';
    }

    switch (error.status) {
      case 400:
        return 'Invalid request. Please check your input.';
      case 401:
        return 'You are not authorized to perform this action.';
      case 403:
        return 'Access forbidden.';
      case 404:
        return 'The requested resource was not found.';
      case 408:
        return 'Request timeout. Please try again.';
      case 500:
        return 'Server error. Please try again later.';
      case 502:
        return 'Bad gateway. The server is temporarily unavailable.';
      case 503:
        return 'Service unavailable. Please try again later.';
      default:
        return this.DEFAULT_ERROR_MESSAGE;
    }
  }

  /**
   * Determines the error type based on the error object
   * @param error - The error object
   * @returns The error type
   */
  getErrorType(error: any): ErrorType {
    if (error.status === 0 || (error.status >= 500 && error.status < 600)) {
      return ErrorType.NETWORK;
    }
    if (error.status >= 400 && error.status < 500) {
      return ErrorType.API;
    }
    if (error.name === 'ValidationError') {
      return ErrorType.VALIDATION;
    }
    return ErrorType.UNKNOWN;
  }

  /**
   * RxJS operator for automatic retry with exponential backoff
   * @param maxRetries - Maximum number of retry attempts
   * @param excludeStatusCodes - HTTP status codes that should not trigger a retry
   * @returns Observable operator for retry logic
   */
  retryWithBackoff(maxRetries = this.MAX_RETRIES, excludeStatusCodes: number[] = [400, 401, 403, 404]) {
    let retries = 0;

    return (src: Observable<any>) => src.pipe(
      retryWhen(errors => errors.pipe(
        mergeMap(error => {
          // Don't retry for certain status codes
          if (excludeStatusCodes.includes(error?.status)) {
            return throwError(() => error);
          }

          retries++;
          if (retries > maxRetries) {
            this.showError('Maximum retry attempts reached. Please try again later.');
            return throwError(() => error);
          }

          const delay = this.RETRY_DELAY * Math.pow(2, retries - 1);
          this.showInfo(`Retrying... Attempt ${retries} of ${maxRetries}`);
          return timer(delay);
        })
      )),
      finalize(() => {
        if (retries > 0 && retries <= maxRetries) {
          this.showSuccess('Request successful after retry');
        }
        retries = 0;
      })
    );
  }

  /**
   * Logs error for debugging (in production, this would send to a logging service)
   * @param error - The error to log
   * @param context - Additional context about where the error occurred
   */
  logError(error: any, context?: string): void {
    const timestamp = new Date().toISOString();
    const errorInfo = {
      timestamp,
      context,
      error: {
        message: error?.message || 'Unknown error',
        stack: error?.stack,
        status: error?.status,
        statusText: error?.statusText
      }
    };

    // In development, log to console
    if (!this.isProduction()) {
      console.error('Error logged:', errorInfo);
    }

    // In production, this would send to a logging service
    // this.loggingService.logError(errorInfo);
  }

  /**
   * Checks if the application is in production mode
   * @returns true if in production, false otherwise
   */
  private isProduction(): boolean {
    // This would typically check an environment variable
    return false;
  }
}