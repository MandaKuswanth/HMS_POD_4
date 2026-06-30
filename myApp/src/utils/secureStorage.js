import * as SecureStore from 'expo-secure-store';

const ACCESS_TOKEN_KEY = 'ACCESS_TOKEN';
const REFRESH_TOKEN_KEY = 'REFRESH_TOKEN';
const USER_DATA_KEY = 'USER_DATA';

export const saveAccessToken = async (token) => {
    try {
        await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, token);
    } catch (error) {
        console.error('Error saving access token:', error);
    }
};

export const saveRefreshToken = async (token) => {
    try {
        await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, token);
    } catch (error) {
        console.error('Error saving refresh token:', error);
    }
};

export const saveUserData = async (userData) => {
    try {
        await SecureStore.setItemAsync(USER_DATA_KEY, JSON.stringify(userData));
    } catch (error) {
        console.error('Error saving user data:', error);
    }
};

export const getAccessToken = async () => {
    try {
        return await SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
    } catch (error) {
        console.error('Error getting access token:', error);
        return null;
    }
};

export const getRefreshToken = async () => {
    try {
        return await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
    } catch (error) {
        console.error('Error getting refresh token:', error);
        return null;
    }
};

export const getUserData = async () => {
    try {
        const data = await SecureStore.getItemAsync(USER_DATA_KEY);
        return data ? JSON.parse(data) : null;
    } catch (error) {
        console.error('Error getting user data:', error);
        return null;
    }
};

export const removeAccessToken = async () => {
    try {
        await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY);
    } catch (error) {
        console.error('Error removing access token:', error);
    }
};

export const removeRefreshToken = async () => {
    try {
        await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
    } catch (error) {
        console.error('Error removing refresh token:', error);
    }
};

export const removeUserData = async () => {
    try {
        await SecureStore.deleteItemAsync(USER_DATA_KEY);
    } catch (error) {
        console.error('Error removing user data:', error);
    }
};

export const clearAllAuthData = async () => {
    try {
        await Promise.all([
            removeAccessToken(),
            removeRefreshToken(),
            removeUserData()
        ]);
    } catch (error) {
        console.error('Error clearing auth data:', error);
    }
};
