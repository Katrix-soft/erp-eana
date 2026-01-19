import { ErrorHandler, Injectable } from '@angular/core';

@Injectable()
export class GlobalErrorHandler implements ErrorHandler {
  handleError(error: any): void {
    const chunkFailedMessage = /Loading chunk [\d]+ failed/;
    const moduleFetchFailedMessage = /Failed to fetch dynamically imported module/;

    if (chunkFailedMessage.test(error.message) || moduleFetchFailedMessage.test(error.message)) {
      console.warn('Nueva versión detectada. Recargando aplicación...');
      
      // Control de recarga para evitar loops infinitos
      const lastReload = localStorage.getItem('last-chunk-reload');
      const now = Date.now();
      
      if (!lastReload || now - parseInt(lastReload) > 10000) {
        localStorage.setItem('last-chunk-reload', now.toString());
        window.location.reload();
      }
    }
    
    // Loguear el error original en consola
    console.error('Error detectado:', error);
  }
}
