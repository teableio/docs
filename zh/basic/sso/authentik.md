---
title: "Authentik SSO"
description: "配置 Authentik 作为 Teable 的 SSO 认证提供商"
---

<Tip>适用于 Business 版及以上版本</Tip>

## 步骤 1：在 Teable 中创建认证提供商

1. 进入 Teable 的 SSO 设置页面
2. 创建新的认证提供商，命名为 **Authentik** 并选择 **OpenID Connect**

## 步骤 2：访问 Authentik 管理界面

1. 登录你的 Authentik 实例管理界面
2. 默认 URL 通常是 `https://your-authentik-domain/if/admin/`
3. 使用管理员凭据登录

## 步骤 3：创建新提供商

1. 点击左侧菜单的 **Applications** → **Providers**
2. 点击 **Create** 按钮
3. 选择 **OAuth2/OpenID Provider**
4. 配置提供商设置：

### 基本设置

- **Name**（名称）：Teable SSO Provider
- **Authorization flow**（授权流程）：选择你偏好的流程（通常是 **default-authentication-flow**）
- **Client type**（客户端类型）：**Confidential**
- **Client ID**（客户端 ID）：（自动生成，如需要可自定义）
- **Client Secret**（客户端密钥）：（自动生成，请复制此值）

### 重定向 URI

- **Redirect URIs/Origins (RegEx)**（重定向 URI/来源）：粘贴 Teable 中的**回调 URL**
  - 精确匹配：`https://app.teable.cn/api/auth/callback/authentik`
  - 正则表达式模式：`https://app\.teable\.cn/api/auth/callback/.*`

### 高级设置

- **Scopes**（范围）：确保以下范围可用：
  - `openid`
  - `email`
  - `profile`
- **Subject mode**（主题模式）：**Based on the User's hashed ID**
- **Include claims in id_token**（在 id_token 中包含声明）：勾选此选项

点击 **Finish** 创建提供商。

## 步骤 4：保存客户端凭据

创建提供商后：

1. 从提供商详情中复制 **Client ID**（客户端 ID）
2. 复制 **Client Secret**（客户端密钥，仅在创建时显示一次）
3. 将这两个值粘贴到 Teable 的 SSO 配置中

> **警告**：请安全地存储客户端密钥。如需要，你可以稍后重新生成。

## 步骤 5：创建应用程序

1. 点击左侧菜单的 **Applications** → **Applications**
2. 点击 **Create** 按钮
3. 配置应用程序：
   - **Name**（名称）：Teable
   - **Slug**（标识符）：`teable`（或你偏好的标识符）
   - **Provider**（提供商）：选择你在步骤 3 中创建的 **Teable SSO Provider**
   - **Launch URL**（启动 URL）：（可选）`https://app.teable.cn`
   - **UI settings**（界面设置）：（可选）上传 Teable 徽标并自定义外观

点击 **Create** 完成。

## 步骤 6：配置 OAuth 端点

在 Teable 中使用你的 Authentik 域名填写以下 OAuth 端点：

- **Authorization URL**（授权 URL）：`https://{your-authentik-domain}/application/o/authorize/`
- **Token URL**（令牌 URL）：`https://{your-authentik-domain}/application/o/token/`
- **User Info URL**（用户信息 URL）：`https://{your-authentik-domain}/application/o/userinfo/`
- **Issuer**（颁发者）：`https://{your-authentik-domain}/application/o/{application-slug}/`

> **注意**：请将 `{your-authentik-domain}` 替换为你的实际 Authentik 实例域名，将 `{application-slug}` 替换为你配置的标识符（例如：`teable`）。

## 步骤 7：配置应用程序访问

### 创建或使用现有流程

1. 导航至 **Flows & Stages** → **Flows**
2. 你可以使用默认流程或创建自定义流程
3. 通常需要的流程：
   - **Authentication flow**（认证流程）：用于用户登录
   - **Authorization flow**（授权流程）：用于 OAuth2/OIDC 授权

### 分配访问策略（可选）

1. 返回应用程序设置
2. 滚动到 **Policy / Group / User Bindings** 部分
3. 点击 **Bind existing policy** 以基于以下条件限制访问：
   - **Groups**（组）：仅允许特定组
   - **Users**（用户）：仅允许特定用户
   - **Custom policies**（自定义策略）：创建复杂的访问规则

## 步骤 8：配置范围和声明（可选）

### 审查范围

1. 导航至 **Customization** → **Property Mappings**
2. 审查 OAuth2/OIDC 的 **Scope Mappings**
3. 确保以下范围包含正确的声明：
   - `openid`：包含 `sub` 声明
   - `email`：包含 `email` 和 `email_verified`
   - `profile`：包含 `name`、`given_name`、`family_name` 等

### 添加自定义声明

如果需要自定义用户属性：

1. 进入 **Customization** → **Property Mappings**
2. 点击 **Create** → **Scope Mapping**
3. 定义你的自定义声明：
   - **Name**（名称）：自定义声明名称
   - **Scope name**（范围名称）：范围标识符（例如：`custom_claims`）
   - **Expression**（表达式）：用于提取用户数据的 Python 表达式
4. 将范围附加到你的提供商

## 步骤 9：测试 SSO 登录

你有两种方式启用 SSO 登录：

**方式 1：直接使用认证 URL**
- 直接使用授权 URL 作为你的 SSO 登录 URL
- 用户将被重定向到 Authentik 进行认证

**方式 2：域名验证**
1. 在 Teable 中配置域名验证
2. 验证你的自定义域名
3. 访问 https://app.teable.cn
4. 点击 SSO 登录按钮
5. 输入已验证域名下的电子邮件地址以登录

## 其他配置（可选）

### 配置多因素认证

1. 导航至 **Flows & Stages** → **Stages**
2. 创建 MFA 阶段（例如：TOTP、WebAuthn、SMS）
3. 进入 **Flows & Stages** → **Flows**
4. 编辑你的认证流程
5. 将 MFA 阶段添加到流程中
6. 配置 MFA 策略和绑定

### 设置用户注册

1. 导航至 **Flows & Stages** → **Flows**
2. 创建或编辑注册流程
3. 为以下内容添加阶段：
   - 用户详细信息收集
   - 电子邮件验证
   - 密码设置
4. 将注册流程链接到你的应用程序

### 配置密码策略

1. 导航至 **Flows & Stages** → **Policies**
2. 创建密码策略，包括以下要求：
   - 最小长度
   - 复杂性要求
   - 密码历史
   - 过期规则

### 启用会话管理

1. 导航至 **Events** → **Sessions**
2. 监控活跃用户会话
3. 在 **System** → **Settings** 中配置会话超时设置

### 自定义品牌

1. 导航至 **Customization** → **Tenants**
2. 编辑你的租户设置
3. 自定义：
   - 徽标和网站图标
   - 主题颜色
   - 页脚文本和链接
4. 用户通过 Authentik 登录时将看到你的品牌

### 启用审计日志

1. 导航至 **Events** → **Logs**
2. 审查认证事件和错误
3. 为重要事件设置通知规则
4. 在 **System** → **Settings** 中配置事件保留策略

