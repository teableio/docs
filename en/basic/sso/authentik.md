---
title: "Authentik SSO"
description: "Configure Authentik as your SSO authentication provider for Teable"
---

<Tip>Available for Business plan and above</Tip>

## Step 1: Create Authentication Provider in Teable

1. Navigate to your Teable SSO settings
2. Create a new authentication provider and name it **Authentik** and select **OpenID Connect**

## Step 2: Access Authentik Admin Interface

1. Log in to your Authentik instance admin interface
2. The default URL is typically `https://your-authentik-domain/if/admin/`
3. Use your administrator credentials to log in

## Step 3: Create a New Provider

1. Navigate to **Applications** → **Providers** in the left menu
2. Click **Create** button
3. Select **OAuth2/OpenID Provider**
4. Configure the provider settings:

### Basic Settings

- **Name**: Teable SSO Provider
- **Authorization flow**: Select your preferred flow (typically **default-authentication-flow**)
- **Client type**: **Confidential**
- **Client ID**: (Auto-generated, you can customize if needed)
- **Client Secret**: (Auto-generated, copy this value)

### Redirect URIs

- **Redirect URIs/Origins (RegEx)**: Paste the **Callback URL** from Teable
  - For exact match: `https://app.teable.ai/api/auth/callback/authentik`
  - For regex pattern: `https://app\.teable\.ai/api/auth/callback/.*`

### Advanced Settings

- **Scopes**: Make sure the following scopes are available:
  - `openid`
  - `email`
  - `profile`
- **Subject mode**: **Based on the User's hashed ID**
- **Include claims in id_token**: Check this option

Click **Finish** to create the provider.

## Step 4: Save Client Credentials

After creating the provider:

1. Copy the **Client ID** from the provider details
2. Copy the **Client Secret** (this is shown only once during creation)
3. Paste both values into the Teable SSO configuration

> **Warning**: Store the Client Secret securely. You can regenerate it later if needed.

## Step 5: Create an Application

1. Navigate to **Applications** → **Applications** in the left menu
2. Click **Create** button
3. Configure the application:
   - **Name**: Teable
   - **Slug**: `teable` (or your preferred slug)
   - **Provider**: Select the **Teable SSO Provider** you created in Step 3
   - **Launch URL**: (Optional) `https://app.teable.ai`
   - **UI settings**: (Optional) Upload Teable logo and customize appearance

Click **Create** to finish.

## Step 6: Configure OAuth Endpoints

In Teable, fill in the following OAuth endpoints using your Authentik domain:

- **Authorization URL**: `https://{your-authentik-domain}/application/o/authorize/`
- **Token URL**: `https://{your-authentik-domain}/application/o/token/`
- **User Info URL**: `https://{your-authentik-domain}/application/o/userinfo/`
- **Issuer**: `https://{your-authentik-domain}/application/o/{application-slug}/`

> **Note**: Replace `{your-authentik-domain}` with your actual Authentik instance domain and `{application-slug}` with the slug you configured (e.g., `teable`).

## Step 7: Configure Application Access

### Create or Use Existing Flow

1. Navigate to **Flows & Stages** → **Flows**
2. You can use the default flows or create custom ones
3. Typical flows needed:
   - **Authentication flow**: For user login
   - **Authorization flow**: For OAuth2/OIDC authorization

### Assign Access Policy (Optional)

1. Go back to your application settings
2. Scroll to **Policy / Group / User Bindings** section
3. Click **Bind existing policy** to restrict access based on:
   - **Groups**: Only allow specific groups
   - **Users**: Only allow specific users
   - **Custom policies**: Create complex access rules

## Step 8: Configure Scopes and Claims (Optional)

### Review Scopes

1. Navigate to **Customization** → **Property Mappings**
2. Review the **Scope Mappings** for OAuth2/OIDC
3. Ensure the following scopes include the right claims:
   - `openid`: Contains `sub` claim
   - `email`: Contains `email` and `email_verified`
   - `profile`: Contains `name`, `given_name`, `family_name`, etc.

### Add Custom Claims

If you need custom user attributes:

1. Go to **Customization** → **Property Mappings**
2. Click **Create** → **Scope Mapping**
3. Define your custom claims:
   - **Name**: Custom claim name
   - **Scope name**: Scope identifier (e.g., `custom_claims`)
   - **Expression**: Python expression to extract user data
4. Attach the scope to your provider

## Step 9: Test SSO Login

You have two options to enable SSO login:

**Option 1: Direct Authentication URL**
- Use the authorization URL as your SSO login URL
- Users will be redirected to Authentik for authentication

**Option 2: Domain Verification**
1. In Teable, configure domain verification
2. Verify your custom domain
3. Visit https://app.teable.ai
4. Click the SSO login button
5. Enter your email address under the verified domain to log in

## Additional Configuration (Optional)

### Configure Multi-Factor Authentication

1. Navigate to **Flows & Stages** → **Stages**
2. Create MFA stages (e.g., TOTP, WebAuthn, SMS)
3. Go to **Flows & Stages** → **Flows**
4. Edit your authentication flow
5. Add MFA stages to the flow
6. Configure MFA policies and bindings

### Set Up User Enrollment

1. Navigate to **Flows & Stages** → **Flows**
2. Create or edit an enrollment flow
3. Add stages for:
   - User details collection
   - Email verification
   - Password setup
4. Link the enrollment flow to your application

### Configure Password Policies

1. Navigate to **Flows & Stages** → **Policies**
2. Create password policies with requirements like:
   - Minimum length
   - Complexity requirements
   - Password history
   - Expiration rules

### Enable Session Management

1. Navigate to **Events** → **Sessions**
2. Monitor active user sessions
3. Configure session timeout settings in **System** → **Settings**

### Custom Branding

1. Navigate to **Customization** → **Tenants**
2. Edit your tenant settings
3. Customize:
   - Logo and favicon
   - Theme colors
   - Footer text and links
4. Users will see your branding when logging in through Authentik

### Enable Audit Logging

1. Navigate to **Events** → **Logs**
2. Review authentication events and errors
3. Set up notification rules for important events
4. Configure event retention policies in **System** → **Settings**

