---
title: "Azure Entra ID SSO"
description: "Configure Azure Entra ID as your SSO authentication provider for Teable"
---

<Tip>Available for Business plan and above</Tip>

## Step 1: Create Authentication Provider in Teable

1. Navigate to your Teable SSO settings
2. Create a new authentication provider and name it **Azure Entra ID** and select **OpenID Connect**

<img
  src="/images/staged-sso-preview/2026-05-11-sso-azure-entra-id-2025-12-04-18-00-20.png"
  alt="Azure Entra ID SSO setup step 1"
  className="docs-screenshot"
/>

## Step 2: Access Azure Entra ID

1. Log in to your Azure account
2. Navigate to **Microsoft Entra ID** (formerly Azure Active Directory)

<img
  src="/images/staged-sso-preview/2026-05-11-sso-azure-entra-id-2025-12-04-18-00-27.png"
  alt="Azure Entra ID SSO setup step 2"
  className="docs-screenshot"
/>

## Step 3: Configure OAuth Endpoints

Fill in the following OAuth endpoints in Teable using your **Tenant ID**:

<img
  src="/images/staged-sso-preview/2026-05-11-sso-azure-entra-id-2025-12-04-18-00-51.png"
  alt="Azure Entra ID SSO setup step 3"
  className="docs-screenshot"
/>

- **Authorization URL**: `https://login.microsoftonline.com/_YOUR_TENANT_ID_/oauth2/v2.0/authorize`
- **Token URL**: `https://login.microsoftonline.com/_YOUR_TENANT_ID_/oauth2/v2.0/token`
- **User Info URL**: `https://graph.microsoft.com/oidc/userinfo`
- **Issuer**: `https://login.microsoftonline.com/_YOUR_TENANT_ID_/v2.0`

> **Note**: Replace `_YOUR_TENANT_ID_` with your actual Azure Tenant ID.

## Step 4: Register a New Application

1. In Azure Entra ID, click **App registrations** in the left menu
2. Click **+ New registration**

<img
  src="/images/staged-sso-preview/2026-05-11-sso-azure-step4-option-2-fit-width.png"
  alt="Azure Entra ID app registration"
  className="docs-screenshot"
/>

## Step 5: Configure Application Registration

Fill in the application registration form:

<img
  src="/images/staged-sso-preview/2026-05-11-sso-azure-entra-id-2025-12-04-18-01-11.png"
  alt="Azure Entra ID SSO setup step 5"
  className="docs-screenshot"
/>
<img
  src="/images/staged-sso-preview/2026-05-11-sso-azure-entra-id-2025-12-04-18-01-19.png"
  alt="Azure Entra ID SSO setup step 6"
  className="docs-screenshot"
/>

- **Name**: Teable SSO
- **Supported account types**: Select based on your needs
- **Platform**: Web
- **Redirect URI**: Paste the **Callback URL** from Teable

Click **Register** to create the application.

## Step 6: Save the Client ID

1. Copy the **Application (client) ID** from the application overview page

<img
  src="/images/staged-sso-preview/2026-05-11-sso-azure-entra-id-2025-12-04-18-01-27.png"
  alt="Azure Entra ID SSO setup step 7"
  className="docs-screenshot"
/>

2. Paste the Client ID into the Teable SSO configuration

<img
  src="/images/staged-sso-preview/2026-05-11-sso-azure-entra-id-2025-12-04-18-01-32.png"
  alt="Azure Entra ID SSO setup step 8"
  className="docs-screenshot"
/>

## Step 7: Create Client Secret

1. In your application, click **Certificates & secrets** in the left menu

<img
  src="/images/staged-sso-preview/2026-05-11-sso-azure-entra-id-2025-12-04-18-01-44.png"
  alt="Azure Entra ID SSO setup step 9"
  className="docs-screenshot"
/>

2. Click **+ Add a certificate or secret**

<img
  src="/images/staged-sso-preview/2026-05-11-sso-azure-entra-id-2025-12-04-18-01-50.png"
  alt="Azure Entra ID SSO setup step 10"
  className="docs-screenshot"
/>

3. Add a description and set the expiration period
4. Click **Add**
5. **Important**: Copy the secret **Value** immediately and save it as your Client Secret in Teable

<img
  src="/images/staged-sso-preview/2026-05-11-sso-azure-entra-id-2025-12-04-18-01-55.png"
  alt="Azure Entra ID SSO setup step 11"
  className="docs-screenshot"
/>

> **Warning**: The secret value is only visible once. Make sure to save it immediately.

## Step 8: Configure API Permissions

1. Click **API permissions** in the left menu
2. Click **+ Add a permission**

<img
  src="/images/staged-sso-preview/2026-05-11-sso-azure-entra-id-2025-12-04-18-02-00.png"
  alt="Azure Entra ID SSO setup step 12"
  className="docs-screenshot"
/>
<img
  src="/images/staged-sso-preview/2026-05-11-sso-azure-entra-id-2025-12-04-18-02-05.png"
  alt="Azure Entra ID SSO setup step 13"
  className="docs-screenshot"
/>

3. Select **Microsoft Graph**
4. Choose **Delegated permissions**
5. Add the following permissions:
   - `email`
   - `openid`
   - `profile`
6. Click **Add permissions**

<img
  src="/images/staged-sso-preview/2026-05-11-sso-azure-entra-id-2025-12-04-18-02-16.png"
  alt="Azure Entra ID SSO setup step 14"
  className="docs-screenshot"
/>

7. Click **Grant admin consent for [Your Directory]** to approve the permissions

## Step 9: Test SSO Login

You have two options to enable SSO login:

<img
  src="/images/staged-sso-preview/2026-05-11-sso-azure-entra-id-2025-12-04-18-34-30.png"
  alt="Azure Entra ID SSO setup step 15"
  className="docs-screenshot"
/>

**Option 1: Direct Authentication URL**
- Use the authentication URL as your SSO login URL

**Option 2: Domain Verification**
1. Click **Domain verification** in the left menu
2. Verify your custom domain
3. Visit your teable login page
4. Click the SSO login button
5. Enter your email address under the verified domain to log in
