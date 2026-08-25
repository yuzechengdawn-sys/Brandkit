# BrandKit — 品牌规范与素材生产原型

一期纯前端演示。项目使用原生 HTML、CSS 和少量 JavaScript，无构建步骤、无 npm 依赖。`index.html` 默认进入 Guide。

## 页面

| 文件 | 页面 | 当前作用 |
|---|---|---|
| `index.html` | 默认入口 | 自动进入 Guide / Basic |
| `guide-basic.html` | Guide / Basic | 标识、留白、最小尺寸、基础配色与错误用法 |
| `guide-color.html` | Guide / Color | 品牌色与语义色板；可下载示例 token |
| `guide-font.html` | Guide / Font | 方正兰亭可变黑的中英文字重与使用规则 |
| `guide-grid.html` | Guide / Grid | 海报与营销长图的版式骨架 |
| `guide-motion.html` | Guide / Motion | 可播放的进入、移动动效与参数规范 |
| `guide-theme.html` | Guide / Theme | 视觉语言与主题配色 |
| `guide-moodboard.html` | Guide / Moodboard | 可切换排列方式的品牌情绪板与选图原则 |
| `guide-assets.html` | Guide / Assets | 标识、视觉参考、token 与 Skill 的统一下载入口 |
| `make-new.html` | Make / 新建任务 | 结构化选择物料、示例文档、模板、尺寸和配色 |
| `make-result.html` | Make / 示例结果 | 根据海报或营销长图选项展示固定案例和示例检查 |
| `make.html` | Make / 品牌模板库 | 使用项目现有品牌供图展示 8 个海报、营销长图模板 |
| `review.html` | Audit | 卡片式工单与示例审核状态 |
| `mcp.html` | MCP 服务 | 安装配置、能力清单和按任务路由规则的演示 |

`assets/skills/` 中的 Markdown 和 `assets/brandkit-colors.tokens.json` 都是可下载的演示占位文件，不是已发布的生产规则包。

## 一期演示闭环

```text
Guide 查看与下载规则
  → Make 选择海报或营销长图
  → 查看固定案例与示例检查
  → Audit 查看同名待审核工单

MCP 从同一套规则中按任务返回所需部分
```

Make 当前不会读取真实云文档，也没有连接生成服务；Result 和 Audit 使用固定演示数据。MCP 页面不会连接真实服务器，配置地址和令牌均为占位符。

## 导航与身份

静态演示为了方便检查，会同时显示 Guide、Make、Audit。正式接入身份系统后由服务端直接渲染可见入口，页面不额外显示角色标签：

- 普通访问者：Guide
- 内部员工：Guide、Make
- 有审核权限的账号：Guide、Make、Audit

MCP 是全局入口，不属于某个一级栏目。

## 设计约定

- 页面骨架参考 Trae Design Library：300px 左栏、8px 主内容外边距、白色圆角内容面板。
- Alert、Button、Card、Badge、Input、Select、Tabs 的几何和状态参考 shadcn/ui 默认 light 主题。
- 英文与数字使用 Geist；中文使用 Noto Sans SC，接近 Figma 当前中文界面的显示效果。
- Basic 五张规范图使用统一画布；前三张标识规范图统一为相同展示宽度。
- 品牌色统一为橙 `#FF4A07`、黄 `#FBF724`、蓝 `#0380FF`。黄色和蓝色以品牌强调色命名，不冒充 error / success 状态。
- Font、Motion、Moodboard 与 Assets 使用 Vessa 式浅灰规范纸张、蓝色网点场和实时展示组件。

## 当前可交互内容

- Guide 的资产、token 与 Skill 示例可下载。
- Make 的物料类型可用键盘选择，并会联动模板与尺寸；提交后根据海报或营销长图展示对应示例。
- MCP 的“复制配置”可复制代码，失败时会提示手动复制。
- 模板库搜索与三组筛选器可用；Audit 的筛选和审核按钮仍为视觉演示，不会写入数据。

## 本地预览

```bash
python -m http.server 8000
```

访问 `http://localhost:8000/`。字体使用 Google Fonts CDN；离线时会回落到系统无衬线字体。
