import React, { useState, useEffect, useRef } from 'react';
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
} from 'lucide-react-native';
import { supabase } from '../lib/supabase';
import { useTheme } from '../theme/ThemeContext';
import { api } from '../services/api';
import { useSocket } from '../hooks/useSocket';
import { useAlert } from '../components/CustomAlertModal';

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
    const { colors, isDark } = useTheme();
    const { showError } = useAlert();
    const insets = useSafeAreaInsets();
    const bookingId = route?.params?.bookingId;
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [threadId, setThreadId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const flatListRef = useRef<FlatList>(null);
    const currentUserId = useRef<string>('demo-user');

    const initialName = route?.params?.providerName || route?.params?.provider?.business_name || route?.params?.provider?.provider_name || 'Pawber Specialist';
    const [recipient, setRecipient] = useState<any>({
        name: initialName,
        avatar: route?.params?.provider?.provider_image || 'https://i.pravatar.cc/100?img=12',
        rating: 4.9,
        status: 'Online'
    });

    useEffect(() => {
        const init = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) currentUserId.current = user.id;

            const passedThreadId = route?.params?.threadId;
            const providerUserId = route?.params?.providerUserId;
            let finalThreadId = passedThreadId;

            if (!finalThreadId && bookingId) {
                let query = supabase
                    .from('chat_threads')
                    .select('id')
                    .eq('booking_id', bookingId);
                
                if (providerUserId) {
                    query = query.eq('provider_user_id', providerUserId);
                }

                const { data: thread } = await query.maybeSingle();
                if (thread) {
                    finalThreadId = thread.id;
                } else {
                    try {
                        const res: any = await api.post('/chat/threads', {
                            booking_id: bookingId,
                            provider_user_id: providerUserId
                        });
                        const createdThreadId = res?.data?.thread?.id || res?.thread?.id || res?.data?.id || res?.id;
                        if (createdThreadId) {
                            finalThreadId = createdThreadId;
                        }
                    } catch (e) {
                        console.error('Failed to auto-create thread:', e);
                    }
                }
            }

            if (finalThreadId) {
                setThreadId(finalThreadId);
                await loadMessages(finalThreadId);

                // Fetch details of the thread to identify other participant
                const { data: threadDetails } = await supabase
                    .from('chat_threads')
                    .select('client_id, provider_user_id')
                    .eq('id', finalThreadId)
                    .single();

                if (threadDetails) {
                    const otherUserId = currentUserId.current === threadDetails.client_id
                        ? threadDetails.provider_user_id
                        : threadDetails.client_id;

                    if (otherUserId) {
                        const { data: profile } = await supabase
                            .from('profiles')
                            .select('full_name, avatar_url')
                            .eq('id', otherUserId)
                            .maybeSingle();

                        const { data: providerData } = await supabase
                            .from('providers')
                            .select('business_name, rating')
                            .eq('user_id', otherUserId)
                            .maybeSingle();

                        let rating = 4.9;
                        if (providerData?.rating) {
                            rating = parseFloat(providerData.rating);
                        }

                        const finalName = providerData?.business_name || profile?.full_name || initialName;
                        setRecipient({
                            name: finalName,
                            avatar: profile?.avatar_url || 'https://i.pravatar.cc/100?img=12',
                            rating: rating,
                            status: 'Online'
                        });
                    }
                }
            }

            if (!passedThreadId && !bookingId) {
                loadDemoMessages();
                setRecipient(DEMO_PROVIDER);
            }

            setIsLoading(false);
        };

        init();
    }, [bookingId, route?.params?.threadId, route?.params?.providerUserId]);

    const { socket, isConnected, emit, on } = useSocket();
    const typingTimeoutRef = useRef<any>(null);

    useEffect(() => {
        if (!threadId) return;

        // Join socket room for instant delivery
        if (isConnected) {
            emit('join_chat', threadId);
        }

        // Listen to Socket.IO events
        const unsubNewMsg = on('new_message', (newMsg: ChatMessage) => {
            setMessages(prev => {
                if (prev.some(m => m.id === newMsg.id)) return prev;
                return [...prev, newMsg];
            });
            if (newMsg.sender_id !== currentUserId.current) {
                setIsTyping(false);
            }
        });

        const unsubTypingStart = on('typing_start', (data: any) => {
            if (data.threadId === threadId && data.userId !== currentUserId.current) {
                setIsTyping(true);
            }
        });

        const unsubTypingStop = on('typing_stop', (data: any) => {
            if (data.threadId === threadId && data.userId !== currentUserId.current) {
                setIsTyping(false);
            }
        });

        // Supabase realtime fallback
        const subscription = supabase
            .channel(`chat:${threadId}`)
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'chat_messages',
                filter: `thread_id=eq.${threadId}`,
            }, (payload: { new: ChatMessage }) => {
                const newMsg = payload.new as ChatMessage;
                setMessages(prev => {
                    if (prev.some(m => m.id === newMsg.id)) return prev;
                    return [...prev, newMsg];
                });
                if (newMsg.sender_id !== currentUserId.current) {
                    setIsTyping(false);
                }
            })
            .subscribe();

        return () => {
            if (isConnected) {
                emit('leave_chat', threadId);
            }
            unsubNewMsg();
            unsubTypingStart();
            unsubTypingStop();
            subscription.unsubscribe();
        };
    }, [threadId, isConnected]);

    const handleInputChange = (text: string) => {
        setInput(text);
        if (threadId && isConnected) {
            emit('typing_start', { threadId });
            if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
            typingTimeoutRef.current = setTimeout(() => {
                emit('typing_stop', { threadId });
            }, 2000);
        }
    };

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

        if (threadId) {
            try {
                const res: any = await api.post(`/chat/threads/${threadId}/messages`, {
                    content,
                    message_type: 'text',
                });
                if (res && res.success === false) {
                    showError('Safety Notice 🛡️', res.error?.message || 'For your safety, personal contact details cannot be shared. Please continue chatting through Pawber.');
                    setInput(content);
                }
            } catch (err: any) {
                console.error('Failed to send message:', err);
                showError('Error', err.message || 'Failed to send message');
            }
        } else {
            const newMsg: ChatMessage = {
                id: `temp-${Date.now()}`,
                thread_id: 'demo',
                sender_id: currentUserId.current,
                content,
                message_type: 'text',
                is_read: false,
                created_at: new Date().toISOString(),
            };

            setMessages(prev => [...prev, newMsg]);
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
                    <View style={[styles.systemMessageBubble, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}>
                        <Text style={[styles.systemMessageText, { color: colors.textSecondary }]}>{item.content}</Text>
                    </View>
                </View>
            );
        }

        const mine = isMyMessage(item);
        return (
            <View style={[styles.messageRow, mine ? styles.myMessageRow : styles.theirMessageRow]}>
                <View style={[
                    styles.messageBubble,
                    mine ? styles.myBubble : styles.theirBubble,
                    mine ? { backgroundColor: colors.accent } : { backgroundColor: colors.surface, borderColor: colors.border }
                ]}>
                    <Text style={[
                        styles.messageText,
                        mine ? styles.myMessageText : styles.theirMessageText,
                        !mine && { color: colors.text }
                    ]}>
                        {item.content}
                    </Text>
                </View>
                <View style={[styles.messageMeta, mine ? { alignSelf: 'flex-end' } : { alignSelf: 'flex-start' }]}>
                    <Text style={[styles.messageTime, { color: colors.textMuted }]}>{formatTime(item.created_at)}</Text>
                    {mine && (
                        item.is_read ? <CheckCheck size={12} color={colors.accent} /> : <Check size={12} color={colors.textMuted} />
                    )}
                </View>
            </View>
        );
    };

    return (
        <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.container}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
            >
                {/* Header */}
                <View style={[styles.header, { paddingTop: Math.max(insets.top, 20) + 10, backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={[styles.backBtn, { backgroundColor: colors.background }]}>
                        <ArrowLeft size={20} color={colors.text} />
                    </TouchableOpacity>

                    <View style={styles.providerInfo}>
                        <View style={styles.avatarWrapper}>
                            <Image source={{ uri: recipient?.avatar || 'https://i.pravatar.cc/100' }} style={styles.avatar} />
                            <View style={[styles.onlineDot, { borderColor: colors.surface }]} />
                        </View>
                        <View>
                            <Text style={[styles.providerName, { color: colors.text }]}>{recipient?.name || 'Loading...'}</Text>
                            <View style={styles.providerSubInfo}>
                                <View style={styles.ratingBox}>
                                    <Star size={10} color={colors.primary} fill={colors.primary} />
                                    <Text style={[styles.ratingText, { color: colors.primary }]}>{recipient?.rating?.toFixed(1) || '4.9'}</Text>
                                </View>
                                <Text style={[styles.statusText, { color: colors.accent }]}>{isTyping ? 'Typing...' : (recipient?.status || 'Online')}</Text>
                            </View>
                        </View>
                    </View>

                    <View style={styles.headerActions}>
                        <TouchableOpacity onPress={() => Linking.openURL('tel:9999999999')} style={[styles.actionBtn, { backgroundColor: colors.background }]}>
                            <Phone size={18} color={colors.text} />
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.actionBtn, { backgroundColor: colors.background }]}>
                            <MoreVertical size={18} color={colors.text} />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Booking Banner */}
                <View style={[styles.bookingBanner, { backgroundColor: colors.accentLight, borderBottomColor: colors.border }]}>
                    <View style={styles.bannerLeft}>
                        <ShieldCheck size={14} color={colors.accent} />
                        <Text style={[styles.bannerText, { color: colors.accent }]}>Spa & Grooming • Max</Text>
                    </View>
                    <TouchableOpacity style={styles.trackBtn} onPress={() => navigation.navigate('LiveTracking')}>
                        <MapPin size={12} color={colors.accent} />
                        <Text style={[styles.trackBtnText, { color: colors.accent }]}>TRACK</Text>
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
                            <View style={[styles.separatorLine, { backgroundColor: colors.border }]} />
                            <Text style={[styles.separatorText, { color: colors.textMuted }]}>TODAY</Text>
                            <View style={[styles.separatorLine, { backgroundColor: colors.border }]} />
                        </View>
                    )}
                />

                {/* Input Area */}
                <View style={[styles.inputArea, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
                    <TextInput
                        style={[styles.textInput, { backgroundColor: colors.background, color: colors.text }]}
                        placeholder="Type a message..."
                        value={input}
                        onChangeText={handleInputChange}
                        multiline
                        placeholderTextColor={colors.textMuted}
                    />
                    <TouchableOpacity
                        style={[styles.sendBtn, { backgroundColor: colors.accent, shadowColor: colors.accent }, !input.trim() && { backgroundColor: colors.border, shadowOpacity: 0 }]}
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
        gap: 12,
    },
    backBtn: {
        width: 40,
        height: 40,
        borderRadius: 12,
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
    },
    providerName: {
        fontSize: 14,
        fontWeight: 'bold',
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
    },
    statusText: {
        fontSize: 10,
        fontWeight: 'bold',
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
        alignItems: 'center',
        justifyContent: 'center',
    },
    bookingBanner: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 8,
        borderBottomWidth: 1,
    },
    bannerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    bannerText: {
        fontSize: 11,
        fontWeight: 'bold',
    },
    trackBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    trackBtnText: {
        fontSize: 10,
        fontWeight: '900',
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
    },
    separatorText: {
        fontSize: 9,
        fontWeight: '900',
        letterSpacing: 1,
    },
    systemMessageContainer: {
        alignItems: 'center',
        marginVertical: 8,
    },
    systemMessageBubble: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 12,
        borderWidth: 1,
    },
    systemMessageText: {
        fontSize: 10,
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
        borderBottomRightRadius: 4,
    },
    theirBubble: {
        borderBottomLeftRadius: 4,
        borderWidth: 1,
    },
    messageText: {
        fontSize: 14,
        lineHeight: 20,
    },
    myMessageText: {
        color: 'white',
    },
    theirMessageText: {
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
        fontWeight: '500',
    },
    inputArea: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        gap: 12,
    },
    attachBtn: {
        width: 44,
        height: 44,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
    },
    textInput: {
        flex: 1,
        borderRadius: 20,
        paddingHorizontal: 16,
        paddingVertical: 10,
        maxHeight: 100,
        fontSize: 14,
    },
    sendBtn: {
        width: 44,
        height: 44,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
        shadowOpacity: 0.2,
        shadowOffset: { width: 0, height: 4 },
    },
});
