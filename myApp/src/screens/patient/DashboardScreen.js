import React, { useCallback, useMemo, useState } from "react";
import PropTypes from "prop-types";

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

    const { doctors, doctorsLoading, loadDoctors } = useAppointments();

    const [search, setSearch] = useState("");
    const [activeFilter, setActiveFilter] = useState("All");

    useFocusEffect(
        useCallback(() => {
            loadDoctors();
        }, [loadDoctors])
    );

    React.useEffect(() => {
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

    const goToProfile = () => {
        navigation.navigate("Profile");
    };

    const goToBookAppointment = () => {
        navigation.navigate("BookAppointment");
    };

    const goToMyAppointments = () => {
        navigation.navigate("MyAppointments");
    };

    const goToBookWithDoctor = (doctor) => {
        navigation.navigate("BookAppointment", {
            doctor,
        });
    };

    const renderDoctorsContent = () => {
        if (doctorsLoading) {
            return (
                <ActivityIndicator
                    color={COLORS.primary}
                    style={styles.loader}
                />
            );
        }

        if (filteredDoctors.length === 0) {
            return (
                <Text style={styles.emptyText}>
                    No doctors found
                </Text>
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

                    <TouchableOpacity onPress={goToProfile}>
                        <AppAvatar name={patient?.name} size={48} />
                    </TouchableOpacity>
                </View>

                <AppCard style={styles.uhidCard}>
                    <View style={styles.uhidRow}>
                        <View>
                            <Text style={styles.uhidLabel}>
                                Patient UHID
                            </Text>
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
    >
        <Text style={styles.actionIcon}>📋</Text>

        <View style={styles.actionContent}>
            <Text style={styles.actionTitle}>
                My Appointments
            </Text>

            <Text style={styles.actionSubtitle}>
                View upcoming and completed appointments
            </Text>
        </View>
    </TouchableOpacity>

    <TouchableOpacity
        onPress={goToBookAppointment}
        style={styles.actionCard}
    >
        <Text style={styles.actionIcon}>➕</Text>

        <View style={styles.actionContent}>
            <Text style={styles.actionTitle}>
                Book Appointment
            </Text>

            <Text style={styles.actionSubtitle}>
                Schedule a consultation with a doctor
            </Text>
        </View>
    </TouchableOpacity>

    <TouchableOpacity
        onPress={() =>
            navigation.navigate("HealthRecords")
        }
        style={styles.actionCard}
    >
        <Text style={styles.actionIcon}>📑</Text>

        <View style={styles.actionContent}>
            <Text style={styles.actionTitle}>
                Health Records
            </Text>

            <Text style={styles.actionSubtitle}>
                View diagnosis, prescriptions and reports
            </Text>
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
                    <Text style={styles.sectionTitle}>
                        Available Doctors
                    </Text>
                    <Text style={styles.countText}>
                        {filteredDoctors.length} found
                    </Text>
                </View>

                {renderDoctorsContent()}
            </ScrollView>
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
                <InfoRow label="Fee" value={`₹${fee}`} />
            </View>

            <TouchableOpacity
                style={styles.bookBtn}
                onPress={() => onBook(doctor)}
            >
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

function getQualification(qualification) {
    if (Array.isArray(qualification)) {
        return qualification.length > 0
            ? qualification.join(", ")
            : "MBBS";
    }

    return qualification || "MBBS";
}

function getAvailability(availabilitySlots) {
    if (
        !Array.isArray(availabilitySlots) ||
        availabilitySlots.length === 0
    ) {
        return "Not available";
    }

    const firstSlot = availabilitySlots.at(0);
    const lastSlot = availabilitySlots.at(-1);

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
    doctor: PropTypes.shape({
        _id: PropTypes.string,
        employeeCode: PropTypes.string,
        name: PropTypes.string,
        specialization: PropTypes.string,
        qualification: PropTypes.oneOfType([
            PropTypes.string,
            PropTypes.arrayOf(PropTypes.string),
        ]),
        availabilitySlots: PropTypes.arrayOf(PropTypes.string),
        consultationFee: PropTypes.oneOfType([
            PropTypes.string,
            PropTypes.number,
        ]),
        fee: PropTypes.oneOfType([
            PropTypes.string,
            PropTypes.number,
        ]),
    }).isRequired,
    onBook: PropTypes.func.isRequired,
};

InfoRow.propTypes = {
    label: PropTypes.string.isRequired,
    value: PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.number,
    ]).isRequired,
};

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
    quickActionsContainer: {
    marginHorizontal: 20,
    marginBottom: 20,
},

actionCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 18,
    marginBottom: 12,

    flexDirection: "row",
    alignItems: "center",

    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
},

actionIcon: {
    fontSize: 28,
    marginRight: 16,
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
    justifyContent: "space-between",
    marginHorizontal: 20,
    marginBottom: 16,
    gap: 10,
},

quickCard: {
    flex: 1,
},

quickCardInner: {
    height: 130,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 8,
},

quickIcon: {
    fontSize: 28,
    color: COLORS.primary,
    marginBottom: 10,
},

quickLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.text,
    textAlign: "center",
    lineHeight: 20,
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

    loader: {
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