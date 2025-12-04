---
title: "OneLogin SSO"
description: "配置 OneLogin 作为 Teable 的 SSO 认证提供商"
---

<Tip>适用于 Pro 及以上版本</Tip>

## 步骤 1：在 Teable 中创建认证提供商

1. 进入 Teable 的 SSO 设置页面
2. 创建新的认证提供商，命名为 **OneLogin** 并选择 **OpenID Connect**

## 步骤 2：访问 OneLogin 管理门户

1. 登录你的 [OneLogin Admin Portal](https://app.onelogin.com/login)
2. 确保你拥有管理员权限
3. 点击顶部菜单的 **Applications**

## 步骤 3：添加新应用程序

1. 点击菜单中的 **Applications** → **Applications**
2. 点击 **Add App** 按钮
3. 在搜索框中搜索 **OpenId Connect (OIDC)**
4. 从结果中选择 **OpenId Connect (OIDC)**
5. 点击 **Save**

## 步骤 4：配置应用程序设置

### 显示信息

在 **Configuration** 选项卡中：

1. **Display Name**（显示名称）：Teable SSO
2. **Description**（描述）：（可选）Teable 的 SSO 集成
3. **Logo**（徽标）：（可选）上传 Teable 徽标
4. 点击 **Save**

### 配置设置

进入 **Configuration** 选项卡并配置：

1. **Redirect URIs**（重定向 URI）：粘贴 Teable 中的**回调 URL**
2. **Login Url**（登录 URL）：（可选）`https://app.teable.io`
3. **Application Type**（应用程序类型）：Web
4. 点击 **Save**

## 步骤 5：获取客户端凭据

进入 **SSO** 选项卡：

1. 找到 **Client ID** 字段并复制其值
2. 找到 **Client Secret** 字段并复制其值（可能需要先点击 "Show"）
3. 将这两个值粘贴到 Teable 的 SSO 配置中

> **警告**：请妥善保管你的客户端密钥。如需要，你可以从此页面重新生成。

## 步骤 6：配置 OAuth 端点

在 **SSO** 选项卡中，你会找到你的 OneLogin 子域名。使用它在 Teable 中配置端点：

- **Authorization URL**（授权 URL）：`https://{subdomain}.onelogin.com/oidc/2/auth`
- **Token URL**（令牌 URL）：`https://{subdomain}.onelogin.com/oidc/2/token`
- **User Info URL**（用户信息 URL）：`https://{subdomain}.onelogin.com/oidc/2/me`
- **Issuer**（颁发者）：`https://{subdomain}.onelogin.com/oidc/2`

> **注意**：请将 `{subdomain}` 替换为你的实际 OneLogin 子域名（例如：`mycompany.onelogin.com`）。你可以在 OneLogin 门户 URL 中找到它。

## 步骤 7：配置应用程序访问

### 分配角色

进入 **Access** 选项卡：

1. **Roles**（角色）：选择哪些角色应该有权访问此应用程序
2. 你可以选择：
   - 特定角色
   - 所有用户
   - 自定义条件
3. 点击 **Save**

### 分配用户

进入 **Users** 选项卡：

1. 点击 **Add Users** 或 **Add Users by Role**
2. 选择应该通过 SSO 访问 Teable 的用户
3. 点击 **Continue** 和 **Save**

## 步骤 8：配置参数（可选）

进入 **Parameters** 选项卡以映射用户属性：

1. 点击 **Add parameter** 创建自定义声明
2. 配置标准 OIDC 声明：
   - **email**：用户电子邮件地址
   - **name**：用户全名
   - **given_name**：用户名字
   - **family_name**：用户姓氏
3. 将每个参数映射到相应的 OneLogin 用户字段
4. 点击 **Save**

## 步骤 9：启用应用程序

1. 确保所有配置已保存
2. 应用程序现在应该已启用并对分配的用户可见
3. 用户将在其 OneLogin 门户中看到 Teable 应用

## 步骤 10：测试 SSO 登录

你有三种方式启用 SSO 登录：

**方式 1：直接使用认证 URL**
- 直接使用授权 URL 作为你的 SSO 登录 URL

**方式 2：OneLogin 门户**
- 用户可以登录到其 OneLogin 门户并点击 Teable 应用程序图标

**方式 3：域名验证**
1. 在 Teable 中配置域名验证
2. 验证你的自定义域名
3. 访问 https://app.teable.io
4. 点击 SSO 登录按钮
5. 输入已验证域名下的电子邮件地址以登录

## 其他配置（可选）

### 配置 MFA

1. 在 OneLogin 管理门户中，进入 **Security** → **Multi-Factor Authentication**
2. 为你的组织或特定用户启用 MFA 策略
3. 配置 MFA 要求（例如：始终要求、新设备要求）

### 设置用户配置（SCIM）

如果要自动从 OneLogin 配置用户到 Teable：

1. 在你的 Teable 应用程序中进入 **Provisioning** 选项卡
2. 启用配置
3. 配置 SCIM 端点（如果 Teable 支持 SCIM）
4. 映射用户属性
5. 启用用户创建、更新和删除

### 配置会话持续时间

1. 在 OneLogin 中进入 **Settings** → **Sessions**
2. 配置会话超时设置
3. 设置空闲超时和最大会话持续时间

### 自定义品牌

1. 在 OneLogin 中进入 **Customization** → **Portal**
2. 自定义 OneLogin 门户外观
3. 添加你的公司徽标、颜色和自定义 CSS
4. 这会影响用户登录 OneLogin 时看到的内容

