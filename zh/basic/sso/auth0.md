---
title: "Auth0 SSO"
description: "配置 Auth0 作为 Teable 的 SSO 认证提供商"
---

<Tip>适用于 Business 版及以上版本</Tip>

## 步骤 1：在 Teable 中创建认证提供商

1. 进入 Teable 的 SSO 设置页面
2. 创建新的认证提供商，命名为 **Auth0** 并选择 **OpenID Connect**

## 步骤 2：访问 Auth0 仪表板

1. 登录你的 [Auth0 Dashboard](https://manage.auth0.com)
2. 选择你的 Auth0 租户
3. 点击左侧菜单的 **Applications** → **Applications**

## 步骤 3：创建新应用程序

1. 点击 **Create Application**
2. 输入应用程序详情：
   - **Name**（名称）：Teable SSO
   - **Application Type**（应用程序类型）：选择 **Regular Web Applications**
3. 点击 **Create**

## 步骤 4：配置应用程序设置

创建应用程序后，进入 **Settings** 选项卡：

### 基本信息

1. 复制你的 **Domain**（域名，例如：`your-tenant.auth0.com` 或 `your-tenant.us.auth0.com`）
2. 复制 **Client ID**（客户端 ID）
3. 复制 **Client Secret**（客户端密钥）
4. 将这些值粘贴到 Teable 的 SSO 配置中

### 应用程序 URI

向下滚动到 **Application URIs** 部分：

1. **Allowed Callback URLs**（允许的回调 URL）：粘贴 Teable 中的**回调 URL**
2. **Allowed Logout URLs**（允许的登出 URL）：（可选）`https://app.teable.cn`
3. **Allowed Web Origins**（允许的 Web 来源）：（可选）`https://app.teable.cn`
4. 点击页面底部的 **Save Changes**

> **警告**：在离开页面之前务必保存更改。

## 步骤 5：配置 OAuth 端点

在 Teable 中使用你的 Auth0 域名填写以下 OAuth 端点：

- **Authorization URL**（授权 URL）：`https://{yourDomain}/authorize`
- **Token URL**（令牌 URL）：`https://{yourDomain}/oauth/token`
- **User Info URL**（用户信息 URL）：`https://{yourDomain}/userinfo`
- **Issuer**（颁发者）：`https://{yourDomain}/`

> **注意**：请将 `{yourDomain}` 替换为步骤 4 中的实际 Auth0 域名。

## 步骤 6：配置连接（可选）

Auth0 允许你启用多个身份提供商。要配置可用的登录方法：

1. 在应用程序设置中，进入 **Connections** 选项卡
2. 启用你想要支持的认证方法：
   - **Database**：用户名/密码认证
   - **Social**：Google、Microsoft、GitHub 等
   - **Enterprise**：SAML、Active Directory 等
3. 根据需要配置每个连接

## 步骤 7：自定义登录体验（可选）

### 通用登录页面

1. 在 Auth0 仪表板中进入 **Branding** → **Universal Login**
2. 自定义登录页面外观
3. 添加你的公司徽标和品牌颜色

### 邮件模板

1. 进入 **Branding** → **Email Templates**
2. 自定义验证、密码重置等邮件模板

## 步骤 8：配置用户权限

### 定义范围

1. 在 Auth0 仪表板中进入 **Applications** → **APIs**
2. 选择 **Auth0 Management API** 或创建自定义 API
3. 定义应用程序所需的范围/权限

### 分配角色（可选）

1. 进入 **User Management** → **Roles**
2. 为不同的用户类型创建角色
3. 为每个角色分配权限
4. 将用户分配到适当的角色

## 步骤 9：测试 SSO 登录

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

### 启用多因素认证

1. 在 Auth0 仪表板中进入 **Security** → **Multi-Factor Auth**
2. 启用你偏好的 MFA 方法（短信、认证器应用等）
3. 定义 MFA 策略和规则

### 配置自定义逻辑规则

1. 进入 **Auth Pipeline** → **Rules**
2. 创建自定义规则以：
   - 向令牌添加自定义声明
   - 强制条件访问
   - 与外部服务集成
   - 丰富用户配置文件

### 设置组织（Auth0 Organizations 功能）

如果使用 Auth0 Organizations：

1. 在 Auth0 仪表板中进入 **Organizations**
2. 为不同的租户/公司创建组织
3. 配置组织特定的品牌和连接
4. 在你的 Teable 应用程序中启用组织支持

