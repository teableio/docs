---
title: "OneLogin SSO"
description: "Configure OneLogin as your SSO authentication provider for Teable"
---

<Tip>Available for Pro plan and above</Tip>

## Step 1: Create Authentication Provider in Teable

1. Navigate to your Teable SSO settings
2. Create a new authentication provider and name it **OneLogin** and select **OpenID Connect**

## Step 2: Access OneLogin Admin Portal

1. Log in to your [OneLogin Admin Portal](https://app.onelogin.com/login)
2. Ensure you have administrator privileges
3. Navigate to **Applications** in the top menu

## Step 3: Add a New Application

1. Click **Applications** → **Applications** in the menu
2. Click **Add App** button
3. Search for **OpenId Connect (OIDC)** in the search box
4. Select **OpenId Connect (OIDC)** from the results
5. Click **Save**

## Step 4: Configure Application Settings

### Display Information

In the **Configuration** tab:

1. **Display Name**: Teable SSO
2. **Description**: (Optional) SSO integration for Teable
3. **Logo**: (Optional) Upload Teable logo
4. Click **Save**

### Configuration Settings

Go to the **Configuration** tab and configure:

1. **Redirect URIs**: Paste the **Callback URL** from Teable
2. **Login Url**: (Optional) `https://app.teable.io`
3. **Application Type**: Web
4. Click **Save**

## Step 5: Get Client Credentials

Go to the **SSO** tab:

1. Find the **Client ID** field and copy the value
2. Find the **Client Secret** field and copy the value (you may need to click "Show" first)
3. Paste both values into the Teable SSO configuration

> **Warning**: Keep your Client Secret secure. You can regenerate it if needed from this page.

## Step 6: Configure OAuth Endpoints

In the **SSO** tab, you'll find your OneLogin subdomain. Use it to configure the endpoints in Teable:

- **Authorization URL**: `https://{subdomain}.onelogin.com/oidc/2/auth`
- **Token URL**: `https://{subdomain}.onelogin.com/oidc/2/token`
- **User Info URL**: `https://{subdomain}.onelogin.com/oidc/2/me`
- **Issuer**: `https://{subdomain}.onelogin.com/oidc/2`

> **Note**: Replace `{subdomain}` with your actual OneLogin subdomain (e.g., `mycompany.onelogin.com`). You can find this in your OneLogin portal URL.

## Step 7: Configure Application Access

### Assign Roles

Go to the **Access** tab:

1. **Roles**: Select which roles should have access to this application
2. You can select:
   - Specific roles
   - All users
   - Custom conditions
3. Click **Save**

### Assign Users

Go to the **Users** tab:

1. Click **Add Users** or **Add Users by Role**
2. Select the users who should have access to Teable via SSO
3. Click **Continue** and **Save**

## Step 8: Configure Parameters (Optional)

Go to the **Parameters** tab to map user attributes:

1. Click **Add parameter** to create custom claims
2. Configure standard OIDC claims:
   - **email**: User email address
   - **name**: User full name
   - **given_name**: User first name
   - **family_name**: User last name
3. Map each parameter to the corresponding OneLogin user field
4. Click **Save**

## Step 9: Enable the Application

1. Make sure all configurations are saved
2. The application should now be enabled and visible to assigned users
3. Users will see the Teable app in their OneLogin portal

## Step 10: Test SSO Login

You have three options to enable SSO login:

**Option 1: Direct Authentication URL**
- Use the authorization URL as your SSO login URL

**Option 2: OneLogin Portal**
- Users can log in to their OneLogin portal and click the Teable application icon

**Option 3: Domain Verification**
1. In Teable, configure domain verification
2. Verify your custom domain
3. Visit https://app.teable.io
4. Click the SSO login button
5. Enter your email address under the verified domain to log in

## Additional Configuration (Optional)

### Configure MFA

1. In OneLogin Admin Portal, go to **Security** → **Multi-Factor Authentication**
2. Enable MFA policies for your organization or specific users
3. Configure MFA requirements (e.g., always require, require for new devices)

### Set Up Provisioning (SCIM)

If you want to automatically provision users from OneLogin to Teable:

1. Go to the **Provisioning** tab in your Teable application
2. Enable provisioning
3. Configure the SCIM endpoint (if Teable supports SCIM)
4. Map user attributes
5. Enable user creation, updates, and deletion

### Configure Session Duration

1. Go to **Settings** → **Sessions** in OneLogin
2. Configure session timeout settings
3. Set idle timeout and maximum session duration

### Custom Branding

1. Go to **Customization** → **Portal** in OneLogin
2. Customize the OneLogin portal appearance
3. Add your company logo, colors, and custom CSS
4. This affects what users see when they log in to OneLogin

