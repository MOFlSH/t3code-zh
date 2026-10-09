import { useI18n, isLocale } from "~/i18n/i18n";
import { Select, SelectItem, SelectPopup, SelectTrigger, SelectValue } from "../ui/select";
import { SettingsRow, SettingsSection } from "./settingsLayout";

export function LanguageSettings() {
  const { locale, setLocale, t } = useI18n();

  return (
    <SettingsSection id="language" title={t("settings.language")}>
      <SettingsRow
        title={t("settings.language")}
        description={t("settings.languageDescription")}
        control={
          <Select
            value={locale}
            onValueChange={(value) => {
              if (isLocale(value)) setLocale(value);
            }}
          >
            <SelectTrigger size="sm" className="w-full sm:w-44" aria-label={t("settings.language")}>
              <SelectValue />
            </SelectTrigger>
            <SelectPopup align="end">
              <SelectItem value="zh-CN">{t("settings.languageOption.zhCN")}</SelectItem>
              <SelectItem value="en">{t("settings.languageOption.en")}</SelectItem>
            </SelectPopup>
          </Select>
        }
      />
    </SettingsSection>
  );
}
