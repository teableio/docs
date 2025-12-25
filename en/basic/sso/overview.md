---
title: "Single Sign-On (SSO)"
description: "Configure SSO authentication for your Teable workspace using OpenID Connect"
---

<Tip>Available for Business plan and above</Tip>

## Overview

Teable supports SSO authentication based on the **OpenID Connect (OIDC)** standard protocol.

## Supported Identity Providers

<CardGroup cols={2}>
  <Card title="Azure Entra ID" icon="microsoft" href="/en/basic/sso/azure-entra-id">
    Configure SSO using Microsoft Azure Entra ID (formerly Azure Active Directory)
  </Card>
  
  <Card title="Okta" icon="shield-halved" href="/en/basic/sso/okta">
    Configure SSO using Okta identity platform
  </Card>
  
  <Card title="Google Workspace" icon="google" href="/en/basic/sso/google-workspace">
    Configure SSO using Google Workspace accounts
  </Card>
  
  <Card title="Auth0" icon="lock" href="/en/basic/sso/auth0">
    Configure SSO using Auth0 identity platform
  </Card>
  
  <Card title="OneLogin" icon="fingerprint" href="/en/basic/sso/onelogin">
    Configure SSO using OneLogin identity management
  </Card>
  
  <Card title="Authentik" icon="key" href="/en/basic/sso/authentik">
    Configure SSO using Authentik open-source identity provider
  </Card>
</CardGroup>

## How It Works

All integrations use the **OpenID Connect (OIDC)** protocol based on OAuth 2.0:

1. User clicks SSO login on Teable
2. User is redirected to your identity provider
3. User authenticates with their credentials
4. Identity provider sends user information back to Teable
5. User is logged into Teable

## For Self-Hosted Users

If you're running a self-hosted instance, you can configure any OIDC-compatible identity provider:

<Card title="OIDC Configuration for Self-Hosted" icon="server" href="/en/deploy/oidc">
  Configure OIDC authentication for your self-hosted instance
</Card>
