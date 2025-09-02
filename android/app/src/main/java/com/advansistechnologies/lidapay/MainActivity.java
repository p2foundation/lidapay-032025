package com.advansistechnologies.lidapay;

import android.content.Intent;
import android.net.Uri;
import android.content.res.Configuration;
import android.os.Build;
import android.os.Bundle;
import android.util.Log;
import android.view.View;
import android.view.WindowInsets;
import android.view.WindowInsetsController;
import androidx.core.view.WindowCompat;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    private static final String TAG = "MainActivity";
    private static final String CUSTOM_SCHEME = "lidapay";
    private static final String CUSTOM_HOST = "redirect-url";
    private static final String HTTPS_HOST = "api.advansistechnologies.com";
    private static final String HTTPS_PATH = "/api/v1/advansispay/redirect-url";

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        Log.d(TAG, "MainActivity created - waiting for payment response");

        // Enable edge-to-edge display
        enableEdgeToEdge();

        handleIntent(getIntent());
    }

    private void enableEdgeToEdge() {
        // Enable edge-to-edge display
        WindowCompat.setDecorFitsSystemWindows(getWindow(), false);

        // Set light status bar icons for better visibility
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            View decor = getWindow().getDecorView();
            int flags = decor.getSystemUiVisibility();
            // Use light status bar if we're in light theme
            boolean isLightTheme = (getResources().getConfiguration().uiMode
                & Configuration.UI_MODE_NIGHT_MASK) != Configuration.UI_MODE_NIGHT_YES;

            if (isLightTheme) {
                flags |= View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR;
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                    flags |= View.SYSTEM_UI_FLAG_LIGHT_NAVIGATION_BAR;
                }
            } else {
                flags &= ~View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR;
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                    flags &= ~View.SYSTEM_UI_FLAG_LIGHT_NAVIGATION_BAR;
                }
            }
            decor.setSystemUiVisibility(flags);
        }

        // Set up window insets listener to handle layout properly
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
            getWindow().setDecorFitsSystemWindows(false);
            final WindowInsetsController controller = getWindow().getInsetsController();
            if (controller != null) {
                // Show system bars with light or dark icons based on theme
                boolean isDarkTheme = (getResources().getConfiguration().uiMode
                    & Configuration.UI_MODE_NIGHT_MASK) == Configuration.UI_MODE_NIGHT_YES;

                controller.setSystemBarsAppearance(
                    isDarkTheme ? 0 : WindowInsetsController.APPEARANCE_LIGHT_STATUS_BARS,
                    WindowInsetsController.APPEARANCE_LIGHT_STATUS_BARS
                );

                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                    controller.setSystemBarsAppearance(
                        isDarkTheme ? 0 : WindowInsetsController.APPEARANCE_LIGHT_NAVIGATION_BARS,
                        WindowInsetsController.APPEARANCE_LIGHT_NAVIGATION_BARS
                    );
                }

                controller.hide(WindowInsets.Type.statusBars() | WindowInsets.Type.navigationBars());
                controller.setSystemBarsBehavior(
                    WindowInsetsController.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE
                );
            }
        } else {
            // For older versions, use the View.SYSTEM_UI_FLAG_* flags
            View decorView = getWindow().getDecorView();
            int flags = View.SYSTEM_UI_FLAG_LAYOUT_STABLE |
                       View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION |
                       View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN |
                       View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY;

            // Add light status bar flags if needed
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                boolean isLightTheme = (getResources().getConfiguration().uiMode
                    & Configuration.UI_MODE_NIGHT_MASK) != Configuration.UI_MODE_NIGHT_YES;
                if (isLightTheme) {
                    flags |= View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR;
                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                        flags |= View.SYSTEM_UI_FLAG_LIGHT_NAVIGATION_BAR;
                    }
                }
            }

            decorView.setSystemUiVisibility(flags);
        }
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        Log.d(TAG, "New intent received - processing payment response");
        handleIntent(intent);
    }

    private void handleIntent(Intent intent) {
        String action = intent.getAction();
        Uri data = intent.getData();

        if (Intent.ACTION_VIEW.equals(action) && data != null) {
            Log.d(TAG, "Payment response received: " + data.toString());

            String scheme = data.getScheme();
            String host = data.getHost();
            String path = data.getPath();

            if (CUSTOM_SCHEME.equals(scheme) && CUSTOM_HOST.equals(host)) {
                Log.d(TAG, "Processing ExpressPay payment response (custom scheme)");
                processDeepLink(data);
            } else if ("https".equals(scheme) && HTTPS_HOST.equals(host) && HTTPS_PATH.equals(path)) {
                Log.d(TAG, "Processing ExpressPay payment response (HTTPS)");
                processDeepLink(data);
            } else {
                Log.w(TAG, "Unrecognized payment response format: " + data.toString());
            }
        }
    }

    private void processDeepLink(Uri uri) {
        try {
            Log.d(TAG, "Processing deep link with URI: " + uri.toString());
            Log.d(TAG, "URI scheme: " + uri.getScheme());
            Log.d(TAG, "URI host: " + uri.getHost());
            Log.d(TAG, "URI path: " + uri.getPath());
            Log.d(TAG, "URI query: " + uri.getQuery());

            // Log all payment response parameters
            for (String param : uri.getQueryParameterNames()) {
                String value = uri.getQueryParameter(param);
                Log.d(TAG, "Payment parameter - " + param + ": " + value);
            }

            // Clean the URL by removing newlines and extra spaces
            String cleanedUrl = uri.toString()
                .replace("%0A", "")  // Remove newlines
                .replaceAll("\\s+", ""); // Remove extra spaces

            Log.d(TAG, "Original URI: " + uri.toString());
            Log.d(TAG, "Cleaned URI: " + cleanedUrl);
            Log.d(TAG, "URI contains newlines: " + uri.toString().contains("%0A"));
            Log.d(TAG, "URI contains spaces: " + uri.toString().contains(" "));

            // Notify the web app about the payment response
            bridge.getWebView().evaluateJavascript(
                String.format("window.dispatchEvent(new CustomEvent('deepLink', { detail: '%s' }));",
                cleanedUrl),
                null
            );
            Log.d(TAG, "Payment response forwarded to web app");

        } catch (Exception e) {
            Log.e(TAG, "Error processing payment response: " + e.getMessage());
            e.printStackTrace();
        }
    }
}
