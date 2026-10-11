# Canvas Rift：CI 使用与学习说明

工作流源文件：[`.github/workflows/ci.yml`](../.github/workflows/ci.yml)。它复用项目已有 npm 脚本，执行依赖安装、类型检查、自动化测试和生产构建。

## CI 与 GitHub Actions

CI（持续集成）是在频繁合入代码时，自动执行一套固定检查，让问题尽早暴露。对本项目而言，每次推送或提交 PR 后，都由另一台干净的机器安装锁定依赖、检查类型、运行回归测试并构建，减少“我的电脑能运行，但别人不行”的情况。

GitHub Actions 是执行这些自动化任务的平台。CI 是工作方式，Actions 是本项目用来实现它的工具；Actions 也能部署，但当前配置只做验证。参见 [GitHub CI 说明](https://docs.github.com/en/actions/get-started/continuous-integration)。

## 对照实际配置理解

| 概念 / 配置 | 本项目中的含义 |
| --- | --- |
| Workflow | 整份 `ci.yml` 定义的自动化流程，名称为 `CI` |
| Job | `jobs.verify` 是本流程唯一的任务，包含六个步骤 |
| Runner | `runs-on: ubuntu-latest` 选择 GitHub 提供的标准 Ubuntu 虚拟机来执行任务 |
| Step | `steps` 中的每个条目，在同一个 Job 的机器上按顺序执行 |
| `name` | 工作流及步骤的显示名称，方便在 Actions 日志中定位 |
| `on.push.branches: [release]` | 推送更新到 `release` 时触发 |
| `on.pull_request.branches: [release]` | 新建、重新打开或更新目标分支为 `release` 的 PR 时触发；这里筛选的是合入目标分支 |
| `on.workflow_dispatch` | 允许在 Actions 页面手动运行；工作流需先出现在默认分支，本仓库默认分支就是 `release` |
| `permissions.contents: read` | 内置 `GITHUB_TOKEN` 仅取得读取代码的权限，其他可配置权限为无；不需要自行添加密钥 |
| `timeout-minutes: 10` | Job 最长运行十分钟，超时会停止，避免任务一直卡住 |
| `uses` | 调用现成的 Action，本项目使用官方检出代码与配置 Node 的工具 |
| `with` | 向 Action 传入参数，例如 Node 版本 |
| `run` | 在 Runner 的终端执行命令 |

YAML 用缩进表达层级，本文件统一使用空格。GitHub 收到匹配事件后，读取相应提交中的工作流，安排 Runner 执行。只在本地创建文件或执行 `git commit` 不会触发 GitHub。参见 [工作流概念](https://docs.github.com/en/actions/concepts/workflows-and-actions/workflows)与 [YAML 配置规范](https://docs.github.com/en/actions/reference/workflows-and-actions/workflow-syntax)。

标准托管 Runner 在公开仓库的执行时间免费，本配置不使用大型付费 Runner、不上传构建产物，也没有添加缓存配置。参见 [GitHub Actions 计费说明](https://docs.github.com/en/billing/concepts/product-billing/github-actions)。

## 六个步骤如何执行

| 日志中的步骤名称 | 执行内容与用途 |
| --- | --- |
| Check out code | `actions/checkout@v6` 把触发此次运行的代码检出到 Runner；`persist-credentials: false` 不为后续命令保存认证凭据 |
| Set up Node.js | `actions/setup-node@v6` 配置 Node 22；后续 npm 命令使用这个版本 |
| Install dependencies | `npm ci` 按 `package-lock.json` 安装完整依赖，包括 TypeScript 与 Vite 等开发依赖 |
| TypeScript type check | `npm run check` 执行 `tsc --noEmit`，检查类型和接口使用，不产生 JavaScript 文件 |
| Run tests | `npm test` 使用 Node 自带测试运行器，验证碰撞、章节边界、裂缝、宅邸、笔触几何和运镜等行为 |
| Production build | `npm run build` 再做类型检查并执行 `vite build`，确认可以生成生产版 `dist/` |

`@v6` 是 Action 自身的版本号，与项目选择的 Node 22 是不同的编号。本项目测试会直接导入 `.ts` 文件，需要 Node 22.18+ 的原生类型擦除能力；它负责运行代码，不负责类型检查，所以仍需 `tsc`。参见 [Node 原生 TypeScript 说明](https://nodejs.org/learn/typescript/run-natively)。

`npm install` 适合日常开发及添加依赖，必要时会更新锁文件。`npm ci` 适合干净安装和 CI：要求已有锁文件，若它与 `package.json` 不一致就失败；安装前清理已有 `node_modules`，不改写包清单或锁文件。因此仓库必须提交 `package-lock.json`，保证不同机器使用相同的依赖版本。参见 [npm ci 官方说明](https://docs.npmjs.com/cli/v11/commands/npm-ci/)。

三项检查各有作用：类型检查发现类型与调用约定问题，测试检查运行行为，构建发现生产打包与资源引用问题。任意一项成功都不能替代另外两项；它们也不能替代人工观察画质与交互体验。

保留原有 `build` 脚本中的类型检查，虽然 CI 会检查两次，但无需为此修改现有构建体系。独立的类型检查 Step 可以更早、更明确地定位错误。

## 手动推送与观察第一次运行

在项目目录执行：

```sh
git branch --show-current
git status --short --branch
git log --oneline origin/release..release
git push origin release
```

前三条用于确认当前分支是 `release`、检查工作区及查看待推送提交；最后一条才会上传。本地提交已完成，推送时保持现有安全钩子，不使用强制推送、不推送 `main` 或旧标签。

推送后打开 [仓库 Actions 页面](https://github.com/perseverance-geek/canvas-rift/actions)：

1. 点击左侧 **CI**，打开最新一条运行，核对分支 `release` 和提交 SHA。
2. 点击 **verify** Job，逐个展开六个步骤，查看命令输出。
3. 绿色成功表示所有必需步骤退出码为 0；红色失败时，先展开第一个失败步骤查看原因。前面的步骤失败后，后续普通步骤会跳过。
4. 依赖步骤失败时检查安装日志与锁文件；类型失败看源码位置；测试失败看失败用例与断言；构建失败看 Vite 错误。修复后正常提交并推送，会产生新的运行。

已有 Three 核心包超过 500 kB 的构建体积提示属于警告；构建退出码为 0 时仍算成功。绿色 CI 表示这套检查通过，不能证明所有浏览器、画质和操作路径都无问题。

工作流上传到默认分支后，也可以在 **Actions → CI → Run workflow** 选择 `release` 手动执行。同一提交重跑用于确认环境或网络问题；修改代码则应提交新版本。参见 [查看运行记录](https://docs.github.com/en/actions/how-tos/monitor-workflows/view-workflow-run-history)与 [手动运行说明](https://docs.github.com/en/actions/how-tos/manage-workflow-runs/manually-run-a-workflow)。

## PR、代码审查与 CD 如何配合

PR 提出要合入 `release` 的变更；CI 对变更自动运行固定检查，在 PR 的检查区域显示结果。PR 合并后，`release` 的推送事件会再次验证合入后的代码。本次没有配置分支保护或必须通过的状态检查，所以添加 CI 本身不会强制阻止失败的 PR 被合并。

Codex Code Review 可以补充检查设计、逻辑和测试未覆盖的问题；CI 提供可重复的命令结果，代码审查提供判断，两者共同辅助维护者决定是否合入。OpenAI 官方说明也强调代码审查不能替代测试、分支保护和必要审批。参见 [Codex Code Review 官方说明](https://developers.openai.com/blog/custom-code-review-rules-for-codex)。本阶段未启用自动审查。

CD（持续交付 / 持续部署）在验证之后处理交付与部署；持续部署通常把通过检查的变更自动发布到运行环境。本项目现在只生成并验证 `dist/`，没有上传或部署它，没有配置 GitHub Pages。参见 [GitHub 持续部署说明](https://docs.github.com/en/actions/get-started/continuous-deployment)。

## 本次验证范围

本地使用官方 Node 22.23.3 / npm 10.9.9 在 macOS 验证：`npm ci`、`npm run check`、20 项测试及生产构建全部通过。YAML 使用本机已有解析器检查语法与重复键，并核对触发事件、权限、Runner、Action 参数和步骤命令。源码、现有测试、依赖清单及锁文件均未修改。

尚未推送此工作流，GitHub Ubuntu Runner 的真实执行与 GitHub 页面展示仍需通过上面的首次推送确认；本地验证不等同于远端运行已成功。
