// resources/js/utils/GlobalSettings.ts

type CurrencyFormatOptions = {
    showSymbol?: boolean;
    showCode?: boolean;
};

type CurrencySettings = {
    decimal_format: string;
    default_currency: string;
    decimal_separator: string;
    thousands_separator: string;
    float_number: boolean;
    currency_symbol_space: boolean;
    currency_symbol_position: 'before' | 'after';
    currency_symbol: string;
    currency_code: string;
    currency_name: string;
};

export type KbSettings = {
    get<T = any>(key: string, defaultValue?: T): T;

    date_format: string;
    time_format: string;
    timezone: string;
    language: string;

    currencySettings: CurrencySettings;

    formatCurrency(amount: number | string, options?: CurrencyFormatOptions): string;
    formatDateTime(date: string | Date, includeTime?: boolean): string;
    formatDateTimeSimple(date: string | Date, includeTime?: boolean): string;
    formatTime(time: string): string;
};

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const MONTHS_SHORT = MONTHS.map((m) => m.slice(0, 3));

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const DAYS_SHORT = DAYS.map((d) => d.slice(0, 3));

function parseDate(date: string | Date): Date | null {
    const parsed = typeof date === 'string' ? new Date(date) : date;
    return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function toNumber(value: number | string): number {
    const parsed = typeof value === 'string' ? Number.parseFloat(value) : value;

    return Number.isFinite(parsed) ? parsed : 0;
}

function applyThousandsSeparator(value: string, separator: string): string {
    if (separator === 'none') return value;
    return value.replace(/\B(?=(\d{3})+(?!\d))/g, separator);
}

function phpDateFormat(format: string, date: Date): string {
    return format.replace(/[a-zA-Z]/g, (token) => {
        switch (token) {
            case 'D':
                return DAYS_SHORT[date.getDay()];
            case 'l':
                return DAYS[date.getDay()];
            case 'M':
                return MONTHS_SHORT[date.getMonth()];
            case 'F':
                return MONTHS[date.getMonth()];

            case 'j':
                return String(date.getDate());
            case 'd':
                return String(date.getDate()).padStart(2, '0');

            case 'Y':
                return String(date.getFullYear());
            case 'y':
                return String(date.getFullYear()).slice(-2);

            case 'm':
                return String(date.getMonth() + 1).padStart(2, '0');
            case 'n':
                return String(date.getMonth() + 1);

            case 'G':
                return String(date.getHours());
            case 'H':
                return String(date.getHours()).padStart(2, '0');

            case 'g':
                return String(date.getHours() % 12 || 12);
            case 'h':
                return String(date.getHours() % 12 || 12).padStart(2, '0');

            case 'i':
                return String(date.getMinutes()).padStart(2, '0');
            case 's':
                return String(date.getSeconds()).padStart(2, '0');

            case 'a':
                return date.getHours() >= 12 ? 'pm' : 'am';
            case 'A':
                return date.getHours() >= 12 ? 'PM' : 'AM';

            default:
                return token;
        }
    });
}

function resolveDateInTimezone(date: Date, timezone: string): Date {
    const parts = new Intl.DateTimeFormat('en-CA', {
        timeZone: timezone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
    }).formatToParts(date);

    const get = (type: string) => parts.find((p) => p.type === type)?.value ?? '00';

    return new Date(`${get('year')}-${get('month')}-${get('day')}T${get('hour')}:${get('minute')}:${get('second')}`);
}

function withFallback(formatter: (value: any, ...args: any[]) => string | null, fallback = '') {
    return (value: any, ...args: any[]): string => {
        if (value === null || value === undefined || value === '') {
            return fallback;
        }

        const result = formatter(value, ...args);

        return result ?? fallback;
    };
}

function createFormatters(timezone: string, dateFormat: string, timeFormat: string, currencySettings: CurrencySettings) {
    function rawFormatDateTime(date: string | Date, includeTime = true): string | null {
        const parsed = parseDate(date);
        if (!parsed) return null;

        const resolved = resolveDateInTimezone(parsed, timezone);
        const format = includeTime ? `${dateFormat} ${timeFormat}` : dateFormat;

        return phpDateFormat(format, resolved);
    }

    function rawFormatDateTimeSimple(date: string | Date, includeTime = true): string | null {
        const parsed = parseDate(date);
        if (!parsed) return null;

        const resolved = resolveDateInTimezone(parsed, timezone);
        const format = includeTime ? `D, M j, Y ${timeFormat}` : `D, M j, Y`;

        return phpDateFormat(format, resolved);
    }

    const formatDateTime = withFallback(rawFormatDateTime, '');
    const formatDateTimeSimple = withFallback(rawFormatDateTimeSimple, '');

    function formatTime(time: string): string {
        if (!time) return '';

        const [h, m] = time.split(':').map(Number);

        if (!Number.isFinite(h) || !Number.isFinite(m)) {
            return time;
        }

        const date = new Date();
        date.setHours(h, m, 0, 0);

        return phpDateFormat(timeFormat, date);
    }

    // currency already safe, but we can still wrap if you want consistency
    const safeFormatCurrency = withFallback(formatCurrency, '0');

    function formatCurrency(amount: number | string, options: CurrencyFormatOptions = { showSymbol: true, showCode: false }) {
        let value = toNumber(amount);

        if (!currencySettings.float_number) {
            value = Math.floor(value);
        }

        const decimals = Number.parseInt(currencySettings.decimal_format, 10);

        let [integer, fraction] = value.toFixed(decimals).split('.');

        integer = applyThousandsSeparator(integer, currencySettings.thousands_separator);

        let result = fraction ? `${integer}${currencySettings.decimal_separator}${fraction}` : integer;

        if (options.showSymbol) {
            const space = currencySettings.currency_symbol_space ? ' ' : '';

            result =
                currencySettings.currency_symbol_position === 'before'
                    ? `${currencySettings.currency_symbol}${space}${result}`
                    : `${result}${space}${currencySettings.currency_symbol}`;
        }

        if (options.showCode) {
            result += ` ${currencySettings.currency_code}`;
        }

        return result;
    }

    return {
        formatCurrency: safeFormatCurrency,
        formatDateTime,
        formatDateTimeSimple,
        formatTime,
    };
}

export function bootstrapKbSettings(settings: Record<string, any>): void {
    const currencySettings: CurrencySettings = {
        decimal_format: String(settings.decimal_format ?? '2'),
        default_currency: String(settings.default_currency ?? 'USD'),
        decimal_separator: String(settings.decimal_separator ?? '.'),
        thousands_separator: String(settings.thousands_separator ?? ','),
        float_number: String(settings.float_number ?? '1') === '1',
        currency_symbol_space: String(settings.currency_symbol_space ?? '0') === '1',
        currency_symbol_position: settings.currency_symbol_position === 'after' ? 'after' : 'before',
        currency_symbol: String(settings.currency_symbol ?? settings.default_currency ?? '$'),
        currency_code: String(settings.currency_code ?? settings.default_currency ?? 'USD'),
        currency_name: String(settings.currency_name ?? 'US Dollar'),
    };

    const timezone = settings.default_timezone ?? 'UTC';
    const dateFormat = settings.date_format ?? 'Y-m-d';
    const timeFormat = settings.time_format ?? 'H:i';

    const formatters = createFormatters(timezone, dateFormat, timeFormat, currencySettings);

    window.kbSettings = {
        get: (key, fallback = null) => settings[key] ?? fallback,

        date_format: dateFormat,
        time_format: timeFormat,

        timezone,
        language: settings.default_language ?? 'en',

        currencySettings,

        ...formatters,
    };
}

export {};
