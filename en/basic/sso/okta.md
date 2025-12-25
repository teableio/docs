---
title: "Okta SSO"
description: "Configure Okta as your SSO authentication provider for Teable"
---

<Tip>Available for Business plan and above</Tip>

## Step 1: Create Authentication Provider in Teable

1. Navigate to your Teable SSO settings
2. Create a new authentication provider and name it **Okta** and select **OpenID Connect**

## Step 2: Access Okta Admin Console

1. Log in to your Okta account
2. Navigate to **Admin Dashboard**
3. Go to **Applications** → **Applications** in the left menu

## Step 3: Create a New Application

1. Click **Create App Integration**
2. Select **OIDC - OpenID Connect** as the sign-in method
3. Select **Web Application** as the application type
4. Click **Next**

## Step 4: Configure Application Settings

Fill in the application configuration form:

- **App integration name**: Teable SSO
- **Grant type**: Select **Authorization Code**
- **Sign-in redirect URIs**: Paste the **Callback URL** from Teable
- **Sign-out redirect URIs**: (Optional) `https://app.teable.ai`
- **Controlled access**: Choose who can access this application

Click **Save** to create the application.

## Step 5: Save Client Credentials

After creating the application, you'll see the application details page:

1. Copy the **Client ID**
2. Copy the **Client Secret** (click "Show" if needed)
3. Paste both values into the Teable SSO configuration

> **Warning**: Keep your Client Secret secure and never share it publicly.

## Step 6: Configure OAuth Endpoints

In Teable, fill in the following OAuth endpoints:

- **Authorization URL**: `https://{yourOktaDomain}/oauth2/v1/authorize`
- **Token URL**: `https://{yourOktaDomain}/oauth2/v1/token`
- **User Info URL**: `https://{yourOktaDomain}/oauth2/v1/userinfo`
- **Issuer**: `https://{yourOktaDomain}`

> **Note**: Replace `{yourOktaDomain}` with your actual Okta domain (e.g., `dev-123456.okta.com` or `mycompany.okta.com`)

## Step 7: Assign Users or Groups

1. In your Okta application, go to the **Assignments** tab
2. Click **Assign** → **Assign to People** or **Assign to Groups**
3. Select the users or groups who should have access to Teable via SSO
4. Click **Assign** and **Done**

## Step 8: Test SSO Login

You have two options to enable SSO login:

**Option 1: Direct Authentication URL**
- Use the authorization URL as your SSO login URL

**Option 2: Domain Verification**
1. In Teable, configure domain verification
2. Verify your custom domain
3. Visit https://app.teable.ai
4. Click the SSO login button
5. Enter your email address under the verified domain to log in

## Additional Configuration (Optional)

### Configure Custom Claims

If you need to map additional user attributes:

1. Go to **Security** → **API** in Okta Admin
2. Select your authorization server (usually "default")
3. Go to the **Claims** tab
4. Add custom claims as needed (e.g., department, role)

### Enable Multi-Factor Authentication

1. Go to **Security** → **Authenticators** in Okta Admin
2. Configure your preferred MFA methods
3. Create an authentication policy for your Teable application

