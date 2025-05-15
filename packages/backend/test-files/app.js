const Koa = require('koa');

const cheerio = require('cheerio');
const proxy = require('koa-proxy');

const app = new Koa();
const port = 3002; // 你可以选择任何你喜欢的端口

// 定义所有请求的目标服务器
const target = 'https://www.baidu.com'; // 请替换成你想要转发请求的目标服务器 URL
// 记录请求信息的中间件
app.use(async (ctx, next) => {
    console.log(`收到请求: ${ctx.method} ${ctx.url}`);
    await next();
    console.log(`响应状态: ${ctx.status}`);
});

const injectedScript = `
  <script>
    console.log("This script was injected by the proxy using Cheerio!");
    document.addEventListener('DOMContentLoaded', function() {
      const body = document.querySelector('body');
      if (body) {
        const message = document.createElement('div');
        message.style.backgroundColor = 'lightgreen';
        message.style.padding = '15px';
        message.textContent = 'Greetings from the Cheerio-powered proxy!';
        body.insertBefore(message, body.firstChild);
      }
    });
  </script>
`;

// 使用 koa-proxy 中间件来代理所有请求
app.use(proxy({
    host: target,
    changeOrigin: true, // 对于虚拟主机站点，需要将请求头的 Origin 修改为目标 URL
    ws: true, // 代理 WebSocket 连接
    // pathRewrite: { // 可选：用于重写路径
    //   '^/old-path': '/new-path',
    // },
    onError: (err, ctx) => {
        console.error('代理错误:', err);
        ctx.status = 500;
        ctx.body = '代理服务器发生错误。';
    },
}));

app.use(async (ctx, next) => {
    await next();

    if (ctx.status >= 200 && ctx.status < 300) {
        const contentType = ctx.response.headers['content-type'];
        console.log(contentType,33333)
        if (contentType && contentType.includes('text/html')) {
            try {
                let html = ctx.body;
                if (typeof html !== 'string') {
                    html = await new Promise((resolve, reject) => {
                        let data = '';
                        ctx.body.on('data', chunk => {
                            data += chunk;
                        });
                        ctx.body.on('end', () => {
                            resolve(data);
                        });
                        ctx.body.on('error', reject);
                    });
                }

                console.log(html,333)
                const $ = cheerio.load(html);
                $('body').append(injectedScript); // 将脚本追加到 <body> 标签的末尾

                const modifiedHtml = $.html();

                ctx.body = modifiedHtml;
                ctx.response.set('Content-Length', Buffer.byteLength(modifiedHtml));
            } catch (error) {
                console.error('修改 HTML 响应出错:', error);
            }
        }
    }
});


app.listen(port, () => {
    console.log(`Koa 代理服务器正在监听 http://localhost:${port}`);
});