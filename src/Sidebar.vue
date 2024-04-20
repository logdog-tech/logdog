<template>
  <div class="sidebar">
    <div v-bind="containerProps" style="height: 300px; width: 500%">
      <div v-bind="wrapperProps">
        <div v-for="item in list" :key="item.index" style="height: 24px; line-height: 24px; font-size: small; display: flex">
          <div v-html="highlight(item.data)"></div>
        </div>
      </div>
    </div>
    <h5>文本文件输入</h5>
    <input type="file" @change="readFile" accept=".txt" class="form-control mb-4">
    <hr>
    <h5>高亮规则</h5>
    <div v-for="rule in rules" :key="rule.id" class="rule-item" 
        @dblclick="editRule(rule)"
        :style="{ color: rule.foreColor, backgroundColor: rule.backColor }">
      <p class="rule-name">{{ rule.name }}</p>
      <span @click.stop="deleteRule(rule)" class="delete-btn">&times;</span>
    </div>
    <h5>{{ isEditing ? '编辑' : '新增' }}</h5>
    <div class="mb-3">
      <label class="form-label">规则名称</label>
      <input v-model="editedRule.name" placeholder="规则名称" class="form-control">
    </div>
    <div class="mb-3">
      <label class="form-label">过滤条件（正则表达式）</label>  
      <input v-model="editedRule.regex" placeholder="正则表达式" class="form-control">
    </div>
    <div class="mb-3">
      <label class="form-label">前景色</label>
      <input v-model="editedRule.foreColor" type="color" class="form-control form-control-color">
    </div>
    <div class="mb-3">
      <label class="form-label">背景色</label>
      <input v-model="editedRule.backColor" type="color" class="form-control form-control-color">
    </div>
    <button @click="saveRule" :disabled="!isValidRule" class="btn btn-primary me-2">
      {{ isEditing ? '保存' : '添加' }}
    </button>
    <button v-if="isEditing" @click="cancelEdit" class="btn btn-secondary">取消</button>
  </div>
</template>

<script setup>
  import { ref, computed } from 'vue'
  import { useVirtualList } from '@vueuse/core'

  const props = defineProps({
    fileContent: {
      type: String,
      required: true
    },
    rules: {
      type: Array,
      required: true
    },
    editedRule: {
      type: Object,
      required: true
    },
    isEditing: {
      type: Boolean,
      required: true
    },
    highlight: {
      type: Function,
      required: true
    },
    readFile: {
      type: Function,
      required: true
    },
    editRule: {
      type: Function,
      required: true
    },
    deleteRule: {
      type: Function,
      required: true
    },
    saveRule: {
      type: Function,
      required: true
    },
    cancelEdit: {
      type: Function,
      required: true
    }
  })

  const mylines = computed(() => {
    const items = props.fileContent.split('\n')
    return items
  })
  const { list, containerProps, wrapperProps } = useVirtualList(mylines, { itemHeight: 24 })
</script>

<style scoped>
  .sidebar {
    width: 300px;
    padding: 14px;
    background-color: #f8f9fa;
    border-right: 1px solid #dee2e6;
    overflow-y: auto;
  }

  .rule-item {
    margin-bottom: 10px;
    padding:4px 8px;
    border-radius: 5px;
    cursor: pointer;
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    box-shadow: 0 1px 3px rgba(0,0,0,.2);
  }

  .rule-name {
    margin: 0;
  }

  .delete-btn {
    float: right;
    color: #dc3545;
    font-size: 14px;
    line-height: 1;
    cursor: pointer;
  }

  .delete-btn:hover {
    color: #b02a37;
    float: right;
    color: #dc3545;
    font-size: 14px;
    cursor: pointer;
    vertical-align: bottom;
  }
</style>