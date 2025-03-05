
export default function HighlightText(props: {text: string, highlight: string}) {
    const text = props.text;
    const highlight = props.highlight;

    const regex = new RegExp(highlight, 'g');
    const html = text.replace(regex, `<span class="text-gray-900 bg-yellow-200 h-fit">${highlight}</span>`);

    return <span v-html={html}></span>
}