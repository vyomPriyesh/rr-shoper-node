import dayjs from "dayjs";

export const timeAgo = (date) => {
    const now = new Date();
    const past = new Date(date);

    const seconds = Math.floor((now - past) / 1000);

    const intervals = [
        { label: "year", seconds: 31536000 },
        { label: "month", seconds: 2592000 }, // 30 days
        { label: "week", seconds: 604800 },
        { label: "day", seconds: 86400 },
        { label: "hour", seconds: 3600 },
        { label: "minute", seconds: 60 },
        { label: "second", seconds: 1 },
    ];

    for (const interval of intervals) {
        const count = Math.floor(seconds / interval.seconds);

        if (count >= 1) {
            if (interval.label === "day" && count === 1) {
                return "Yesterday";
            }

            return `${count} ${interval.label}${count > 1 ? "s" : ""} ago`;
        }
    }

    return "Just now";
};

export const displayDate = (date) => {
    return dayjs(date).format('DD MMM YYYY')
}

export const displayDateTime = (date) => {
    return dayjs(date).format('DD MMM YYYY hh:mm A')
}

export const unixDisplayDate = (date) => {
    return dayjs.unix(date).format("DD MMM YYYY hh:mm A")
}

export const remainingDaysUnix = (date1, date2) => {
    const parseDate = (date) => {
        if (!date) return null;

        // Unix timestamp in seconds
        if (typeof date === "number") {
            return dayjs.unix(date);
        }

        // Numeric string Unix timestamp
        if (
            typeof date === "string" &&
            /^\d+$/.test(date)
        ) {
            return dayjs.unix(Number(date));
        }

        // Normal date formats
        return dayjs(date);
    };

    const startDate = parseDate(date1);
    const endDate = parseDate(date2);

    if (
        !startDate?.isValid() ||
        !endDate?.isValid()
    ) {
        return 0;
    }

    return Math.max(0, endDate.startOf("day").diff(startDate.startOf("day"), "day")
    );
};