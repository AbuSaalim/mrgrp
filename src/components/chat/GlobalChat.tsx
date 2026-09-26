"use client";

import React, { useState, useEffect, useRef } from "react";
import Pusher from "pusher-js";
import { MessageSquare, X, Send, Trash2, ChevronDown } from "lucide-react";
import { toast } from "sonner";

interface ChatMessage {
  _id: string;
  senderId: string;
  senderName: string;
  senderRole: string;
  message: string;
  targetRole: string;
  taggedRoles: string[];
  isDeleted: boolean;
  createdAt: string;
}

interface UserData {
  name: string;
  email: string;
  role: string;
  userId?: string;
  id?: string;
}

const ROLES = ["Super Admin", "HR", "Accounts", "Design", "Store", "Project", "Marketing"];

export default function GlobalChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const [userData, setUserData] = useState<UserData | null>(null);
  
  const [targetRole, setTargetRole] = useState("All");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [deletingMsgId, setDeletingMsgId] = useState<string | null>(null);
  const [unreadByRole, setUnreadByRole] = useState<Record<string, number>>({});
  const [typingRoles, setTypingRoles] = useState<string[]>([]);
  
  const targetRoleRef = useRef(targetRole);
  const isOpenRef = useRef(isOpen);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isFetching, setIsFetching] = useState(false);

  // Tagging State
  const [showTagMenu, setShowTagMenu] = useState(false);
  const [tagFilter, setTagFilter] = useState("");
  const [unreadMentions, setUnreadMentions] = useState(0);

  // Dragging State
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const elementStart = useRef({ x: 0, y: 0 });

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    targetRoleRef.current = targetRole;
    setTypingRoles([]); // clear typing on channel switch
    if (isOpen) {
       setUnreadByRole(prev => ({ ...prev, [targetRole]: 0 }));
    }
  }, [targetRole, isOpen]);

  useEffect(() => {
    isOpenRef.current = isOpen;
    if (isOpen) {
      if (messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
      }
    }
  }, [isOpen]);

  // Fetch User Data
  useEffect(() => {
    async function init() {
      try {
        const userRes = await fetch("/api/auth/me");
        if (userRes.ok) setUserData(await userRes.json());
      } catch (err) {}
    }
    init();
  }, []);

  // Fetch Messages based on targetRole and page
  useEffect(() => {
    async function loadMessages() {
      setIsFetching(true);
      try {
        const chatRes = await fetch(`/api/chat?targetRole=${targetRole}&page=${page}`);
        if (chatRes.ok) {
           const data = await chatRes.json();
           if (data.length < 50) setHasMore(false);
           else setHasMore(true);

           if (page === 1) {
             setMessages(data);
             setTimeout(() => messagesEndRef.current?.scrollIntoView(), 50);
           } else {
             // Prepend older messages
             setMessages(prev => [...data, ...prev]);
           }
        }
      } catch (err) {
        console.error("Load Error", err);
      }
      setIsFetching(false);
    }
    loadMessages();
  }, [targetRole, page]);

  // Set up Pusher
  useEffect(() => {
    const pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_APP_KEY!, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
    });

    const channel = pusher.subscribe("global-chat");
    
    const handleNewMessage = (newMsg: ChatMessage) => {
      const myRole = userData?.role || "";
      let shouldShow = false;

      // Filter if the message belongs in the current active view
      if (targetRoleRef.current === "All") {
         if (newMsg.targetRole === "All") shouldShow = true;
      } else {
         if (newMsg.targetRole === targetRoleRef.current || (newMsg.targetRole === myRole && newMsg.senderRole === targetRoleRef.current)) {
            shouldShow = true;
         }
      }

      if (shouldShow) {
        setMessages((prev) => {
          if (prev.some((m) => m._id === newMsg._id)) return prev;
          return [...prev, newMsg];
        });
        setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
      }

      const isMyOwnMessage = newMsg.senderId.toString() === (userData?.userId || userData?.id)?.toString();
      if (isMyOwnMessage) return;

      // Badges & Notifications
      if (newMsg.targetRole === "All") {
         if (!isOpenRef.current || targetRoleRef.current !== "All") {
            setUnreadByRole(prev => ({ ...prev, "All": (prev["All"] || 0) + 1 }));
            const isMentioned = newMsg.taggedRoles.includes(myRole);
            toast(`Global Chat${isMentioned ? ' (Mention)' : ''}: ${newMsg.senderName}`, {
               icon: <MessageSquare size={16} className="text-blue-500" />
            });
         }
      } else if (newMsg.targetRole === myRole) {
         if (!isOpenRef.current || targetRoleRef.current !== newMsg.senderRole) {
            setUnreadByRole(prev => ({ ...prev, [newMsg.senderRole]: (prev[newMsg.senderRole] || 0) + 1 }));
            toast(`Private message from ${newMsg.senderName}`, {
               icon: <MessageSquare size={16} className="text-blue-500" />
            });
         }
      }
    };

    channel.bind("new-message", handleNewMessage);

    channel.bind("delete-message", (data: { id: string }) => {
      setMessages((prev) => 
        prev.map(m => m._id === data.id ? { ...m, isDeleted: true, message: "This message was deleted" } : m)
      );
    });

    const handleTyping = (data: { senderRole: string, targetRole: string, isTyping: boolean }) => {
      const myRole = userData?.role || "";
      if (data.targetRole === targetRoleRef.current && data.senderRole !== myRole) {
         setTypingRoles(prev => {
            if (data.isTyping && !prev.includes(data.senderRole)) return [...prev, data.senderRole];
            if (!data.isTyping) return prev.filter(r => r !== data.senderRole);
            return prev;
         });
      }
    };
    channel.bind("user-typing", handleTyping);

    return () => {
      channel.unbind("new-message", handleNewMessage);
      channel.unbind("user-typing", handleTyping);
      pusher.unsubscribe("global-chat");
    };
  }, [userData]);

  const handleTargetSelect = (role: string) => {
    setTargetRole(role);
    setUnreadByRole(prev => ({ ...prev, [role]: 0 }));
    setPage(1); // reset to newest
    setMessages([]); // clear UI instantly for snappy feel
    setIsDropdownOpen(false);
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputText.trim()) return;

    const messageToSend = inputText;
    setInputText("");
    setShowTagMenu(false);

    const words = messageToSend.split(" ");
    const tags = words
      .filter((w) => w.startsWith("@"))
      .map((w) => w.substring(1))
      .filter((tag) => ROLES.includes(tag));

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: messageToSend, taggedRoles: tags, targetRole }),
      });
      if (!res.ok) {
        setInputText(messageToSend);
        toast.error("Failed to send message");
      }
    } catch (err) {
      setInputText(messageToSend);
      toast.error("Network error");
    }
  };

  const handleDeleteMessage = async (id: string) => {
    try {
      const res = await fetch(`/api/chat/${id}`, { method: "DELETE" });
      if (!res.ok) toast.error("Failed to delete message");
    } catch (err) {
      toast.error("Network error");
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInputText(val);

    // Notify typing
    if (!typingTimeoutRef.current) {
      fetch("/api/chat/typing", {
        method: "POST",
        body: JSON.stringify({ targetRole, isTyping: true }),
        headers: { "Content-Type": "application/json" }
      }).catch(() => {});
    }
    
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    
    typingTimeoutRef.current = setTimeout(() => {
      fetch("/api/chat/typing", {
        method: "POST",
        body: JSON.stringify({ targetRole, isTyping: false }),
        headers: { "Content-Type": "application/json" }
      }).catch(() => {});
      typingTimeoutRef.current = null;
    }, 1500);

    const lastWord = val.split(" ").pop();
    if (lastWord?.startsWith("@") && targetRole === "All") { // only allow tag menu in Global
      setTagFilter(lastWord.substring(1));
      setShowTagMenu(true);
    } else {
      setShowTagMenu(false);
    }
  };

  const handleTagSelect = (role: string) => {
    const words = inputText.split(" ");
    words.pop();
    words.push(`@${role} `);
    setInputText(words.join(" "));
    setShowTagMenu(false);
    inputRef.current?.focus();
  };

  const filteredRoles = ROLES.filter((r) => r.toLowerCase().includes(tagFilter.toLowerCase()));

  // Drag Handlers
  const handlePointerDown = (e: React.PointerEvent) => {
    if (isOpen) return;
    dragStart.current = { x: e.clientX, y: e.clientY };
    elementStart.current = { ...position };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (isOpen) return;
    if ((e.target as HTMLElement).hasPointerCapture(e.pointerId)) {
      const dx = e.clientX - dragStart.current.x;
      const dy = e.clientY - dragStart.current.y;
      if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
        setIsDragging(true);
      }
      if (isDragging) {
        setPosition({
          x: elementStart.current.x + dx,
          y: elementStart.current.y + dy,
        });
      }
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (isOpen) return;
    const target = e.target as HTMLElement;
    target.releasePointerCapture(e.pointerId);
    
    if (isDragging) {
      setIsDragging(false);
      setTimeout(() => {
        const rect = target.getBoundingClientRect();
        const windowWidth = window.innerWidth;
        const windowHeight = window.innerHeight;
        
        let targetX = position.x;
        let targetY = position.y;
        const edgeMargin = 24;

        const centerX = rect.left + rect.width / 2;
        if (centerX < windowWidth / 2) {
          targetX = position.x + (edgeMargin - rect.left);
        } else {
          targetX = position.x + ((windowWidth - edgeMargin) - rect.right);
        }

        if (rect.top < 80) {
          targetY = position.y + (80 - rect.top);
        } else if (rect.bottom > windowHeight - 96) {
          targetY = position.y + ((windowHeight - 96) - rect.bottom);
        }
        setPosition({ x: targetX, y: targetY });
      }, 10);
    } else {
      setIsDragging(false);
    }
  };

  const handleIconClick = (e: React.MouseEvent) => {
    if (isDragging) {
      e.preventDefault();
      return;
    }
    setIsOpen(!isOpen);
    if (!isOpen) setPosition({ x: 0, y: 0 });
    else setUnreadMentions(0); // clear on open
  };

  const totalUnreadCount = Object.values(unreadByRole).reduce((a, b) => a + b, 0);

  const renderMessageContent = (msg: string) => {
    return msg.split(" ").map((word, i) => {
      if (word.startsWith("@") && ROLES.includes(word.substring(1))) {
        return (
          <span key={i} className="font-semibold text-blue-500 bg-blue-50 dark:bg-blue-900/30 dark:text-blue-400 px-1 rounded mx-0.5">
            {word}
          </span>
        );
      }
      return word + " ";
    });
  };

  return (
    <>
      <button
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onClick={handleIconClick}
        style={{ transform: `translate(${position.x}px, ${position.y}px)` }}
        className={`fixed bottom-24 sm:bottom-6 left-4 sm:left-auto sm:right-6 w-14 h-14 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-full flex items-center justify-center shadow-lg touch-none z-[110] ${
          isDragging ? "cursor-grabbing scale-105" : "cursor-pointer hover:shadow-xl hover:scale-105 transition-all duration-300 ease-out"
        }`}
      >
        {isOpen ? <X size={24} /> : (
          <>
            <MessageSquare size={24} />
            {totalUnreadCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full border-2 border-white dark:border-slate-900 shadow-sm animate-in zoom-in">
                {totalUnreadCount > 9 ? "9+" : totalUnreadCount}
              </span>
            )}
          </>
        )}
        {unreadMentions > 0 && !isOpen && totalUnreadCount === 0 && (
          <span className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 border-2 border-white rounded-full flex items-center justify-center text-xs font-bold shadow">
            {unreadMentions}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="fixed inset-0 sm:inset-auto sm:bottom-24 sm:right-6 w-full h-full sm:w-[420px] sm:h-[550px] bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl sm:rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.4)] border-0 sm:border sm:border-white/20 dark:sm:border-white/10 flex flex-col overflow-hidden z-[110] flex-shrink-0 animate-in slide-in-from-bottom-5">
          {/* Header */}
          <div className="bg-transparent p-3 sm:p-4 border-b border-slate-200/50 dark:border-slate-700/50 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center flex-shrink-0">
                <MessageSquare size={18} className="text-blue-600 dark:text-blue-400" />
              </div>
              <div className="flex flex-col">
                <div className="relative flex items-center w-fit">
                  <button 
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className="flex items-center gap-2 font-bold text-[15.5px] text-slate-800 dark:text-white bg-transparent border-none focus:outline-none cursor-pointer p-0 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                  >
                    {targetRole === "All" ? "Global Team Chat" : targetRole}
                    <ChevronDown size={16} className={`text-slate-400 transition-transform duration-300 ${isDropdownOpen ? "rotate-180" : ""}`} />
                  </button>
                  
                  {isDropdownOpen && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setIsDropdownOpen(false)} />
                      <div className="absolute top-full left-0 mt-2 w-48 bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl border border-slate-200/50 dark:border-slate-700/50 rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.4)] z-50 py-2 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <button
                          onClick={() => handleTargetSelect("All")}
                          className={`w-full flex items-center justify-between px-4 py-2.5 text-sm transition-colors ${targetRole === "All" ? "bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-semibold" : "text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50"}`}
                        >
                          <span>Global Team Chat</span>
                          {(unreadByRole["All"] || 0) > 0 && (
                            <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full shadow-sm animate-in zoom-in">
                              {unreadByRole["All"]}
                            </span>
                          )}
                        </button>
                        {ROLES.map(r => (
                          <button
                            key={r}
                            onClick={() => handleTargetSelect(r)}
                            className={`w-full flex items-center justify-between px-4 py-2.5 text-sm transition-colors ${targetRole === r ? "bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-semibold" : "text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50"}`}
                          >
                            <span>{r}</span>
                            {(unreadByRole[r] || 0) > 0 && (
                              <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full shadow-sm animate-in zoom-in">
                                {unreadByRole[r]}
                              </span>
                            )}
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>
                <div className="flex items-center gap-1.5 text-[10px] text-slate-500 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Live • {targetRole === "All" ? "Public" : "Private Encrypted"}
                </div>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
              <X size={18} />
            </button>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-transparent custom-scrollbar relative">
            {isFetching && (
               <div className="text-center py-2 text-xs text-slate-400">Loading messages...</div>
            )}
            {!isFetching && hasMore && messages.length >= 50 && (
              <div className="flex justify-center mb-4">
                <button 
                  onClick={() => setPage(p => p + 1)}
                  className="px-3 py-1 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm border border-slate-200/50 dark:border-slate-700/50 rounded-full text-xs text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 shadow-sm transition-colors"
                >
                  Load older messages
                </button>
              </div>
            )}

            {messages.length === 0 && !isFetching && (
               <div className="h-full flex flex-col items-center justify-center text-slate-400 opacity-50 space-y-2">
                 <MessageSquare size={32} />
                 <p className="text-sm">No messages yet</p>
               </div>
            )}

            {messages.map((msg) => {
              const isMe = userData?.role === msg.senderRole && userData?.name === msg.senderName;
              const isMentioned = userData && msg.taggedRoles.includes(userData.role);
              const canDelete = isMe || userData?.role === "Super Admin";

              return (
                <div key={msg._id} className={`flex flex-col group ${isMe ? "items-end" : "items-start"}`}>
                  <div className="flex items-center gap-1.5 mb-1 mx-1">
                    <span className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">{msg.senderRole}</span>
                    {!isMe && <span className="text-[11px] text-slate-400">{msg.senderName}</span>}
                  </div>
                  
                  <div className="flex items-end gap-2 relative">
                    {canDelete && !msg.isDeleted && isMe && (
                      <button 
                        onClick={() => setDeletingMsgId(msg._id)} 
                        className="opacity-0 group-hover:opacity-100 p-1 mb-1 text-slate-300 hover:text-red-500 transition-opacity rounded-full hover:bg-red-50 dark:hover:bg-red-900/20"
                        title="Delete message"
                      >
                        <Trash2 size={13} />
                      </button>
                    )}
                    
                    <div 
                      className={`max-w-[85%] px-3.5 py-2.5 rounded-2xl text-[12px] leading-relaxed shadow-sm relative ${
                        msg.isDeleted 
                          ? "bg-slate-100/50 dark:bg-slate-800/30 text-slate-400 dark:text-slate-500 italic rounded-tr-sm border border-slate-200/50 dark:border-slate-700/30"
                          : isMe 
                          ? "bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-900 rounded-tr-sm" 
                          : isMentioned && targetRole === "All"
                            ? "bg-amber-50/80 dark:bg-amber-900/30 text-slate-800 dark:text-amber-100 border border-amber-200/50 dark:border-amber-700/30 rounded-tl-sm ring-1 ring-amber-400/20" 
                            : "bg-white/80 dark:bg-slate-800/80 text-slate-700 dark:text-slate-200 border border-slate-200/50 dark:border-slate-700/50 rounded-tl-sm"
                      }`}
                    >
                      {msg.isDeleted ? msg.message : renderMessageContent(msg.message)}
                    </div>
                    
                    {canDelete && !msg.isDeleted && !isMe && (
                       <button 
                        onClick={() => setDeletingMsgId(msg._id)} 
                        className="opacity-0 group-hover:opacity-100 p-1 mb-1 text-slate-300 hover:text-red-500 transition-opacity rounded-full hover:bg-red-50 dark:hover:bg-red-900/20"
                        title="Delete (Admin)"
                      >
                        <Trash2 size={13} />
                      </button>
                    )}

                    {/* Inline Delete Confirmation */}
                    {deletingMsgId === msg._id && (
                      <div className={`absolute ${isMe ? 'right-0' : 'left-0'} bottom-full mb-1 bg-white/95 dark:bg-slate-800/95 shadow-xl rounded-lg border border-slate-200 dark:border-slate-700 p-1 z-50 animate-in fade-in zoom-in-95 flex flex-col w-36 backdrop-blur-md`}>
                        <button 
                          onClick={() => { handleDeleteMessage(msg._id); setDeletingMsgId(null); }} 
                          className="text-red-600 dark:text-red-400 font-medium hover:bg-red-50 dark:hover:bg-red-900/30 text-[11px] text-left px-2 py-1.5 rounded-md transition-colors flex items-center gap-1.5"
                        >
                          <Trash2 size={12} />
                          Delete for everyone
                        </button>
                        <button 
                          onClick={() => setDeletingMsgId(null)} 
                          className="text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/50 text-[11px] text-left px-2 py-1.5 rounded-md transition-colors mt-0.5"
                        >
                          Cancel
                        </button>
                      </div>
                    )}
                  </div>
                  <span className="text-[9px] text-slate-400 mt-1 mx-1">
                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              );
            })}

            {/* Typing Indicator */}
            {typingRoles.length > 0 && (
              <div className="flex items-center gap-2 mt-2 ml-2 animate-in fade-in slide-in-from-bottom-2">
                <div className="bg-slate-100 dark:bg-slate-800 rounded-full px-3 py-1.5 flex items-center gap-1 shadow-sm">
                  <span className="w-1.5 h-1.5 bg-slate-400 dark:bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1.5 h-1.5 bg-slate-400 dark:bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1.5 h-1.5 bg-slate-400 dark:bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
                <span className="text-[10px] text-slate-400 font-medium">
                  {typingRoles.join(", ")} {typingRoles.length > 1 ? "are" : "is"} typing...
                </span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-3 bg-transparent border-t border-slate-200/50 dark:border-slate-700/50 relative">
            {showTagMenu && filteredRoles.length > 0 && targetRole === "All" && (
              <div className="absolute bottom-full mb-2 left-0 w-full px-3">
                <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xl rounded-lg overflow-hidden py-1">
                  <div className="px-3 py-1.5 text-xs font-semibold text-slate-500 bg-slate-50 dark:bg-slate-800/50">Tag a Department</div>
                  {filteredRoles.map((role) => (
                    <button
                      key={role}
                      onClick={() => handleTagSelect(role)}
                      className="w-full text-left px-3 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-blue-50 dark:hover:bg-slate-700 flex items-center gap-2"
                    >
                      <div className="w-5 h-5 rounded bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center text-blue-600">@</div>
                      {role}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <form onSubmit={handleSendMessage} className="flex items-center gap-2">
              <input
                ref={inputRef}
                type="text"
                value={inputText}
                onChange={handleInputChange}
                placeholder={targetRole === "All" ? "Type a message... use @ to tag" : `Private message to ${targetRole}...`}
                className="flex-1 bg-white/50 dark:bg-slate-900/50 border border-slate-200/60 dark:border-slate-700/60 focus:bg-white dark:focus:bg-slate-800 focus:border-slate-400 dark:focus:border-slate-500 focus:ring-0 rounded-full px-4 py-2.5 text-[13.5px] transition-all shadow-sm placeholder:text-slate-400 dark:placeholder:text-slate-500 text-slate-800 dark:text-slate-200"
              />
              <button 
                type="submit"
                disabled={!inputText.trim()}
                className="w-10 h-10 rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 flex items-center justify-center disabled:opacity-50 hover:scale-105 transition-all flex-shrink-0 shadow-sm"
              >
                <Send size={16} className="ml-0.5" />
              </button>
            </form>
          </div>

          {/* Delete Confirmation Overlay */}
          {deletingMsgId && (
            <div className="absolute inset-0 bg-white/40 dark:bg-slate-900/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4 animate-in fade-in duration-200">
              <div className="bg-white dark:bg-slate-800 shadow-2xl rounded-2xl border border-slate-200/50 dark:border-slate-700/50 w-[240px] overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="p-4 text-center">
                  <h4 className="font-bold text-slate-800 dark:text-slate-100 text-[14px]">Delete message?</h4>
                  <p className="text-[12px] text-slate-500 dark:text-slate-400 mt-1">This action cannot be undone.</p>
                </div>
                <div className="flex border-t border-slate-100 dark:border-slate-700/50">
                  <button 
                    onClick={() => setDeletingMsgId(null)} 
                    className="flex-1 py-3 text-[13px] font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors"
                  >
                    Cancel
                  </button>
                  <div className="w-[1px] bg-slate-100 dark:bg-slate-700/50"></div>
                  <button 
                    onClick={() => { handleDeleteMessage(deletingMsgId); setDeletingMsgId(null); }} 
                    className="flex-1 py-3 text-[13px] font-bold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
}
