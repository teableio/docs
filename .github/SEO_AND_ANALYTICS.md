# Help 页面 SEO 与统计规范

新增或改写 Help 页面时，按本规范检查内容、元数据、内链与统计。页面内容沿用仓库现有的 Mintlify MDX、导航和语言结构；图片规范见 [README](../README.md#image-assets)。

## 先读正文，再写标题与描述

- `title` 对应正文的具体任务、对象或问题，每种语言内保持唯一。让读者看出这篇文档能解决什么，避免关键词罗列、泛化的“完整指南”和重复套用的标题模板。Mintlify 已处理站点标题，不要机械追加品牌后缀。
- `description` 用自然的一两句话说明可完成的操作、适用场景或关键条件。依据实际正文写，不复述标题，不批量替换功能名生成同一句描述，也不承诺未提供的功能或结果。
- 标题变长时，用简短的 `sidebarTitle` 保留清晰的导航名称；修改 SEO 标题时检查原导航标签是否应保留。
- frontmatter 的 `title` 提供页面唯一 H1，正文从 `##` 开始。保留已发布的标题锚点及历史别名，避免破坏旧链接。
- 能力、套餐条件、限制和操作步骤以可核实的产品能力为准。必要限制写成具体使用条件；调研缺口、验收状态和待办放在工作记录中。

## 沿用多语言与索引规则

语言目录为 `en`、`zh`、`ru`、`de`、`fr`、`es`、`it`、`ja`、`tr`、`uk`、`ar`，导航由 [docs.json](../docs.json) 管理。将可翻译的标题、描述、导航名、正文及 alt/aria 文本写入对应语言 MDX 或现有语言资源；使用当地自然表达，不另建一套语言判断或翻译回退机制。

Canonical 应指向该页干净、稳定的正式 HTTPS URL，不含 UTM、站内来源参数、hash、localhost 或 `/src/_props/` 等内部路径。部署后检查平台实际输出，不能以本地预览的内部 URL 作为正式地址。核对各语言 hreflang 的对应关系；隐藏、归档、退役页面分别维护 [隐藏页策略](seo-hidden-pages.json)、[归档策略](seo-archive-policy.json) 和重定向。

## 按上下文添加可访问的真实链接

- 在读者需要进一步了解产品、比较方案、操作案例或客户案例的位置添加内链，链接到实际存在、语言合适的官网页面。先核对目录与目标内容，产品详情页通常直接使用 `/ai-app-builder` 等真实路径，不假设是 `/products/:slug`。
- 使用原生 `<a href>` 或最终能生成原生锚点的 Markdown 链接。卡片使用仓库现有的 `docs-card-link` 外层锚点，避免不可抓取的 `Card href`、空链接和交互元素嵌套。
- 官网内部引流不人为添加 `utm_source` 等获客参数。站内文档来源由共享脚本处理；保留真实外部推广已有的 UTM，根入口语言跳转也必须保留查询参数。

## 复用共享统计契约

[help-link-tracking.js](../help-link-tracking.js) 统一处理受信任官网链接的引荐策略、来源标记和点击事件。不要逐页嵌入 GA 脚本或重复发送 `config`、`page_view`；页面浏览继续由现有 Mintlify/GA 集成负责。受信任的公开官网链接保留 `noopener` 并移除 `noreferrer`，其他外链不套用这条规则。

| 项目      | 当前代码契约                                                                                      |
| --------- | ------------------------------------------------------------------------------------------------- |
| Help 点击 | `teable_help_link_click`，表示跳转意图                                                            |
| 官网落地  | `teable_help_link_arrive`，表示目标页面接收了有效来源标记                                         |
| 来源标记  | `help_source` 为公开文档路径，`help_host` 为允许的 Help 域名，由脚本添加并替换旧值                |
| 事件维度  | `source_path`、`target_path`、`source_domain`、`link_category`、`locale`；`locale` 指来源文档语言 |
| 链接类别  | `product`、`compare`、`blog`、`customer`                                                          |

当前路径验证仅接受最长 100 字符、由小写字母/数字/连字符组成的路径段，可带末尾 `/`；排除编码分隔符、内部路径和私有应用路径。Help 来源域名为 `help.teable.ai`、`help.teable.cn`，来源为语言首页、`basic`/`deploy`/`api-doc`/`compare` 下的文档或符合现有格式的 changelog。目标限于脚本列出的正式 HTTPS 官网域名、产品目录和公开比较/文章/客户案例路径。

新增产品、文档根目录、语言、路径格式或域名时，检查是否超出这些边界。需要扩展时，同步修改 Help 脚本、官网仓库 `src/lib/help-link-arrival.ts` 中的校验及双方回归检查；不要静默扩大到任意 URL。官网对应检查入口为 `node scripts/check-help-link-arrival.mjs`，在官网仓库执行。

事件只传公开、受限的路径和分类值，不传完整查询串、hash、邮箱、邀请参数、凭据或私有资源标识。现有查询参数的保留不等于允许把它们复制到事件字段；新埋点复用现有同意机制，不额外创建身份标识或覆盖原始获客来源。点击、落地、注册成功分别验收，不把按钮点击当作注册完成，也不把不同 GA4 属性自动视为同一条连续会话。

## 按改动验证并记录结果

每个独立修复单独提交；功能或页面改动完成后，在本地启动预览并检查实际 HTML，安排独立子 agent review，解决有效反馈。发现相关小问题直接修复，独立问题加入计划。纯规则文档修改检查链接和内容即可，不为文档格式另写测试。

以下命令在 Help 仓库根目录执行，与现有 CI 保持一致：

```bash
python3 -m pip install -r scripts/requirements-seo.txt
python3 -m unittest discover -s scripts -p 'test_*.py'
node --test scripts/test_*.cjs
python3 scripts/check_docs_seo.py
npx --yes mintlify@4.2.1059 validate
npx --yes mintlify@4.2.1059 broken-links --check-anchors --check-redirects
```

按 [README 的本地预览命令](../README.md#changelog-history-and-local-preview) 启动服务后，运行：

```bash
python3 scripts/check_rendered_seo.py --base-url http://localhost:3000
```

端口使用当前实际预览端口；需要全量检查时加 `--all`。来源追踪改动另外核对跳转前后参数、共享脚本加载、事件字段、重复执行和 SPA 导航；HTTP/VM 检查不能替代实际采集与 GA4 收数证据。

上线前后核对正式 Canonical/hreflang、sitemap、重定向、受影响链接及事件接收情况。记录“配置正确”“事件已发送”“GA4 已收到”“标准来源报表已入表”各自的证据，未验收的环节明确列为待验。当前自动检查覆盖元数据存在性、重复标题、H1、链接和策略一致性等；语言质量、搜索意图和功能真实性仍需编辑与 reviewer 判断。
