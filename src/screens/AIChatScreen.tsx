import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    FlatList,
    KeyboardAvoidingView,
    Platform,
    SafeAreaView,
    ActivityIndicator,
    Image,
    Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Send, ArrowLeft, Bot, User, Sparkles, ChevronRight, MessageSquare } from 'lucide-react-native';
import { aiApi } from '../services/ai.service';
import { useTheme } from '../theme/ThemeContext';

const { width } = Dimensions.get('window');

interface Message {
    id: string;
    text: string;
    sender: 'user' | 'ai';
    timestamp: Date;
    suggestions?: string[];
}

export default function AIChatScreen({ navigation }: any) {
    const insets = useSafeAreaInsets();
    const { colors, isDark } = useTheme();
    const [messages, setMessages] = useState<Message[]>([
        {
            id: '1',
            text: "Hello! I'm your Pawber Concierge. How can I help you and your pet today? ✨",
            sender: 'ai',
            timestamp: new Date(),
            suggestions: ["Book a Grooming", "Check my points", "Refer a friend"]
        }
    ]);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const flatListRef = useRef<FlatList>(null);

    const handleSend = async (text: string) => {
        if (!text.trim()) return;

        const userMsg: Message = {
            id: Date.now().toString(),
            text,
            sender: 'user',
            timestamp: new Date()
        };

        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setIsTyping(true);

        try {
            const response = await aiApi.chat(text);
            if (response.success && response.data) {
                const aiMsg: Message = {
                    id: (Date.now() + 1).toString(),
                    text: response.data.message,
                    sender: 'ai',
                    timestamp: new Date(response.data.timestamp),
                    suggestions: response.data.suggestions
                };
                setMessages(prev => [...prev, aiMsg]);
            }
        } catch (error) {
            console.error('Chat error:', error);
        } finally {
            setIsTyping(false);
        }
    };

    const renderMessage = ({ item }: { item: Message }) => (
        <View style={[
            styles.messageWrapper,
            item.sender === 'user' ? styles.userMessageWrapper : styles.aiMessageWrapper
        ]}>
            {item.sender === 'ai' && (
                <View style={styles.aiAvatar}>
                    <Bot size={16} color="white" />
                </View>
            )}
            <View style={[
                styles.messageBubble,
                item.sender === 'user' ? styles.userBubble : styles.aiBubble
            ]}>
                <Text style={[
                    styles.messageText,
                    item.sender === 'user' ? styles.userText : styles.aiText
                ]}>
                    {item.text}
                </Text>
            </View>
        </View>
    );

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={[styles.header, { paddingTop: Math.max(insets.top, 16), backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={[styles.backBtn, { backgroundColor: colors.surfaceSecondary }]}>
                    <ArrowLeft size={24} color={colors.text} />
                </TouchableOpacity>
                <View style={styles.headerInfo}>
                    <View style={styles.aiStatusIcon}>
                        <Bot size={18} color="white" />
                    </View>
                    <View>
                        <Text style={[styles.headerTitle, { color: colors.text }]}>Pet Concierge</Text>
                        <Text style={[styles.headerSubtitle, { color: colors.primary }]}>AI Support • Online</Text>
                    </View>
                </View>
            </View>

            <FlatList
                ref={flatListRef}
                data={messages}
                renderItem={renderMessage}
                keyExtractor={item => item.id}
                contentContainerStyle={styles.listContent}
                onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
            />

            {isTyping && (
                <View style={styles.typingIndicator}>
                    <ActivityIndicator size="small" color="#14b8a6" />
                    <Text style={styles.typingText}>Concierge is thinking...</Text>
                </View>
            )}

            {/* Suggestions */}
            {messages[messages.length - 1]?.sender === 'ai' && messages[messages.length - 1]?.suggestions && (
                <View style={[styles.suggestionsContainer, { backgroundColor: 'transparent' }]}>
                    <FlatList
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        data={messages[messages.length - 1].suggestions}
                        renderItem={({ item }) => (
                            <TouchableOpacity style={[styles.suggestionBtn, { backgroundColor: colors.surface, borderColor: colors.primary }]} onPress={() => handleSend(item)}>
                                <Text style={[styles.suggestionText, { color: colors.primary }]}>{item}</Text>
                                <ChevronRight size={14} color={colors.primary} />
                            </TouchableOpacity>
                        )}
                        keyExtractor={item => item}
                        contentContainerStyle={styles.suggestionsList}
                    />
                </View>
            )}

            <KeyboardAvoidingView 
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
            >
                <View style={[styles.inputContainer, { paddingBottom: Math.max(insets.bottom, 16) + 8, backgroundColor: colors.surface, borderTopColor: colors.border }]}>
                    <View style={[styles.inputWrapper, { backgroundColor: colors.background, borderColor: colors.border }]}>
                        <TextInput
                            style={[styles.input, { maxHeight: 100, color: colors.text }]}
                            placeholder="Ask me anything about your pets..."
                            value={input}
                            onChangeText={setInput}
                            multiline
                            placeholderTextColor={colors.textMuted}
                        />
                        <TouchableOpacity 
                            style={[styles.sendBtn, !input.trim() && styles.sendBtnDisabled, { backgroundColor: colors.primary }]} 
                            onPress={() => handleSend(input)}
                            disabled={!input.trim()}
                        >
                            <Send size={20} color="white" />
                        </TouchableOpacity>
                    </View>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8fafc' },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingBottom: 16,
        backgroundColor: 'white',
        borderBottomWidth: 1,
        borderColor: '#f1f5f9',
    },
    backBtn: { marginRight: 16, width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f1f5f9' },
    headerInfo: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    aiStatusIcon: { width: 32, height: 32, borderRadius: 10, backgroundColor: '#8b5cf6', alignItems: 'center', justifyContent: 'center' },
    headerTitle: { fontSize: 16, fontWeight: '900', color: '#0f172a' },
    headerSubtitle: { fontSize: 10, fontWeight: '700', color: '#14b8a6', letterSpacing: 0.5 },
    listContent: { padding: 24, paddingBottom: 100 },
    messageWrapper: { marginBottom: 20, flexDirection: 'row', alignItems: 'flex-end', gap: 10 },
    userMessageWrapper: { justifyContent: 'flex-end' },
    aiMessageWrapper: { justifyContent: 'flex-start' },
    aiAvatar: { width: 32, height: 32, borderRadius: 12, backgroundColor: '#0f172a', alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
    messageBubble: { padding: 16, borderRadius: 24, maxWidth: width * 0.75 },
    userBubble: { backgroundColor: '#0f172a', borderBottomRightRadius: 4 },
    aiBubble: { borderBottomLeftRadius: 4, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, elevation: 1 },
    messageText: { fontSize: 14, lineHeight: 20, fontWeight: '600' },
    userText: { color: 'white' },
    aiText: { color: '#0f172a' },
    typingIndicator: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 24, marginBottom: 16 },
    typingText: { fontSize: 12, color: '#64748b', fontWeight: '800' },
    suggestionsContainer: { position: 'absolute', bottom: 100, width: '100%', backgroundColor: 'transparent' },
    suggestionsList: { paddingHorizontal: 24, paddingBottom: 16, gap: 10 },
    suggestionBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'white', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 16, borderWidth: 1, borderColor: '#14b8a6', shadowColor: '#14b8a6', shadowOpacity: 0.05, shadowRadius: 10 },
    suggestionText: { fontSize: 12, fontWeight: '800', color: '#14b8a6' },
    inputContainer: { paddingHorizontal: 24, paddingTop: 12, backgroundColor: 'white', borderTopWidth: 1, borderColor: '#f1f5f9' },
    inputWrapper: { flexDirection: 'row', alignItems: 'flex-end', gap: 12, backgroundColor: '#f8fafc', borderRadius: 24, paddingHorizontal: 16, paddingVertical: 8, borderWidth: 1.5, borderColor: '#f1f5f9' },
    input: { flex: 1, paddingTop: 8, paddingBottom: 8, fontSize: 14, color: '#0f172a', fontWeight: '600' },
    sendBtn: { width: 44, height: 44, borderRadius: 16, backgroundColor: '#14b8a6', alignItems: 'center', justifyContent: 'center' },
    sendBtnDisabled: { backgroundColor: '#cbd5e1' },
});
