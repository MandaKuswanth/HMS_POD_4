import AsyncStrorage from '@react-native-async-storage/async-storage';

export const setItem = async (key, value) => {
    try {
        await AsyncStrorage.setItem(key, JSON.stringify(value));
    }
    catch (error) {
        console.log('Error in setting item to storage', error);
    }
};


export const getItem = async (key) => {
    try {
        const value = await AsyncStrorage.getItem(key);
        return value ? JSON.parse(value) : null;

    } catch (error) {
        console.log('Error in getting item from storage', error);
        return null;
    }
};

export const removeItem=async (key)=>{
    try {
        await AsyncStrorage.removeItem(key);
        
    } catch (error) {
        console.log('Error in removing item from storage', error);
        
    }
}