import React, { useCallback, useMemo, useState, useEffect, useRef } from "react";
import PropTypes from "prop-types";

import {
    ActivityIndicator,
    Animated,
    Dimensions,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    KeyboardAvoidingView,
    Platform,
} from "react-native";

import { useFocusEffect } from "@react-navigation/native";

import AppAvatar from "../../components/AppAvatar";
import AppCard from "../../components/AppCard";
import AppContainer from "../../components/AppContainer";
import AppInput from "../../components/AppInput";
import AppButton from "../../components/AppButton";

import { useAuth } from "../../context/AuthContext";
import { useAppointments } from "../../context/AppointmentContext";

import COLORS from "../../utils/colors";

const { width } = Dimensions.get("window");

function DoctorSkeleton() {
    const fadeAnim = useRef(new Animated.Value(0.5)).current;

    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: 800,
                    useNativeDriver: true,
                }),
                Animated.timing(fadeAnim, {
                    toValue: 0.5,
                    duration: 800,
                    useNativeDriver: true,
                }),
            ])
        ).start();
    }, [fadeAnim]);

    return (
        <AppCard style={styles.doctorCard}>
            <Animated.View style={[styles.doctorTop, { opacity: fadeAnim }]}>
                <View style={styles.skeletonAvatar} />
                <View style={styles.doctorHeaderText}>
                    <View style={styles.skeletonTitle} />
                    <View style={styles.skeletonSubtitle} />
                </View>
            </Animated.View>
            <Animated.View style={[styles.doctorInfoBox, { opacity: fadeAnim, paddingVertical: 14, gap: 12 }]}>
                 <View style={styles.skeletonLine} />
                 <View style={styles.skeletonLineShort} />
            </Animated.View>
            <Animated.View style={[styles.skeletonButton, { opacity: fadeAnim }]} />
        </AppCard>
    );
}

