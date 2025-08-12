<template>
  <div class="log-viewer">
    <!-- HugeList 自身作为纵向 & 横向滚动容器 -->
    <HugeList
      class="log-list"
      :wrap="wrap"
      :rowCount="12340000000"
      :rowHeight="ROW_HEIGHT"
      :style="`height:${VIEWPORT_HEIGHT}px; width:100%;`"
    >
      <template #default="{ index }">
        <div class="log-item">
          <div class="line-number" @click="toggleMark(index)">
            <span>{{ index + 1 }}</span>
          </div>
          <div
            class="log-line"
            :class="{ marked: marked.has(index) }"
            :title="logs[index % 100]"
          >
            {{ logs[index % 100] }}
          </div>
        </div>
      </template>
    </HugeList>
     <input key="wrap" type="checkbox" v-model="wrap" name="wrap">Wrap lines</input>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue';
import HugeList from '../components/HugeList.vue';

export default defineComponent({
  name: 'LogViewerExample',
  components: { HugeList },
  setup() {
    const ROW_COUNT = 1000;
    const ROW_HEIGHT = 30;
    const VIEWPORT_HEIGHT = 600;

    const logs = ref<string[]>(new Array(ROW_COUNT));
    const marked = ref<Set<number>>(new Set());
    const wrap = ref(true);

    function randInt(min: number, max: number) {
      return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    function randomBody(len: number) {
      const chars =
        'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789 _-/.:@[]{}()+=,';
      let out = '';
      for (let i = 0; i < len; i++) {
        out += chars[randInt(0, chars.length - 1)];
      }
      return out;
    }

    function generateRandomLogs() {
      const levels = ['INFO', 'DEBUG', 'WARN', 'ERROR', 'TRACE'];
      const tags = [
        'SERVICE',
        'HTTP',
        'Worker',
        'Task',
        'Auth',
        'Cache',
        'DB',
        'Kafka',
        'Init',
        'Config',
        'Health'
      ];
      const now = Date.now();
      for (let i = 0; i < ROW_COUNT; i++) {
        const ts = new Date(now - (ROW_COUNT - i) * 17)
          .toISOString()
          .replace('T', ' ')
          .replace('Z', '');
        const pid = randInt(1000, 9999);
        const tid = randInt(1000, 9999);
        const level = levels[randInt(0, levels.length - 1)];
        const tag = tags[randInt(0, tags.length - 1)];
        const msgLen = randInt(50, 2000);
        const body = randomBody(msgLen);
        logs.value[i] = `${ts} ${pid} ${tid} ${level} ${tag}: ${body}`;
      }
    }

    function toggleMark(index: number) {
      if (marked.value.has(index)) {
        marked.value.delete(index);
      } else {
        marked.value.add(index);
      }
      // 触发响应式（Set 内容变更 Vue 不自动追踪）
      marked.value = new Set(marked.value);
    }

    generateRandomLogs();

    return {
      ROW_COUNT,
      ROW_HEIGHT,
      VIEWPORT_HEIGHT,
      logs,
      marked,
      toggleMark,
      wrap
    };
  }
});
</script>

<style scoped>
.log-viewer {
  font-family: monospace;
  background: #fff;
  color: #222;
}

/* 允许横向滚动：HugeList 根节点应用 overflow */
.log-list {
  overflow: auto;            /* 同时纵向 + 横向 */
  /* 如果 HugeList 内部自己设定了 overflow，可在其内部加一层 wrapper 改写，这里假设 style 透传到根元素 */
}

/* 每行 */
.log-item {
  display: flex;
  align-items: stretch;
  /* 关键：让行的总宽随内容扩展，产生横向滚动 */
  /* width: max-content; 行内容比容器宽时，容器出现水平滚动条 */
  min-height: 100%;
  height: 100%;
  line-height: 30px;
  border-bottom: 1px solid #f2f2f2;
  position: relative;
  font-size: 12px;
}

/* 行号：sticky 固定在左侧，不随水平滚动离开视口 */
.line-number {
  position: sticky;
  left: 0;
  z-index: 2;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  min-width: 64px;
  padding: 0 8px 0 4px;
  box-sizing: border-box;
  background: #f5f7fa;
  color: #02587e;
  border-right: 1px solid #e3e6eb;
  user-select: none;
  cursor: pointer;
  white-space: nowrap;
}
.line-number:hover {
  background: #e9eef3;
}

/* 日志正文 */
.log-line {
  /* flex: 0 0 200px;   */
 /*  white-space: pre;      /* 不换行，保留空格 */
  padding: 0 12px 0 8px;
  box-sizing: border-box;
  /* 可选：为了更好区分行，长行阅读体验 */

        white-space: break-spaces;
        word-wrap: break-word; /* 关键属性：允许长单词或URL换行 */
        word-break: break-all; /* 关键属性：强制换行 */
}

.log-line.marked {
  background: #fff5cc;
}

/* 选中文本时行号仍可见（可根据主题调色） */
::selection {
  background: #b3d4ff;
  color: #000;
}
</style>