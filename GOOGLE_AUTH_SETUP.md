# Google Sign-In Setup Guide

This guide details how to obtain and configure a Google Client ID to enable live Google authentication on the PathshalaKhoj website (both locally and on Render production).

---

## 🔍 Why is Google Sign-In stuck on a blank white window (`accounts.google.com/gsi/transform`)?

Google requires every website domain where "Sign in with Google" is used to be explicitly whitelisted under **Authorized JavaScript origins** in Google Cloud Console. 

If `https://pathshalakhoj.onrender.com` is missing from your Authorized JavaScript origins list, Google blocks the pop-up window for security reasons, leaving it stuck loading on a blank white page.

---

## 🛠️ Step-by-Step Fix (2 Minutes):

### 1. Open Google Cloud Console
1. Go to the [Google Cloud Console Credentials Page](https://console.cloud.google.com/apis/credentials).
2. Select your Google Cloud Project (e.g., `Pathshala-Khoj`).

### 2. Edit Your OAuth 2.0 Web Client
1. Under **OAuth 2.0 Client IDs**, click your Web Client name or the ✏️ **Edit** icon next to it.
2. Scroll down to **Authorized JavaScript origins**:
   - Click **+ ADD URI**
   - Add: `https://pathshalakhoj.onrender.com`
   - Add: `http://localhost:4000` (for local development)
3. Scroll down to **Authorized redirect URIs**:
   - Click **+ ADD URI**
   - Add: `https://pathshalakhoj.onrender.com`
   - Add: `http://localhost:4000`
4. Click **SAVE** at the bottom of the page.

---

## ⚡ Step 3: Save Environment Variable on Render (Optional if using your custom Client ID)

If you created a new Google Client ID:
1. Copy the Client ID string (e.g. `123456789-abc.apps.googleusercontent.com`).
2. Go to your [Render Dashboard](https://dashboard.render.com).
3. Select your `PathshalaKhoj` web service → **Environment**.
4. Add or update key: `GOOGLE_CLIENT_ID` with value: `your-copied-client-id`.
5. Save changes (Render will automatically re-deploy).

---

> 💡 **Note**: Changes in Google Cloud Console usually take 1–5 minutes to propagate across Google servers. Once saved, open `https://pathshalakhoj.onrender.com` in your browser, hard refresh (`Ctrl + Shift + R`), and Google Sign-In will complete instantly!
