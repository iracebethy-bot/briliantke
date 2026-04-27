const http = require('http');
const notifier = require('mail-notifier');

// 1. Render 呼吸服务
const port = process.env.PORT || 10000;
http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
  res.end('小克助理（工业级版）运行中...');
}).listen(port);

// 2. 邮箱配置 (直接使用 IMAP，163 邮箱也支持，比 POP3 更实时)
const imapConfig = {
  user: process.env.MAIL_USER,
  password: process.env.MAIL_PASS, // 你的授权码
  host: "imap.163.com",
  port: 993,
  tls: true,
  autostart: true
};

// 3. 监听逻辑
const n = notifier(imapConfig);

n.on('end', () => n.start()); // 断开自动重连

n.on('mail', (mail) => {
  console.log(`[${new Date().toLocaleString()}] 📩 收到新邮件! 来自: ${mail.from[0].address}`);
  console.log(`主题: ${mail.subject}`);
  
  // 查找内容里的链接
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const urls = mail.text.match(urlRegex);
  
  if (urls) {
    console.log(`🔗 抓到链接: ${urls.join(', ')}`);
    // 后续可以在这里加写入 GitHub 的代码
  }
});

n.on('error', (err) => {
  console.error('❌ 监测出错:', err.message);
});

console.log('✨ 小克助理已开启实时监测模式...');
n.start();
