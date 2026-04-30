<template>

    <div v-if="showFeedbackModal"
            class="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div class="mx-4 w-full max-w-md rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
                <div class="mb-4 flex items-center justify-between">
                    <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100">{{ $t('feedback.title') }}</h3>
                    <button @click="closeModal" class="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                        <i class="pi pi-times" />
                    </button>
                </div>
                <div class="text-center">
                    <p class="mb-4 text-gray-700 dark:text-gray-300">{{ $t('feedback.scanQRCode') }}</p>
                    <img src="/wechat-qr.jpg" alt="WeChat QR Code" class="mx-auto w-120 h-160 mb-4" />
                    <p class="text-sm text-gray-600 dark:text-gray-400">{{ $t('feedback.description') }}</p>
                </div>
            </div>
        </div>
</template>
<script lang="ts">

export default {
    name: 'FeedbackModal',
    props: {
        showFeedbackModal: {
            type: Boolean,
            default: false
        }
    },
    emits: ['update:showFeedbackModal'],
    methods: {
        closeModal() {
            this.$emit('update:showFeedbackModal', false);
        }
    }
}
</script>
