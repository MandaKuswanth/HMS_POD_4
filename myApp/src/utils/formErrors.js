export const createErrorUpdater = (setErrors) => {
    return (field, message) => {
        setErrors((prev) => ({
            ...prev,
            [field]: message,
        }));
    };
};
