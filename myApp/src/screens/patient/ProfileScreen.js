import React from "react";

import {
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";

import AppAvatar from "../../components/AppAvatar";
import AppButton from "../../components/AppButton";
import AppCard from "../../components/AppCard";
import AppContainer from "../../components/AppContainer";
import ScreenHeader from "../../components/ScreenHeader";

import { useAuth } from "../../context/AuthContext";

import COLORS from "../../utils/colors";
import { formatDateDisplay } from "../../utils/dateUtils";
import PropTypes from "prop-types";

export default function ProfileScreen({ navigation }) {
    const { patient, logout } = useAuth();

    const address =
        typeof patient?.address === "object" &&
            patient.address !== null
            ? patient.address
            : {
                street: patient?.address || "",
                city: "",
                state: "",
                pincode: "",
            };

    return (
        <AppContainer>
            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scroll}
            >
                <ScreenHeader title="Profile" />

                <View style={styles.avatarSection}>
                    <AppAvatar
                        name={patient?.name}
                        size={82}
                    />

                    <Text style={styles.patientName}>
                        {patient?.name || "Patient"}
                    </Text>

                    <Text style={styles.uhidText}>
                        {patient?.UHID || "—"}
                    </Text>
                </View>

                <AppCard style={styles.card}>
                    <InfoRow
                        icon="✉️"
                        label="Email"
                        value={patient?.email}
                    />

                    <Divider />

                    <InfoRow
                        icon="📞"
                        label="Phone"
                        value={patient?.phone}
                    />

                    <Divider />

                    <InfoRow
                        icon="🩸"
                        label="Blood Group"
                        value={patient?.bloodGroup}
                    />

                    <Divider />

                    <InfoRow
                        icon="👤"
                        label="Gender"
                        value={patient?.gender?.toUpperCase()}
                    />

                    <Divider />

                    <InfoRow
                        icon="📅"
                        label="DOB"
                        value={formatDateDisplay(patient?.dob)}
                    />
                </AppCard>

                <AppCard style={styles.card}>
                    <Text style={styles.cardSectionTitle}>
                        Address
                    </Text>

                    <InfoRow
                        icon="🏠"
                        label="Street"
                        value={address?.street}
                    />

                    <Divider />

                    <InfoRow
                        icon="📍"
                        label="City"
                        value={address?.city}
                    />

                    <Divider />

                    <InfoRow
                        icon="🗺️"
                        label="State"
                        value={address?.state}
                    />

                    <Divider />

                    <InfoRow
                        icon="📌"
                        label="Pincode"
                        value={address?.pincode}
                    />
                </AppCard>

                <AppCard style={styles.card}>
                    <Text style={styles.cardSectionTitle}>
                        Emergency Contact
                    </Text>

                    <InfoRow
                        icon="👤"
                        label="Name"
                        value={patient?.emergencyContact?.name}
                    />

                    <Divider />

                    <InfoRow
                        icon="🔗"
                        label="Relation"
                        value={patient?.emergencyContact?.relation}
                    />

                    <Divider />

                    <InfoRow
                        icon="📞"
                        label="Phone"
                        value={patient?.emergencyContact?.phone}
                    />
                </AppCard>

                <View style={styles.btnContainer}>
                    <AppButton
                        title="Edit Profile"
                        onPress={() =>
                            navigation.navigate("EditProfile")
                        }
                    />
                </View>

                <View style={styles.btnContainer}>
                    <AppButton
                        title="Logout"
                        onPress={logout}
                        color={COLORS.dangerLight}
                        textColor={COLORS.danger}
                    />
                </View>
            </ScrollView>
        </AppContainer>
    );
}

function InfoRow({ icon, label, value }) {
    return (
        <View style={styles.infoRow}>
            <View style={styles.infoLeft}>
                <Text style={styles.infoIcon}>
                    {icon}
                </Text>

                <Text style={styles.infoLabel}>
                    {label}
                </Text>
            </View>

            <Text
                style={styles.infoValue}
                numberOfLines={2}
            >
                {value || "—"}
            </Text>
        </View>
    );
}

function Divider() {
    return <View style={styles.divider} />;
}

const styles = StyleSheet.create({
    scroll: {
        paddingBottom: 40,
    },

    avatarSection: {
        alignItems: "center",
        paddingVertical: 24,
    },

    patientName: {
        fontSize: 22,
        fontWeight: "900",
        color: COLORS.text,
        marginTop: 10,
    },

    uhidText: {
        fontSize: 14,
        color: COLORS.subtitle,
        marginTop: 4,
    },

    card: {
        marginHorizontal: 20,
        marginBottom: 14,
    },

    cardSectionTitle: {
        fontSize: 16,
        fontWeight: "900",
        color: COLORS.text,
        paddingBottom: 8,
    },

    infoRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingVertical: 13,
        gap: 10,
    },

    infoLeft: {
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
    },

    infoIcon: {
        fontSize: 18,
        width: 26,
    },

    infoLabel: {
        fontSize: 15,
        color: COLORS.subtitle,
    },

    infoValue: {
        flex: 1,
        fontSize: 15,
        fontWeight: "800",
        color: COLORS.text,
        textAlign: "right",
    },

    divider: {
        height: 1,
        backgroundColor: COLORS.border,
    },

    btnContainer: {
        marginHorizontal: 20,
        marginBottom: 12,
    },
});

ProfileScreen.propTypes = {
    navigation: PropTypes.object.isRequired,
};

InfoRow.propTypes = {
    icon: PropTypes.node.isRequired,
    label: PropTypes.string.isRequired,
    value: PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.number,
    ]).isRequired,
};
