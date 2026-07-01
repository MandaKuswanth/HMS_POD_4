import * as SecureStore from "expo-secure-store";

const SecureStorage = {
    async getItem(key) {
        try {
            return await SecureStore.getItemAsync(key);
        } catch (err) {
            console.log("SecureStorage getItem error:", err);
            return null;
        }
    },

    async setItem(key, value) {
        return SecureStore.setItemAsync(key, value);
    },

    async removeItem(key) {
        return SecureStore.deleteItemAsync(key);
    },

    async multiGet(keys) {
        const results = await Promise.all(
            keys.map(async (key) => {
                try {
                    const value = await SecureStore.getItemAsync(key);
                    return [key, value ?? null];
                } catch (err) {
                    console.log(`SecureStorage multiGet error for ${key}:`, err);
                    return [key, null];
                }
            })
        );
        return results;
    },

    async multiSet(keyValuePairs) {
        await Promise.all(
            keyValuePairs.map(([key, value]) => SecureStore.setItemAsync(key, value))
        );
    },

    async multiRemove(keys) {
        await Promise.all(keys.map((key) => SecureStore.deleteItemAsync(key)));
    },
};

export default SecureStorage;