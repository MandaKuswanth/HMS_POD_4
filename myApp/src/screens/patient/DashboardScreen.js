import React, { useCallback, useMemo, useState } from "react";

import {
    ActivityIndicator,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

import { useFocusEffect } from "@react-navigation/native";

import AppAvatar from "../../components/AppAvatar";
import AppCard from "../../components/AppCard";
import AppContainer from "../../components/AppContainer";
import AppInput from "../../components/AppInput";

import { useAuth } from "../../context/AuthContext";
import { useAppointments } from "../../context/AppointmentContext";

import COLORS from "../../utils/colors";

export default function DashboardScreen({ navigation }) {
    const { patient } = useAuth();

    const {
        doctors,
        doctorsLoading,
        loadDoctors,
    } = useAppointments();

    const [search, setSearch] = useState("");
    const [activeFilter, setActiveFilter] = useState("All");

    useFocusEffect(
        useCallback(() => {
            loadDoctors();
        }, [loadDoctors])
    );

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

    const filteredDoctors = useMemo(() => {
        return doctors.filter((doctor) => {
            const searchText = search.trim().toLowerCase();

            const matchSearch =
                !searchText ||
                doctor.name?.toLowerCase().includes(searchText) ||
                doctor.specialization?.toLowerCase().includes(searchText);

            const matchFilter =
                activeFilter === "All" ||
                doctor.specialization === activeFilter;

            return matchSearch && matchFilter;
        });
    }, [doctors, search, activeFilter]);

    return (
        <AppContainer>
            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scroll}
            >
                <View style={styles.topBar}>
                    <View>
                        <Text style={styles.greeting}>Good day,</Text>
                        <Text style={styles.screenTitle}>
                            {patient?.name || "Patient"}
                        </Text>
                    </View>

                    <TouchableOpacity
                        onPress={() => navigation.navigate("Profile")}
                    >
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

                <View style={styles.quickRow}>
                    <TouchableOpacity
                        style={styles.quickCard}
                        onPress={() => navigation.navigate("BookAppointment")}
                    >
                        <AppCard style={styles.quickCardInner}>
                            <Text style={styles.quickIcon}>＋</Text>
                            <Text style={styles.quickTitle}>Book</Text>
                            <Text style={styles.quickSub}>Appointment</Text>
                        </AppCard>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.quickCard}
                        onPress={() =>
                            navigation.navigate("MyAppointments")
                        }
                    >
                        <AppCard style={styles.quickCardInner}>
                            <Text style={styles.quickIcon}>📋</Text>
                            <Text style={styles.quickTitle}>My</Text>
                            <Text style={styles.quickSub}>Appointments</Text>
                        </AppCard>
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
                        placeholder="Search doctors"
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
                            style={[
                                styles.filterChip,
                                activeFilter === spec &&
                                styles.filterChipActive,
                            ]}
                        >
                            <Text
                                style={[
                                    styles.filterText,
                                    activeFilter === spec &&
                                    styles.filterTextActive,
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

                {doctorsLoading ? (
                    <ActivityIndicator
                        color={COLORS.primary}
                        style={{ marginTop: 30 }}
                    />
                ) : (
                    <>
                        {filteredDoctors.map((doctor) => (
                            <DoctorCard
                                key={doctor.employeeCode || doctor._id}
                                doctor={doctor}
                                onBook={() =>
                                    navigation.navigate("BookAppointment", {
                                        doctor,
                                    })
                                }
                            />
                        ))}

                        {filteredDoctors.length === 0 && (
                            <Text style={styles.emptyText}>
                                No doctors found
                            </Text>
                        )}
                    </>
                )}
            </ScrollView>
        </AppContainer>
    );
}

function DoctorCard({ doctor, onBook }) {
    const qualification = Array.isArray(doctor.qualification)
        ? doctor.qualification.join(", ")
        : doctor.qualification || "MBBS";

    const availability =
        Array.isArray(doctor.availabilitySlots) &&
            doctor.availabilitySlots.length > 0
            ? doctor.availabilitySlots.join(", ")
            : "Not available";

    return (
        <AppCard style={styles.doctorCard}>
            <View style={styles.doctorTop}>
                <AppAvatar
                    name={doctor.name}
                    size={52}
                    backgroundColor={COLORS.primaryLight}
                    textColor={COLORS.primary}
                />

                <View style={{ flex: 1 }}>
                    <Text style={styles.doctorName}>
                        Dr. {doctor.name}
                    </Text>
                    <Text style={styles.doctorSpec}>
                        {doctor.specialization || "Doctor"}
                    </Text>
                </View>
            </View>

            <View style={styles.doctorInfoBox}>
                <InfoRow label="Qualification" value={qualification} />
                <InfoRow label="Availability" value={availability} />
                <InfoRow
                    label="Fee"
                    value={`₹${doctor.consultationFee || "—"}`}
                />
            </View>

            <TouchableOpacity style={styles.bookBtn} onPress={onBook}>
                <Text style={styles.bookBtnText}>
                    Book Appointment
                </Text>
            </TouchableOpacity>
        </AppCard>
    );
}

function InfoRow({ label, value }) {
    return (
        <View style={styles.doctorInfoRow}>
            <Text style={styles.doctorInfoLabel}>{label}</Text>
            <Text style={styles.doctorInfoValue}>{value}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
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

    greeting: {
        fontSize: 14,
        color: COLORS.subtitle,
    },

    screenTitle: {
        fontSize: 26,
        fontWeight: "900",
        color: COLORS.text,
    },

    uhidCard: {
        marginHorizontal: 20,
        marginBottom: 14,
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
        paddingHorizontal: 14,
        paddingVertical: 6,
        borderRadius: 20,
    },

    activeText: {
        color: COLORS.booked,
        fontWeight: "800",
        fontSize: 13,
    },

    quickRow: {
        flexDirection: "row",
        marginHorizontal: 20,
        gap: 12,
        marginBottom: 14,
    },

    quickCard: {
        flex: 1,
    },

    quickCardInner: {
        paddingVertical: 18,
    },

    quickIcon: {
        fontSize: 24,
        color: COLORS.primary,
        fontWeight: "900",
        marginBottom: 8,
    },

    quickTitle: {
        fontSize: 18,
        fontWeight: "800",
        color: COLORS.text,
    },

    quickSub: {
        fontSize: 13,
        color: COLORS.subtitle,
    },

    findCard: {
        marginHorizontal: 20,
        marginBottom: 14,
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
        marginBottom: 12,
    },

    filterRow: {
        paddingHorizontal: 20,
        gap: 8,
        marginBottom: 14,
    },

    filterChip: {
        paddingHorizontal: 18,
        paddingVertical: 9,
        borderRadius: 50,
        backgroundColor: COLORS.white,
        borderWidth: 1,
        borderColor: COLORS.border,
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
        color: "#fff",
    },

    doctorsHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        paddingHorizontal: 20,
        marginBottom: 10,
    },

    countText: {
        fontSize: 13,
        color: COLORS.subtitle,
    },

    emptyText: {
        textAlign: "center",
        color: COLORS.subtitle,
        marginTop: 30,
    },

    doctorCard: {
        marginHorizontal: 20,
        marginBottom: 14,
    },

    doctorTop: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        marginBottom: 14,
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
        marginTop: 2,
    },

    doctorInfoBox: {
        backgroundColor: COLORS.surface,
        borderRadius: 12,
        paddingHorizontal: 14,
        marginBottom: 14,
    },

    doctorInfoRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
        gap: 12,
    },

    doctorInfoLabel: {
        fontSize: 14,
        color: COLORS.subtitle,
    },

    doctorInfoValue: {
        flex: 1,
        textAlign: "right",
        fontSize: 14,
        fontWeight: "800",
        color: COLORS.text,
    },

    bookBtn: {
        backgroundColor: COLORS.primary,
        borderRadius: 50,
        paddingVertical: 14,
        alignItems: "center",
    },

    bookBtnText: {
        color: "#fff",
        fontWeight: "800",
        fontSize: 15,
    },
});