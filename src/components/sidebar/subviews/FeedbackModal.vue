<template>

    <div v-if="showFeedbackModal"
            class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div class="bg-white rounded-lg p-6 max-w-md w-full mx-4">
                <div class="flex justify-between items-center mb-4">
                    <h3 class="text-lg font-semibold">{{ $t('feedback.title') }}</h3>
                    <button @click="closeModal" class="text-gray-500 hover:text-gray-700">
                        <i class="pi pi-times" />
                    </button>
                </div>
                <div class="text-center">
                    <p class="mb-4">{{ $t('feedback.scanQRCode') }}</p>
                    <img src="/wechat-qr.jpg" alt="WeChat QR Code" class="mx-auto w-120 h-160 mb-4" />
                    <p class="text-sm text-gray-600">{{ $t('feedback.description') }}</p>
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