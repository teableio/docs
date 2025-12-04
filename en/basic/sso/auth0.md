---
title: "Auth0 SSO"
description: "Configure Auth0 as your SSO authentication provider for Teable"
---

<Tip>Available for Pro plan and above</Tip>

## Step 1: Create Authentication Provider in Teable

1. Navigate to your Teable SSO settings
2. Create a new authentication provider and name it **Auth0** and select **OpenID Connect**

## Step 2: Access Auth0 Dashboard

1. Log in to your [Auth0 Dashboard](https://manage.auth0.com)
2. Select your Auth0 tenant
3. Navigate to **Applications** → **Applications** in the left menu

## Step 3: Create a New Application

1. Click **Create Application**
2. Enter application details:
   - **Name**: Teable SSO
   - **Application Type**: Select **Regular Web Applications**
3. Click **Create**

## Step 4: Configure Application Settings

After creating the application, go to the **Settings** tab:

### Basic Information

1. Copy your **Domain** (e.g., `your-tenant.auth0.com` or `your-tenant.us.auth0.com`)
2. Copy the **Client ID**
3. Copy the **Client Secret**
4. Paste these values into the Teable SSO configuration

### Application URIs

Scroll down to the **Application URIs** section:

1. **Allowed Callback URLs**: Paste the **Callback URL** from Teable
2. **Allowed Logout URLs**: (Optional) `https://app.teable.io`
3. **Allowed Web Origins**: (Optional) `https://app.teable.io`
4. Click **Save Changes** at the bottom of the page

> **Warning**: Make sure to save your changes before leaving the page.

## Step 5: Configure OAuth Endpoints

In Teable, fill in the following OAuth endpoints using your Auth0 domain:

- **Authorization URL**: `https://{yourDomain}/authorize`
- **Token URL**: `https://{yourDomain}/oauth/token`
- **User Info URL**: `https://{yourDomain}/userinfo`
- **Issuer**: `https://{yourDomain}/`

> **Note**: Replace `{yourDomain}` with your actual Auth0 domain from Step 4.

## Step 6: Configure Connections (Optional)

Auth0 allows you to enable multiple identity providers. To configure which login methods are available:

1. In your application settings, go to the **Connections** tab
2. Enable the authentication methods you want to support:
   - **Database**: Username/Password authentication
   - **Social**: Google, Microsoft, GitHub, etc.
   - **Enterprise**: SAML, Active Directory, etc.
3. Configure each connection as needed

## Step 7: Customize Login Experience (Optional)

### Universal Login Page

1. Go to **Branding** → **Universal Login** in the Auth0 dashboard
2. Customize the login page appearance
3. Add your company logo and brand colors

### Email Templates

1. Go to **Branding** → **Email Templates**
2. Customize email templates for verification, password reset, etc.

## Step 8: Configure User Permissions

### Define Scopes

1. Go to **Applications** → **APIs** in the Auth0 dashboard
2. Select **Auth0 Management API** or create a custom API
3. Define the scopes/permissions needed for your application

### Assign Roles (Optional)

1. Go to **User Management** → **Roles**
2. Create roles for different user types
3. Assign permissions to each role
4. Assign users to appropriate roles

## Step 9: Test SSO Login

You have two options to enable SSO login:

**Option 1: Direct Authentication URL**
- Use the authorization URL as your SSO login URL

**Option 2: Domain Verification**
1. In Teable, configure domain verification
2. Verify your custom domain
3. Visit https://app.teable.io
4. Click the SSO login button
5. Enter your email address under the verified domain to log in

## Additional Configuration (Optional)

### Enable Multi-Factor Authentication

1. Go to **Security** → **Multi-Factor Auth** in the Auth0 dashboard
2. Enable your preferred MFA methods (SMS, authenticator app, etc.)
3. Define MFA policies and rules

### Configure Rules for Custom Logic

1. Go to **Auth Pipeline** → **Rules**
2. Create custom rules to:
   - Add custom claims to tokens
   - Enforce conditional access
   - Integrate with external services
   - Enrich user profiles

### Set Up Organizations (Auth0 Organizations Feature)

If using Auth0 Organizations:

1. Go to **Organizations** in the Auth0 dashboard
2. Create organizations for different tenants/companies
3. Configure organization-specific branding and connections
4. Enable organization support in your Teable application

