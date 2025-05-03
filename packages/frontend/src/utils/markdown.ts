import MarkdownIt from 'markdown-it';
import hljs from 'highlight.js';
import DOMPurify from 'dompurify';

// // @ts-ignore
// import "github-markdown-css";
// import 'highlight.js/styles/github.css';
// import 'katex/dist/katex.min.css';
// 导入highlight.js及其语言包
import 'highlight.js/lib/common';


import markdownItKatex from 'markdown-it-katex';


// 配置MarkdownIt实例
const md = new MarkdownIt({
  typographer: true,
  highlight: function (str, lang) {
    if (lang && hljs.getLanguage(lang)) {
      try {
        return hljs.highlight(str, { language: lang }).value;
      } catch (__) {}
    }
    return '';
  }
});
md.use(markdownItKatex);



export const mdRender = (content?: string) => content && DOMPurify.sanitize(md.render(content));
