import React from "react";

import { View, TextInput, Text, StyleSheet } from "react-native";
const CustomInput = ({ label, value, onChangeText, placeholder, secureTextEntry, keyboardType, error }) => {

    return (
        <View style={styles.Container}>
            {label && <Text style={styles.label}>{label}</Text>}
            <TextInput style={[styles.input, error && styles.inputError]}
                value={value}
                onChangeText={onChangeText}
                placeholder={placeholder}
                secureTextEntry={secureTextEntry}
                keyboardType={keyboardType}
                placeholderTextColor="#9CA3AF"
            />
            {error && <Text style={styles.errorText}>{error}</Text>}
        </View>
    )
}

const styles = StyleSheet.create({
    Container: {
        marginBottom: 16,
    },
    label: {
        fontSize: 14,
        color: '#1F2937',
        marginBottom: 6,
        fontWeight: '500',
    },
    input: {
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#D1D5DB',
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 10,
        fontSize: 16,
        color: '#111827',
    },
    inputError: {
        borderColor: '#EF4444',
    },
    errorText: {
        color: '#EF4444',
        fontSize: 12,
        marginTop: 4,
    }
})

export default CustomInput;