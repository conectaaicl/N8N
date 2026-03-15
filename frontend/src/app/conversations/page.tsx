"use client";

import React, { useState, useEffect } from "react";
import { MessageSquare, Send, Phone, User, Search, Filter, MoreVertical, Smartphone } from "lucide-react";
import { useBranding } from "@/components/providers/BrandingProvider";
import api from "@/lib/api";

export default function ConversationsPage() {
    const { branding } = useBranding();
    const [conversations, setConversations] = useState<any[]>([]);
    const [selectedId, setSelectedId] = useState<number | null>(null);
    const [messages, setMessages] = useState<any[]>([]);
    const [newMessage, setNewMessage] = useState("");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchConversations = async () => {
            try {
                const res = await api.get("/conversations/");
                setConversations(res.data);
                if (res.data.length > 0 && !selectedId) {
                    setSelectedId(res.data[0].id);
                }
            } catch (err) {
                console.error("Fetch convs failed", err);
            } finally {
                setLoading(false);
            }
        };
        fetchConversations();
    }, []);

    useEffect(() => {
        if (!selectedId) return;
        const fetchMessages = async () => {
            try {
                const res = await api.get(`/conversations/${selectedId}/messages`);
                setMessages(res.data);
            } catch (err) {
                console.error("Fetch msgs failed", err);
            }
        };
        fetchMessages();
        // Setup polling or websocket for real-time
        const interval = setInterval(fetchMessages, 5000);
        return () => clearInterval(interval);
    }, [selectedId]);

    const handleSendMessage = async () => {
        if (!newMessage.trim() || !selectedId) return;
        try {
            await api.post(`/conversations/${selectedId}/send`, { content: newMessage });
            setNewMessage("");
            // Refresh messages
            const res = await api.get(`/conversations/${selectedId}/messages`);
            setMessages(res.data);
        } catch (err) {
            console.error("Send failed", err);
        }
    };

    const selectedConv = conversations.find(c => c.id === selectedId);

    return (
        <div className="flex h-full bg-background overflow-hidden max-w-[1600px] mx-auto w-full shadow-2xl">
            {/* List Sidebar */}
            <div className="w-80 border-r border-border bg-card/20 flex flex-col">
                <div className="p-4 border-b border-border space-y-4">
                    <h2 className="text-xl font-bold">Conversations</h2>
                    <div className="relative">
                        <Search className="absolute left-3 top-2.5 text-foreground/30" size={16} />
                        <input
                            type="text"
                            placeholder="Search chats..."
                            className="w-full bg-white/5 border border-border rounded-lg pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                        />
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto">
                    {conversations.map((conv) => (
                        <div
                            key={conv.id}
                            onClick={() => setSelectedId(conv.id)}
                            className={`p-4 border-b border-white/5 cursor-pointer transition-colors ${selectedId === conv.id ? "bg-primary/10 border-r-2 border-r-primary" : "hover:bg-white/5"
                                }`}
                        >
                            <div className="flex justify-between items-start mb-1">
                                <div className="flex items-center gap-2">
                                    <span className="font-semibold text-sm truncate">{conv.contact.name}</span>
                                    {conv.contact.lead_score > 70 && (
                                        <span className="px-1.5 py-0.5 rounded text-[8px] bg-red-500/20 text-red-500 font-bold uppercase">Hot</span>
                                    )}
                                </div>
                                <span className="text-[10px] text-foreground/30">
                                    {new Date(conv.updated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className={`w-2 h-2 rounded-full ${conv.channel === 'whatsapp' ? 'bg-emerald-500' : 'bg-blue-500'}`} />
                                <p className="text-xs text-foreground/50 truncate flex-1">{conv.last_message || "No messages yet"}</p>
                                {conv.contact.intent && (
                                    <span className="text-[9px] text-primary/70 italic truncate max-w-[60px]">{conv.contact.intent}</span>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 flex flex-col relative">
                {selectedConv ? (
                    <>
                        {/* Chat Header */}
                        <div className="p-4 border-b border-border bg-card/30 backdrop-blur-md flex justify-between items-center">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center font-bold">
                                    {selectedConv.contact.name.charAt(0)}
                                </div>
                                <div className="space-y-1">
                                    <div className="flex items-center gap-3">
                                        <h3 className="font-bold text-sm">{selectedConv.contact.name}</h3>
                                        <div className="flex items-center gap-2">
                                            <span className="px-2 py-0.5 rounded-full bg-white/5 border border-border text-[9px] font-bold text-primary">
                                                SCORE: {selectedConv.contact.lead_score}
                                            </span>
                                            {selectedConv.contact.intent && (
                                                <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[9px] font-bold uppercase tracking-wider">
                                                    {selectedConv.contact.intent.replace('_', ' ')}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 text-[10px] text-foreground/50 uppercase tracking-wider">
                                        <Smartphone size={10} />
                                        {selectedConv.channel} • {selectedConv.contact.phone}
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-4 text-foreground/50">
                                <Phone size={20} className="cursor-pointer hover:text-primary transition-colors" />
                                <Filter size={20} className="cursor-pointer hover:text-primary transition-colors" />
                                <MoreVertical size={20} className="cursor-pointer hover:text-primary transition-colors" />
                            </div>
                        </div>

                        {/* Messages List */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-fixed opacity-80">
                            {messages.map((msg) => (
                                <div key={msg.id} className={`flex ${msg.sender_type === 'human' || msg.sender_type === 'bot' ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-[70%] p-3 rounded-2xl text-sm shadow-sm ${msg.sender_type === 'human'
                                        ? "bg-primary text-white rounded-tr-none"
                                        : msg.sender_type === 'bot'
                                            ? "bg-purple-600 text-white rounded-tr-none"
                                            : "bg-card border border-border text-foreground rounded-tl-none"
                                        }`}>
                                        <p>{msg.content}</p>
                                        <div className={`text-[9px] mt-1 opacity-50 ${msg.sender_type !== 'contact' ? 'text-right' : ''}`}>
                                            {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Input Area */}
                        <div className="p-4 border-t border-border bg-card/30">
                            <div className="relative flex items-center gap-3">
                                <input
                                    type="text"
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                                    placeholder="Type your message..."
                                    className="flex-1 bg-white/5 border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                                />
                                <button
                                    onClick={handleSendMessage}
                                    className="p-3 rounded-xl bg-primary text-white hover:opacity-90 transition-opacity shadow-lg shadow-primary/20"
                                >
                                    <Send size={20} />
                                </button>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-foreground/30 space-y-4">
                        <div className="p-6 rounded-full bg-white/5">
                            <MessageSquare size={48} />
                        </div>
                        <p className="text-sm font-medium">Select a conversation to start chatting</p>
                    </div>
                )}
            </div>
        </div>
    );
}
