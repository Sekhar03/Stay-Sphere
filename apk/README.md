# StaySphere Google Play Store Release & Deployment Package

This directory (`apk/`) contains the production-ready build artifacts, Google Play bundle, and signing keys for **StaySphere** (`in.staysphere.app`).

---

## 📦 Play Store & Distribution Files

| File | Purpose | Size |
|---|---|---|
| [`StaySphere-release.aab`](file:///c:/Users/sekha/OneDrive/Desktop/pg/apk/StaySphere-release.aab) | **Google Play Store App Bundle** *(Mandatory format for Google Play Console)* | ~3.0 MB |
| [`StaySphere-release.apk`](file:///c:/Users/sekha/OneDrive/Desktop/pg/apk/StaySphere-release.apk) | **Production Signed Standalone APK** *(Direct device installation / sideloading)* | ~3.1 MB |
| [`staysphere-release-key.jks`](file:///c:/Users/sekha/OneDrive/Desktop/pg/apk/staysphere-release-key.jks) | **Production Release Keystore** *(Required for future app updates)* | 2.7 KB |

---

## 🔑 Keystore Credentials

> [!WARNING]
> Keep `staysphere-release-key.jks` secure and backed up. Google Play Console requires this exact key to verify future app updates.

- **Keystore File:** `staysphere-release-key.jks`
- **Keystore Password:** `StaySphere@2026`
- **Key Alias:** `staysphere`
- **Key Password:** `StaySphere@2026`
- **Certificate Validity:** 10,000 days (until 2054)
- **Signature Algorithm:** SHA-256 with RSA 2048-bit

---

## 🚀 How to Upload to Google Play Console

1. Log in to [Google Play Console](https://play.google.com/console).
2. Click **Create app**:
   - **App name:** StaySphere
   - **Default language:** English (or preferred)
   - **App or game:** App
   - **Free or paid:** Free (or as applicable)
3. Navigate to **Release** > **Production** (or **Testing** > **Internal testing**).
4. Click **Create new release**.
5. Under **App bundles**, click **Upload** and select:
   ```
   c:\Users\sekha\OneDrive\Desktop\pg\apk\StaySphere-release.aab
   ```
6. Add your release notes (e.g., *Initial release of StaySphere PG & Coliving management*).
7. Complete the required Store Listing details (App icons, description, privacy policy, and content rating).
8. Click **Save** and **Review release** -> **Start rollout to Production**!

---

## 📲 How to Install the APK Directly on Any Android Phone

You can also install the APK directly onto your phone without uploading to the Play Store:
1. Connect your phone via USB or transfer [`StaySphere-release.apk`](file:///c:/Users/sekha/OneDrive/Desktop/pg/apk/StaySphere-release.apk) via Google Drive/WhatsApp.
2. Tap the file on your device and select **Install**.
3. *Or via ADB from terminal:*
   ```powershell
   adb install apk\StaySphere-release.apk
   ```
