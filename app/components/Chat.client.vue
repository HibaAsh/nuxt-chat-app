<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, nextTick, computed } from 'vue'
import { useChatStore } from '~/stores/chat'
import { onAuthStateChanged } from 'firebase/auth'
import { useI18n } from '#imports'

const chat = useChatStore()
const input = ref('')
const { $socket, $socketLogout, $auth, $signIn, $signOut } = useNuxtApp()
const messagesEnd = ref<HTMLElement | null>(null)
const user = ref(null as null | any)
const username = ref('')
const userId = ref('')

const { t, locale } = useI18n()

const isRTL = computed(() => locale.value === 'ar')
const sidebarOpen = ref(false)
const sidebarRef = ref<HTMLElement | null>(null)

const handleClickOutside = (e: MouseEvent) => {
  if (sidebarOpen.value && sidebarRef.value && !sidebarRef.value.contains(e.target as Node)) {
    sidebarOpen.value = false
  }
}
onMounted(() => document.addEventListener('click', handleClickOutside))
onBeforeUnmount(() => document.removeEventListener('click', handleClickOutside))

const scrollToBottom = () => {
  nextTick(() => {
    if (messagesEnd.value) {
      messagesEnd.value.scrollIntoView({ behavior: 'smooth' })
    }
  })
}

// Sorted users: current user first
const sortedUsers = computed(() => {
  if (!userId.value) return chat.users
  return [
    ...chat.users.filter(u => u.uid === userId.value),
    ...chat.users.filter(u => u.uid !== userId.value)
  ]
})

// Logout handler
function handleSignOut() {
  if (!user.value) return

  // Emit logout for server
  if (userId.value) $socketLogout(userId.value)

  // Reset chat store
  chat.setUsers(chat.users.filter(u => u.uid !== userId.value))
  chat.setOnlineUsers(chat.onlineUsers.filter(uid => uid !== userId.value))
  chat.setCurrentUserId(null)
  chat.currentChatUser = null
  chat.currentRoom = null

  user.value = null
  username.value = ''
  userId.value = ''

  // Sign out from Firebase
  $signOut()
}

// Firebase auth state
onMounted(() => {
  onAuthStateChanged($auth, (u) => {
    if (u) {
      user.value = u
      username.value = u.displayName || 'Anonymous'
      userId.value = u.uid
      chat.setCurrentUserId(userId.value)

      $socket.emit('register', {
        uid: userId.value,
        displayName: username.value,
        photoURL: user.value.photoURL
      })
    } else {
      user.value = null
      username.value = ''
      userId.value = ''
      chat.setCurrentUserId(null)
    }
  })

  // Listen for online users update from server
  $socket.on('users', (users: any[]) => {
    chat.setUsers(users)
    chat.setOnlineUsers(users.map(u => u.uid))
  })

  $socket.on('private-message', (msg: any) => {
    chat.addMessage({ ...msg, fromUid: msg.fromUid, toUid: msg.toUid }, false)
    scrollToBottom()
  })

  $socket.on('group-message', (msg: any) => {
    chat.addMessage({ ...msg, fromUid: msg.fromUid }, false)
    scrollToBottom()
  })

  $socket.on('message-ack', (msg: any) => {
    if (msg.toUid) {
      chat.addMessage({ ...msg, fromUid: userId.value, toUid: msg.toUid }, true)
    } else {
      chat.addMessage({ ...msg, fromUid: userId.value }, true)
    }
    scrollToBottom()
  })
})

onBeforeUnmount(() => {
  $socket.off('users')
  $socket.off('private-message')
  $socket.off('group-message')
  $socket.off('message-ack')
})

function sendMessage() {
  if (!input.value.trim() || !userId.value) return

  const baseMsg = {
    text: input.value.trim(),
    ts: Date.now(),
    id: `${userId.value}_${Date.now()}`
  }

  if (chat.currentChatUser) {
    const msg = {
      ...baseMsg,
      from: username.value,
      fromUid: userId.value,
      to: chat.users.find(u => u.uid === chat.currentChatUser)?.displayName,
      toUid: chat.currentChatUser
    }
    $socket.emit('private-message', msg)
  } else if (chat.currentRoom) {
    const msg = {
      ...baseMsg,
      from: username.value,
      fromUid: userId.value,
      room: chat.currentRoom
    }
    $socket.emit('group-message', msg)
  }

  input.value = ''
  if (sidebarOpen.value) sidebarOpen.value = false
}
</script>

