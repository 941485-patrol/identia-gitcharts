import { ErrorHandler, Injectable, NgZone } from '@angular/core';

@Injectable()
export class GlobalErrorHandler implements ErrorHandler {
  constructor(private zone: NgZone) {}

  handleError(error: any): void {
    // We use zone.run to ensure the error handling logic runs inside the Angular zone,
    // which is important if we were to trigger UI updates (like a toast).
    this.zone.run(() => {
      console.error('An unexpected error occurred:', error);
      
      // Here you could add logic to show a toast message or send the error to a logging service.
      const message = error.message ? error.message : error.toString();
      alert(`An error occurred: ${message}`);
    });
  }
}
