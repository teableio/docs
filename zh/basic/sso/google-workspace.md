---
title: "Google Workspace SSO"
description: "配置 Google Workspace 作为 Teable 的 SSO 认证提供商"
---

<Tip>适用于专业版及以上版本</Tip>

## 步骤 1：在 Teable 中创建认证提供商

1. 进入 Teable 的 SSO 设置页面
2. 创建新的认证提供商，命名为 **Google Workspace** 并选择 **OpenID Connect**

## 步骤 2：访问 Google Cloud Console

1. 访问 [Google Cloud Console](https://console.cloud.google.com)
2. 使用你的 Google Workspace 管理员账户登录
3. 选择或创建一个用于 Teable SSO 集成的项目

## 步骤 3：启用 Google Identity Services

1. 在 Google Cloud Console 中，导航至 **APIs & Services** → **Library**
2. 搜索 **Google Identity** 或 **Google+ API**
3. 如果尚未启用，点击 **Enable**

## 步骤 4：配置 OAuth 同意屏幕

1. 进入 **APIs & Services** → **OAuth consent screen**
2. 选择 **Internal**（仅限 Google Workspace 用户）或 **External**
3. 填写必要信息：
   - **App name**（应用名称）：Teable SSO
   - **User support email**（用户支持邮箱）：你的邮箱地址
   - **App logo**（应用徽标）：（可选）上传 Teable 徽标
   - **Authorized domains**（授权域名）：添加你的 Teable 域名
   - **Developer contact information**（开发者联系信息）：你的邮箱地址
4. 点击 **Save and Continue**

### 配置范围

1. 点击 **Add or Remove Scopes**
2. 添加以下范围：
   - `openid`
   - `email`
   - `profile`
3. 点击 **Update**，然后点击 **Save and Continue**

### 添加测试用户（如果使用 External）

如果选择了 "External"，在开发期间添加测试用户：
1. 点击 **Add Users**
2. 输入测试用户的电子邮件地址
3. 点击 **Save and Continue**

## 步骤 5：创建 OAuth 客户端 ID

1. 进入 **APIs & Services** → **Credentials**
2. 点击 **Create Credentials** → **OAuth client ID**
3. 选择 **Web application** 作为应用程序类型
4. 配置客户端：
   - **Name**（名称）：Teable SSO Client
   - **Authorized JavaScript origins**（授权的 JavaScript 来源）：（可选）`https://app.teable.cn`
   - **Authorized redirect URIs**（授权的重定向 URI）：粘贴 Teable 中的**回调 URL**
5. 点击 **Create**

## 步骤 6：保存客户端凭据

创建 OAuth 客户端后，会弹出一个对话框显示你的凭据：

1. 复制 **Client ID**（客户端 ID）
2. 复制 **Client Secret**（客户端密钥）
3. 点击 **OK**
4. 将这两个值粘贴到 Teable 的 SSO 配置中

> **注意**：你可以随时从 Credentials 页面检索这些凭据。

## 步骤 7：配置 OAuth 端点

在 Teable 中填写以下 OAuth 端点：

- **Authorization URL**（授权 URL）：`https://accounts.google.com/o/oauth2/v2/auth`
- **Token URL**（令牌 URL）：`https://oauth2.googleapis.com/token`
- **User Info URL**（用户信息 URL）：`https://openidconnect.googleapis.com/v1/userinfo`
- **Issuer**（颁发者）：`https://accounts.google.com`

## 步骤 8：测试 SSO 登录

你有两种方式启用 SSO 登录：

**方式 1：直接使用认证 URL**
- 直接使用授权 URL 作为你的 SSO 登录 URL

**方式 2：域名验证**
1. 在 Teable 中配置域名验证
2. 验证你的 Google Workspace 域名
3. 访问 https://app.teable.cn
4. 点击 SSO 登录按钮
5. 输入你的 Google Workspace 电子邮件地址以登录

## 其他配置（可选）

### 按域名限制访问

如果要限制对特定 Google Workspace 域名的访问：

1. 在你的应用程序代码或 Teable 设置中配置域名限制
2. 仅允许来自已验证域名的电子邮件地址

### 配置会话持续时间

1. 在 Google Admin Console 中，进入 **Security** → **Authentication**
2. 配置 **Google session control** 设置
3. 设置会话持续时间和重新认证策略

### 启用两步验证

1. 在 Google Admin Console 中，进入 **Security** → **Authentication** → **2-Step Verification**
2. 为你的组织启用两步验证
3. 为用户配置强制策略

