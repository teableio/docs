---
title: "Azure Entra ID SSO"
description: "Configure Azure Entra ID as your SSO authentication provider for Teable"
---

<Tip>Available for Pro plan and above</Tip>

## Step 1: Create Authentication Provider in Teable

1. Navigate to your Teable SSO settings
2. Create a new authentication provider and name it **Azure Entra ID** and select **OpenID Connect**

![](/images/2025-12-04-18-00-20.png)

## Step 2: Access Azure Entra ID

1. Log in to your Azure account
2. Navigate to **Microsoft Entra ID** (formerly Azure Active Directory)

![](/images/2025-12-04-18-00-27.png)

## Step 3: Configure OAuth Endpoints

Fill in the following OAuth endpoints in Teable using your **Tenant ID**:

![](/images/2025-12-04-18-00-51.png)

- **Authorization URL**: `https://login.microsoftonline.com/_YOUR_TENANT_ID_/oauth2/v2.0/authorize`
- **Token URL**: `https://login.microsoftonline.com/_YOUR_TENANT_ID_/oauth2/v2.0/token`
- **User Info URL**: `https://graph.microsoft.com/oidc/userinfo`
- **Issuer**: `https://login.microsoftonline.com/_YOUR_TENANT_ID_/v2.0`

> **Note**: Replace `_YOUR_TENANT_ID_` with your actual Azure Tenant ID.

## Step 4: Register a New Application

1. In Azure Entra ID, click **App registrations** in the left menu
2. Click **+ New registration**

![](/images/2025-12-04-18-03-39.png)

## Step 5: Configure Application Registration

Fill in the application registration form:

![](/images/2025-12-04-18-01-11.png)
![](/images/2025-12-04-18-01-19.png)

- **Name**: Teable SSO
- **Supported account types**: Select based on your needs
- **Platform**: Web
- **Redirect URI**: Paste the **Callback URL** from Teable

Click **Register** to create the application.

## Step 6: Save the Client ID

1. Copy the **Application (client) ID** from the application overview page

![](/images/2025-12-04-18-01-27.png)

2. Paste the Client ID into the Teable SSO configuration

![](/images/2025-12-04-18-01-32.png)

## Step 7: Create Client Secret

1. In your application, click **Certificates & secrets** in the left menu

![](/images/2025-12-04-18-01-44.png)

2. Click **+ Add a certificate or secret**

![](/images/2025-12-04-18-01-50.png)

3. Add a description and set the expiration period
4. Click **Add**
5. **Important**: Copy the secret **Value** immediately and save it as your Client Secret in Teable

![](/images/2025-12-04-18-01-55.png)

> **Warning**: The secret value is only visible once. Make sure to save it immediately.

## Step 8: Configure API Permissions

1. Click **API permissions** in the left menu
2. Click **+ Add a permission**

![](/images/2025-12-04-18-02-00.png)
![](/images/2025-12-04-18-02-05.png)

3. Select **Microsoft Graph**
4. Choose **Delegated permissions**
5. Add the following permissions:
   - `email`
   - `openid`
   - `profile`
6. Click **Add permissions**

![](/images/2025-12-04-18-02-16.png)

7. Click **Grant admin consent for [Your Directory]** to approve the permissions

## Step 9: Test SSO Login

You have two options to enable SSO login:

![](/images/2025-12-04-18-34-30.png)

**Option 1: Direct Authentication URL**
- Use the authentication URL as your SSO login URL

**Option 2: Domain Verification**
1. Click **Domain verification** in the left menu
2. Verify your custom domain
3. Visit your teable login page
4. Click the SSO login button
5. Enter your email address under the verified domain to log in
