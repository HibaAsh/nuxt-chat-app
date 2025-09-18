// stores/chat.ts
import { defineStore } from "pinia";

export type ChatMessage = {
  id: string;
  from: string;
  fromUid: string;  // Added UID for consistent identification
  to?: string; // undefined for group messages
  toUid?: string; // Added UID for consistent identification
  text: string;
  ts: number;
  room?: string;
  isOwn?: boolean; // Flag to identify if message is sent by current user
};

export type User = {
  uid: string;
  displayName: string;
  photoURL?: string;
};

export const useChatStore = defineStore("chat", {
  state: () => ({
    users: [] as any[],
    onlineUsers: [] as string[], // array of online user UIDs
    rooms: ["general"] as string[],
    currentChatUser: null as null | string, // private chat (UID)
    currentRoom: "general", // group chat
    conversations: {} as Record<string, ChatMessage[]>, // messages keyed by user UID or room
    unread: {} as Record<string, number>, // unread messages for users
    unreadRooms: {} as Record<string, number>, // unread messages for rooms
    currentUserId: null as null | string, // Track current user ID
  }),
  actions: {
    setUsers(users: any[]) {
      this.users = users;
    },
    setOnlineUsers(uids: string[]) {
      this.onlineUsers = uids
    },
    isUserOnline(uid: string) {
      return this.onlineUsers.includes(uid)
    },
    setRooms(rooms: string[]) {
      this.rooms = rooms;
    },
    
    setCurrentUserId(uid: string) {
      this.currentUserId = uid;
    },

    // Private chat
    openPrivateChat(uid: string) {
      this.currentChatUser = uid;
      this.unread[uid] = 0;
      this.currentRoom = "";
    },

    // Group chat
    openRoom(room: string) {
      this.currentRoom = room;
      this.currentChatUser = null;
      this.unreadRooms[room] = 0;
    },

    // Generate consistent conversation key for private messages
    getPrivateConversationKey(uid1: string, uid2: string): string {
      // Always sort UIDs to ensure same key for both users
      return [uid1, uid2].sort().join('_');
    },

    addMessage(msg: ChatMessage, isOwn: boolean = false) {
      // Add isOwn flag to message
      const messageWithOwnFlag = { ...msg, isOwn };
      
      let key: string;
      
      if (msg.toUid && this.currentUserId) {
        // Private message: use consistent key generation
        key = this.getPrivateConversationKey(msg.fromUid, msg.toUid);
      } else if (msg.room) {
        // Group message
        key = msg.room;
      } else {
        // Fallback to general room
        key = 'general';
      }

      // Initialize conversation array if it doesn't exist
      if (!this.conversations[key]) {
        this.conversations[key] = [];
      }
      
      // Check if message already exists to prevent duplicates
      const messageExists = this.conversations[key].some(
        m => m.id === messageWithOwnFlag.id || 
             (m.fromUid === messageWithOwnFlag.fromUid && m.ts === messageWithOwnFlag.ts)
      );
      
      if (!messageExists) {
        this.conversations[key].push(messageWithOwnFlag);
        
        // Sort messages by timestamp
        this.conversations[key].sort((a, b) => a.ts - b.ts);
      }

      // Update unread counters only if message is not from current user
      // and not in the current view
      if (!isOwn) {
        if (msg.toUid && this.currentUserId) {
          const privateKey = this.getPrivateConversationKey(msg.fromUid, msg.toUid);
          if (privateKey !== this.getPrivateConversationKey(this.currentUserId, this.currentChatUser || '')) {
            this.unread[msg.fromUid] = (this.unread[msg.fromUid] || 0) + 1;
          }
        } else if (msg.room && msg.room !== this.currentRoom) {
          this.unreadRooms[msg.room] = (this.unreadRooms[msg.room] || 0) + 1;
        }
      }
    }
  },
  getters: {
    currentMessages: (state) => {
      if (state.currentChatUser && state.currentUserId) {
        // For private chats, use the consistent key
        const key = [state.currentUserId, state.currentChatUser].sort().join('_');
        return state.conversations[key] || [];
      } else if (state.currentRoom) {
        // For group chats
        return state.conversations[state.currentRoom] || [];
      }
      return [];
    },
  },
});