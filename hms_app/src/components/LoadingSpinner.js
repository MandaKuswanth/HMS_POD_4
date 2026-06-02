import react from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
const LoadingSpinner = ({ fullScreen = true }) => {

    return (
        <View style={styles.container && fullScreen ? styles.fullScreen : null}>
            <ActivityIndicator size="large" color="#1976D2" />
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    fullScreen: {
        flex: 1,
        backgroundColor: '#F8FBFF'
    }
})

export default LoadingSpinner;