/**
 * Timezone utility functions for consistent EST timezone handling
 */

const EST_TIMEZONE = "America/New_York";

/**
 * Format a date to EST timezone
 */
export function formatToEST(
  date: Date | string,
  options?: Intl.DateTimeFormatOptions
): string {
  const dateObj = typeof date === "string" ? new Date(date) : date;

  const defaultOptions: Intl.DateTimeFormatOptions = {
    timeZone: EST_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  };

  // Merge options, but if a property is explicitly set to undefined, remove it
  const finalOptions: Intl.DateTimeFormatOptions = { ...defaultOptions };
  if (options) {
    Object.keys(options).forEach((key) => {
      const optionKey = key as keyof Intl.DateTimeFormatOptions;
      if (options[optionKey] === undefined) {
        delete finalOptions[optionKey];
      } else {
        (finalOptions as any)[optionKey] = options[optionKey];
      }
    });
  }

  return new Intl.DateTimeFormat("en-US", finalOptions).format(dateObj);
}

/**
 * Format a date to EST date only (MM/DD/YYYY)
 */
export function formatDateToEST(date: Date | string): string {
  // If it's a string that looks like a date (YYYY-MM-DD), use it directly
  if (typeof date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
    // Format YYYY-MM-DD to MM/DD/YYYY
    const [year, month, day] = date.split("-");
    return `${month}/${day}/${year}`;
  }

  return formatToEST(date, {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: undefined,
    minute: undefined,
    second: undefined,
    hour12: undefined,
  });
}

/**
 * Format a date to EST time only (HH:MM:SS)
 */
export function formatTimeToEST(date: Date | string): string {
  return formatToEST(date, {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
}

/**
 * Format a date to EST date and time (MM/DD/YYYY HH:MM:SS)
 */
export function formatDateTimeToEST(date: Date | string): string {
  return formatToEST(date, {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
}

/**
 * Get current time in EST
 */
export function getCurrentESTTime(): Date {
  const now = new Date();
  const estTime = new Date(
    now.toLocaleString("en-US", { timeZone: EST_TIMEZONE })
  );
  return estTime;
}

/**
 * Get current timestamp in EST ISO string
 */
export function getCurrentESTISOString(): string {
  return getCurrentESTTime().toISOString();
}

/**
 * Convert a date to EST timezone
 */
export function toEST(date: Date | string): Date {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  const estString = dateObj.toLocaleString("en-US", { timeZone: EST_TIMEZONE });
  return new Date(estString);
}

/**
 * Format relative time (e.g., "2 hours ago") in EST
 */
export function formatRelativeTimeToEST(date: Date | string): string {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  const now = getCurrentESTTime();
  const diffInSeconds = Math.floor((now.getTime() - dateObj.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return "Just now";
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes} minute${minutes !== 1 ? "s" : ""} ago`;
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours} hour${hours !== 1 ? "s" : ""} ago`;
  } else if (diffInSeconds < 2592000) {
    const days = Math.floor(diffInSeconds / 86400);
    return `${days} day${days !== 1 ? "s" : ""} ago`;
  } else {
    return formatDateToEST(dateObj);
  }
}
