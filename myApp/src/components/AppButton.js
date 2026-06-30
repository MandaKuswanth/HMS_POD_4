import React, { useRef } from "react";
import {
    ActivityIndicator,
    Text,
    Pressable,
    StyleSheet,
    Animated,
} from "react-native";
import COLORS from "../utils/colors";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export default function AppButton({
    title,
    onPress,
    disabled,
    loading,
    color = COLORS.primary,
    textColor = COLORS.white,
    style,
    textStyle,
    ...props
}) {
    const scaleValue = useRef(new Animated.Value(1)).current;

    const handlePressIn = () => {
        Animated.spring(scaleValue, {
            toValue: 0.96,
            useNativeDriver: true,
        }).start();
    };

    const handlePressOut = () => {
        Animated.spring(scaleValue, {
            toValue: 1,
            friction: 5,
            tension: 40,
            useNativeDriver: true,
        }).start();
    };

    const isInactive = disabled || loading;

    return (
        <AnimatedPressable
            onPressIn={!isInactive ? handlePressIn : undefined}
            onPressOut={!isInactive ? handlePressOut : undefined}
            onPress={onPress}
            disabled={isInactive}
            style={[
                styles.button,
                { backgroundColor: isInactive ? COLORS.disabledBg : color },
                isInactive && styles.disabled,
                { transform: [{ scale: scaleValue }] },
                style,
            ]}
            {...props}
        >
            {loading ? (
                <ActivityIndicator color={textColor} size="small" />
            ) : (
                <Text style={[styles.text, { color: isInactive ? COLORS.disabledText : textColor }, textStyle]}>
                    {title}
                </Text>
            )}
        </AnimatedPressable>
    );
}

const styles = StyleSheet.create({
    button: {
        height: 52,
        width: "100%",
        borderRadius: 16,
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "row",
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 4,
    },
    disabled: {
        shadowOpacity: 0,
        elevation: 0,
    },
    text: {
        fontSize: 16,
        fontWeight: "700",
        letterSpacing: 0.5,
    },
});