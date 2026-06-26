import React, {
    useCallback,
    useEffect,
    useRef,
    useState,
} from "react";

import {
    ActivityIndicator,
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

const HEALTH_RECORDS_PAGE_SIZE = 10;

const normalizeHealthRecordsPayload = (payload) => {
    if (Array.isArray(payload)) {
        return {
            records: payload,
            pagination: null,
        };
    }

    return {
        records: Array.isArray(payload?.records)
            ? payload.records
            : [],
        pagination: payload?.pagination || null,
    };
};

export default function HealthRecordsScreen({
    navigation,
}) {

    const [records, setRecords] =
        useState([]);
    const [recordsPage, setRecordsPage] =
        useState(1);
    const [recordsHasMore, setRecordsHasMore] =
        useState(true);
    const [recordsLoading, setRecordsLoading] =
        useState(false);
    const [recordsLoadingMore, setRecordsLoadingMore] =
        useState(false);
    const recordsLoadingMoreRef = useRef(false);

    const loadRecords = useCallback(async ({
        page = 1,
        append = false,
    } = {}) => {
        try {
            if (append) {
                setRecordsLoadingMore(true);
            } else {
                setRecordsLoading(true);
            }

            const data =
                await getMyHealthRecords({
                    page,
                    limit: HEALTH_RECORDS_PAGE_SIZE,
                });

            const {
                records: nextRecords,
                pagination,
            } = normalizeHealthRecordsPayload(data);

            setRecords((currentRecords) =>
                append
                    ? [
                        ...currentRecords,
                        ...nextRecords,
                    ]
                    : nextRecords
            );
            setRecordsPage(page);
            setRecordsHasMore(
                pagination
                    ? page < pagination.totalPages
                    : nextRecords.length === HEALTH_RECORDS_PAGE_SIZE
            );
        } catch (err) {
            console.log(err);
            if (!append) {
                setRecords([]);
                setRecordsHasMore(false);
            }
        } finally {
            setRecordsLoading(false);
            setRecordsLoadingMore(false);
        }
    }, []);

    useEffect(() => {
        loadRecords({
            page: 1,
        });
    }, [loadRecords]);

    const loadMoreRecords = () => {
        if (
            recordsLoading ||
            recordsLoadingMore ||
            recordsLoadingMoreRef.current ||
            !recordsHasMore
        ) {
            return;
        }

        recordsLoadingMoreRef.current = true;

        void (async () => {
            try {
                await loadRecords({
                    page: recordsPage + 1,
                    append: true,
                });
            } finally {
                recordsLoadingMoreRef.current = false;
            }
        })();
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

            {recordsLoading ? (
                <View style={styles.loader}>
                    <ActivityIndicator
                        size="large"
                        color={COLORS.primary}
                    />
                </View>
            ) : (
                <FlatList
                    data={records}
                    keyExtractor={(item, index) =>
                        item.healthRecordId?.toString() ||
                        item._id?.toString() ||
                        String(index)
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
                    ListFooterComponent={
                        recordsLoadingMore ? (
                            <View style={styles.footerLoader}>
                                <ActivityIndicator
                                    size="small"
                                    color={COLORS.primary}
                                />
                            </View>
                        ) : null
                    }
                    onEndReached={loadMoreRecords}
                    onEndReachedThreshold={0.4}
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

    loader: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },

    footerLoader: {
        paddingVertical: 18,
        alignItems: "center",
    },
});

HealthRecordsScreen.propTypes = {
    navigation: PropTypes.object.isRequired,
};
