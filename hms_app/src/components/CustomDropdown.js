import React, { useState } from "react";
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Modal,
    FlatList,
} from "react-native";

const CustomDropdown = ({
    label,
    placeholder,
    value,
    options = [],
    onSelect,
    error,
}) => {
    const [visible, setVisible] = useState(false);

    return (
        <View style={styles.container}>
            {label && <Text style={styles.label}>{label}</Text>}

            <TouchableOpacity
                style={[styles.dropdown, error && styles.inputError]}
                onPress={() => setVisible(true)}
                activeOpacity={0.8}
            >
                <Text style={[styles.valueText, !value && styles.placeholderText]}>
                    {value || placeholder}
                </Text>
                <Text style={styles.arrow}>▼</Text>
            </TouchableOpacity>

            {error && <Text style={styles.errorText}>{error}</Text>}

            <Modal
                visible={visible}
                transparent
                animationType="fade"
                onRequestClose={() => setVisible(false)}
            >
                <TouchableOpacity
                    style={styles.modalOverlay}
                    activeOpacity={1}
                    onPress={() => setVisible(false)}
                >
                    <View style={styles.modalBox}>
                        <Text style={styles.modalTitle}>{label}</Text>

                        <FlatList
                            data={options}
                            keyExtractor={(item, index) =>
                                item.value || item.label || index.toString()
                            }
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    style={styles.option}
                                    onPress={() => {
                                        onSelect(item);
                                        setVisible(false);
                                    }}
                                >
                                    <Text style={styles.optionText}>{item.label}</Text>
                                </TouchableOpacity>
                            )}
                        />
                    </View>
                </TouchableOpacity>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginBottom: 14,
    },
    label: {
        fontSize: 15,
        fontWeight: "600",
        color: "#111827",
        marginBottom: 8,
    },
    dropdown: {
        height: 54,
        borderWidth: 1,
        borderColor: "#D1D5DB",
        borderRadius: 10,
        paddingHorizontal: 14,
        backgroundColor: "#FFFFFF",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },
    valueText: {
        fontSize: 16,
        color: "#111827",
    },
    placeholderText: {
        color: "#9CA3AF",
    },
    arrow: {
        fontSize: 14,
        color: "#6B7280",
    },
    inputError: {
        borderColor: "#DC2626",
    },
    errorText: {
        color: "#DC2626",
        fontSize: 13,
        marginTop: 5,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.35)",
        justifyContent: "center",
        padding: 24,
    },
    modalBox: {
        backgroundColor: "#FFFFFF",
        borderRadius: 14,
        padding: 16,
        maxHeight: "70%",
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: "700",
        color: "#1976D2",
        marginBottom: 12,
    },
    option: {
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: "#E5E7EB",
    },
    optionText: {
        fontSize: 16,
        color: "#111827",
    },
});

export default CustomDropdown;