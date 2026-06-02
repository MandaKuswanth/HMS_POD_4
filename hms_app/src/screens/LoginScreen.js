import React, { useState, useContext } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import CustomInput from '../components/CustomInput';
import CustomButton from '../components/CustomButton';
import { AuthContext } from '../context/AuthContext';
import { validateEmail, validateRequired } from '../utils/validation';

const LoginScreen = ({ navigation }) => {
    const { login, loading } = useContext(AuthContext);

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [errors, setErrors] = useState({});

    const handleLogin = async () => {
        let newErrors = {};
        if (!validateRequired(email)) newErrors.email = 'Email is required';
        else if (!validateEmail(email)) newErrors.email = 'Invalid email format';

        if (!validateRequired(password)) newErrors.password = 'Password is required';

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        setErrors({});
        const res = await login(email, password);
        if (res.success) {
            navigation.replace('PatientDashboardScreen');
        }
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : null}
        >
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.header}>
                    <Text style={styles.welcomeText}>Welcome Back</Text>
                    <Text style={styles.subtitleText}>Login to access your patient portal</Text>
                </View>

                <View style={styles.formContainer}>
                    <CustomInput
                        label="Email"
                        placeholder="Enter your email"
                        value={email}
                        onChangeText={(text) => { setEmail(text); setErrors({ ...errors, email: null }); }}
                        keyboardType="email-address"
                        error={errors.email}
                    />

                    <CustomInput
                        label="Password"
                        placeholder="Enter your password"
                        value={password}
                        onChangeText={(text) => { setPassword(text); setErrors({ ...errors, password: null }); }}
                        secureTextEntry
                        error={errors.password}
                    />
                    <CustomButton
                        title="Login"
                        onPress={handleLogin}
                        loading={loading}
                    />

                    <View style={styles.signupContainer}>
                        <Text style={styles.signupText}>Don't have an account? </Text>
                        <TouchableOpacity onPress={() => navigation.navigate('SignupScreen')}>
                            <Text style={styles.signupLink}>Sign Up</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8FBFF',
    },
    scrollContent: {
        flexGrow: 1,
        justifyContent: 'center',
        padding: 24,
    },
    header: {
        marginBottom: 40,
        alignItems: 'center',
    },
    welcomeText: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#1976D2',
        marginBottom: 8,
    },
    subtitleText: {
        fontSize: 16,
        color: '#6B7280',
    },
    formContainer: {
        backgroundColor: '#FFFFFF',
        padding: 24,
        borderRadius: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 4,
    },
    signupContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 20,
    },
    signupText: {
        color: '#6B7280',
        fontSize: 15,
    },
    signupLink: {
        color: '#1976D2',
        fontSize: 15,
        fontWeight: 'bold',
    },
});

export default LoginScreen;