<template>
  <div class="flex h-screen relative">
    <!-- Mobile toggle button -->
    <button
      @click="sidebarOpen = !sidebarOpen"
      class="sm:hidden absolute top-2.5 z-50 p-2 px-3 bg-primary text-text rounded hover:opacity-90 hover:bg-background transition"
      :class="isRTL ? 'left-4' : 'right-4'"
    >
      ☰
    </button>

    <!-- Sidebar -->
    <aside
      ref="sidebarRef"
      :class="[ 
        'fixed sm:static inset-y-0 w-64 bg-background border-r border-text flex flex-col z-40 transition-transform duration-300',
        sidebarOpen
          ? 'translate-x-0'
          : isRTL
            ? 'translate-x-full'
            : '-translate-x-full',
        'sm:translate-x-0'
      ]"
    >
      <div class="mb-16 pb-3 overflow-y-auto">
        <div class="p-4 border-b border-text flex items-center justify-between">
          <div v-if="!user">
            <button @click="$signIn()" class="px-3 py-1 bg-primary text-white rounded hover:bg-text hover:text-background text-sm transition">
              {{ t('login') }}
            </button>
          </div>
          <div v-else class="flex flex-col gap-2">
            <Avatar :image="user.photoURL" :online="true" :size="50" />
            <div class="flex flex-col items-start text-sm text-text truncate">
              <span class="text-sm text-text truncate">{{ username }}</span>
              <button @click="handleSignOut()" class="text-xs text-red-500 hover:underline mt-1">{{ t('logout') }}</button>
            </div>
          </div>
        </div>
  
        <!-- Rooms -->
        <div class="flex flex-col gap-6 overflow-y-auto p-4">
          <div v-if="chat.rooms.length > 0">
            <h4 class="font-semibold text-text mb-2">{{ t('rooms') }}</h4>
            <ul>
              <li v-for="r in chat.rooms" :key="r"
                  @click="() => { chat.openRoom(r); sidebarOpen=false }"
                  :class="[ 
                    'cursor-pointer p-2 rounded flex justify-between items-center',
                    chat.currentRoom === r ? 'bg-primary text-text' : 'hover:bg-text hover:text-primary'
                  ]">
                <span># {{ r }}</span>
                <span v-if="chat.unreadRooms[r]" class="bg-primary text-text text-xs rounded-full px-2 py-0.5">
                  {{ chat.unreadRooms[r] }}
                </span>
              </li>
            </ul>
          </div>

          <!-- Private Users -->
          <div v-if="chat.users.length > 0">
            <h4 class="font-semibold text-text">{{ t('private-chats') }}</h4>
            <ul>
              <li v-for="u in sortedUsers" :key="u.uid"
                  @click="() => { chat.openPrivateChat(u.uid); sidebarOpen=false }"
                  :class="[ 
                    'cursor-pointer p-2 rounded flex justify-between items-center',
                    chat.currentChatUser === u.uid ? 'bg-primary' : 'hover:bg-text hover:text-primary'
                  ]">
                <div class="flex items-center gap-2">
                  <Avatar :image="u.photoURL" :online="true" :size="40" />
                  <span>{{ u.displayName }}</span>
                </div>
                <span v-if="chat.unread[u.uid]" class="bg-primary text-text text-xs rounded-full px-2 py-0.5">
                  {{ chat.unread[u.uid] }}
                </span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div class="absolute bottom-0 left-0 right-0 flex justify-center gap-2 pb-6">
        <ThemeSwitcher />
        <LocaleSwitcher />
      </div>
    </aside>

    <!-- Chat Window -->
    <main class="flex-1 flex flex-col text-text">
      <div class="p-4 bg-primary border-b border-text">
        <h2 class="text-lg font-semibold">
          <div v-if="chat.currentChatUser" class="flex items-center gap-2">
            <Avatar :image="chat.users.find(u => u.uid === chat.currentChatUser)?.photoURL" :online="true" :size="50" />
            <span>{{ chat.users.find(u => u.uid === chat.currentChatUser)?.displayName || 'Unknown User' }}</span>
          </div>
          <span v-else># {{ chat.currentRoom }}</span>
        </h2>
      </div>

      <div class="flex-1 overflow-y-auto p-4 space-y-4 flex flex-col">
        <div v-for="msg in chat.currentMessages" :key="msg.id"
             :class="[
               'max-w-xs p-3 rounded-lg break-words',
               msg.isOwn ? 'bg-primary text-text' : 'bg-text text-background'
             ]"
             :style="{
               alignSelf: msg.isOwn ? (isRTL.value ? 'flex-start' : 'flex-end') : (isRTL.value ? 'flex-end' : 'flex-start'),
               direction: msg.isOwn ? (isRTL.value ? 'ltr' : 'ltr') : (isRTL.value ? 'rtl' : 'ltr'),
               textAlign: msg.isOwn ? (isRTL.value ? 'left' : 'right') : (isRTL.value ? 'right' : 'left')
             }"
        >
          <p class="text-sm text-primary font-semibold mb-1" v-if="!msg.isOwn">{{ msg.from }}</p>
          <p class="text-sm">{{ msg.text }}</p>
          <p class="text-xs mt-1 opacity-75">{{ new Date(msg.ts).toLocaleTimeString() }}</p>
        </div>
        <div ref="messagesEnd"></div>
      </div>

      <div class="p-4 bg-primary border-t border-text flex items-center gap-2">
        <input v-model="input" @keyup.enter="sendMessage" type="text" :placeholder="t('message')"
          class="flex-1 p-3 text-primary rounded-lg border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-background"
          :disabled="!user" />
        <button @click="sendMessage"
          class="h-full flex items-center px-4 py-2 cursor-pointer bg-background rounded-lg hover:bg-text hover:text-background transition disabled:opacity-50"
          :disabled="!user || !input.trim()">
          <Icon name="streamline:mail-send-email-message" class="bg-text" size="20" />
        </button>
      </div>
    </main>
  </div>
</template>

<style scoped>
aside {
  transition: transform 0.3s ease;
}
#chat-window {
  scroll-behavior: smooth;
}
</style>
