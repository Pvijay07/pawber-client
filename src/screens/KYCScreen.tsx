import React, { useState, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    SafeAreaView,
    Image,
    Alert,
    ActivityIndicator,
    Dimensions,
} from 'react-native';
import { Camera, CameraView } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { 
    ChevronLeft, 
    Camera as CameraIcon, 
    Upload, 
    CheckCircle, 
    ShieldCheck, 
    AlertCircle,
    User,
    FileText,
    RefreshCcw,
} from 'lucide-react-native';
import { useTheme } from '../theme/ThemeContext';
import { providersApi } from '../services/providers.service';

const { width } = Dimensions.get('window');

export default function KYCScreen({ navigation }: any) {
    const insets = useSafeAreaInsets();
    const { colors, isDark } = useTheme();
    
    const [step, setStep] = useState<1 | 2>(1); // 1: Selfie, 2: Document
    const [isCameraActive, setIsCameraActive] = useState(false);
    const [selfie, setSelfie] = useState<string | null>(null);
    const [docImage, setDocImage] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    const cameraRef = useRef<any>(null);

    const takeSelfie = async () => {
        if (cameraRef.current) {
            try {
                const photo = await cameraRef.current.takePictureAsync();
                setSelfie(photo.uri);
                setIsCameraActive(false);
            } catch (error) {
                Alert.alert('Error', 'Failed to capture selfie');
            }
        }
    };

    const pickDocument = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            quality: 0.8,
        });

        if (!result.canceled) {
            setDocImage(result.assets[0].uri);
        }
    };

    const handleSubmit = async () => {
        if (!selfie || !docImage) {
            Alert.alert('Incomplete', 'Please provide both selfie and document image.');
            return;
        }

        setIsSubmitting(true);
        try {
            // In a real app, upload these to Supabase Storage first
            // For now, we simulate the submission
            const res = await providersApi.uploadDocument({
                document_type: 'identity_verification',
                file_url: docImage, // Placeholder
            });

            if (res.success) {
                Alert.alert(
                    'Verification Submitted',
                    'Your documents are being verified. We will notify you once approved.',
                    [{ text: 'OK', onPress: () => navigation.goBack() }]
                );
            }
        } catch (error) {
            Alert.alert('Error', 'Failed to submit verification.');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isCameraActive) {
        return (
            <View style={styles.cameraContainer}>
                <CameraView
                    ref={cameraRef}
                    style={StyleSheet.absoluteFill}
                    facing="front"
                />
                <View style={styles.cameraOverlay}>
                    <View style={styles.faceHole} />
                    <Text style={styles.cameraHint}>Position your face within the frame</Text>
                </View>
                <TouchableOpacity style={styles.captureBtn} onPress={takeSelfie}>
                    <View style={styles.captureBtnInner} />
                </TouchableOpacity>
                <TouchableOpacity 
                    style={StyleSheet.flatten([styles.closeCamera, { top: insets.top + 20 }])} 
                    onPress={() => setIsCameraActive(false)}
                >
                    <ChevronLeft size={30} color="white" />
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <SafeAreaView style={StyleSheet.flatten([styles.safeArea, { backgroundColor: colors.background }])}>
            <View style={styles.container}>
                {/* Header */}
                <View style={StyleSheet.flatten([styles.header, { paddingTop: Math.max(insets.top, 16) }])}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={StyleSheet.flatten([styles.backBtn, { backgroundColor: colors.surface }])}>
                        <ChevronLeft size={24} color={colors.text} />
                    </TouchableOpacity>
                    <Text style={StyleSheet.flatten([styles.headerTitle, { color: colors.text }])}>Identity Verification</Text>
                </View>

                <ScrollView contentContainerStyle={styles.scrollContent}>
                    {/* Progress Indicator */}
                    <View style={styles.progressRow}>
                        <View style={StyleSheet.flatten([styles.progressStep, { backgroundColor: colors.primary }])}>
                            <Text style={styles.progressStepText}>1</Text>
                        </View>
                        <View style={StyleSheet.flatten([styles.progressLine, { backgroundColor: step >= 2 ? colors.primary : colors.border }])} />
                        <View style={StyleSheet.flatten([styles.progressStep, { backgroundColor: step >= 2 ? colors.primary : colors.surface }])}>
                            <Text style={StyleSheet.flatten([styles.progressStepText, { color: step >= 2 ? 'white' : colors.textSecondary }])}>2</Text>
                        </View>
                    </View>

                    <View style={styles.infoBox}>
                        <ShieldCheck size={24} color={colors.primary} />
                        <Text style={StyleSheet.flatten([styles.infoText, { color: colors.textSecondary }])}>
                            Verification helps build trust with clients and secures your provider status.
                        </Text>
                    </View>

                    {step === 1 ? (
                        <View style={styles.stepContainer}>
                            <Text style={StyleSheet.flatten([styles.stepTitle, { color: colors.text }])}>Take a Live Selfie</Text>
                            <Text style={StyleSheet.flatten([styles.stepDesc, { color: colors.textSecondary }])}>
                                Make sure your face is clearly visible and well-lit.
                            </Text>

                            <TouchableOpacity 
                                style={StyleSheet.flatten([styles.uploadBox, selfie && { borderColor: colors.primary, backgroundColor: colors.primaryLight }])}
                                onPress={() => setIsCameraActive(true)}
                            >
                                {selfie ? (
                                    <Image source={{ uri: selfie }} style={styles.previewImage} />
                                ) : (
                                    <>
                                        <CameraIcon size={40} color={colors.primary} />
                                        <Text style={StyleSheet.flatten([styles.uploadText, { color: colors.primary }])}>Capture Live Photo</Text>
                                    </>
                                )}
                            </TouchableOpacity>

                            {selfie && (
                                <TouchableOpacity style={styles.retryBtn} onPress={() => setIsCameraActive(true)}>
                                    <RefreshCcw size={16} color={colors.textSecondary} />
                                    <Text style={StyleSheet.flatten([styles.retryText, { color: colors.textSecondary }])}>Retake Photo</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    ) : (
                        <View style={styles.stepContainer}>
                            <Text style={StyleSheet.flatten([styles.stepTitle, { color: colors.text }])}>Upload Identity Proof</Text>
                            <Text style={StyleSheet.flatten([styles.stepDesc, { color: colors.textSecondary }])}>
                                Upload a clear photo of your Govt. ID (Aadhar, PAN, or DL).
                            </Text>

                            <TouchableOpacity 
                                style={StyleSheet.flatten([styles.uploadBox, docImage && { borderColor: colors.primary, backgroundColor: colors.primaryLight }])}
                                onPress={pickDocument}
                            >
                                {docImage ? (
                                    <Image source={{ uri: docImage }} style={styles.previewImage} />
                                ) : (
                                    <>
                                        <FileText size={40} color={colors.primary} />
                                        <Text style={StyleSheet.flatten([styles.uploadText, { color: colors.primary }])}>Select ID Document</Text>
                                    </>
                                )}
                            </TouchableOpacity>

                            {docImage && (
                                <TouchableOpacity style={styles.retryBtn} onPress={pickDocument}>
                                    <Upload size={16} color={colors.textSecondary} />
                                    <Text style={StyleSheet.flatten([styles.retryText, { color: colors.textSecondary }])}>Change Document</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    )}
                </ScrollView>

                <View style={StyleSheet.flatten([styles.footer, { paddingBottom: Math.max(insets.bottom, 16) + 10 }])}>
                    {step === 1 ? (
                        <TouchableOpacity 
                            style={StyleSheet.flatten([styles.primaryBtn, !selfie && styles.disabledBtn, { backgroundColor: colors.primary }])}
                            disabled={!selfie}
                            onPress={() => setStep(2)}
                        >
                            <Text style={styles.primaryBtnText}>NEXT STEP</Text>
                        </TouchableOpacity>
                    ) : (
                        <View style={styles.footerBtns}>
                            <TouchableOpacity style={StyleSheet.flatten([styles.secondaryBtn, { backgroundColor: colors.surface }])} onPress={() => setStep(1)}>
                                <Text style={StyleSheet.flatten([styles.secondaryBtnText, { color: colors.text }])}>BACK</Text>
                            </TouchableOpacity>
                            <TouchableOpacity 
                                style={StyleSheet.flatten([styles.primaryBtn, { flex: 2, backgroundColor: colors.primary }, (!docImage || isSubmitting) && styles.disabledBtn])}
                                disabled={!docImage || isSubmitting}
                                onPress={handleSubmit}
                            >
                                {isSubmitting ? (
                                    <ActivityIndicator color="white" />
                                ) : (
                                    <Text style={styles.primaryBtnText}>SUBMIT FOR KYC</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    )}
                </View>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1 },
    container: { flex: 1 },
    header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 24, paddingBottom: 16, gap: 16 },
    backBtn: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
    headerTitle: { fontSize: 20, fontWeight: 'bold' },
    scrollContent: { paddingHorizontal: 24, paddingTop: 24 },
    progressRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 32 },
    progressStep: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
    progressStepText: { fontWeight: 'bold', color: 'white' },
    progressLine: { width: 60, height: 2, marginHorizontal: 8 },
    infoBox: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, borderRadius: 16, backgroundColor: 'rgba(20, 184, 166, 0.05)', marginBottom: 32 },
    infoText: { flex: 1, fontSize: 13, lineHeight: 18, fontWeight: '500' },
    stepContainer: { alignItems: 'center' },
    stepTitle: { fontSize: 22, fontWeight: 'bold', marginBottom: 8 },
    stepDesc: { fontSize: 14, textAlign: 'center', marginBottom: 32, lineHeight: 20 },
    uploadBox: { width: '100%', aspectRatio: 4/3, borderRadius: 24, borderStyle: 'dashed', borderWidth: 2, borderColor: '#cbd5e1', alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFF9F5', overflow: 'hidden' },
    uploadText: { marginTop: 12, fontWeight: 'bold', fontSize: 14 },
    previewImage: { width: '100%', height: '100%' },
    retryBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 16 },
    retryText: { fontSize: 13, fontWeight: 'bold' },
    footer: { paddingHorizontal: 24, paddingTop: 16 },
    primaryBtn: { height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
    primaryBtnText: { color: 'white', fontWeight: 'bold', letterSpacing: 1 },
    disabledBtn: { opacity: 0.5 },
    footerBtns: { flexDirection: 'row', gap: 12 },
    secondaryBtn: { height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center', flex: 1 },
    secondaryBtnText: { fontWeight: 'bold' },
    cameraContainer: { flex: 1, backgroundColor: 'black' },
    cameraOverlay: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.5)' },
    faceHole: { width: width * 0.7, aspectRatio: 1, borderRadius: width * 0.5, borderWidth: 2, borderColor: 'white', borderStyle: 'dashed' },
    cameraHint: { color: 'white', marginTop: 32, fontWeight: 'bold' },
    captureBtn: { position: 'absolute', bottom: 60, alignSelf: 'center', width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(255,255,255,0.3)', alignItems: 'center', justifyContent: 'center' },
    captureBtnInner: { width: 64, height: 64, borderRadius: 32, backgroundColor: 'white' },
    closeCamera: { position: 'absolute', left: 24 },
});
