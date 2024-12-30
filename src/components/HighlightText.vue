<template>
  <span>
    <template v-for="(part, index) in parts" :key="index">
      <span
        :class="{
          'bg-yellow-200 dark:bg-yellow-500/30 text-gray-900 dark:text-gray-100': part.highlight
        }"
      >{{ part.text }}</span>
    </template>
  </span>
</template>

<script lang="ts">

export default {
    name: "HighlightText",
    props: {
        text: {
            type: String,
            required: true
        },
        highlight: {
            type: String,
            required: true
        }
    },
    computed: {
        parts() {
            if (!this.highlight) {
                return [{ text: this.text, highlight: false }]
            }

            try {
                const regex = new RegExp(this.highlight, 'gi')
                const matches = Array.from(this.text.matchAll(regex)) as RegExpMatchArray[]
                const result: { text: string; highlight: boolean }[] = []
                let lastIndex = 0

                for (const match of matches) {
                    if (!match.index) continue

                    if (match.index > lastIndex) {
                        result.push({
                            text: this.text.slice(lastIndex, match.index),
                            highlight: false
                        })
                    }
                    result.push({
                        text: match[0],
                        highlight: true
                    })
                    lastIndex = match.index + match[0].length
                }

                if (lastIndex < this.text.length) {
                    result.push({
                        text: this.text.slice(lastIndex),
                        highlight: false
                    })
                }

                return result
            } catch {
                // 如果正则表达式无效，返回原始文本
                return [{ text: this.text, highlight: false }]
            }
        }
    }
}
</script>
