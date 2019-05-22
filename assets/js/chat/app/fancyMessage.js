import { Emoji, EmojiIndex } from 'emoji-mart-vue-fast';
import data from "emoji-mart-vue-fast/data/all.json";
let index = new EmojiIndex(data);

const EMOJI_REGEX = /\B:[^\s]+:/g;

function renderEmoji(h, emoji) {
  let theEmoji = index.findEmoji(emoji);
  let rendered = emoji;
  if (theEmoji) {
    rendered = h(Emoji, {
      attrs: { title: emoji },
      props: { emoji, size: 20 }
    });
  }
  return rendered;
}

function renderEmojis(h, val) {
  let match = null;
  let emojis = [];

  while (match = EMOJI_REGEX.exec(val)) {
    emojis.push({
      el: renderEmoji(h, match[0]),
      from: match.index,
      to: match.index + match[0].length
    })
  }

  return emojis;
}

export default {
  props: {
    value: {
        type: String,
        required: true
    }
  },
  render(h) {
    let index = 0;
    let children = [];
    let emojis = renderEmojis(h, this.value);

    for (let emoji of emojis) {
      children.push(this.value.slice(index, emoji.from));
      children.push(emoji.el);

      index = emoji.to;
    }

    children.push(this.value.slice(index));

    return h('span', {}, children);
  }
}