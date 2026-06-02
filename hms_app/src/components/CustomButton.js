import React from 'react';
import {
    TouchableOpacity,
    Text,
    StyleSheet,
    ActivityIndicator,
} from 'react-native';

const CustomButton = ({
    title,
    onPress,
    loading = false,
    type = 'primary',
    disabled = false,
}) => {
    const isDanger = type === 'danger';
    const isOutline = type === 'outline';

    let bgcolor = '#1976D2';

    if (isDanger) bgcolor = '#C62828';
    if (isOutline) bgcolor = 'transparent';
    if (disabled) bgcolor = '#9CA3AF';

    const textColor = isOutline ? '#1976D2' : '#FFFFFF';

    return (
        <TouchableOpacity
            style={[
                styles.button,
                { backgroundColor: bgcolor },
                isOutline && styles.buttonOutline,
                disabled && isOutline && { borderColor: '#9CA3AF' },
            ]}
            onPress={onPress}
            disabled={disabled || loading}
            activeOpacity={0.8}
        >
            {loading ? (
                <ActivityIndicator color={textColor} />
            ) : (
                <Text style={[styles.buttonText, { color: textColor }]}>
                    {title}
                </Text>
            )}
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    button: {
        paddingVertical: 14,
        paddingHorizontal: 24,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 12,
    },
    buttonOutline: {
        borderWidth: 1,
        borderColor: '#1976D2',
    },
    buttonText: {
        fontSize: 16,
        fontWeight: '600',
    },
});

export default CustomButton;