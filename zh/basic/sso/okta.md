---
title: "Okta SSO"
description: "配置 Okta 作为 Teable 的 SSO 认证提供商"
---

<Tip>适用于商业版及以上版本</Tip>

## 步骤 1：在 Teable 中创建认证提供商

1. 进入 Teable 的 SSO 设置页面
2. 创建新的认证提供商，命名为 **Okta** 并选择 **OpenID Connect**

## 步骤 2：访问 Okta 管理控制台

1. 登录你的 Okta 账户
2. 进入 **管理员仪表板**
3. 点击左侧菜单的 **Applications** → **Applications**

## 步骤 3：创建新应用程序

1. 点击 **Create App Integration**
2. 选择 **OIDC - OpenID Connect** 作为登录方法
3. 选择 **Web Application** 作为应用程序类型
4. 点击 **Next**

## 步骤 4：配置应用程序设置

填写应用程序配置表单：

- **App integration name**（应用集成名称）：Teable SSO
- **Grant type**（授权类型）：勾选 **Authorization Code**
- **Sign-in redirect URIs**（登录重定向 URI）：粘贴 Teable 中的**回调 URL**
- **Sign-out redirect URIs**（登出重定向 URI）：（可选）`https://app.teable.cn`
- **Controlled access**（访问控制）：选择谁可以访问此应用程序

点击 **Save** 创建应用程序。

## 步骤 5：保存客户端凭据

创建应用程序后，你会看到应用程序详情页面：

1. 复制 **Client ID**（客户端 ID）
2. 复制 **Client Secret**（客户端密钥，如需要请点击 "Show"）
3. 将这两个值粘贴到 Teable 的 SSO 配置中

> **警告**：请妥善保管你的客户端密钥，切勿公开分享。

## 步骤 6：配置 OAuth 端点

在 Teable 中填写以下 OAuth 端点：

- **Authorization URL**（授权 URL）：`https://{yourOktaDomain}/oauth2/v1/authorize`
- **Token URL**（令牌 URL）：`https://{yourOktaDomain}/oauth2/v1/token`
- **User Info URL**（用户信息 URL）：`https://{yourOktaDomain}/oauth2/v1/userinfo`
- **Issuer**（颁发者）：`https://{yourOktaDomain}`

> **注意**：请将 `{yourOktaDomain}` 替换为你的实际 Okta 域名（例如：`dev-123456.okta.com` 或 `mycompany.okta.com`）

## 步骤 7：分配用户或组

1. 在 Okta 应用程序中，进入 **Assignments** 选项卡
2. 点击 **Assign** → **Assign to People** 或 **Assign to Groups**
3. 选择应该通过 SSO 访问 Teable 的用户或组
4. 点击 **Assign** 和 **Done**

## 步骤 8：测试 SSO 登录

你有两种方式启用 SSO 登录：

**方式 1：直接使用认证 URL**
- 直接使用授权 URL 作为你的 SSO 登录 URL

**方式 2：域名验证**
1. 在 Teable 中配置域名验证
2. 验证你的自定义域名
3. 访问 https://app.teable.cn
4. 点击 SSO 登录按钮
5. 输入已验证域名下的电子邮件地址以登录

## 其他配置（可选）

### 配置自定义声明

如果需要映射其他用户属性：

1. 在 Okta 管理员中进入 **Security** → **API**
2. 选择你的授权服务器（通常是 "default"）
3. 进入 **Claims** 选项卡
4. 根据需要添加自定义声明（例如：部门、角色）

### 启用多因素认证

1. 在 Okta 管理员中进入 **Security** → **Authenticators**
2. 配置你偏好的 MFA 方法
3. 为你的 Teable 应用程序创建认证策略

