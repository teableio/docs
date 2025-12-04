---
title: "单点登录 (SSO)"
description: "使用 OpenID Connect 为你的 Teable 工作区配置 SSO 认证"
---

<Tip>适用于 Pro 及以上版本</Tip>

## 概述

Teable 支持基于 **OpenID Connect (OIDC)** 标准协议的单点登录认证。

## 支持的身份提供商

<CardGroup cols={2}>
  <Card title="Azure Entra ID" icon="microsoft" href="/zh/basic/sso/azure-entra-id">
    使用 Microsoft Azure Entra ID（原 Azure Active Directory）配置 SSO
  </Card>
  
  <Card title="Okta" icon="shield-halved" href="/zh/basic/sso/okta">
    使用 Okta 身份平台配置 SSO
  </Card>
  
  <Card title="Google Workspace" icon="google" href="/zh/basic/sso/google-workspace">
    使用 Google Workspace 账户配置 SSO
  </Card>
  
  <Card title="Auth0" icon="lock" href="/zh/basic/sso/auth0">
    使用 Auth0 身份平台配置 SSO
  </Card>
  
  <Card title="OneLogin" icon="fingerprint" href="/zh/basic/sso/onelogin">
    使用 OneLogin 身份管理配置 SSO
  </Card>
  
  <Card title="Authentik" icon="key" href="/zh/basic/sso/authentik">
    使用 Authentik 开源身份提供商配置 SSO
  </Card>
</CardGroup>

## 工作原理

所有集成都使用基于 OAuth 2.0 的 **OpenID Connect (OIDC)** 协议：

1. 用户在 Teable 上点击 SSO 登录
2. 用户被重定向到身份提供商
3. 用户使用凭据进行认证
4. 身份提供商将用户信息发送回 Teable
5. 用户登录到 Teable

## 自托管用户指南

如果你运行的是自托管实例，可以配置任何兼容 OIDC 的身份提供商：

<Card title="自托管 OIDC 配置" icon="server" href="/zh/deploy/oidc">
  配置自托管实例的 OIDC 认证
</Card>
