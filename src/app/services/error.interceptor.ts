import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      let errorMessage = 'An unknown error occurred!';

      if (error.error instanceof ErrorEvent) {
        // Client-side error
        errorMessage = `Client Side Error: ${error.error.message}`;
      } else {
        // Server-side error
        errorMessage = `Server Side Error: ${error.message} \n Status Code: ${error.status}`;
      }

      console.error(errorMessage);

      // Rethrow to Global Error Handler
      return throwError(() => new Error(errorMessage));
    })
  );
};
