package in.staysphere.app;

import android.content.ActivityNotFoundException;
import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.widget.Toast;
import com.getcapacitor.BridgeActivity;
import com.getcapacitor.BridgeWebViewClient;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        
        try {
            WebView webView = getBridge().getWebView();
            if (webView != null) {
                // Ensure default native rendering layer (DO NOT use LAYER_TYPE_HARDWARE on WebView
                // as it breaks touch-scroll interception in Chromium and causes scroll freeze)
                webView.setLayerType(WebView.LAYER_TYPE_NONE, null);
                webView.setOverScrollMode(WebView.OVER_SCROLL_IF_CONTENT_SCROLLS);
                webView.setVerticalScrollBarEnabled(false);
                webView.setHorizontalScrollBarEnabled(false);
                
                WebSettings settings = webView.getSettings();
                settings.setDomStorageEnabled(true);
                settings.setDatabaseEnabled(true);
                settings.setCacheMode(WebSettings.LOAD_DEFAULT);
                settings.setSupportZoom(false);
                settings.setBuiltInZoomControls(false);

                // Intercept UPI & payment app deep links so Android launches GPay / PhonePe / Paytm / BHIM
                getBridge().setWebViewClient(new BridgeWebViewClient(getBridge()) {
                    @Override
                    public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                        Uri uri = request.getUrl();
                        if (uri != null && handlePaymentUri(uri.toString())) {
                            return true;
                        }
                        return super.shouldOverrideUrlLoading(view, request);
                    }

                    @Override
                    public boolean shouldOverrideUrlLoading(WebView view, String url) {
                        if (url != null && handlePaymentUri(url)) {
                            return true;
                        }
                        return super.shouldOverrideUrlLoading(view, url);
                    }
                });
            }
        } catch (Exception ignored) {}
    }

    private boolean handlePaymentUri(String url) {
        String lower = url.toLowerCase();
        boolean isPaymentScheme =
            lower.startsWith("upi://") ||
            lower.startsWith("tez://") ||
            lower.startsWith("gpay://") ||
            lower.startsWith("phonepe://") ||
            lower.startsWith("paytmmp://") ||
            lower.startsWith("bhim://") ||
            lower.startsWith("credpay://") ||
            lower.startsWith("intent://");

        if (!isPaymentScheme) {
            return false;
        }

        try {
            if (lower.startsWith("intent://")) {
                Intent intent = Intent.parseUri(url, Intent.URI_INTENT_SCHEME);
                if (intent != null) {
                    intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                    if (intent.resolveActivity(getPackageManager()) != null) {
                        startActivity(intent);
                        return true;
                    }
                    // Fallback to generic UPI chooser if the specific app package is not installed
                    Uri parsed = Uri.parse(url);
                    String query = parsed.getEncodedQuery();
                    if (query != null && !query.isEmpty()) {
                        Intent fallback = new Intent(Intent.ACTION_VIEW, Uri.parse("upi://pay?" + query));
                        fallback.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                        Intent chooser = Intent.createChooser(fallback, "Pay with UPI App");
                        chooser.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                        startActivity(chooser);
                        return true;
                    }
                }
            } else {
                Intent intent = new Intent(Intent.ACTION_VIEW, Uri.parse(url));
                intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                if (lower.startsWith("upi://")) {
                    Intent chooser = Intent.createChooser(intent, "Pay with UPI App");
                    chooser.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                    startActivity(chooser);
                } else {
                    startActivity(intent);
                }
                return true;
            }
        } catch (ActivityNotFoundException e) {
            Toast.makeText(
                this,
                "Payment app not installed on this device. Please scan the QR code or use another UPI app.",
                Toast.LENGTH_LONG
            ).show();
            return true;
        } catch (Exception ignored) {
            return true;
        }
        return false;
    }
}
