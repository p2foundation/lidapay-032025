import { bootstrapApplication } from '@angular/platform-browser';
import {
  RouteReuseStrategy,
  provideRouter,
  withPreloading,
  PreloadAllModules,
} from '@angular/router';
import {
  IonicRouteStrategy,
  provideIonicAngular,
} from '@ionic/angular/standalone';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import {
  TranslateModule,
  TranslateLoader,
  TranslateService,
} from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { importProvidersFrom, isDevMode } from '@angular/core';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideServiceWorker } from '@angular/service-worker';
import { addIcons } from 'ionicons';
import { routes } from './app/app.routes';
import { AppComponent } from './app/app.component';
import { appConfig } from './app/app.config';
import { TokenInterceptorService } from './app/services/auth/token.interceptor.service';

// Import icons
import {
  appsOutline,
  phonePortraitOutline,
  wifiOutline,
  globeOutline,
  optionsOutline,
  funnelOutline,
  documentTextOutline,
  timeOutline,
  calendarOutline,
  trendingDownOutline,
  trendingUpOutline,
  checkmark
} from 'ionicons/icons';

// Register icons
addIcons({
  'apps-outline': appsOutline,
  'phone-portrait-outline': phonePortraitOutline,
  'wifi-outline': wifiOutline,
  'globe-outline': globeOutline,
  'options-outline': optionsOutline,
  'funnel-outline': funnelOutline,
  'document-text-outline': documentTextOutline,
  'time-outline': timeOutline,
  'calendar-outline': calendarOutline,
  'trending-down-outline': trendingDownOutline,
  'trending-up-outline': trendingUpOutline,
  'checkmark': checkmark
});

// AoT requires an exported function for factories
export function createTranslateLoader(http: HttpClient) {
  return new TranslateHttpLoader(http, './assets/i18n/', '.json');
}

bootstrapApplication(AppComponent, {
  ...appConfig,
  providers: [
    ...appConfig.providers,
    provideHttpClient(withInterceptors([TokenInterceptorService])),
    provideRouter(routes, withPreloading(PreloadAllModules)),
    importProvidersFrom(
      TranslateModule.forRoot({
        loader: {
          provide: TranslateLoader,
          useFactory: createTranslateLoader,
          deps: [HttpClient],
        },
      })
    ),
    provideAnimations(),
    provideServiceWorker('ngsw-worker.js', {
      enabled: !isDevMode(),
      registrationStrategy: 'registerWhenStable:30000',
    }),
  ],
}).catch((err) => console.error(err));
