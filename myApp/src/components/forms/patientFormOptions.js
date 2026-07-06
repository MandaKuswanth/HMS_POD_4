export const GENDER_OPTIONS = [
    "male",
    "female",
    "others",
];

export const BLOOD_GROUPS = [
    "A+",
    "A-",
    "B+",
    "B-",
    "AB+",
    "AB-",
    "O+",
    "O-",
];

export const formatGender = (gender) => {
    return gender.charAt(0).toUpperCase() + gender.slice(1);
};
