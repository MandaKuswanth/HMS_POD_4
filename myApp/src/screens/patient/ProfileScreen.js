import React from "react";

import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
} from "react-native";

import { SafeAreaView }
    from "react-native-safe-area-context";

export default function ProfileScreen({
    patient,
    goBack,
    goToEditProfile
}) {

    return (

        <SafeAreaView style={styles.container}>

            <ScrollView
                showsVerticalScrollIndicator={false}
            >

                <TouchableOpacity
                    onPress={goBack}
                >
                    <Text style={styles.backButton}>
                        ← Back
                    </Text>
                </TouchableOpacity>

                <View style={styles.profileHeader}>

                    <View style={styles.avatar}>
                        <Text style={styles.avatarText}>
                            {patient?.name?.charAt(0)}
                        </Text>
                    </View>

                    <Text style={styles.name}>
                        {patient?.name}
                    </Text>

                    <Text style={styles.uhid}>
                        {patient?.UHID}
                    </Text>

                </View>

                <View style={styles.card}>

                    <View style={styles.infoRow}>
                        <Text style={styles.icon}>
                            📧
                        </Text>

                        <View>
                            <Text style={styles.label}>
                                Email
                            </Text>

                            <Text style={styles.value}>
                                {patient?.email}
                            </Text>
                        </View>
                    </View>

                    <View style={styles.infoRow}>
                        <Text style={styles.icon}>
                            📞
                        </Text>

                        <View>
                            <Text style={styles.label}>
                                Phone
                            </Text>

                            <Text style={styles.value}>
                                {patient?.phone}
                            </Text>
                        </View>
                    </View>

                    <View style={styles.infoRow}>
                        <Text style={styles.icon}>
                            ⚧
                        </Text>

                        <View>
                            <Text style={styles.label}>
                                Gender
                            </Text>

                            <Text style={styles.value}>
                                {patient?.gender}
                            </Text>
                        </View>
                    </View>

                    <View style={styles.infoRow}>
                        <Text style={styles.icon}>
                            📍
                        </Text>

                        <View>
                            <Text style={styles.label}>
                                Address
                            </Text>

                            <Text style={styles.value}>
                                {patient?.address}
                            </Text>
                        </View>
                    </View>

                </View>

                <TouchableOpacity
                    style={styles.editButton}
                    onPress={goToEditProfile}
                >
                    <Text style={styles.editButtonText}>
                        Edit Profile
                    </Text>
                </TouchableOpacity>

            </ScrollView>

        </SafeAreaView>
    );
}

const styles = StyleSheet.create({

    container: {
        flex: 1,
        backgroundColor: "#F8FAFC"
    },

    backButton: {
        fontSize: 18,
        fontWeight: "600",
        color: "#0F766E",
        margin: 20
    },

    profileHeader: {
        alignItems: "center",
        marginBottom: 20
    },

    avatar: {
        width: 90,
        height: 90,
        borderRadius: 45,
        backgroundColor: "#0F766E",
        justifyContent: "center",
        alignItems: "center"
    },

    avatarText: {
        color: "#fff",
        fontSize: 34,
        fontWeight: "700"
    },

    name: {
        fontSize: 26,
        fontWeight: "700",
        marginTop: 12,
        color: "#0F172A"
    },

    uhid: {
        color: "#64748B",
        marginTop: 4
    },

    card: {
        backgroundColor: "#fff",
        marginHorizontal: 20,
        borderRadius: 20,
        padding: 20,

        shadowColor: "#000",
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 3
    },

    infoRow: {
        flexDirection: "row",
        marginBottom: 20,
        alignItems: "center"
    },

    icon: {
        fontSize: 24,
        width: 40
    },

    label: {
        color: "#64748B",
        fontSize: 13
    },

    value: {
        fontSize: 16,
        fontWeight: "600",
        color: "#0F172A"
    },

    editButton: {
        backgroundColor: "#0F766E",
        margin: 20,
        padding: 16,
        borderRadius: 16,
        alignItems: "center"
    },

    editButtonText: {
        color: "#fff",
        fontWeight: "700",
        fontSize: 16
    }
});