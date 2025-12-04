---
title: "Azure Entra ID SSO"
description: "配置 Azure Entra ID 作为 Teable 的 SSO 认证提供商"
---

<Tip>适用于 Pro 及以上版本</Tip>

## 步骤 1：在 Teable 中创建认证提供商

1. 进入 Teable 的 SSO 设置页面
2. 创建新的认证提供商，命名为 **Azure Entra ID**

![](/images/2025-12-04-18-00-20.png)

## 步骤 2：访问 Azure Entra ID

1. 登录你的 Azure 账户
2. 导航至 **Microsoft Entra ID**（原 Azure Active Directory）

![](/images/2025-12-04-18-00-27.png)

## 步骤 3：配置 OAuth 端点

使用你的 **租户 ID** 在 Teable 中填写以下 OAuth 端点：

![](/images/2025-12-04-18-00-51.png)

- **Authorization URL**（授权 URL）：`https://login.microsoftonline.com/_YOUR_TENANT_ID_/oauth2/v2.0/authorize`
- **Token URL**（令牌 URL）：`https://login.microsoftonline.com/_YOUR_TENANT_ID_/oauth2/v2.0/token`
- **User Info URL**（用户信息 URL）：`https://graph.microsoft.com/oidc/userinfo`
- **Issuer**（颁发者）：`https://login.microsoftonline.com/_YOUR_TENANT_ID_/v2.0`

> **注意**：请将 `_YOUR_TENANT_ID_` 替换为你的实际 Azure 租户 ID。

## 步骤 4：注册新应用程序

1. 在 Azure Entra ID 中，点击左侧菜单的 **应用注册**
2. 点击 **+ 新注册**

![](/images/2025-12-04-18-03-39.png)

## 步骤 5：配置应用程序注册

填写应用程序注册表单：

![](/images/2025-12-04-18-01-11.png)
![](/images/2025-12-04-18-01-19.png)

- **名称**：Teable SSO
- **受支持的账户类型**：根据你的需求选择
- **平台**：Web
- **重定向 URI**：粘贴 Teable 中的**回调 URL**

点击**注册**以创建应用程序。

## 步骤 6：保存客户端 ID

1. 从应用程序概述页面复制**应用程序（客户端）ID**

![](/images/2025-12-04-18-01-27.png)

2. 将客户端 ID 粘贴到 Teable 的 SSO 配置中

![](/images/2025-12-04-18-01-32.png)

## 步骤 7：创建客户端密钥

1. 在你的应用程序中，点击左侧菜单的**证书和密钥**

![](/images/2025-12-04-18-01-44.png)

2. 点击 **+ 新客户端密钥**

![](/images/2025-12-04-18-01-50.png)

3. 添加说明并设置过期时间
4. 点击**添加**
5. **重要**：立即复制密钥的**值**并将其保存为 Teable 中的客户端密钥

![](/images/2025-12-04-18-01-55.png)

> **警告**：密钥值仅显示一次，请务必立即保存。

## 步骤 8：配置 API 权限

1. 点击左侧菜单中的 **API 权限**
2. 点击 **+ 添加权限**

![](/images/2025-12-04-18-02-00.png)
![](/images/2025-12-04-18-02-05.png)

3. 选择 **Microsoft Graph**
4. 选择**委托的权限**
5. 添加以下权限：
   - `email`
   - `openid`
   - `profile`
6. 点击**添加权限**

![](/images/2025-12-04-18-02-16.png)

7. 点击**为 [你的目录] 授予管理员同意**按钮以批准权限

## 步骤 9：测试 SSO 登录

你有两种方式启用 SSO 登录：

**方式 1：直接使用认证 URL**
- 直接使用认证 URL 作为你的 SSO 登录 URL

**方式 2：域名验证**
1. 点击左侧菜单中的**域名验证**
2. 验证你的自定义域名
3. 访问你的 Teable 实例
4. 点击 SSO 登录按钮
5. 输入已验证域名下的电子邮件地址以登录

