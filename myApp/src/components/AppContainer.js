import React from "react";
import { 
    StyleSheet, 
    KeyboardAvoidingView, 
    Platform, 
    TouchableWithoutFeedback, 
    Keyboard,
    View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import COLORS from "../utils/colors";

export default function AppContainer({ 
    children, 
    style, 
    edges, 
    useKeyboardAvoidingView = true, 
    dismissKeyboard = false 
}) {
    let content = (
        <SafeAreaView style={[styles.container, style]} edges={edges}>
            {children}
        </SafeAreaView>
    );

    if (useKeyboardAvoidingView) {
        content = (
            <KeyboardAvoidingView 
                style={styles.keyboardAvoidingView} 
                behavior={Platform.OS === "ios" ? "padding" : undefined}
            >
                {content}
            </KeyboardAvoidingView>
        );
    }

    if (dismissKeyboard) {
        content = (
            <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
                <View style={styles.flexOne}>{content}</View>
            </TouchableWithoutFeedback>
        );
    }
    
    return content;
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    keyboardAvoidingView: {
        flex: 1,
    },
    flexOne: {
        flex: 1,
    }
});