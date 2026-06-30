import React, { useState, useRef, useEffect } from "react";
import {
    Text,
    TextInput,
    View,
    StyleSheet,
    Animated,
    Pressable
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import COLORS from "../utils/colors";

export default function AppInput({
    value,
    onChangeText,
    placeholder,
    secureTextEntry,
    keyboardType,
    autoCapitalize,
    multiline,
    numberOfLines,
    style,
    error,
    label,
    onFocus,
    onBlur,
    ...props
}) {
    const [isFocused, setIsFocused] = useState(false);
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);
    const [internalValue, setInternalValue] = useState(value || props.defaultValue || "");

    useEffect(() => {
        if (value !== undefined) {
            setInternalValue(value);
        }
    }, [value]);

    const hasValue = internalValue !== undefined && internalValue !== null && internalValue.toString().length > 0;
    
    const animatedIsFocused = useRef(new Animated.Value(hasValue ? 1 : 0)).current;

    useEffect(() => {
        Animated.timing(animatedIsFocused, {
            toValue: (isFocused || hasValue) ? 1 : 0,
            duration: 150,
            useNativeDriver: false,
        }).start();
    }, [isFocused, hasValue]);

    const handleFocus = (e) => {
        setIsFocused(true);
        if (onFocus) onFocus(e);
    };

    const handleBlur = (e) => {
        setIsFocused(false);
        if (onBlur) onBlur(e);
    };

    const handleChangeText = (text) => {
        setInternalValue(text);
        if (onChangeText) onChangeText(text);
    };

    const togglePasswordVisibility = () => {
        setIsPasswordVisible(!isPasswordVisible);
    };

    const displayLabel = label || placeholder;
    const showRealPlaceholder = isFocused && !hasValue && label && placeholder;

    const labelStyle = {
        position: "absolute",
        left: 14,
        top: animatedIsFocused.interpolate({
            inputRange: [0, 1],
            outputRange: [18, 6],
        }),
        fontSize: animatedIsFocused.interpolate({
            inputRange: [0, 1],
            outputRange: [15, 12],
        }),
        color: animatedIsFocused.interpolate({
            inputRange: [0, 1],
            outputRange: [COLORS.subtitle, COLORS.primary],
        }),
        zIndex: 1,
    };

    return (
        <View style={styles.wrapper}>
            <View
                style={[
                    styles.inputContainer,
                    isFocused && styles.inputFocused,
                    error && styles.inputError,
                    multiline && styles.multilineContainer,
                ]}
            >
                {displayLabel ? (
                    <Animated.Text style={labelStyle} pointerEvents="none">
                        {displayLabel}
                    </Animated.Text>
                ) : null}
                
                <TextInput
                    value={value}
                    onChangeText={handleChangeText}
                    onFocus={handleFocus}
                    onBlur={handleBlur}
                    secureTextEntry={secureTextEntry && !isPasswordVisible}
                    keyboardType={keyboardType}
                    autoCapitalize={autoCapitalize}
                    multiline={multiline}
                    numberOfLines={numberOfLines}
                    placeholder={showRealPlaceholder ? placeholder : ""} 
                    placeholderTextColor={COLORS.subtitle}
                    style={[
                        styles.input,
                        multiline && styles.multiline,
                        style,
                    ]}
                    {...props}
                />

                {secureTextEntry ? (
                    <Pressable 
                        onPress={togglePasswordVisibility} 
                        style={styles.eyeIcon}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                        <Ionicons 
                            name={isPasswordVisible ? "eye-off-outline" : "eye-outline"} 
                            size={20} 
                            color={COLORS.subtitle} 
                        />
                    </Pressable>
                ) : null}
            </View>

            {error ? (
                <Text style={styles.errorText}>
                    {error}
                </Text>
            ) : null}
        </View>
    );
}

const styles = StyleSheet.create({
    wrapper: {
        marginBottom: 16,
        width: "100%",
    },
    inputContainer: {
        backgroundColor: COLORS.surface,
        borderWidth: 1.5,
        borderColor: COLORS.border,
        borderRadius: 16,
        paddingHorizontal: 14,
        paddingTop: 22,
        paddingBottom: 8,
        flexDirection: "row",
        alignItems: "center",
        minHeight: 56,
    },
    inputFocused: {
        borderColor: COLORS.primary,
        backgroundColor: COLORS.white,
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    inputError: {
        borderColor: COLORS.danger,
        backgroundColor: COLORS.dangerLight,
    },
    input: {
        flex: 1,
        fontSize: 16,
        color: COLORS.text,
        padding: 0,
        margin: 0,
        includeFontPadding: false,
        minHeight: 24,
    },
    multilineContainer: {
        alignItems: "flex-start",
        paddingTop: 24,
    },
    multiline: {
        minHeight: 80,
        textAlignVertical: "top",
    },
    eyeIcon: {
        padding: 4,
        marginLeft: 8,
    },
    errorText: {
        marginTop: 6,
        color: COLORS.danger,
        fontSize: 12,
        fontWeight: "600",
        paddingHorizontal: 4,
    },
});