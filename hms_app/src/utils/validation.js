export const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(String(email).toLowerCase());
}

export const validateRequired = (value) => {
    return value && value.trim() !== '' && value !== undefined && value !== null;
}

export const validatePhone=(phone)=>{
    const re=/^\d{10}$/;
    return re.test(String(phone));
}