import React, { useState, useEffect, useRef, useCallback } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    
    Image,
    Dimensions,
    TextInput,
    FlatList,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator,
    Linking,
    StatusBar
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
    ArrowLeft,
    Send,
    Phone,
    MoreVertical,
    Check,
    CheckCheck,
    Paperclip,
    Star,
    ShieldCheck,
    MapPin,
    ChevronDown,
} from 'lucide-react-native';
import { supabase } from '../lib/supabase';

const { width } = Dimensions.get('window');

interface ChatMessage {
    id: string;
    thread_id: string;
    sender_id: string;
    content: string;
    message_type: 'text' | 'image' | 'location' | 'system';
    metadata?: Record<string, any>;
    is_read: boolean;
    created_at: string;
}

const DEMO_PROVIDER = {
    name: 'David Miller',
    avatar: 'https://i.pravatar.cc/100?img=12',
    rating: 4.9,
    status: 'Online',
};

export default function Chat({ navigation, route }: any) {
    const insets = useSafeAreaInsets();
    const bookingId = route?.params?.bookingId;
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [threadId, setThreadId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [showScrollDown, setShowScrollDown] = useState(false);
    const flatListRef = useRef<FlatList>(null);
    const currentUserId = useRef<string>('demo-user');

    useEffect(() => {
        const init = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) currentUserId.current = user.id;

            if (bookingId) {
                const { data: thread } = await supabase
                    .from('chat_threads')
                    .select('id')
                    .eq('booking_id', bookingId)
                    .single();

                if (thread) {
                    setThreadId(thread.id);
                    await loadMessages(thread.id);
                }
            }

            if (!bookingId) {
                loadDemoMessages();
            }

            setIsLoading(false);
        };

        init();
    }, [bookingId]);

    useEffect(() => {
        if (!threadId) return;

        const subscription = supabase
            .channel(`chat:${threadId}`)
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'chat_messages',
                filter: `thread_id=eq.${threadId}`,
            }, (payload: { new: ChatMessage }) => {
                const newMsg = payload.new as ChatMessage;
                setMessages(prev => [...prev, newMsg]);
                if (newMsg.sender_id !== currentUserId.current) {
                    setIsTyping(false);
                }
            })
            .subscribe();

        return () => {
            subscription.unsubscribe();
        };
    }, [threadId]);

    const loadMessages = async (tId: string) => {
        const { data } = await supabase
            .from('chat_messages')
            .select('*')
            .eq('thread_id', tId)
            .order('created_at', { ascending: true })
            .limit(100);

        if (data) setMessages(data);
    };

    const loadDemoMessages = () => {
        const now = new Date();
        const demoMsgs: ChatMessage[] = [
            {
                id: '1', thread_id: 'demo', sender_id: 'provider',
                content: 'Hi! I\'m David, your pet groomer for today. I\'ll be arriving shortly! 🐾',
                message_type: 'system', is_read: true,
                created_at: new Date(now.getTime() - 3600000).toISOString(),
            },
            {
                id: '2', thread_id: 'demo', sender_id: 'provider',
                content: 'I\'m about 10 minutes away. Is Max ready for his spa day?',
                message_type: 'text', is_read: true,
                created_at: new Date(now.getTime() - 1800000).toISOString(),
            },
            {
                id: '3', thread_id: 'demo', sender_id: 'demo-user',
                content: 'Yes! He\'s been excited all morning 😊',
                message_type: 'text', is_read: true,
                created_at: new Date(now.getTime() - 1500000).toISOString(),
            },
            {
                id: '4', thread_id: 'demo', sender_id: 'provider',
                content: 'Great! Does Max have any sensitive areas I should be aware of?',
                message_type: 'text', is_read: true,
                created_at: new Date(now.getTime() - 900000).toISOString(),
            },
            {
                id: '5', thread_id: 'demo', sender_id: 'demo-user',
                content: 'He doesn\'t like his paws being touched too much. Otherwise he\'s very friendly!',
                message_type: 'text', is_read: true,
                created_at: new Date(now.getTime() - 600000).toISOString(),
            },
            {
                id: '6', thread_id: 'demo', sender_id: 'provider',
                content: 'Noted! I\'ll be extra gentle with his paws. I\'m parking now, be there in 2 mins! 🏃‍♂️',
                message_type: 'text', is_read: true,
                created_at: new Date(now.getTime() - 120000).toISOString(),
            },
        ];
        setMessages(demoMsgs);
    };

    const sendMessage = async () => {
        if (!input.trim()) return;
        const content = input.trim();
        setInput('');

        const newMsg: ChatMessage = {
            id: `temp-${Date.now()}`,
            thread_id: threadId || 'demo',
            sender_id: currentUserId.current,
            content,
            message_type: 'text',
            is_read: false,
            created_at: new Date().toISOString(),
        };

        setMessages(prev => [...prev, newMsg]);

        if (threadId) {
            try {
                await supabase.from('chat_messages').insert({
                    thread_id: threadId,
                    sender_id: currentUserId.current,
                    content,
                    message_type: 'text',
                });
            } catch (err) {
                console.error('Failed to send message:', err);
            }
        } else {
            setIsTyping(true);
            setTimeout(() => {
                const replies = [
                    'Got it! Thank you for letting me know 🙏',
                    'Perfect, I\'ll keep that in mind!',
                    'Sounds great! Max is going to love the session today.',
                    'No worries at all! I have plenty of experience with that.',
                    'Absolutely, that\'s very useful information 😊',
                ];
                const reply: ChatMessage = {
                    id: `reply-${Date.now()}`,
                    thread_id: 'demo',
                    sender_id: 'provider',
                    content: replies[Math.floor(Math.random() * replies.length)],
                    message_type: 'text',
                    is_read: false,
                    created_at: new Date().toISOString(),
                };
                setMessages(prev => [...prev, reply]);
                setIsTyping(false);
            }, 1500 + Math.random() * 2000);
        }
    };

    const formatTime = (dateStr: string) => {
        const d = new Date(dateStr);
        return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    };

    const isMyMessage = (msg: ChatMessage) => msg.sender_id === currentUserId.current;

    const renderItem = ({ item }: { item: ChatMessage }) => {
        if (item.message_type === 'system') {
            return (
                <View style={styles.systemMessageContainer}>
                    <View style={styles.systemMessageBubble}>
                        <Text style={styles.systemMessageText}>{item.content}</Text>
                    </View>
                </View>
            );
        }

        const mine = isMyMessage(item);
        return (
            <View style={[styles.messageRow, mine ? styles.myMessageRow : styles.theirMessageRow]}>
                <View style={[styles.messageBubble, mine ? styles.myBubble : styles.theirBubble]}>
                    <Text style={[styles.messageText, mine ? styles.myMessageText : styles.theirMessageText]}>
                        {item.content}
                    </Text>
                </View>
                <View style={[styles.messageMeta, mine ? { alignSelf: 'flex-end' } : { alignSelf: 'flex-start' }]}>
                    <Text style={styles.messageTime}>{formatTime(item.created_at)}</Text>
                    {mine && (
                        item.is_read ? <CheckCheck size={12} color="#14b8a6" /> : <Check size={12} color="#94a3b8" />
                    )}
                </View>
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.container}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
            >
                {/* Header */}
                <View style={[styles.header, { paddingTop: Math.max(insets.top, 20) + 10 }]}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                        <ArrowLeft size={20} color="#0f172a" />
                    </TouchableOpacity>

                    <View style={styles.providerInfo}>
                        <View style={styles.avatarWrapper}>
                            <Image source={{ uri: DEMO_PROVIDER.avatar }} style={styles.avatar} />
                            <View style={styles.onlineDot} />
                        </View>
                        <View>
                            <Text style={styles.providerName}>{DEMO_PROVIDER.name}</Text>
                            <View style={styles.providerSubInfo}>
                                <View style={styles.ratingBox}>
                                    <Star size={10} color="#f97316" fill="#f97316" />
                                    <Text style={styles.ratingText}>{DEMO_PROVIDER.rating}</Text>
                                </View>
                                <Text style={styles.statusText}>{isTyping ? 'Typing...' : DEMO_PROVIDER.status}</Text>
                            </View>
                        </View>
                    </View>

                    <View style={styles.headerActions}>
                        <TouchableOpacity onPress={() => Linking.openURL('tel:9999999999')} style={styles.actionBtn}>
                            <Phone size={18} color="#0f172a" />
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.actionBtn}>
                            <MoreVertical size={18} color="#0f172a" />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Booking Banner */}
                <View style={styles.bookingBanner}>
                    <View style={styles.bannerLeft}>
                        <ShieldCheck size={14} color="#14b8a6" />
                        <Text style={styles.bannerText}>Spa & Grooming • Max</Text>
                    </View>
                    <TouchableOpacity style={styles.trackBtn} onPress={() => navigation.navigate('LiveTracking')}>
                        <MapPin size={12} color="#14b8a6" />
                        <Text style={styles.trackBtnText}>TRACK</Text>
                    </TouchableOpacity>
                </View>

                {/* Message List */}
                <FlatList
                    ref={flatListRef}
                    data={messages}
                    renderItem={renderItem}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.listContent}
                    onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
                    onLayout={() => flatListRef.current?.scrollToEnd({ animated: true })}
                    showsVerticalScrollIndicator={false}
                    ListHeaderComponent={() => (
                        <View style={styles.dateSeparator}>
                            <View style={styles.separatorLine} />
                            <Text style={styles.separatorText}>TODAY</Text>
                            <View style={styles.separatorLine} />
                        </View>
                    )}
                />

                {/* Input Area */}
                <View style={styles.inputArea}>
                    <TouchableOpacity style={styles.attachBtn}>
                        <Paperclip size={20} color="#94a3b8" />
                    </TouchableOpacity>
                    <TextInput
                        style={styles.textInput}
                        placeholder="Type a message..."
                        value={input}
                        onChangeText={setInput}
                        multiline
                        placeholderTextColor="#94a3b8"
                    />
                    <TouchableOpacity
                        style={[styles.sendBtn, !input.trim() && styles.sendBtnDisabled]}
                        disabled={!input.trim()}
                        onPress={sendMessage}
                    >
                        <Send size={18} color="white" />
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: 'white',
    },
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
        gap: 12,
        backgroundColor: 'white',
    },
    backBtn: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: '#f8fafc',
        alignItems: 'center',
        justifyContent: 'center',
    },
    providerInfo: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    avatarWrapper: {
        position: 'relative',
    },
    avatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        borderWidth: 1.5,
        borderColor: 'rgba(20, 184, 166, 0.2)',
    },
    onlineDot: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: '#14b8a6',
        borderWidth: 2,
        borderColor: 'white',
    },
    providerName: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#0f172a',
    },
    providerSubInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    ratingBox: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 2,
    },
    ratingText: {
        fontSize: 10,
        fontWeight: '900',
        color: '#f97316',
    },
    statusText: {
        fontSize: 10,
        fontWeight: 'bold',
        color: '#14b8a6',
        textTransform: 'uppercase',
    },
    headerActions: {
        flexDirection: 'row',
        gap: 8,
    },
    actionBtn: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: '#f8fafc',
        alignItems: 'center',
        justifyContent: 'center',
    },
    bookingBanner: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 8,
        backgroundColor: '#f0fdfa',
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(20, 184, 166, 0.1)',
    },
    bannerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    bannerText: {
        fontSize: 11,
        fontWeight: 'bold',
        color: '#14b8a6',
    },
    trackBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    trackBtnText: {
        fontSize: 10,
        fontWeight: '900',
        color: '#14b8a6',
        letterSpacing: 1,
    },
    listContent: {
        paddingHorizontal: 20,
        paddingBottom: 20,
    },
    dateSeparator: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingVertical: 20,
    },
    separatorLine: {
        flex: 1,
        height: 1,
        backgroundColor: '#f1f5f9',
    },
    separatorText: {
        fontSize: 9,
        fontWeight: '900',
        color: '#94a3b8',
        letterSpacing: 1,
    },
    systemMessageContainer: {
        alignItems: 'center',
        marginVertical: 8,
    },
    systemMessageBubble: {
        backgroundColor: '#f8fafc',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#f1f5f9',
    },
    systemMessageText: {
        fontSize: 10,
        color: '#64748b',
        fontWeight: '500',
        textAlign: 'center',
    },
    messageRow: {
        marginBottom: 16,
        maxWidth: '80%',
    },
    myMessageRow: {
        alignSelf: 'flex-end',
    },
    theirMessageRow: {
        alignSelf: 'flex-start',
    },
    messageBubble: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 20,
    },
    myBubble: {
        backgroundColor: '#14b8a6',
        borderBottomRightRadius: 4,
    },
    theirBubble: {
        backgroundColor: 'white',
        borderBottomLeftRadius: 4,
        borderWidth: 1,
        borderColor: '#f1f5f9',
    },
    messageText: {
        fontSize: 14,
        lineHeight: 20,
    },
    myMessageText: {
        color: 'white',
    },
    theirMessageText: {
        color: '#0f172a',
    },
    messageMeta: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginTop: 4,
        paddingHorizontal: 4,
    },
    messageTime: {
        fontSize: 10,
        color: '#94a3b8',
        fontWeight: '500',
    },
    inputArea: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: 'white',
        borderTopWidth: 1,
        borderTopColor: '#f1f5f9',
        gap: 12,
    },
    attachBtn: {
        width: 44,
        height: 44,
        borderRadius: 14,
        backgroundColor: '#f8fafc',
        alignItems: 'center',
        justifyContent: 'center',
    },
    textInput: {
        flex: 1,
        backgroundColor: '#f8fafc',
        borderRadius: 20,
        paddingHorizontal: 16,
        paddingVertical: 10,
        maxHeight: 100,
        fontSize: 14,
        color: '#0f172a',
    },
    sendBtn: {
        width: 44,
        height: 44,
        borderRadius: 14,
        backgroundColor: '#14b8a6',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#14b8a6',
        shadowOpacity: 0.2,
        shadowOffset: { width: 0, height: 4 },
    },
    sendBtnDisabled: {
        backgroundColor: '#f1f5f9',
        shadowOpacity: 0,
    },
});
