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
    ActivityIndicator,
} from "react-native";
import MedicalRecordCard from "../../components/MedicalRecordCard";
import AppContainer from "../../components/AppContainer";
import AppCard from "../../components/AppCard";

import {
    getMyHealthRecords,
} from "../../api/healthRecordService";

import COLORS from "../../utils/colors";

export default function HealthRecordsScreen({
    navigation,
}) {

    const [records, setRecords] = useState([]);
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);
    const [hasNextPage, setHasNextPage] = useState(false);

    useEffect(() => {
        loadRecords(1, false);
    }, []);

    const loadRecords = async (pageToLoad, isRefresh) => {
        try {
            if (isRefresh) {
                setRefreshing(true);
            } else if (pageToLoad === 1) {
                setLoading(true);
            } else {
                setLoadingMore(true);
            }

            const response = await getMyHealthRecords(pageToLoad, 10);
            const newRecords = response?.data || [];
            const pagination = response?.pagination || {};

            if (isRefresh || pageToLoad === 1) {
                setRecords(newRecords);
            } else {
                setRecords(prev => [...prev, ...newRecords]);
            }

            setPage(pageToLoad);
            setHasNextPage(pagination.hasNextPage || false);
        } catch (err) {
            console.log("LOAD HEALTH RECORDS ERROR:", err);
        } finally {
            setLoading(false);
            setRefreshing(false);
            setLoadingMore(false);
        }
    };

    const handleRefresh = () => {
        loadRecords(1, true);
    };

    const handleLoadMore = () => {
        if (loadingMore || !hasNextPage) return;
        loadRecords(page + 1, false);
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

            {loading && records.length === 0 ? (
                <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
                    <ActivityIndicator size="large" color={COLORS.primary} />
                </View>
            ) : (
                <FlatList
                    data={records}
                    keyExtractor={(item) =>
                        item.healthRecordId || item._id
                    }
                    renderItem={renderItem}
                    contentContainerStyle={{
                        padding: 20,
                    }}
                    refreshing={refreshing}
                    onRefresh={handleRefresh}
                    onEndReached={handleLoadMore}
                    onEndReachedThreshold={0.5}
                    ListFooterComponent={
                        loadingMore ? (
                            <ActivityIndicator
                                size="small"
                                color={COLORS.primary}
                                style={{ marginVertical: 20 }}
                            />
                        ) : null
                    }
                    ListEmptyComponent={
                        <Text
                            style={styles.empty}
                        >
                            No health records found
                        </Text>
                    }
                />
            )}

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