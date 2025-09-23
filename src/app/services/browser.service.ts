import { Injectable } from '@angular/core';
import { Browser } from '@capacitor/browser';

type PresentationStyle = 'fullscreen' | 'popover';

@Injectable({
  providedIn: 'root'
})
export class BrowserService {
  constructor() {}

  /**
   * Opens a URL in the in-app browser
   * @param url The URL to open
   * @param options Optional configuration for the browser
   */
  async openInAppBrowser(url: string, options: {
    presentationStyle?: PresentationStyle;
    toolbarColor?: string;
    windowName?: string;
  } = {}) {
    const defaultOptions = {
      presentationStyle: 'popover' as PresentationStyle,
      toolbarColor: '#3880ff',
      windowName: '_blank',
      ...options
    };

    const browserOptions: {
      url: string;
      presentationStyle?: PresentationStyle;
      toolbarColor?: string;
      windowName?: string;
    } = {
      url,
      toolbarColor: defaultOptions.toolbarColor,
      windowName: defaultOptions.windowName
    };

    // Only add presentationStyle if it's defined
    if (defaultOptions.presentationStyle) {
      browserOptions.presentationStyle = defaultOptions.presentationStyle;
    }

    await Browser.open(browserOptions);
  }

  /**
   * Closes the in-app browser if it's open
   */
  async closeInAppBrowser() {
    await Browser.close();
  }
}
