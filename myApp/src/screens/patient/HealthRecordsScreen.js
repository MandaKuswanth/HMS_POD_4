import React, {
    useEffect,
    useState,
} from "react";

import {
    FlatList,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import MedicalRecordCard from "../../components/MedicalRecordCard";
import AppContainer from "../../components/AppContainer";

import {
    getMyHealthRecords,
} from "../../api/healthRecordService";

import COLORS from "../../utils/colors";
import PropTypes from "prop-types";

export default function HealthRecordsScreen({
    navigation,
}) {

    const [records, setRecords] =
        useState([]);

    useEffect(() => {
        loadRecords();
    }, []);

    const loadRecords = async () => {
        try {
            const data =
                await getMyHealthRecords();

            setRecords(data);
        } catch (err) {
            console.log(err);
        }
    };

    const renderItem = ({ item }) => (
   <MedicalRecordCard
    doctorName={item.doctorName}
    specialization={item.specialization}
     diagnosis={item.diagnosis}
    symptoms={item.symptoms}
    prescription={item.prescription}
    appointmentDate={item.appointmentDate}
/>
    );

    return (
        <AppContainer>

            {/* Header */}

            <View style={styles.header}>

                <TouchableOpacity
                    onPress={() =>
                        navigation.goBack()
                    }
                >
                    <Text style={styles.back}>
                        ←
                    </Text>
                </TouchableOpacity>

                <Text style={styles.headerTitle}>
                    Health Records
                </Text>

            </View>

            <FlatList
                data={records}
                keyExtractor={(item) =>
                    item.healthRecordId
                }
                renderItem={renderItem}
                contentContainerStyle={{
                    padding: 20,
                }}
                ListEmptyComponent={
                    <Text
                        style={styles.empty}
                    >
                        No health records found
                    </Text>
                }
            />

        </AppContainer>
    );
}

const styles = StyleSheet.create({

    header: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 20,
        paddingVertical: 15,
    },

    back: {
        fontSize: 28,
        fontWeight: "bold",
        marginRight: 15,
    },

    headerTitle: {
        fontSize: 22,
        fontWeight: "900",
    },

    card: {
        marginBottom: 15,
    },

    title: {
        fontSize: 18,
        fontWeight: "800",
        marginBottom: 10,
    },

    label: {
        fontWeight: "700",
        marginTop: 8,
    },

    date: {
        marginTop: 10,
        color: COLORS.subtitle,
    },

    empty: {
        textAlign: "center",
        marginTop: 50,
    },
});

HealthRecordsScreen.propTypes = {
    navigation: PropTypes.object.isRequired,
};
