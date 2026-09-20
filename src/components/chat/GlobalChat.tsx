"use client";

import React, { useState, useEffect, useRef } from "react";
import Pusher from "pusher-js";
import { MessageSquare, X, Send, User as UserIcon } from "lucide-react";
import { toast } from "sonner";

interface ChatMessage {
  _id: string;
  senderId: string;
  senderName: string;
  senderRole: string;
  message: string;
  taggedRoles: string[];
  createdAt: string;
}

interface UserData {
  name: string;
  email: string;
  role: string;
}

const ROLES = ["Super Admin", "HR", "Accounts", "Design", "Store", "Project", "Marketing"];

export default function GlobalChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const [userData, setUserData] = useState<UserData | null>(null);
  
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

  // Fetch User Data & Initial Messages
  useEffect(() => {
    async function init() {
      try {
        const userRes = await fetch("/api/auth/me");
        if (userRes.ok) setUserData(await userRes.json());
        
        const chatRes = await fetch("/api/chat");
        if (chatRes.ok) setMessages(await chatRes.json());
      } catch (err) {
        console.error("Init Error", err);
      }
    }
    init();
  }, []);

  // Set up Pusher
  useEffect(() => {
    const pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_APP_KEY!, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
    });

    const channel = pusher.subscribe("global-chat");
    
    channel.bind("new-message", (newMsg: ChatMessage) => {
      setMessages((prev) => {
        // Prevent duplicates
        if (prev.some((m) => m._id === newMsg._id)) return prev;
        return [...prev, newMsg];
      });

      // Handle unread mentions
      if (!isOpen) {
        if (userData && newMsg.taggedRoles.includes(userData.role)) {
          setUnreadMentions((prev) => prev + 1);
          toast(`You were tagged in Global Chat by ${newMsg.senderName}`, {
            icon: <MessageSquare size={16} className="text-blue-500" />
          });
        }
      }
    });

    return () => {
      pusher.unsubscribe("global-chat");
    };
  }, [userData, isOpen]);

  // Scroll to bottom
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      setUnreadMentions(0); // Mark read when opened
    }
  }, [messages, isOpen]);

  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputText.trim()) return;

    const messageToSend = inputText;
    setInputText("");
    setShowTagMenu(false);

    // Extract tagged roles from message text (e.g. "@HR hello")
    const words = messageToSend.split(" ");
    const tags = words
      .filter((w) => w.startsWith("@"))
      .map((w) => w.substring(1))
      .filter((tag) => ROLES.includes(tag));

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: messageToSend, taggedRoles: tags }),
      });
      if (!res.ok) {
        setInputText(messageToSend); // restore on fail
        toast.error("Failed to send message");
      }
    } catch (err) {
      setInputText(messageToSend);
      toast.error("Network error");
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInputText(val);

    // Detect @ typing
    const lastWord = val.split(" ").pop();
    if (lastWord?.startsWith("@")) {
      setTagFilter(lastWord.substring(1));
      setShowTagMenu(true);
    } else {
      setShowTagMenu(false);
    }
  };

  const handleTagSelect = (role: string) => {
    const words = inputText.split(" ");
    words.pop(); // remove partial @tag
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
      // End dragging first to re-enable CSS transitions
      setIsDragging(false);
      
      // Small timeout to allow transition classes to apply before moving
      setTimeout(() => {
        const rect = target.getBoundingClientRect();
        const windowWidth = window.innerWidth;
        const windowHeight = window.innerHeight;
        
        let targetX = position.x;
        let targetY = position.y;
        
        const edgeMargin = 24; // Better gap on left/right

        // Snap to left or right edge
        const centerX = rect.left + rect.width / 2;
        if (centerX < windowWidth / 2) {
          targetX = position.x + (edgeMargin - rect.left);
        } else {
          targetX = position.x + ((windowWidth - edgeMargin) - rect.right);
        }

        // Vertical bounds (Keep between top: 80px and bottom: 96px)
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
    // Reset position when opened so the close button is exactly where expected
    if (!isOpen) setPosition({ x: 0, y: 0 });
  };

  // Render text with styled tags
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
      {/* Floating Button */}
      <button
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onClick={handleIconClick}
        style={{ transform: `translate(${position.x}px, ${position.y}px)` }}
        className={`fixed bottom-24 sm:bottom-6 left-4 sm:left-6 w-14 h-14 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full flex items-center justify-center text-white shadow-xl touch-none z-[60] ${
          isDragging ? "cursor-grabbing scale-105" : "cursor-pointer hover:shadow-2xl hover:scale-105 transition-all duration-500 ease-out"
        }`}
      >
        {isOpen ? <X size={24} /> : <MessageSquare size={24} />}
        {unreadMentions > 0 && !isOpen && (
          <span className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 border-2 border-white rounded-full flex items-center justify-center text-xs font-bold shadow">
            {unreadMentions}
          </span>
        )}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed inset-0 sm:inset-auto sm:bottom-24 sm:left-6 w-full h-full sm:w-96 sm:h-[500px] bg-white dark:bg-slate-900 sm:rounded-2xl shadow-2xl border-0 sm:border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden z-[70] flex-shrink-0 animate-in slide-in-from-bottom-5">
          {/* Header */}
          <div className="bg-slate-50 dark:bg-slate-800 p-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center">
                <MessageSquare size={18} className="text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-800 dark:text-white">Global Team Chat</h3>
                <div className="flex items-center gap-1.5 text-xs text-slate-500">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  Live
                </div>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
              <X size={18} />
            </button>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50 dark:bg-slate-900/50 custom-scrollbar">
            {messages.map((msg) => {
              const isMe = userData?.role === msg.senderRole && userData?.name === msg.senderName;
              const isMentioned = userData && msg.taggedRoles.includes(userData.role);

              return (
                <div key={msg._id} className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}>
                  <div className="flex items-center gap-1.5 mb-1 mx-1">
                    <span className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">{msg.senderRole}</span>
                    {!isMe && <span className="text-[11px] text-slate-400">{msg.senderName}</span>}
                  </div>
                  
                  <div 
                    className={`max-w-[85%] px-3.5 py-2.5 rounded-2xl text-[13.5px] leading-relaxed shadow-sm ${
                      isMe 
                        ? "bg-blue-600 text-white rounded-tr-sm" 
                        : isMentioned 
                          ? "bg-amber-100 dark:bg-amber-900/40 text-slate-800 dark:text-amber-100 border border-amber-300 dark:border-amber-700/50 rounded-tl-sm ring-2 ring-amber-400/20" 
                          : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-tl-sm"
                    }`}
                  >
                    {renderMessageContent(msg.message)}
                  </div>
                  <span className="text-[10px] text-slate-400 mt-1 mx-1">
                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-3 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 relative">
            {/* Tagging Dropdown */}
            {showTagMenu && filteredRoles.length > 0 && (
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
                placeholder="Type a message... use @ to tag"
                className="flex-1 bg-slate-100 dark:bg-slate-800 border-transparent focus:bg-white dark:focus:bg-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 rounded-full px-4 py-2.5 text-sm transition-all"
              />
              <button 
                type="submit"
                disabled={!inputText.trim()}
                className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white disabled:opacity-50 disabled:bg-slate-300 dark:disabled:bg-slate-700 hover:bg-blue-700 transition-colors flex-shrink-0"
              >
                <Send size={16} className="ml-0.5" />
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
