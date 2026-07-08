# Google Sign-In Setup Guide

This guide details how to obtain and configure a Google Client ID to enable live Google authentication on the PathshalaKhoj website.

---

## 1. Create a Google Cloud Project
1. Go to the [Google Cloud Console](https://console.cloud.google.com/).
2. Log in with your Google account.
3. Click the project dropdown at the top left of the screen and select **New Project**.
4. Name your project (e.g., `Pathshala-Khoj`) and click **Create**.

---

## 2. Configure the OAuth Consent Screen
1. In the left sidebar, navigate to **APIs & Services** > **OAuth consent screen**.
2. Select **User Type**:
   - Choose **External** (allows any Google user to log in).
   - Click **Create**.
3. Fill in the required fields:
   - **App name**: `Pathshala Khoj`
   - **User support email**: (Select your email address)
   - **Developer contact information**: (Your email address)
4. Click **Save and Continue** (you can skip the Scopes and Test Users screens for local testing).

---

## 3. Create OAuth Client Credentials
1. In the left sidebar, click **Credentials**.
2. Click **+ Create Credentials** at the top and select **OAuth client ID**.
3. Select **Application type**: **Web application**.
4. Under **Authorized JavaScript origins**, click **+ ADD URI** and add:
   - `http://localhost:4000`
5. Under **Authorized redirect URIs**, click **+ ADD URI** and add:
   - `http://localhost:4000`
6. Click **Create**.

---

## 4. Save Credentials to Environment Configuration
1. A modal will pop up displaying your **Client ID** (it ends with `.apps.googleusercontent.com`). Copy it.
2. Open the `.env` file in the `backend/` directory:
   [backend/.env](file:///c:/Users/Sanket/Documents/Bucket%20List/college-finder/backend/.env)
3. Paste the client ID on the `GOOGLE_CLIENT_ID` line (make sure to uncomment it by removing the leading `#`):
   ```ini
   GOOGLE_CLIENT_ID=your-copied-client-id-here.apps.googleusercontent.com
   ```
4. **Restart the backend server** so that it applies the configuration:
   - In terminal: Stop node server and run `npm start` again.
