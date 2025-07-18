import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { CreditCardIcon } from "@heroicons/react/24/outline";
import { SUPPORTED_CURRENCIES } from "@/lib/utils";
import type { UserSettings } from "@/api/settings";

export interface CurrencySettingsProps {
  settings: UserSettings;
  onSettingChange: (
    key: keyof UserSettings,
    value: boolean | number | string
  ) => void;
  disabled?: boolean;
}

export function CurrencySettings({
  settings,
  onSettingChange,
  disabled = false,
}: CurrencySettingsProps) {
  // Add safety check to prevent rendering issues if settings is null or undefined
  if (!settings) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCardIcon className="h-5 w-5" />
            Currency & Conversion Settings
          </CardTitle>
          <CardDescription>Loading currency settings...</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCardIcon className="h-5 w-5" />
          Currency & Conversion Settings
        </CardTitle>
        <CardDescription>
          Configure how currencies are displayed and converted throughout the
          application.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>Enable Currency Conversion</Label>
            <p className="text-sm text-gray-600">
              Automatically convert subscription costs to your preferred
              currency
            </p>
          </div>
          <Switch
            checked={settings.enableCurrencyConversion}
            onCheckedChange={(checked) =>
              onSettingChange("enableCurrencyConversion", checked)
            }
            disabled={disabled}
          />
        </div>

        <Separator />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label>Preferred Display Currency</Label>
            <Select
              value={settings.preferredDisplayCurrency}
              onValueChange={(value) =>
                onSettingChange("preferredDisplayCurrency", value)
              }
              disabled={disabled || !settings.enableCurrencyConversion}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select currency" />
              </SelectTrigger>
              <SelectContent>
                {SUPPORTED_CURRENCIES.map((currency) => (
                  <SelectItem key={currency.value} value={currency.value}>
                    {currency.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-sm text-gray-600">
              Currency to convert all amounts to
            </p>
          </div>

          <div className="space-y-2">
            <Label>Exchange Rate Refresh Interval</Label>
            <Select
              value={settings.currencyRefreshInterval.toString()}
              onValueChange={(value) =>
                onSettingChange("currencyRefreshInterval", parseInt(value))
              }
              disabled={disabled || !settings.enableCurrencyConversion}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="15">15 minutes</SelectItem>
                <SelectItem value="30">30 minutes</SelectItem>
                <SelectItem value="60">1 hour</SelectItem>
                <SelectItem value="240">4 hours</SelectItem>
                <SelectItem value="720">12 hours</SelectItem>
                <SelectItem value="1440">24 hours</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-sm text-gray-600">
              How often to update exchange rates
            </p>
          </div>
        </div>

        <Separator />

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Auto-Convert All Currencies</Label>
              <p className="text-sm text-gray-600">
                Automatically convert all subscription costs without asking
              </p>
            </div>
            <Switch
              checked={settings.autoConvertCurrencies}
              onCheckedChange={(checked) =>
                onSettingChange("autoConvertCurrencies", checked)
              }
              disabled={disabled || !settings.enableCurrencyConversion}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Show Original Currency</Label>
              <p className="text-sm text-gray-600">
                Display the original currency alongside converted amounts
              </p>
            </div>
            <Switch
              checked={settings.showOriginalCurrency}
              onCheckedChange={(checked) =>
                onSettingChange("showOriginalCurrency", checked)
              }
              disabled={disabled || !settings.enableCurrencyConversion}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Show Conversion Rates</Label>
              <p className="text-sm text-gray-600">
                Display exchange rates used for conversions
              </p>
            </div>
            <Switch
              checked={settings.showConversionRates}
              onCheckedChange={(checked) =>
                onSettingChange("showConversionRates", checked)
              }
              disabled={disabled || !settings.enableCurrencyConversion}
            />
          </div>
        </div>

        <Separator />

        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h4 className="font-medium text-blue-900 mb-2">
            Currency Conversion Preview
          </h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-blue-700">Netflix (USD)</span>
              <span className="text-blue-900 font-medium">
                {settings.enableCurrencyConversion &&
                settings.preferredDisplayCurrency !== "USD"
                  ? `~${settings.preferredDisplayCurrency} 12.50`
                  : "$15.99"}
                {settings.enableCurrencyConversion &&
                  settings.showOriginalCurrency &&
                  settings.preferredDisplayCurrency !== "USD" && (
                    <span className="text-blue-600 ml-2">($15.99)</span>
                  )}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-blue-700">Spotify (EUR)</span>
              <span className="text-blue-900 font-medium">
                {settings.enableCurrencyConversion &&
                settings.preferredDisplayCurrency !== "EUR"
                  ? `~${settings.preferredDisplayCurrency} 11.20`
                  : "€9.99"}
                {settings.enableCurrencyConversion &&
                  settings.showOriginalCurrency &&
                  settings.preferredDisplayCurrency !== "EUR" && (
                    <span className="text-blue-600 ml-2">(€9.99)</span>
                  )}
              </span>
            </div>
            {settings.enableCurrencyConversion &&
              settings.showConversionRates && (
                <p className="text-blue-600 text-xs mt-2">
                  Exchange rates: 1 USD = 0.85{" "}
                  {settings.preferredDisplayCurrency}, 1 EUR = 1.12{" "}
                  {settings.preferredDisplayCurrency}
                </p>
              )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
