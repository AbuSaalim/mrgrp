"use client";

import React, { useState, useEffect, useRef } from "react";
import Pusher from "pusher-js";
import { MessageSquare, X, Send, Trash2, ChevronDown, Camera, Clock, Download, Loader2, User, Users, Search } from "lucide-react";
import { toast } from "sonner";

interface ChatMessage {
  _id: string;
  senderId: string;
  senderName: string;
  senderRole: string;
  message: string;
  targetRole: string;
  targetUserId?: string | null;
  targetUserName?: string | null;
  taggedRoles: string[];
  isDeleted: boolean;
  mediaKey?: string | null;
  mediaUrl?: string | null;
  mediaName?: string | null;
  mediaType?: string | null;
  mediaSize?: number | null;
  mediaExpiresAt?: string | null;
  mediaDeleted?: boolean;
  createdAt: string;
}

interface ChatUser {
  id: string;
  name: string;
  email: string;
  role: string;
  isActive?: boolean;
}

interface UserData {
  name: string;
  email: string;
  role: string;
  userId?: string;
  id?: string;
}

const ROLES = ["Super Admin", "HR", "Accounts", "Design", "Store", "Project", "Marketing"];

const getDateLabel = (dateStr: string) => {
  const messageDate = new Date(dateStr);
  const today = new Date();
  
  const msgIST = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(messageDate);
  const todayIST = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(today);
  
  const yesterdayDate = new Date(today);
  yesterdayDate.setDate(today.getDate() - 1);
  const yesterdayIST = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(yesterdayDate);

  if (msgIST === todayIST) return "Today";
  if (msgIST === yesterdayIST) return "Yesterday";

  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'Asia/Kolkata',
  }).format(messageDate);
};

const isDifferentDay = (date1: string, date2: string) => {
  const d1 = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(new Date(date1));
  const d2 = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(new Date(date2));
  return d1 !== d2;
};

