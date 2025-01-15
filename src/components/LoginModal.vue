<template>
    <div v-if="modelValue" class="modal-overlay" @click="closeModal">
        <div class="modal-content" @click.stop>
            <button class="close-button" @click="closeModal">×</button>

            <div class="modal-body">
                <h2>{{ $t('login.title') }}</h2>
                <p class="subtitle">{{ $t('login.subtitle') }}</p>

                <div class="login-methods">
                    <button class="login-btn wechat" @click="handleWechatLogin">
                        <img src="@/assets/wechat-icon.svg" alt="WeChat" />
                        {{ $t('login.wechat') }}
                    </button>
                </div>

                <div class="divider">
                    <span>{{ $t('login.other_login') }}</span>
                </div>

                <div class="other-login-methods">
                    <button class="icon-btn google" @click="handleGoogleLogin" :title="$t('login.google')">
                        <img src="@/assets/google-icon.svg" alt="Google" />
                    </button>
                    <button class="icon-btn github" @click="handleGithubLogin" :title="$t('login.github')">
                        <img src="@/assets/github-icon.svg" alt="GitHub" />
                    </button>
                    <button class="icon-btn linuxdo" @click="handleLinuxdoLogin" :title="$t('login.linuxdo')">
                        <img src="@/assets/linuxdo-icon.png" alt="Linux.do" />
                    </button>
                </div>

                <p class="terms">
                    {{ $t('login.terms_prefix') }}
                    <a href="#" @click.stop="openTerms">{{ $t('login.terms') }}</a> {{ $t('login.and') }}
                    <a href="#" @click.stop="openPrivacy">{{ $t('login.privacy') }}</a>
                </p>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
defineProps<{
    modelValue: boolean
}>()

const emit = defineEmits<{
    (e: 'update:modelValue', value: boolean): void
}>()

const closeModal = () => {
    emit('update:modelValue', false)
}

const handleWechatLogin = () => {
    window.location.href = "https://api.logdog.tech/login?redirect_url=" + window.location.href;
}

const handleLinuxdoLogin = () => {
    window.location.href = "https://connect.linux.do/oauth2/authorize?response_type=code&client_id=0zjnSRcIJ4kwusuVleRcfgEbVE90H5f8&state=ttt1" + window.location.href;
}

const handleGoogleLogin = async () => {
    window.location.href = `${import.meta.env.VITE_API_BASE_URL}/auth/google`
}

const handleGithubLogin = async () => {
    window.location.href = `${import.meta.env.VITE_API_BASE_URL}/auth/github`
}

const openTerms = () => {
    // TODO: Open terms of use
    console.log('Terms clicked')
}

const openPrivacy = () => {
    // TODO: Open privacy policy
    console.log('Privacy clicked')
}
</script>

<style scoped>
.modal-overlay {
    position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background-color: rgba(0, 0, 0, 0.5);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 1000;
    }
    
    .modal-content {
        background: white;
        padding: 2rem;
        border-radius: 12px;
        width: 100%;
        max-width: 400px;
        position: relative;
        animation: modal-appear 0.3s ease-out;
    }
    
    @keyframes modal-appear {
        from {
            opacity: 0;
            transform: translateY(20px);
        }
    
                to {
                    opacity: 1;
                    transform: translateY(0);
                }
                }
        
                .close-button {
                    position: absolute;
                    top: 1rem;
                    right: 1rem;
                    background: none;
                    border: none;
                    font-size: 1.5rem;
                    cursor: pointer;
                    color: #666;
                    padding: 0.5rem;
                }
        
                .close-button:hover {
                    color: #333;
                }
        
                .modal-body {
                    text-align: center;
                }
        
                h2 {
                    margin: 0 0 0.5rem;
                    color: #333;
                    font-size: 1.5rem;
                }
        
                .subtitle {
                    color: #666;
                    margin-bottom: 2rem;
                    font-size: 0.9rem;
                }
        
                .login-methods {
                    display: flex;
                    flex-direction: column;
                    gap: 0.75rem;
                    margin-bottom: 1.5rem;
                }
        
                .login-btn {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 0.75rem;
                    padding: 0.75rem;
                    border: 1px solid #ddd;
                    border-radius: 8px;
                    background: white;
                    cursor: pointer;
                    font-size: 1rem;
                    width: 100%;
                    transition: all 0.2s;
                }
        
                .login-btn img {
                    width: 20px;
                    height: 20px;
                }
        
                .login-btn.wechat {
                    background-color: #07C160;
                    color: white;
                    border: none;
                }
        
                .login-btn.wechat:hover {
                    background-color: #06B057;
                }
        
                .other-login-methods {
                    display: flex;
                    justify-content: center;
                    gap: 1rem;
                    margin: 1.5rem 0;
                }
        
                .icon-btn {
                    width: 40px;
                    height: 40px;
                    border-radius: 50%;
                    border: 1px solid #ddd;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    transition: all 0.2s;
                    padding: 0;
                    background: white;
                }
        
                .icon-btn img {
                    width: 20px;
                    height: 20px;
                }
        
                .icon-btn.google:hover {
                    background-color: #f8f8f8;
                    border-color: #ccc;
                }
        
                .icon-btn.github {
                    background-color: #24292e;
                    border: none;
                }
        
                .icon-btn.github:hover {
                    background-color: #2f363d;
                }
        
                .icon-btn.linuxdo:hover {
                    background-color: #f8f8f8;
                    border-color: #ccc;
                }
        
                .divider {
                    display: flex;
                    align-items: center;
                    text-align: center;
                    margin: 1.5rem 0;
                }
        
                .divider::before,
                .divider::after {
                    content: '';
                    flex: 1;
                    border-bottom: 1px solid #ddd;
                }
        
                .divider span {
                    padding: 0 0.75rem;
                    color: #666;
                    font-size: 0.9rem;
                }
        
                .terms {
                    margin-top: 1.5rem;
                    font-size: 0.8rem;
                    color: #666;
                }
        
                .terms a {
                    color: #007AFF;
                    text-decoration: none;
}

.terms a:hover {
    text-decoration: underline;
}
</style>
