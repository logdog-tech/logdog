<template>
    <div v-if="show" class="encoding-selector-overlay" @click.self="closeModal">
        <div class="encoding-selector">
            <div class="encoding-selector-title">Select Encoding</div>
            <div class="search-container">
                <input type="text" v-model="searchQuery" placeholder="Search encodings..." class="search-input"
                    @keydown.stop />
            </div>
            <div class="common-encodings" v-if="!searchQuery">
                <button v-for="encoding in commonEncodings" :key="encoding" @click="selectEncoding(encoding)"
                    :class="['encoding-button', { active: encoding === currentEncoding }]">
                    {{ encoding.toUpperCase() }}
                </button>
            </div>
            <div class="encoding-buttons">
                <button v-for="encoding in filteredEncodings" :key="encoding" @click="selectEncoding(encoding)"
                    :class="['encoding-button', { active: encoding === currentEncoding }]">
                    {{ encoding.toUpperCase() }}
                </button>
            </div>
            <div class="default-encoding-option">
                <label>
                    <input type="checkbox" v-model="isDefaultEncoding" @change="handleDefaultEncodingChange">
                    Set as default encoding
                </label>
            </div>
        </div>
    </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { settingsTableHelper } from '@/utils/db';

export default defineComponent({
    name: 'EncodingSelector',
    props: {
        show: {
            type: Boolean,
            required: false
        },
        encoding: {
            type: String,
            required: false,
            default: 'utf8'
        }
    },
    data() {
        return {
            searchQuery: '',
            isDefaultEncoding: false,
            commonEncodings: [
                'utf-8',
                'gb18030',
                'gbk',
                'big5',
                'shift-jis',
            ],
            encodings: [
                'utf-8',
                'utf-16le',
                'utf-16be',
                'gb18030',
                'gbk',
                'big5',
                'shift-jis',
                'euc-kr',
                'iso-8859-1',
                'windows-1252',
                'utf-32le',
                'utf-32be',
                'iso-8859-2',
                'iso-8859-3',
                'iso-8859-4',
                'iso-8859-5',
                'iso-8859-6',
                'iso-8859-7',
                'iso-8859-8',
                'iso-8859-9',
                'iso-8859-10',
                'iso-8859-11',
                'iso-8859-13',
                'iso-8859-14',
                'iso-8859-15',
                'iso-8859-16',
                'koi8-r',
                'koi8-u',
                'windows-1250',
                'windows-1251',
                'windows-1252',
                'windows-1253',
                'windows-1254',
                'windows-1255',
                'windows-1256',
                'windows-1257',
                'windows-1258',
                'x-mac-cyrillic'
            ]
        };
    },
    computed: {
        currentEncoding(): string {
            return this.encoding;
        },
        filteredEncodings(): string[] {
            const query = this.searchQuery.toLowerCase();
            const filtered = this.encodings.filter(enc =>
                enc.toLowerCase().includes(query)
            );
            return filtered;
        }
    },
    async created() {
        const defaultEncoding = await settingsTableHelper.getDefaultEncoding();
        this.isDefaultEncoding = this.encoding === defaultEncoding;
    },
    methods: {
        async selectEncoding(encoding: string) {
            this.$emit('update:encoding', encoding);
            this.$emit('update:show', false)

            if (this.isDefaultEncoding) {
                await settingsTableHelper.setDefaultEncoding(encoding);
            } else {
                await settingsTableHelper.setDefaultEncoding('');
            }
        },
        closeModal() {
            this.$emit('update:show', false)
        },
        async handleDefaultEncodingChange() {
            if (this.isDefaultEncoding) {
                await settingsTableHelper.setDefaultEncoding(this.currentEncoding);
            } else {
                await settingsTableHelper.setDefaultEncoding('');
            }
        },
    }
});
</script>

<style scoped>
.encoding-selector-overlay {
    position: fixed;
    top: 0;
    left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.4);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 1000;
    }
    
    .encoding-selector {
        background: white;
        border-radius: 8px;
        padding: 24px;
            width: 90%;
            max-width: 600px;
            max-height: 80vh;
            display: flex;
            flex-direction: column;
            box-shadow: 0 2px 12px rgba(0, 0, 0, 0.15);
        }
        
        .encoding-selector-title {
            font-size: 1.25em;
            font-weight: 600;
            margin-bottom: 20px;
                color: #2c3e50;
            }
            
            .search-container {
                margin-bottom: 20px;
            }
            
            .search-input {
                width: 100%;
                padding: 10px 12px;
                border: 1px solid #ddd;
                border-radius: 6px;
                font-size: 14px;
                transition: border-color 0.2s;
            }
            
            .search-input:focus {
                outline: none;
                border-color: #1890ff;
                box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.1);
            }
            
            .common-encodings {
                margin: 0 -8px 20px -8px;
                padding: 0 8px 20px 8px;
                border-bottom: 1px solid #eee;
                display: grid;
                grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
                gap: 10px;
            }
            
            .encoding-buttons {
                display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(110px, 1fr));
                    gap: 10px;
                    overflow-y: auto;
                    max-height: calc(50vh - 140px);
                    padding: 4px 8px 4px 0;
                    margin: 0 -8px;
                }
                
                .encoding-button {
                    padding: 8px 12px;
                        border: 1px solid #e8e8e8;
                        border-radius: 6px;
                        background: white;
                        cursor: pointer;
                        font-size: 13px;
                            transition: all 0.2s;
                            text-align: center;
                            color: #595959;
                                height: 36px;
                                display: flex;
                                align-items: center;
                                justify-content: center;
                            }
                            
                            .encoding-button:hover {
                                background: #f5f5f5;
                                border-color: #d9d9d9;
                            }
                            
                            .encoding-button.active {
                                background: #e6f7ff;
                                border-color: #1890ff;
                                color: #1890ff;
                            }
                            
                            .default-encoding-option {
                                padding: 10px;
                                border-top: 1px solid #eee;
                                margin-top: 10px;
                            }
                            
                            .default-encoding-option label {
                                display: flex;
                                align-items: center;
                                gap: 8px;
                                cursor: pointer;
                            }
                            
                            .default-encoding-option input[type="checkbox"] {
                                margin: 0;
                            }
                            
                            /* 滚动条样式 */
                            .encoding-buttons::-webkit-scrollbar {
                                width: 6px;
                            }
                            
                            .encoding-buttons::-webkit-scrollbar-track {
                                background: #f5f5f5;
                                border-radius: 3px;
                            }
                            
                            .encoding-buttons::-webkit-scrollbar-thumb {
                                background: #d9d9d9;
                                border-radius: 3px;
                            }
                            
                            .encoding-buttons::-webkit-scrollbar-thumb:hover {
                                background: #bfbfbf;
                            }
</style>

