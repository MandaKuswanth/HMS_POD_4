exports.validatePassword = (password, confirmPassword) => {
    if (!password)
        return "Password required";

    if (password !== confirmPassword)
        return "Passwords do not match";

    if (password.length < 8)
        return "Password must be at least 8 characters";

    if (!/[A-Z]/.test(password))
        return "Password needs uppercase";

    if (!/\d/.test(password))
        return "Password needs number";

    return null;
};