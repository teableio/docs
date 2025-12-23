---
title: "Google Workspace SSO"
description: "Configure Google Workspace as your SSO authentication provider for Teable"
---

<Tip>Available for Pro plan and above</Tip>

## Step 1: Create Authentication Provider in Teable

1. Navigate to your Teable SSO settings
2. Create a new authentication provider and name it **Google Workspace** and select **OpenID Connect**

## Step 2: Access Google Cloud Console

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Log in with your Google Workspace admin account
3. Select or create a project for Teable SSO integration

## Step 3: Enable Google Identity Services

1. In the Google Cloud Console, navigate to **APIs & Services** → **Library**
2. Search for **Google Identity** or **Google+ API**
3. Click **Enable** if not already enabled

## Step 4: Configure OAuth Consent Screen

1. Go to **APIs & Services** → **OAuth consent screen**
2. Select **Internal** (for Google Workspace users only) or **External**
3. Fill in the required information:
   - **App name**: Teable SSO
   - **User support email**: Your email address
   - **App logo**: (Optional) Upload Teable logo
   - **Authorized domains**: Add your Teable domain
   - **Developer contact information**: Your email address
4. Click **Save and Continue**

### Configure Scopes

1. Click **Add or Remove Scopes**
2. Add the following scopes:
   - `openid`
   - `email`
   - `profile`
3. Click **Update** and then **Save and Continue**

### Add Test Users (if using External)

If you selected "External", add test users during development:
1. Click **Add Users**
2. Enter email addresses of test users
3. Click **Save and Continue**

## Step 5: Create OAuth Client ID

1. Go to **APIs & Services** → **Credentials**
2. Click **Create Credentials** → **OAuth client ID**
3. Select **Web application** as the application type
4. Configure the client:
   - **Name**: Teable SSO Client
   - **Authorized JavaScript origins**: (Optional) `https://app.teable.ai`
   - **Authorized redirect URIs**: Paste the **Callback URL** from Teable
5. Click **Create**

## Step 6: Save Client Credentials

After creating the OAuth client, a dialog will appear with your credentials:

1. Copy the **Client ID**
2. Copy the **Client Secret**
3. Click **OK**
4. Paste both values into the Teable SSO configuration

> **Note**: You can always retrieve these credentials later from the Credentials page.

## Step 7: Configure OAuth Endpoints

In Teable, fill in the following OAuth endpoints:

- **Authorization URL**: `https://accounts.google.com/o/oauth2/v2/auth`
- **Token URL**: `https://oauth2.googleapis.com/token`
- **User Info URL**: `https://openidconnect.googleapis.com/v1/userinfo`
- **Issuer**: `https://accounts.google.com`

## Step 8: Test SSO Login

You have two options to enable SSO login:

**Option 1: Direct Authentication URL**
- Use the authorization URL as your SSO login URL

**Option 2: Domain Verification**
1. In Teable, configure domain verification
2. Verify your Google Workspace domain
3. Visit https://app.teable.ai
4. Click the SSO login button
5. Enter your Google Workspace email address to log in

## Additional Configuration (Optional)

### Restrict Access by Domain

If you want to restrict access to specific Google Workspace domains:

1. In your application code or Teable settings, configure domain restrictions
2. Only allow email addresses from your verified domain(s)

### Configure Session Duration

1. In Google Admin Console, go to **Security** → **Authentication**
2. Configure **Google session control** settings
3. Set session duration and re-authentication policies

### Enable 2-Step Verification

1. In Google Admin Console, go to **Security** → **Authentication** → **2-Step Verification**
2. Enable 2-Step Verification for your organization
3. Configure enforcement policies for users

