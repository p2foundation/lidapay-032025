package com.advansistechnologies.lidapay;

import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.util.Log;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    private static final String TAG = "MainActivity";
    private static final String CUSTOM_SCHEME = "lidapay";
    private static final String CUSTOM_HOST = "redirect-url";
    private static final String HTTPS_HOST = "api.advansistechnologies.com";
    private static final String HTTPS_PATH = "/api/v1/advansispay/redirect-url" ;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        Log.d(TAG, "MainActivity created - waiting for payment response");
        handleIntent(getIntent());
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
            // Log all payment response parameters
            for (String param : uri.getQueryParameterNames()) {
                String value = uri.getQueryParameter(param);
                Log.d(TAG, "Payment parameter - " + param + ": " + value);
            }

            // Notify the web app about the payment response
            bridge.getWebView().evaluateJavascript(
                String.format("window.dispatchEvent(new CustomEvent('deepLink', { detail: '%s' }));",
                uri.toString()),
                null
            );
            Log.d(TAG, "Payment response forwarded to web app");

        } catch (Exception e) {
            Log.e(TAG, "Error processing payment response: " + e.getMessage());
        }
    }
}
