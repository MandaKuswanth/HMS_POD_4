export const getTodayDate = () => {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    return date;
};

export const getTomorrowDate = () => {
    const date = new Date();

    date.setDate(date.getDate() + 1);
    date.setHours(0, 0, 0, 0);

    return date;
};

export const normalizeDateOnly = (date) => {
    const value = new Date(date);

    value.setHours(0, 0, 0, 0);

    return value;
};

export const formatDateForApi = (date) => {
    if (!date) return "";

    const value = new Date(date);

    const year = value.getFullYear();

    const month = String(
        value.getMonth() + 1
    ).padStart(2, "0");

    const day = String(
        value.getDate()
    ).padStart(2, "0");

    return `${year}-${month}-${day}`;
};

export const formatDateDisplay = (date) => {
    if (!date) return "—";

    const value = new Date(date);

    return Number.isNaN(value.getTime())
        ? "—"
        : value.toDateString();
};