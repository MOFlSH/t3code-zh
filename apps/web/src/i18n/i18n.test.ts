import { describe, expect, it } from "vite-plus/test";

import {
  DEFAULT_LOCALE,
  formatMessage,
  isLocale,
  localeFromPreference,
  resolveMessage,
  resolveSourceMessage,
} from "./i18n";

describe("application localization", () => {
  it("defaults to Simplified Chinese and validates stored locale values", () => {
    expect(DEFAULT_LOCALE).toBe("zh-CN");
    expect(localeFromPreference("en")).toBe("en");
    expect(localeFromPreference("zh-CN")).toBe("zh-CN");
    expect(localeFromPreference("fr")).toBe("zh-CN");
    expect(isLocale(null)).toBe(false);
  });

  it("uses the selected locale and falls back to English when a translation is missing", () => {
    expect(resolveMessage("zh-CN", "nav.settings")).toBe("设置");
    expect(resolveMessage("en", "nav.settings")).toBe("Settings");
  });

  it("translates registered literal phrases and falls back to their source text", () => {
    expect(resolveSourceMessage("zh-CN", "Update track")).toBe("更新渠道");
    expect(resolveSourceMessage("en", "Update track")).toBe("Update track");
    expect(resolveSourceMessage("zh-CN", "An untranslated phrase")).toBe("An untranslated phrase");
    expect(resolveSourceMessage("zh-CN", "Reset {label} to default", { label: "项目" })).toBe(
      "将“项目”恢复为默认值",
    );
  });

  it("covers the settings and provider phrases shown in the desktop preview", () => {
    expect(resolveSourceMessage("zh-CN", "Panel animations")).toBe("面板动画");
    expect(
      resolveSourceMessage(
        "zh-CN",
        "Default permissions for new threads. Projects can override them.",
      ),
    ).toBe("新建会话的默认权限。项目可以覆盖此设置。");
    expect(resolveSourceMessage("zh-CN", "Full access")).toBe("完全访问");
    expect(resolveSourceMessage("zh-CN", "Authenticated as")).toBe("已认证账户");
    expect(resolveSourceMessage("zh-CN", "ChatGPT Plus Subscription")).toBe(
      "ChatGPT Plus 订阅",
    );
  });

  it("interpolates values without erasing unknown placeholders", () => {
    expect(formatMessage("Compact {count} tokens ({unknown})", { count: 12 })).toBe(
      "Compact 12 tokens ({unknown})",
    );
  });
});
