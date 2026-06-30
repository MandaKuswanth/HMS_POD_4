import React, { useEffect, useState } from "react";
import {
    FlatList,
    StyleSheet,
    Text,
    View,
    ActivityIndicator,
} from "react-native";

import MedicalRecordCard from "../../components/MedicalRecordCard";
import AppContainer from "../../components/AppContainer";
import ScreenHeader from "../../components/ScreenHeader";
import { getMyHealthRecords } from "../../api/healthRecordService";
import COLORS from "../../utils/colors";

export default function HealthRecordsScreen({ navigation }) {
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
                setRecords((prev) => [...prev, ...newRecords]);
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

    const renderEmptyState = () => (
        <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No health records found</Text>
            <Text style={styles.emptySubText}>Your past diagnoses and prescriptions will appear here.</Text>
        </View>
    );

    return (
        <AppContainer>
            <ScreenHeader
                title="Health Records"
                subtitle="View your past medical history"
                goBack={() => navigation.goBack()}
            />

            {loading && records.length === 0 ? (
                <View style={styles.loaderContainer}>
                    <ActivityIndicator size="large" color={COLORS.primary} />
                </View>
            ) : (
                <FlatList
                    data={records}
                    keyExtractor={(item) => item.healthRecordId || item._id}
                    renderItem={renderItem}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                    refreshing={refreshing}
                    onRefresh={handleRefresh}
                    onEndReached={handleLoadMore}
                    onEndReachedThreshold={0.5}
                    ListEmptyComponent={renderEmptyState}
                    ListFooterComponent={
                        loadingMore ? (
                            <ActivityIndicator
                                size="small"
                                color={COLORS.primary}
                                style={styles.footerLoader}
                            />
                        ) : null
                    }
                />
            )}
        </AppContainer>
    );
}

const styles = StyleSheet.create({
    listContent: {
        padding: 20,
        paddingBottom: 40,
        flexGrow: 1,
    },
    loaderContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    footerLoader: {
        marginVertical: 20,
    },
    emptyContainer: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        paddingTop: 80,
    },
    emptyText: {
        fontSize: 18,
        fontWeight: "700",
        color: COLORS.text,
        marginBottom: 8,
    },
    emptySubText: {
        fontSize: 14,
        color: COLORS.subtitle,
        textAlign: "center",
        paddingHorizontal: 30,
        lineHeight: 20,
    },
});