export default function DashboardScreen({ navigation }) {
    const { patient } = useAuth();
    const { doctors, doctorsLoading, loadDoctors } = useAppointments();

    const [search, setSearch] = useState("");
    const [activeFilter, setActiveFilter] = useState("All");

    useFocusEffect(
        useCallback(() => {
            loadDoctors();
        }, [loadDoctors])
    );

    useEffect(() => {
        const timeoutId = setTimeout(() => {
            loadDoctors(search.trim(), activeFilter);
        }, 500);
        return () => clearTimeout(timeoutId);
    }, [search, activeFilter, loadDoctors]);

    const specializations = useMemo(() => {
        return [
            "All",
            ...new Set(
                doctors
                    .map((doctor) => doctor.specialization)
                    .filter(Boolean)
            ),
        ];
    }, [doctors]);

    const filteredDoctors = doctors;

    const goToProfile = () => navigation.navigate("Profile");
    const goToBookAppointment = () => navigation.navigate("BookAppointment");
    const goToMyAppointments = () => navigation.navigate("MyAppointments");
    const goToBookWithDoctor = (doctor) => navigation.navigate("BookAppointment", { doctor });

    const renderDoctorsContent = () => {
        if (doctorsLoading) {
            return (
                <View>
                    <DoctorSkeleton />
                    <DoctorSkeleton />
                </View>
            );
        }

        if (filteredDoctors.length === 0) {
            return (
                <View style={styles.emptyState}>
                    <Text style={styles.emptyIcon}>👩‍⚕️</Text>
                    <Text style={styles.emptyTitle}>No doctors found</Text>
                    <Text style={styles.emptySubtitle}>Try adjusting your filters or search term.</Text>
                </View>
            );
        }

        return filteredDoctors.map((doctor) => (
            <DoctorCard
                key={doctor.employeeCode || doctor._id}
                doctor={doctor}
                onBook={goToBookWithDoctor}
            />
        ));
    };

    return (
        <AppContainer>
            <KeyboardAvoidingView 
                style={styles.flex1} 
                behavior={Platform.OS === "ios" ? "padding" : undefined}
            >
                <ScrollView
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.scroll}
                    keyboardShouldPersistTaps="handled"
                >
                    <View style={styles.topBar}>
                        <View style={styles.greetingBox}>
                            <Text style={styles.greeting}>Good day,</Text>
                            <Text style={styles.screenTitle} numberOfLines={1}>
                                {patient?.name || "Patient"}
                            </Text>
                        </View>
                        <TouchableOpacity onPress={goToProfile} activeOpacity={0.7}>
                            <AppAvatar name={patient?.name} size={48} />
                        </TouchableOpacity>
                    </View>

                    <AppCard style={styles.uhidCard}>
                        <View style={styles.uhidRow}>
                            <View>
                                <Text style={styles.uhidLabel}>Patient UHID</Text>
                                <Text style={styles.uhidValue}>
                                    {patient?.UHID || "—"}
                                </Text>
                            </View>
                            <View style={styles.activeBadge}>
                                <Text style={styles.activeText}>Active</Text>
                            </View>
                        </View>
                    </AppCard>

                    <View style={styles.quickActionsContainer}>
                        <TouchableOpacity
                            onPress={goToMyAppointments}
                            style={styles.actionCard}
                            activeOpacity={0.7}
                        >
                            <View style={styles.actionIconContainer}>
                                <Text style={styles.actionIcon}>📋</Text>
                            </View>
                            <View style={styles.actionContent}>
                                <Text style={styles.actionTitle}>My Appointments</Text>
                                <Text style={styles.actionSubtitle}>View upcoming & completed</Text>
                            </View>
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={goToBookAppointment}
                            style={styles.actionCard}
                            activeOpacity={0.7}
                        >
                            <View style={styles.actionIconContainer}>
                                <Text style={styles.actionIcon}>➕</Text>
                            </View>
                            <View style={styles.actionContent}>
                                <Text style={styles.actionTitle}>Book Appointment</Text>
                                <Text style={styles.actionSubtitle}>Schedule a consultation</Text>
                            </View>
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={() => navigation.navigate("HealthRecords")}
                            style={styles.actionCard}
                            activeOpacity={0.7}
                        >
                            <View style={styles.actionIconContainer}>
                                <Text style={styles.actionIcon}>📑</Text>
                            </View>
                            <View style={styles.actionContent}>
                                <Text style={styles.actionTitle}>Health Records</Text>
                                <Text style={styles.actionSubtitle}>Diagnosis & prescriptions</Text>
                            </View>
                        </TouchableOpacity>
                    </View>

                    <AppCard style={styles.findCard}>
                        <Text style={styles.sectionTitle}>Find a Doctor</Text>
                        <Text style={styles.sectionSub}>
                            Search by doctor name or specialization
                        </Text>
                        <AppInput
                            value={search}
                            onChangeText={setSearch}
                            placeholder="Search doctors..."
                        />
                    </AppCard>

                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.filterRow}
                    >
                        {specializations.map((spec) => (
                            <TouchableOpacity
                                key={spec}
                                onPress={() => setActiveFilter(spec)}
                                activeOpacity={0.7}
                                style={[
                                    styles.filterChip,
                                    activeFilter === spec && styles.filterChipActive,
                                ]}
                            >
                                <Text
                                    style={[
                                        styles.filterText,
                                        activeFilter === spec && styles.filterTextActive,
                                    ]}
                                >
                                    {spec}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>

                    <View style={styles.doctorsHeader}>
                        <Text style={styles.sectionTitle}>Available Doctors</Text>
                        <Text style={styles.countText}>
                            {filteredDoctors.length} found
                        </Text>
                    </View>

                    {renderDoctorsContent()}
                </ScrollView>
            </KeyboardAvoidingView>
        </AppContainer>
    );
}

function DoctorCard({ doctor, onBook }) {
    const qualification = getQualification(doctor.qualification);
    const availability = getAvailability(doctor.availabilitySlots);
    const fee = doctor.consultationFee || doctor.fee || "—";

    return (
        <AppCard style={styles.doctorCard}>
            <View style={styles.doctorTop}>
                <AppAvatar
                    name={doctor.name}
                    size={52}
                    backgroundColor={COLORS.primaryLight}
                    textColor={COLORS.primary}
                />
                <View style={styles.doctorHeaderText}>
                    <Text style={styles.doctorName} numberOfLines={1}>
                        Dr. {doctor.name}
                    </Text>
                    <Text style={styles.doctorSpec} numberOfLines={1}>
                        {doctor.specialization || "Doctor"}
                    </Text>
                </View>
            </View>

            <View style={styles.doctorInfoBox}>
                <InfoRow label="Qualification" value={qualification} />
                <InfoRow label="Availability" value={availability} />
                <InfoRow label="Fee" value={`₹${fee}`} />
            </View>

            <AppButton
                title="Book Appointment"
                onPress={() => onBook(doctor)}
            />
        </AppCard>
    );
}

function InfoRow({ label, value }) {
    return (
        <View style={styles.doctorInfoRow}>
            <Text style={styles.doctorInfoLabel}>{label}</Text>
            <Text style={styles.doctorInfoValue} numberOfLines={1}>{value}</Text>
        </View>
    );
}

function getQualification(qualification) {
    if (Array.isArray(qualification)) {
        return qualification.length > 0 ? qualification.join(", ") : "MBBS";
    }
    return qualification || "MBBS";
}

function getAvailability(availabilitySlots) {
    if (!Array.isArray(availabilitySlots) || availabilitySlots.length === 0) {
        return "Not available";
    }
    const firstSlot = availabilitySlots[0];
    const lastSlot = availabilitySlots[availabilitySlots.length - 1];
    const startTime = firstSlot.split(" - ")[0];
    const endTime = lastSlot.split(" - ")[1];
    return `${startTime} - ${endTime}`;
}

DashboardScreen.propTypes = {
    navigation: PropTypes.shape({
        navigate: PropTypes.func.isRequired,
    }).isRequired,
};

DoctorCard.propTypes = {
    doctor: PropTypes.object.isRequired,
    onBook: PropTypes.func.isRequired,
};

InfoRow.propTypes = {
    label: PropTypes.string.isRequired,
    value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
};

const styles = StyleSheet.create({
    flex1: {
        flex: 1,
    },
    scroll: {
        paddingBottom: 40,
    },
    topBar: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingHorizontal: 20,
        paddingTop: 10,
        paddingBottom: 16,
    },
    greetingBox: {
        flex: 1,
        paddingRight: 10,
    },
    greeting: {
        fontSize: 14,
        color: COLORS.subtitle,
    },
    screenTitle: {
        fontSize: 26,
        fontWeight: "900",
        color: COLORS.text,
    },
    quickActionsContainer: {
        marginHorizontal: 20,
        marginBottom: 20,
    },
    actionCard: {
        backgroundColor: COLORS.white,
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        flexDirection: "row",
        alignItems: "center",
        shadowColor: "#000",
        shadowOpacity: 0.05,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 4 },
        elevation: 3,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    actionIconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: COLORS.surface,
        justifyContent: "center",
        alignItems: "center",
        marginRight: 16,
    },
    actionIcon: {
        fontSize: 24,
    },
    actionContent: {
        flex: 1,
    },
    actionTitle: {
        fontSize: 16,
        fontWeight: "700",
        color: COLORS.text,
    },
    actionSubtitle: {
        marginTop: 4,
        fontSize: 13,
        color: COLORS.subtitle,
    },
    uhidCard: {
        marginHorizontal: 20,
        marginBottom: 16,
        padding: 20,
    },
    uhidRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    uhidLabel: {
        fontSize: 13,
        color: COLORS.subtitle,
        marginBottom: 4,
    },
    uhidValue: {
        fontSize: 20,
        fontWeight: "900",
        color: COLORS.primaryMid,
    },
    activeBadge: {
        backgroundColor: COLORS.bookedLight,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
    },
    activeText: {
        color: COLORS.booked,
        fontWeight: "800",
        fontSize: 12,
    },
    findCard: {
        marginHorizontal: 20,
        marginBottom: 16,
        padding: 20,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: "800",
        color: COLORS.text,
    },
    sectionSub: {
        fontSize: 13,
        color: COLORS.subtitle,
        marginTop: 4,
        marginBottom: 16,
    },
    filterRow: {
        paddingHorizontal: 20,
        gap: 8,
        marginBottom: 16,
    },
    filterChip: {
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 50,
        backgroundColor: COLORS.white,
        borderWidth: 1,
        borderColor: COLORS.border,
        shadowColor: "#000",
        shadowOpacity: 0.03,
        shadowRadius: 4,
        shadowOffset: { width: 0, height: 2 },
        elevation: 1,
    },
    filterChipActive: {
        backgroundColor: COLORS.primary,
        borderColor: COLORS.primary,
    },
    filterText: {
        fontSize: 14,
        fontWeight: "700",
        color: COLORS.text,
    },
    filterTextActive: {
        color: COLORS.white,
    },
    doctorsHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingHorizontal: 20,
        marginBottom: 12,
    },
    countText: {
        fontSize: 13,
        color: COLORS.subtitle,
        fontWeight: "600",
    },
    emptyState: {
        alignItems: "center",
        justifyContent: "center",
        padding: 40,
        marginTop: 20,
    },
    emptyIcon: {
        fontSize: 48,
        marginBottom: 16,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: "700",
        color: COLORS.text,
        marginBottom: 8,
    },
    emptySubtitle: {
        fontSize: 14,
        color: COLORS.subtitle,
        textAlign: "center",
    },
    doctorCard: {
        marginHorizontal: 20,
        marginBottom: 16,
        padding: 16,
    },
    doctorTop: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        marginBottom: 16,
    },
    doctorHeaderText: {
        flex: 1,
    },
    doctorName: {
        fontSize: 17,
        fontWeight: "800",
        color: COLORS.text,
    },
    doctorSpec: {
        fontSize: 14,
        color: COLORS.primaryMid,
        fontWeight: "700",
        marginTop: 4,
    },
    doctorInfoBox: {
        backgroundColor: COLORS.surface,
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 8,
        marginBottom: 16,
    },
    doctorInfoRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
        gap: 12,
    },
    doctorInfoLabel: {
        fontSize: 13,
        color: COLORS.subtitle,
        fontWeight: "500",
    },
    doctorInfoValue: {
        flex: 1,
        textAlign: "right",
        fontSize: 14,
        fontWeight: "700",
        color: COLORS.text,
    },
    skeletonAvatar: {
        width: 52,
        height: 52,
        borderRadius: 26,
        backgroundColor: COLORS.border,
    },
    skeletonTitle: {
        height: 16,
        width: "60%",
        backgroundColor: COLORS.border,
        borderRadius: 4,
        marginBottom: 8,
    },
    skeletonSubtitle: {
        height: 12,
        width: "40%",
        backgroundColor: COLORS.border,
        borderRadius: 4,
    },
    skeletonLine: {
        height: 12,
        width: "100%",
        backgroundColor: COLORS.border,
        borderRadius: 4,
    },
    skeletonLineShort: {
        height: 12,
        width: "80%",
        backgroundColor: COLORS.border,
        borderRadius: 4,
    },
    skeletonButton: {
        height: 48,
        width: "100%",
        backgroundColor: COLORS.border,
        borderRadius: 24,
    },
});