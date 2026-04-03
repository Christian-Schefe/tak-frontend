import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { routes } from './app.routes';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { authInterceptor } from './auth/auth-interceptor/auth-interceptor';
import { providePrimeNG } from 'primeng/config';
import { provideNgtRenderer } from 'angular-three/dom';
import Aura from '@primeuix/themes/aura';
import { MARKED_EXTENSIONS, MARKED_OPTIONS, provideMarkdown } from 'ngx-markdown';
import { emoteExtension } from './components/chat-conversation/chat-conversation';
import { Renderer } from 'marked';

const renderer = new Renderer();
renderer.html = (html) => {
  const escapedHtml = html.raw
    .replace(/&/g, '&amp;') // First: escape & to avoid double-escaping entities
    .replace(/</g, '&lt;') // Escape <
    .replace(/>/g, '&gt;') // Escape >
    .replace(/"/g, '&quot;') // Escape " (for attributes)
    .replace(/'/g, '&#39;'); // Escape ' (for attributes)
  return escapedHtml;
};

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes, withComponentInputBinding()),
    provideHttpClient(withInterceptors([authInterceptor])),
    providePrimeNG({
      theme: {
        preset: Aura,
        options: {
          darkModeSelector: '.dark-mode',
        },
      },
      ripple: true,
    }),
    provideNgtRenderer(),
    provideMarkdown({
      markedExtensions: [
        {
          provide: MARKED_EXTENSIONS,
          useFactory: emoteExtension,
          multi: true,
        },
      ],
      markedOptions: {
        provide: MARKED_OPTIONS,
        useValue: {
          gfm: true,
          breaks: true,
          renderer,
        },
      },
    }),
  ],
};
