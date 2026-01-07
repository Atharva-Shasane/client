import { ApplicationConfig, provideZonelessChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withFetch } from '@angular/common/http';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    // ⚡ FIX: Using the API name suggested by your Angular compiler
    provideZonelessChangeDetection(),

    provideRouter(routes),
    provideHttpClient(withFetch()),
  ],
};
