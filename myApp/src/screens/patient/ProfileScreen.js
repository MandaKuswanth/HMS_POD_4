import React from "react";

import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";

import COLORS from "../../utils/colors";

import AppCard from "../../components/AppCard";

import AppButton from "../../components/AppButton";
import AppContainer from "../../components/AppContainer";

export default function ProfileScreen({
    patient,
    goBack,
    goToEditProfile
}) {

    return (

        <AppContainer>

            <ScrollView
                showsVerticalScrollIndicator={false}
            >

                <TouchableOpacity
                    onPress={goBack}
                >
                    <Text
                        style={styles.backButton}
                    >
                        ← Back
                    </Text>
                </TouchableOpacity>

                <View
                    style={styles.header}
                >

                    <View
                        style={styles.avatar}
                    >
                        <Text
                            style={styles.avatarText}
                        >
                            {
                                patient?.name
                                    ?.charAt(0)
                                    ?.toUpperCase()
                            }
                        </Text>
                    </View>

                    <Text
                        style={styles.name}
                    >
                        {patient?.name}
                    </Text>

                    <Text
                        style={styles.uhid}
                    >
                        {patient?.UHID}
                    </Text>

                </View>

                <AppCard
                    style={styles.card}
                >

                    <View
                        style={styles.infoRow}
                    >
                        <Text
                            style={styles.label}
                        >
                            Email
                        </Text>

                        <Text
                            style={styles.value}
                        >
                            {patient?.email}
                        </Text>
                    </View>

                    <View
                        style={styles.divider}
                    />

                    <View
                        style={styles.infoRow}
                    >
                        <Text
                            style={styles.label}
                        >
                            Phone
                        </Text>

                        <Text
                            style={styles.value}
                        >
                            {patient?.phone}
                        </Text>
                    </View>

                    <View
                        style={styles.divider}
                    />

                    <View
                        style={styles.infoRow}
                    >
                        <Text
                            style={styles.label}
                        >
                            Gender
                        </Text>

                        <Text
                            style={styles.value}
                        >
                            {patient?.gender}
                        </Text>
                    </View>

                    <View
                        style={styles.divider}
                    />

                    <View
                        style={styles.infoRow}
                    >
                        <Text
                            style={styles.label}
                        >
                            Address
                        </Text>

                        <Text
                            style={[
                                styles.value,
                                styles.address
                            ]}
                        >
                            {
                                patient?.address ||
                                "N/A"
                            }
                        </Text>
                    </View>

                </AppCard>

                <View
                    style={styles.buttonContainer}
                >
                    <AppButton
                        title="Edit Profile"
                        onPress={goToEditProfile}
                    />
                </View>

            </ScrollView>

        </AppContainer>
    );
}

const styles = StyleSheet.create({

    backButton: {
        fontSize: 18,
        fontWeight: "600",
        color: COLORS.primary,
        margin: 20
    },

    header: {
        alignItems: "center",
        backgroundColor: COLORS.primary,
        marginHorizontal: 20,
        marginBottom: 20,
        borderRadius: 28,
        paddingVertical: 30
    },

    avatar: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: COLORS.white,

        justifyContent: "center",
        alignItems: "center"
    },

    avatarText: {
        color: COLORS.primary,
        fontSize: 40,
        fontWeight: "700"
    },

    name: {
        marginTop: 15,
        fontSize: 28,
        fontWeight: "700",
        color: COLORS.white
    },

    uhid: {
        marginTop: 6,
        color: COLORS.primaryLight,
        fontSize: 15
    },

    card: {
        marginHorizontal: 20,
        paddingVertical: 5
    },

    infoRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingVertical: 16
    },

    label: {
        fontSize: 15,
        color: COLORS.subtitle
    },

    value: {
        fontSize: 16,
        fontWeight: "600",
        color: COLORS.text
    },

    address: {
        flex: 1,
        textAlign: "right",
        marginLeft: 20
    },

    divider: {
        height: 1,
        backgroundColor:
            COLORS.border
    },

    buttonContainer: {
        margin: 20
    }
});