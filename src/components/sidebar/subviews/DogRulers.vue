<template>
    <div class="flex flex-col h-full bg-gradient-to-br from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
        <!-- 标签栏 -->
        <div class="p-3">
            <div class="flex p-1 bg-gray-200/50 dark:bg-gray-700/50 rounded-xl backdrop-blur-sm">
                <button 
                    v-for="tab in tabs" 
                    :key="tab.value"
                    @click="activeTab = tab.value"
                    :class="[
                        'flex-1 px-6 py-2.5 text-sm font-medium rounded-lg transition-all duration-300 relative',
                        activeTab === tab.value
                            ? 'text-gray-800 dark:text-white'
                            : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                    ]"
                >
                    {{ tab.label }}
                    <div
                        v-if="activeTab === tab.value"
                        class="absolute inset-0 bg-white dark:bg-gray-600 rounded-lg shadow-sm"
                        style="z-index: -1;"
                    ></div>
                </button>
            </div>
        </div>

        <!-- 内容区域 -->
        <div class="flex-1 overflow-y-auto overflow-x-hidden px-4">
            <transition
                enter-active-class="transition ease-out duration-200"
                enter-from-class="opacity-0 translate-y-1"
                enter-to-class="opacity-100 translate-y-0"
                leave-active-class="transition ease-in duration-150"
                leave-from-class="opacity-100 translate-y-0"
                leave-to-class="opacity-0 translate-y-1"
            >
                <div v-show="true" class="space-y-4">
                    <RuleList 
                        v-if="activeTab === 'filter'" 
                        :workspace="workspace"
                        :currentUser="currentUser"
                        :items="filterItems"
                        type="filter"
                        class="animate-fade-in"
                        @update:items="handleUpdateItems"
                        @userToggleItems="handleUserToggleItems"
                    />
                    <RuleList 
                        v-if="activeTab === 'color'" 
                        :workspace="workspace"
                        :currentUser="currentUser"
                        :items="colorItems"
                        type="color"
                        class="animate-fade-in"
                        @update:items="handleUpdateItems"
                        @userToggleItems="handleUserToggleItems"
                    />
                    <RuleList 
                        v-if="activeTab === 'function'" 
                        :workspace="workspace"
                        :currentUser="currentUser"
                        :items="functionItems"
                        type="function"
                        class="animate-fade-in"
                        @update:items="handleUpdateItems"
                        @userToggleItems="handleUserToggleItems"
                    />
                </div>
            </transition>
        </div>
    </div>
</template>

<script lang="ts">
import type { PropType } from 'vue';
import RuleList from './rulelist/RuleList.vue';
import type { User, Workspace } from '../../../modules/base';
import { ruleTableHelper } from '../../../utils/db';
import type { Rule } from '@/modules/base';
import { ruleApi } from '@/api';

export default {
    name: 'DogRulers',
    components: {
        RuleList
    },
    props: {
        workspace: {
            type: Object as PropType<Workspace>,
            required: true
        },
        currentUser: {
            type: Object as PropType<User>,
            required: true
        }
    },
    watch: {
        async workspace(newWorkspaceValue) {
            console.log('new workspace', newWorkspaceValue);

            this.rules = await this.getWorkspaceRulesFromDatabase();


            const localRules = await this.getWorkspaceRulesFromDatabase();
            const remoteRules = await ruleApi.getRules({ workspace_id: newWorkspaceValue.id });

            // remoteRules 中不存在的，直接删除
            for (const rule of localRules) {
                if (!remoteRules.some(r => r.uuid === rule.uuid)) {
                    await ruleTableHelper.delete(rule.uuid);
                }
            }
            // remoteRules 中存在的，直接添加或修改
            for (const rule of remoteRules) {
                await ruleTableHelper.insertOrUpdate(rule);
            }
            
            this.rules = await this.getWorkspaceRulesFromDatabase();

            this.$emit('configChanged', this.rules);
        }
    },
    computed: {
        filterItems(): Rule[] {
            return this.rules.filter((item: Rule) => item.rule_type === 'filter');
        },
        colorItems(): Rule[] {
            return this.rules.filter((item: Rule) => item.rule_type === 'color');
        },
        functionItems(): Rule[] {
            return this.rules.filter((item: Rule) => item.rule_type === 'function');
        }
    },
    data() {
        return {
            activeTab: 'filter',
            tabs: [
                { label: '过滤', value: 'filter' },
                { label: '颜色', value: 'color' },
                { label: '函数', value: 'function' }
            ],
            rules: [] as Rule[]
        }
    },
    async mounted() {
    },
    emits: ['configChanged', 'userToggleItems'],
    methods: {
        async getWorkspaceRulesFromDatabase() {
            const rules = await ruleTableHelper.getAll().then(rules => rules.filter((rule: Rule) => {
                return rule.workspace_id === this.workspace.id || rule.workspace_id === 1;
            }).reverse());
            for (const rule of rules) {
                if (rule.rule_type === 'color') {
                    rule._checked = true;
                }
            }

            // 按照创建时间排序
            rules.sort((a: Rule, b: Rule) => {
                if (a.created_at > b.created_at) {
                    return -1;
                } else if (a.created_at < b.created_at) {
                    return 1;
                } else {
                    return 0;
                }
            });
            return rules;
        },
        handleUserToggleItems(type: 'filter' | 'color' | 'function', item: Rule) {
            console.log('handleUserToggleItems', type, item);
            this.$emit('userToggleItems', type, item);
            this.$emit('configChanged', this.rules);
        },
        handleUpdateItems(type: 'filter' | 'color' | 'function', items: Rule[]) {
            // TODO
        }
    }
}
</script>

<style scoped>
.animate-fade-in {
    animation: fadeIn 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

@keyframes fadeIn {
    from {
        opacity: 0;
        transform: translateY(8px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}
</style>