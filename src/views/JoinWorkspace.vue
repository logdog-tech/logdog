<template>
  <div class="fixed inset-0 bg-gray-50 flex items-center justify-center">
    <div class="max-w-lg w-full mx-4">
      <!-- Logo 和标题 -->
      <div class="text-center mb-8">
        <div class="w-24 h-24 mx-auto mb-4">
          <img src="@/assets/logo-fill.svg" alt="LogDog" class="w-full h-full">
        </div>
        <h1 class="text-2xl font-bold text-gray-900">{{ $t('joinWorkspace.title') }}</h1>
      </div>

      <!-- 主要内容卡片 -->
      <div class="bg-white rounded-xl shadow-lg overflow-hidden">
        <!-- 加载状态 -->
        <div v-if="loading" class="p-8 text-center">
          <div class="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-500 border-t-transparent mb-4"></div>
          <p class="text-gray-600">{{ $t('joinWorkspace.loading') }}</p>
        </div>

        <!-- 未登录状态 -->
        <div v-else-if="!isLoggedIn" class="p-8">
          <div class="text-center">
            <div class="rounded-full bg-blue-100 p-4 inline-block mb-4">
              <i class="pi pi-user text-blue-500 text-2xl"></i>
            </div>
            <h2 class="text-xl font-semibold text-gray-900 mb-2">{{ $t('joinWorkspace.needLogin') }}</h2>
            <p class="text-gray-600 mb-6">{{ $t('joinWorkspace.loginPrompt') }}</p>
            <button @click="handleLogin" 
                    class="w-full bg-blue-500 text-white rounded-lg py-3 px-4 hover:bg-blue-600 transition-colors">
              {{ $t('joinWorkspace.loginNow') }}
            </button>
          </div>
        </div>

        <!-- 错误状态 -->
        <div v-else-if="error" class="p-8">
          <div class="text-center">
            <div class="rounded-full bg-red-100 p-4 inline-block mb-4">
              <i class="pi pi-times-circle text-red-500 text-2xl"></i>
            </div>
            <h2 class="text-xl font-semibold text-gray-900 mb-2">{{ error }}</h2>
            <p v-if="countdown > 0" class="text-gray-500 mb-4">
              {{ countdown }}{{ $t('joinWorkspace.autoReturn') }}
            </p>
            <router-link to="/" 
                        class="inline-block text-blue-500 hover:text-blue-600 transition-colors">
              {{ $t('joinWorkspace.returnHome') }}
            </router-link>
          </div>
        </div>

        <!-- 成功状态 -->
        <div v-else class="p-8">
          <div class="text-center">
            <div class="rounded-full bg-green-100 p-4 inline-block mb-4">
              <i class="pi pi-check-circle text-green-500 text-2xl"></i>
            </div>
            <h2 class="text-xl font-semibold text-gray-900 mb-2">{{ message }}</h2>
            <p v-if="countdown > 0" class="text-gray-500 mb-4">
              {{ countdown }}{{ $t('joinWorkspace.autoReturn') }}
            </p>
            <router-link to="/" 
                        class="inline-block text-blue-500 hover:text-blue-600 transition-colors">
              {{ $t('joinWorkspace.returnHome') }}
            </router-link>
          </div>
        </div>
      </div>

      <!-- 底部信息 -->
      <div class="mt-8 text-center text-gray-500 text-sm">
        <p>&copy; 2024 LogDog. All rights reserved.</p>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { useRouter } from 'vue-router'
import { workspaceApi, userApi } from '../api'

interface ApiError {
  detail: string;
  message?: string;
  workspace_id?: number;
}

export default defineComponent({
  name: 'JoinWorkspace',
  props: {
    code: {
      type: String,
      required: true
    }
  },
  setup() {
    const router = useRouter()
    return { router }
  },
  data() {
    return {
      loading: true,
      error: '',
      message: '',
      countdown: 3,
      countdownTimer: null as number | null,
      isLoggedIn: false,
    }
  },
  methods: {
    startCountdown() {
      this.countdown = 3;
      this.countdownTimer = window.setInterval(() => {
        this.countdown--;
        if (this.countdown <= 0) {
          this.clearCountdown();
          this.router.push('/');
        }
      }, 1000);
    },
    clearCountdown() {
      if (this.countdownTimer) {
        clearInterval(this.countdownTimer);
        this.countdownTimer = null;
      }
    },
    handleLogin() {
      const currentUrl = window.location.href;
      window.location.href = `https://api.logdog.tech/login?redirect_url=${encodeURIComponent(currentUrl)}`;
    },
    async checkLoginStatus() {
      try {
        await userApi.getUserInfo();
        this.isLoggedIn = true;
        return true;
      } catch {
        this.isLoggedIn = false;
        return false;
      }
    }
  },
  async mounted() {
    try {
      const isLoggedIn = await this.checkLoginStatus();
      if (!isLoggedIn) {
        this.loading = false;
        return;
      }

      const result = await workspaceApi.joinWorkspaceByInvitation(this.code);
      this.message = result.message;
      this.startCountdown();
    } catch (error) {
      const apiError = error as ApiError;
      this.error = apiError.detail || apiError.message || this.$t('joinWorkspace.errorJoin');
      if (apiError.detail?.includes(this.$t('joinWorkspace.alreadyMember'))) {
        this.startCountdown();
      }
    } finally {
      this.loading = false;
    }
  },
  beforeUnmount() {
    this.clearCountdown();
  }
})
</script> 