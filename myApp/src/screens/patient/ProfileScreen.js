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

export default function ProfileScreen({ navigation }) {
    const { patient, logout } = useAuth();

    const address =
        typeof patient?.address === "object" && patient.address !== null
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
                        size={86}
                    />
                    <Text style={styles.patientName} numberOfLines={1}>
                        {patient?.name || "Patient"}
                    </Text>
                    <View style={styles.uhidBadge}>
                        <Text style={styles.uhidText}>
                            UHID: {patient?.UHID || "—"}
                        </Text>
                    </View>
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

                <View style={styles.btnGroup}>
                    <AppButton
                        title="Edit Profile"
                        onPress={() => navigation.navigate("EditProfile")}
                    />
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
                <Text style={styles.infoIcon}>{icon}</Text>
                <Text style={styles.infoLabel}>{label}</Text>
            </View>
            <Text style={styles.infoValue} numberOfLines={2}>
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
        paddingHorizontal: 20,
    },
    patientName: {
        fontSize: 22,
        fontWeight: "900",
        color: COLORS.text,
        marginTop: 16,
        textAlign: "center",
    },
    uhidBadge: {
        backgroundColor: COLORS.primaryLight,
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 20,
        marginTop: 8,
    },
    uhidText: {
        fontSize: 13,
        fontWeight: "700",
        color: COLORS.primary,
    },
    card: {
        marginHorizontal: 20,
        marginBottom: 16,
        padding: 20,
    },
    cardSectionTitle: {
        fontSize: 18,
        fontWeight: "900",
        color: COLORS.text,
        paddingBottom: 12,
    },
    infoRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingVertical: 12,
        gap: 16,
    },
    infoLeft: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
    },
    infoIcon: {
        fontSize: 20,
        width: 28,
        textAlign: "center",
    },
    infoLabel: {
        fontSize: 15,
        color: COLORS.subtitle,
        fontWeight: "500",
    },
    infoValue: {
        flex: 1,
        fontSize: 15,
        fontWeight: "700",
        color: COLORS.text,
        textAlign: "right",
    },
    divider: {
        height: 1,
        backgroundColor: COLORS.border,
        opacity: 0.6,
    },
    btnGroup: {
        marginHorizontal: 20,
        marginTop: 8,
        gap: 12,
    },
});