const formatMessageTime = (dateStr: string) => {
  return new Intl.DateTimeFormat('en-IN', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone: 'Asia/Kolkata',
  }).format(new Date(dateStr));
};

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
  const userDataRef = useRef(userData);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isFetching, setIsFetching] = useState(false);
  const [isFetchingOlder, setIsFetchingOlder] = useState(false);
  const [viewportHeight, setViewportHeight] = useState<number | null>(null);

  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Site Photo / Media State
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreviewUrl, setFilePreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [viewerImage, setViewerImage] = useState<{ url: string; name: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 1-on-1 Direct Messaging State
  const [usersList, setUsersList] = useState<ChatUser[]>([]);
  const [selectedUser, setSelectedUser] = useState<ChatUser | null>(null);
  const selectedUserRef = useRef<ChatUser | null>(null);
  const [chatTab, setChatTab] = useState<"channels" | "dms">("channels");
  const [userSearchQuery, setUserSearchQuery] = useState("");
  const [unreadByDm, setUnreadByDm] = useState<Record<string, number>>({});

  useEffect(() => {
    selectedUserRef.current = selectedUser;
    setTypingRoles([]);
    if (isOpen && selectedUser) {
      setUnreadByDm((prev) => ({ ...prev, [selectedUser.id]: 0 }));
    }
  }, [selectedUser, isOpen]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const MAX_SIZE = 1 * 1024 * 1024; // 1 MB limit
    if (file.size > MAX_SIZE) {
      toast.error(`Image size must be less than 1 MB (Selected: ${(file.size / (1024 * 1024)).toFixed(2)} MB)`);
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    if (!file.type.startsWith("image/")) {
      toast.error("Only image files (JPG, PNG, WebP) are allowed");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    if (filePreviewUrl) URL.revokeObjectURL(filePreviewUrl);
    setSelectedFile(file);
    setFilePreviewUrl(URL.createObjectURL(file));
  };

  const cancelSelectedFile = () => {
    if (filePreviewUrl) URL.revokeObjectURL(filePreviewUrl);
    setSelectedFile(null);
    setFilePreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  useEffect(() => {
    userDataRef.current = userData;
  }, [userData]);

  // Mobile virtual keyboard viewport height tracker
  useEffect(() => {
    if (typeof window === "undefined") return;

    const updateViewport = () => {
      if (window.visualViewport) {
        setViewportHeight(window.visualViewport.height);
      } else {
        setViewportHeight(window.innerHeight);
      }
    };

    updateViewport();
    window.visualViewport?.addEventListener("resize", updateViewport);
    window.visualViewport?.addEventListener("scroll", updateViewport);
    window.addEventListener("resize", updateViewport);

    return () => {
      window.visualViewport?.removeEventListener("resize", updateViewport);
      window.visualViewport?.removeEventListener("scroll", updateViewport);
      window.removeEventListener("resize", updateViewport);
    };
  }, []);

  // Tagging State
  const [showTagMenu, setShowTagMenu] = useState(false);
  const [tagFilter, setTagFilter] = useState("");
  const [unreadMentions, setUnreadMentions] = useState(0);

  // Dragging State
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const elementStart = useRef({ x: 0, y: 0 });

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

  // Fetch User Data and Team Members
  useEffect(() => {
    async function init() {
      try {
        const userRes = await fetch("/api/auth/me");
        if (userRes.ok) setUserData(await userRes.json());
      } catch (err) {}

      try {
        const usersRes = await fetch("/api/users");
        if (usersRes.ok) {
          const data = await usersRes.json();
          setUsersList(data.users || []);
        }
      } catch (err) {
        console.error("Failed to fetch users list for chat:", err);
      }
    }
    init();
  }, []);

  // Fetch Messages on targetRole or selectedUser change
  useEffect(() => {
    async function loadInitialMessages() {
      setIsFetching(true);
      try {
        const url = selectedUser
          ? `/api/chat?targetUserId=${selectedUser.id}&page=1`
          : `/api/chat?targetRole=${targetRole}&page=1`;
        const chatRes = await fetch(url);
        if (chatRes.ok) {
           const data: ChatMessage[] = await chatRes.json();
           setHasMore(data.length >= 50);
           setMessages(data);
           setTimeout(() => messagesEndRef.current?.scrollIntoView(), 50);
        }
      } catch (err) {
        console.error("Load Error", err);
      } finally {
        setIsFetching(false);
      }
    }
    setPage(1);
    loadInitialMessages();
  }, [targetRole, selectedUser]);

  // Background & Screen Unlock Reconnect Sync
  useEffect(() => {
    const handleSyncOnVisible = async () => {
      if (document.visibilityState !== "visible") return;
      try {
        const currentTarget = targetRoleRef.current;
        const currentDmUser = selectedUserRef.current;
        const url = currentDmUser
          ? `/api/chat?targetUserId=${currentDmUser.id}&page=1`
          : `/api/chat?targetRole=${currentTarget}&page=1`;
        const res = await fetch(url);
        if (res.ok) {
          const latestMessages: ChatMessage[] = await res.json();
          setMessages((prev) => {
            const existingMap = new Map(prev.map((m) => [m._id, m]));
            let hasNew = false;
            for (const msg of latestMessages) {
              if (!existingMap.has(msg._id)) {
                hasNew = true;
              }
              existingMap.set(msg._id, msg);
            }
            if (!hasNew) return prev;
            const merged = Array.from(existingMap.values());
            merged.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
            return merged;
          });
        }
      } catch (err) {
        console.error("Sync error on visible:", err);
      }
    };

    document.addEventListener("visibilitychange", handleSyncOnVisible);
    window.addEventListener("focus", handleSyncOnVisible);

    return () => {
      document.removeEventListener("visibilitychange", handleSyncOnVisible);
      window.removeEventListener("focus", handleSyncOnVisible);
    };
  }, []);

  const handleLoadOlder = async () => {
    if (isFetchingOlder || !hasMore) return;
    const container = messagesContainerRef.current;
    const prevScrollHeight = container?.scrollHeight || 0;
    const prevScrollTop = container?.scrollTop || 0;

    setIsFetchingOlder(true);
    try {
      const nextPage = page + 1;
      const url = selectedUser
        ? `/api/chat?targetUserId=${selectedUser.id}&page=${nextPage}`
        : `/api/chat?targetRole=${targetRole}&page=${nextPage}`;
      const chatRes = await fetch(url);
      if (chatRes.ok) {
        const olderData: ChatMessage[] = await chatRes.json();
        setHasMore(olderData.length >= 50);
        setPage(nextPage);

        setMessages((prev) => {
          const existingIds = new Set(prev.map((m) => m._id));
          const filteredOlder = olderData.filter((m) => !existingIds.has(m._id));
          return [...filteredOlder, ...prev];
        });

        // Maintain scroll position so chat does not jump
        requestAnimationFrame(() => {
          if (container) {
            container.scrollTop = container.scrollHeight - prevScrollHeight + prevScrollTop;
          }
        });
      }
    } catch (err) {
      console.error("Load older error", err);
    } finally {
      setIsFetchingOlder(false);
    }
  };

  // Set up Pusher - only once on mount with stable ref
  useEffect(() => {
    const pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_APP_KEY!, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
    });

    const channel = pusher.subscribe("global-chat");
    
    const handleNewMessage = (newMsg: ChatMessage) => {
      const currentRole = userDataRef.current?.role || "";
      const myId = (userDataRef.current?.userId || userDataRef.current?.id)?.toString();
      const isMyOwnMessage = Boolean(myId && newMsg.senderId?.toString() === myId);
      const activeDmId = selectedUserRef.current?.id;

      let shouldShow = false;

      // Handle 1-on-1 Direct Message
      if (newMsg.targetUserId) {
        const isForMe = newMsg.targetUserId === myId;
        const isFromMe = newMsg.senderId?.toString() === myId;
        if (!isForMe && !isFromMe) return; // not involved in this DM

        // If currently viewing DM with the other party
        if (activeDmId && (newMsg.senderId?.toString() === activeDmId || (isFromMe && newMsg.targetUserId === activeDmId))) {
          shouldShow = true;
        }

        if (shouldShow) {
          setMessages((prev) => {
            if (prev.some((m) => m._id === newMsg._id)) return prev;
            return [...prev, newMsg];
          });
          setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
        }

        if (isMyOwnMessage) return;

        // Badge & Notification for DM
        if (!isOpenRef.current || activeDmId !== newMsg.senderId) {
          setUnreadByDm((prev) => ({ ...prev, [newMsg.senderId]: (prev[newMsg.senderId] || 0) + 1 }));
          toast(`Direct Message from ${newMsg.senderName}`, {
            description: newMsg.message || (newMsg.mediaKey ? "Sent a site photo" : ""),
            icon: <MessageSquare size={16} className="text-blue-500" />
          });
        }
        return;
      }

      // Handle Channel Messages (Global or Department)
      if (!selectedUserRef.current) {
        if (targetRoleRef.current === "All") {
          if (newMsg.targetRole === "All") shouldShow = true;
        } else {
          if (newMsg.targetRole === targetRoleRef.current || (newMsg.targetRole === currentRole && newMsg.senderRole === targetRoleRef.current)) {
            shouldShow = true;
          }
        }
      }

      if (shouldShow) {
        setMessages((prev) => {
          if (prev.some((m) => m._id === newMsg._id)) return prev;
          return [...prev, newMsg];
        });
        setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
      }

      if (isMyOwnMessage) return;

      // Badges & Notifications for channel
      if (newMsg.targetRole === "All") {
        if (!isOpenRef.current || selectedUserRef.current || targetRoleRef.current !== "All") {
          setUnreadByRole(prev => ({ ...prev, "All": (prev["All"] || 0) + 1 }));
          const isMentioned = newMsg.taggedRoles.includes(currentRole);
          toast(`Global Chat${isMentioned ? ' (Mention)' : ''}: ${newMsg.senderName}`, {
            icon: <MessageSquare size={16} className="text-blue-500" />
          });
        }
      } else if (newMsg.targetRole === currentRole) {
        if (!isOpenRef.current || selectedUserRef.current || targetRoleRef.current !== newMsg.senderRole) {
          setUnreadByRole(prev => ({ ...prev, [newMsg.senderRole]: (prev[newMsg.senderRole] || 0) + 1 }));
          toast(`Department message from ${newMsg.senderName}`, {
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

    const handleTyping = (data: { senderId?: string, senderRole: string, targetRole?: string, targetUserId?: string, isTyping: boolean }) => {
      const currentRole = userDataRef.current?.role || "";
      const myId = (userDataRef.current?.userId || userDataRef.current?.id)?.toString();

      // DM Typing Indicator
      if (data.targetUserId) {
        if (data.targetUserId === myId && selectedUserRef.current?.id === data.senderId) {
          setTypingRoles((prev) => {
            const label = selectedUserRef.current?.name || "Colleague";
            if (data.isTyping && !prev.includes(label)) return [...prev, label];
            if (!data.isTyping) return prev.filter((r) => r !== label);
            return prev;
          });
        }
        return;
      }

      // Channel Typing Indicator
      if (!selectedUserRef.current && data.targetRole === targetRoleRef.current && data.senderRole !== currentRole) {
         setTypingRoles((prev) => {
            if (data.isTyping && !prev.includes(data.senderRole)) return [...prev, data.senderRole];
            if (!data.isTyping) return prev.filter((r) => r !== data.senderRole);
            return prev;
         });
      }
    };
    channel.bind("user-typing", handleTyping);

    return () => {
      channel.unbind("new-message", handleNewMessage);
      channel.unbind("delete-message");
      channel.unbind("user-typing", handleTyping);
      pusher.unsubscribe("global-chat");
      pusher.disconnect();
    };
  }, []);

  const handleTargetSelect = (role: string) => {
    setSelectedUser(null);
    setTargetRole(role);
    setUnreadByRole(prev => ({ ...prev, [role]: 0 }));
    setPage(1); // reset to newest
    setMessages([]); // clear UI instantly for snappy feel
    setIsDropdownOpen(false);
  };

  const handleSelectUserDm = (user: ChatUser) => {
    setSelectedUser(user);
    setUnreadByDm(prev => ({ ...prev, [user.id]: 0 }));
    setPage(1);
    setMessages([]);
    setIsDropdownOpen(false);
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputText.trim() && !selectedFile) return;

    const messageToSend = inputText;
    setInputText("");
    setShowTagMenu(false);

    const words = messageToSend.split(" ");
    const tags = words
      .filter((w) => w.startsWith("@"))
      .map((w) => w.substring(1))
      .filter((tag) => ROLES.includes(tag));

    let uploadedMedia: {
      mediaKey: string;
      mediaName: string;
      mediaType: string;
      mediaSize: number;
    } | null = null;

    if (selectedFile) {
      setIsUploading(true);
      try {
        const formData = new FormData();
        formData.append("file", selectedFile);
        const upRes = await fetch("/api/chat/upload", {
          method: "POST",
          body: formData,
        });
        if (!upRes.ok) {
          const errData = await upRes.json().catch(() => ({}));
          toast.error(errData.error || "Failed to upload image");
          setIsUploading(false);
          setInputText(messageToSend);
          return;
        }
        uploadedMedia = await upRes.json();
      } catch (uploadErr) {
        toast.error("Image upload failed");
        setIsUploading(false);
        setInputText(messageToSend);
        return;
      }
    }

    const payload: any = {
      message: messageToSend,
      mediaKey: uploadedMedia?.mediaKey,
      mediaName: uploadedMedia?.mediaName,
      mediaType: uploadedMedia?.mediaType,
      mediaSize: uploadedMedia?.mediaSize,
    };

    if (selectedUser) {
      payload.targetUserId = selectedUser.id;
      payload.targetUserName = selectedUser.name;
      payload.targetRole = "DM";
    } else {
      payload.targetRole = targetRole;
      payload.taggedRoles = tags;
    }

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        cancelSelectedFile();
        const sentMsg = await res.json();
        setMessages((prev) => {
          if (prev.some((m) => m._id === sentMsg._id)) return prev;
          return [...prev, sentMsg];
        });
        setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 30);
      } else {
        if (messageToSend) setInputText(messageToSend);
        toast.error("Failed to send message");
      }
    } catch (err) {
      if (messageToSend) setInputText(messageToSend);
      toast.error("Network error");
    } finally {
      setIsUploading(false);
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
        body: JSON.stringify({ 
          targetRole: selectedUser ? undefined : targetRole,
          targetUserId: selectedUser?.id,
          isTyping: true 
        }),
        headers: { "Content-Type": "application/json" }
      }).catch(() => {});
    }
    
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    
    typingTimeoutRef.current = setTimeout(() => {
      fetch("/api/chat/typing", {
        method: "POST",
        body: JSON.stringify({ 
          targetRole: selectedUser ? undefined : targetRole,
          targetUserId: selectedUser?.id,
          isTyping: false 
        }),
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

  const totalChannelUnread = Object.values(unreadByRole).reduce((a, b) => a + b, 0);
  const totalDmUnread = Object.values(unreadByDm).reduce((a, b) => a + b, 0);
  const totalUnreadCount = totalChannelUnread + totalDmUnread;

  const myId = (userData?.userId || userData?.id)?.toString();
  const filteredUsers = usersList
    .filter((u) => u.id !== myId)
    .filter((u) => {
      if (!userSearchQuery.trim()) return true;
      const q = userSearchQuery.toLowerCase();
      return u.name.toLowerCase().includes(q) || u.role.toLowerCase().includes(q);
    });

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
        <div 
          style={{ height: viewportHeight && typeof window !== "undefined" && window.innerWidth < 640 ? `${viewportHeight}px` : undefined }}
          className="fixed inset-0 sm:inset-auto sm:bottom-24 sm:right-6 w-full h-[100dvh] sm:h-[550px] sm:w-[420px] bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl sm:rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.4)] border-0 sm:border sm:border-white/20 dark:sm:border-white/10 flex flex-col overflow-hidden z-[110] flex-shrink-0 animate-in slide-in-from-bottom-5"
        >
          {/* Header */}
          <div className="bg-transparent p-3 sm:p-4 border-b border-slate-200/50 dark:border-slate-700/50 flex items-center justify-between">
            <div className="flex items-center gap-3">
              {selectedUser ? (
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-bold text-sm flex items-center justify-center flex-shrink-0 shadow-sm">
                  {selectedUser.name.charAt(0).toUpperCase()}
                </div>
              ) : (
                <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center flex-shrink-0">
                  <MessageSquare size={18} className="text-blue-600 dark:text-blue-400" />
                </div>
              )}
              <div className="flex flex-col">
                <div className="relative flex items-center w-fit">
                  <button 
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className="flex items-center gap-2 font-bold text-[15.5px] text-slate-800 dark:text-white bg-transparent border-none focus:outline-none cursor-pointer p-0 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                  >
                    <span>{selectedUser ? selectedUser.name : targetRole === "All" ? "Global Team Chat" : targetRole}</span>
                    <ChevronDown size={16} className={`text-slate-400 transition-transform duration-300 ${isDropdownOpen ? "rotate-180" : ""}`} />
                  </button>
                  
                  {isDropdownOpen && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setIsDropdownOpen(false)} />
                      <div className="absolute top-full left-0 mt-2 w-64 sm:w-72 bg-white/95 dark:bg-slate-800/95 backdrop-blur-xl border border-slate-200/70 dark:border-slate-700/70 rounded-2xl shadow-[0_12px_40px_rgb(0,0,0,0.18)] z-50 py-2.5 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        {/* Tab Toggle: Channels vs DMs */}
                        <div className="px-3 pb-2 border-b border-slate-200/60 dark:border-slate-700/60 flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => setChatTab("channels")}
                            className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
                              chatTab === "channels"
                                ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-sm"
                                : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700/50"
                            }`}
                          >
                            <Users size={13} />
                            <span>Channels</span>
                            {totalChannelUnread > 0 && (
                              <span className="bg-red-500 text-white text-[9px] font-bold px-1.5 py-0.2 rounded-full">
                                {totalChannelUnread}
                              </span>
                            )}
                          </button>
                          <button
                            type="button"
                            onClick={() => setChatTab("dms")}
                            className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
                              chatTab === "dms"
                                ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-sm"
                                : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700/50"
                            }`}
                          >
                            <User size={13} />
                            <span>Direct (1:1)</span>
                            {totalDmUnread > 0 && (
                              <span className="bg-red-500 text-white text-[9px] font-bold px-1.5 py-0.2 rounded-full">
                                {totalDmUnread}
                              </span>
                            )}
                          </button>
                        </div>

                        {chatTab === "channels" ? (
                          <div className="max-h-64 overflow-y-auto custom-scrollbar pt-1">
                            <button
                              onClick={() => handleTargetSelect("All")}
                              className={`w-full flex items-center justify-between px-3.5 py-2.5 text-xs transition-colors ${
                                !selectedUser && targetRole === "All"
                                  ? "bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-semibold"
                                  : "text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50"
                              }`}
                            >
                              <span className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                                Global Team Chat
                              </span>
                              {(unreadByRole["All"] || 0) > 0 && (
                                <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full shadow-sm animate-in zoom-in">
                                  {unreadByRole["All"]}
                                </span>
                              )}
                            </button>

                            <div className="px-3.5 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                              Departments
                            </div>

                            {ROLES.map((r) => (
                              <button
                                key={r}
                                onClick={() => handleTargetSelect(r)}
                                className={`w-full flex items-center justify-between px-3.5 py-2 text-xs transition-colors ${
                                  !selectedUser && targetRole === r
                                    ? "bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-semibold"
                                    : "text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50"
                                }`}
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
                        ) : (
                          <div className="pt-2">
                            {/* Search Box */}
                            <div className="px-3 mb-2">
                              <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-100 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
                                <Search size={12} className="text-slate-400" />
                                <input
                                  type="text"
                                  value={userSearchQuery}
                                  onChange={(e) => setUserSearchQuery(e.target.value)}
                                  placeholder="Search colleague..."
                                  className="w-full bg-transparent text-xs text-slate-800 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none"
                                />
                              </div>
                            </div>

                            <div className="max-h-56 overflow-y-auto custom-scrollbar">
                              {filteredUsers.length === 0 ? (
                                <div className="py-4 text-center text-xs text-slate-400">
                                  No team members found
                                </div>
                              ) : (
                                filteredUsers.map((u) => {
                                  const isSelected = selectedUser?.id === u.id;
                                  const unreadCount = unreadByDm[u.id] || 0;
                                  return (
                                    <button
                                      key={u.id}
                                      onClick={() => handleSelectUserDm(u)}
                                      className={`w-full flex items-center justify-between px-3 py-2 text-xs transition-colors ${
                                        isSelected
                                          ? "bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-semibold"
                                          : "text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50"
                                      }`}
                                    >
                                      <div className="flex items-center gap-2.5 min-w-0">
                                        <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-500 text-white font-bold text-[11px] flex items-center justify-center flex-shrink-0">
                                          {u.name.charAt(0).toUpperCase()}
                                        </div>
                                        <div className="flex flex-col text-left min-w-0">
                                          <span className="truncate text-xs font-medium text-slate-800 dark:text-slate-200">
                                            {u.name}
                                          </span>
                                          <span className="text-[10px] text-slate-400 truncate">
                                            {u.role}
                                          </span>
                                        </div>
                                      </div>
                                      {unreadCount > 0 && (
                                        <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full shadow-sm animate-in zoom-in">
                                          {unreadCount}
                                        </span>
                                      )}
                                    </button>
                                  );
                                })
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
                <div className="flex items-center gap-1.5 text-[10px] text-slate-500 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  {selectedUser
                    ? `1:1 Direct Message • ${selectedUser.role}`
                    : targetRole === "All"
                    ? "Live • Public"
                    : "Live • Private Encrypted"}
                </div>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
              <X size={18} />
            </button>
          </div>

          {/* Messages Area */}
          <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-4 space-y-4 bg-transparent custom-scrollbar relative">
            {isFetching && (
               <div className="text-center py-2 text-xs text-slate-400">Loading messages...</div>
            )}
            {hasMore && messages.length >= 50 && (
              <div className="flex justify-center mb-4">
                <button 
                  onClick={handleLoadOlder}
                  disabled={isFetchingOlder}
                  className="px-3 py-1 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm border border-slate-200/50 dark:border-slate-700/50 rounded-full text-xs text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 shadow-sm transition-colors disabled:opacity-50"
                >
                  {isFetchingOlder ? "Loading older messages..." : "Load older messages"}
                </button>
              </div>
            )}

            {messages.length === 0 && !isFetching && (
               <div className="h-full flex flex-col items-center justify-center text-slate-400 opacity-50 space-y-2">
                 <MessageSquare size={32} />
                 <p className="text-sm">No messages yet</p>
               </div>
            )}

            {messages.map((msg, index) => {
              const isMe = (userData?.role === msg.senderRole && userData?.name === msg.senderName) ||
                           (Boolean(userData && msg.senderId && (userData.userId === msg.senderId || userData.id === msg.senderId)));
              const isMentioned = Boolean(userData && msg.taggedRoles && msg.taggedRoles.includes(userData.role));
              const canDelete = isMe || userData?.role === "Super Admin";
              const showDateDivider = index === 0 || isDifferentDay(messages[index - 1].createdAt, msg.createdAt);

              return (
                <React.Fragment key={msg._id}>
                  {showDateDivider && (
                    <div className="flex items-center justify-center my-3 select-none">
                      <div className="bg-slate-200/70 dark:bg-slate-800/80 backdrop-blur-md border border-slate-300/40 dark:border-slate-700/60 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 shadow-sm">
                        {getDateLabel(msg.createdAt)}
                      </div>
                    </div>
                  )}

                  <div className={`flex flex-col group ${isMe ? "items-end" : "items-start"}`}>
                    <div className="flex items-center gap-1.5 mb-1 mx-1">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{msg.senderRole}</span>
                      {!isMe && <span className="text-[11px] font-medium text-slate-400">{msg.senderName}</span>}
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
                        className={`max-w-[85%] px-3.5 py-2.5 rounded-2xl text-[12.5px] leading-relaxed shadow-sm relative ${
                          msg.isDeleted 
                            ? "bg-slate-100/50 dark:bg-slate-800/30 text-slate-400 dark:text-slate-500 italic rounded-tr-sm border border-slate-200/50 dark:border-slate-700/30"
                            : isMe 
                            ? "bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-900 rounded-tr-sm" 
                            : isMentioned && targetRole === "All"
                              ? "bg-amber-50/90 dark:bg-amber-950/40 text-slate-800 dark:text-amber-100 border border-amber-300/60 dark:border-amber-700/60 rounded-tl-sm ring-2 ring-amber-400/30" 
                              : "bg-white/90 dark:bg-slate-800/90 text-slate-700 dark:text-slate-200 border border-slate-200/60 dark:border-slate-700/60 rounded-tl-sm"
                        }`}
                      >
                        {isMentioned && !isMe && targetRole === "All" && (
                          <span className="block text-[9.5px] font-bold text-amber-600 dark:text-amber-400 mb-0.5 uppercase tracking-wider">
                            @ Mentioned
                          </span>
                        )}

                        {/* Image Attachment (24h Auto-deletion) */}
                        {msg.mediaKey && !msg.mediaDeleted && (
                          <div className="my-1.5 rounded-xl overflow-hidden border border-slate-300/60 dark:border-slate-700/80 max-w-[240px] relative group/photo shadow-sm">
                            <img
                              src={`/api/chat/media/${msg.mediaKey}`}
                              alt={msg.mediaName || "Site Photo"}
                              className="w-full max-h-56 object-cover cursor-pointer hover:scale-[1.02] transition-transform duration-200 block"
                              loading="lazy"
                              onClick={() => setViewerImage({
                                url: `/api/chat/media/${msg.mediaKey}`,
                                name: msg.mediaName || "Site Photo"
                              })}
                            />
                            <div className="absolute bottom-1 right-1 bg-black/65 backdrop-blur-md px-1.5 py-0.5 rounded text-[9.5px] font-medium text-white/95 flex items-center gap-1 shadow">
                              <Clock size={10} className="text-amber-400" />
                              <span>24h</span>
                            </div>
                          </div>
                        )}

                        {/* Expired Image Placeholder */}
                        {msg.mediaDeleted && (
                          <div className="flex items-center gap-1.5 my-1.5 text-[11px] text-slate-400 dark:text-slate-500 italic bg-slate-100/50 dark:bg-slate-800/40 px-2 py-1 rounded-md border border-slate-200/40 dark:border-slate-700/30">
                            <Clock size={11} className="text-slate-400" />
                            <span>Photo expired & deleted (24h limit)</span>
                          </div>
                        )}

                        {msg.isDeleted ? (
                          msg.message
                        ) : msg.message ? (
                          renderMessageContent(msg.message)
                        ) : null}
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
                    <span className="text-[9.5px] font-medium text-slate-400 dark:text-slate-500 mt-1 mx-1">
                      {formatMessageTime(msg.createdAt)}
                    </span>
                  </div>
                </React.Fragment>
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

            {/* Selected Image Preview Strip */}
            {filePreviewUrl && (
              <div className="mb-2 p-2 bg-slate-100/90 dark:bg-slate-800/90 backdrop-blur-md rounded-xl border border-slate-200/80 dark:border-slate-700/80 flex items-center justify-between animate-in fade-in slide-in-from-bottom-2">
                <div className="flex items-center gap-2.5 overflow-hidden">
                  <img
                    src={filePreviewUrl}
                    alt="Preview"
                    className="w-11 h-11 rounded-lg object-cover border border-slate-300 dark:border-slate-600 flex-shrink-0"
                  />
                  <div className="flex flex-col min-w-0">
                    <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[170px]">
                      {selectedFile?.name}
                    </span>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                        {selectedFile && (selectedFile.size / 1024).toFixed(0)} KB
                      </span>
                      <span className="text-[9px] bg-amber-100/90 dark:bg-amber-950/70 text-amber-700 dark:text-amber-300 px-1.5 py-0.5 rounded-full font-medium flex items-center gap-0.5">
                        <Clock size={9} />
                        24h auto-delete
                      </span>
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={cancelSelectedFile}
                  disabled={isUploading}
                  className="p-1.5 text-slate-400 hover:text-red-500 rounded-full hover:bg-slate-200/60 dark:hover:bg-slate-700/60 transition-colors"
                  title="Remove photo"
                >
                  <X size={15} />
                </button>
              </div>
            )}

            <form onSubmit={handleSendMessage} className="flex items-center gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="w-10 h-10 rounded-full flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex-shrink-0"
                title="Attach photo (< 1MB, 24h expiry)"
              >
                <Camera size={18} />
              </button>
              <input
                ref={inputRef}
                type="text"
                value={inputText}
                onChange={handleInputChange}
                onFocus={() => {
                  setTimeout(() => {
                    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
                  }, 300);
                }}
                placeholder={
                  selectedFile
                    ? "Add an optional caption..."
                    : selectedUser
                    ? `Message ${selectedUser.name}...`
                    : targetRole === "All"
                    ? "Type a message... use @ to tag"
                    : `Private message to ${targetRole}...`
                }
                className="flex-1 bg-white/50 dark:bg-slate-900/50 border border-slate-200/60 dark:border-slate-700/60 focus:bg-white dark:focus:bg-slate-800 focus:border-slate-400 dark:focus:border-slate-500 focus:ring-0 rounded-full px-4 py-2.5 text-[13.5px] transition-all shadow-sm placeholder:text-slate-400 dark:placeholder:text-slate-500 text-slate-800 dark:text-slate-200"
              />
              <button 
                type="submit"
                disabled={(!inputText.trim() && !selectedFile) || isUploading}
                className="w-10 h-10 rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 flex items-center justify-center disabled:opacity-50 hover:scale-105 transition-all flex-shrink-0 shadow-sm"
              >
                {isUploading ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Send size={16} className="ml-0.5" />
                )}
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

      {/* Fullscreen Image Viewer Modal */}
      {viewerImage && (
        <div 
          className="fixed inset-0 z-[250] bg-black/90 backdrop-blur-md flex flex-col items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setViewerImage(null)}
        >
          <div className="absolute top-4 right-4 flex items-center gap-2 z-10" onClick={(e) => e.stopPropagation()}>
            <a
              href={viewerImage.url}
              download={viewerImage.name}
              target="_blank"
              rel="noreferrer"
              className="p-2.5 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors flex items-center justify-center backdrop-blur-md"
              title="Download image"
            >
              <Download size={18} />
            </a>
            <button
              onClick={() => setViewerImage(null)}
              className="p-2.5 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors flex items-center justify-center backdrop-blur-md"
              title="Close"
            >
              <X size={18} />
            </button>
          </div>
          <div 
            className="max-w-full max-h-[85vh] flex flex-col items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={viewerImage.url}
              alt={viewerImage.name}
              className="max-w-full max-h-[80vh] object-contain rounded-xl shadow-2xl"
            />
            <div className="mt-3 text-xs text-white/80 font-medium bg-black/60 px-3 py-1 rounded-full backdrop-blur-sm border border-white/10 flex items-center gap-1.5">
              <span>{viewerImage.name}</span>
              <span>•</span>
              <span className="text-amber-400 flex items-center gap-1">
                <Clock size={11} />
                Auto-deletes in 24 hours
              </span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
