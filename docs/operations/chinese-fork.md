# T3 Code 简体中文 Fork

本 Fork 在上游 `pingdotgg/t3code` 的基础上提供默认简体中文界面，并支持在“设置 → 常规 → 语言”中切换 English。界面文案放在 `apps/web/src/i18n/locales/`；新增文案时应同时更新英文与简体中文资源。汉化仍在持续补齐：尚未接入 i18n 的界面可能显示英文，已有翻译键缺少中文时则回退为英文。

## 本地开发

在仓库根目录运行：

```bash
vp i
vp run dev
```

Windows 的 Git Bash 如果当前终端还未载入 Vite+，先执行：

```bash
source /c/Users/poi/AppData/Roaming/vite-plus/env
```

## 翻译键检查

```bash
node scripts/check-translations.mjs
```

检查器会验证中英文资源的键集合、插值占位符及代码引用，并在终端或 GitHub Actions Summary 中列出与英文相同、可能仍待翻译的条目。结构错误会使检查失败；待翻译条目作为报告显示，不会阻断构建。

## 上游同步

`.github/workflows/upstream-sync.yml` 每周从 `pingdotgg/t3code` 的 `main` 合并到 Fork 的 `main`，并为上游变更创建或更新独立 PR。可在 Actions 中手动运行并指定 `target_branch`。如自动合并遇到冲突，工作流会失败并保留 Fork 主分支不变；应在本地解决冲突后再提交同步 PR。Fork 的语言资源、应用身份与发布配置应作为本地提交保留，不要将中文功能改动直接推到上游。

## Windows x64 构建与发布

在 Actions 中运行 **Release T3 Code 简体中文 for Windows x64** 并输入稳定版本号（例如 `1.0.0`），或将 `zh-v1.0.0` 形式的标签推送到 Fork。工作流构建 NSIS x64 安装程序、生成 Electron 自动更新所需的 `latest.yml` 与 blockmap，并将产物发布到本仓库的 GitHub Release。

如需启用与上游相同的云端登录/中继功能，请在 Fork 仓库的 Actions Variables 配置：

- `CLERK_PUBLISHABLE_KEY`
- `CLERK_JWT_TEMPLATE`
- `CLERK_CLI_OAUTH_CLIENT_ID`
- `T3CODE_RELAY_URL`

请使用 Fork 自己的 Clerk 与 Relay 配置，不要把官方仓库的凭据直接复用到公开 Fork。发布工作流把更新仓库固定为 `MOFlSH/t3code-zh`，使本版本不会从官方 Releases 获取自动更新。开源 Windows 安装包目前未配置代码签名，Windows 可能显示 SmartScreen 警告。

本地构建示例：

```bash
T3CODE_DESKTOP_UPDATE_REPOSITORY=MOFlSH/t3code-zh \
  node scripts/build-desktop-artifact.ts \
  --platform win --target nsis --arch x64 \
  --build-version 1.0.0 --output-dir release
```

## 与官方版隔离

Fork 的桌面身份与官方版不同：

- 应用 ID：`com.moflsh.t3code.zhcn`
- 应用链接协议：`t3code-zh-cn://`
- Electron 用户资料：`%APPDATA%/t3code-zh-cn-v1`
- 默认 T3 状态目录：`~/.t3code-zh-cn`

开发版资料目录为 `%APPDATA%/t3code-zh-cn-dev`。若手动设置 `T3CODE_HOME`，该显式路径优先，使用者应自行确认目标目录不会与其他安装共享。Fork 不会迁移、覆盖或写入官方版的 Electron 用户资料目录。
