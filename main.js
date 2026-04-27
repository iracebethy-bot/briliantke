const http = require('http');
const { MailListener } = require('mail-listener5');

// 1. Render 呼吸服务
const port = process.env.PORT || 10000;
http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
  res.end('小克助理（最新稳健版）运行中...');
}).listen(port);

// 2. 邮箱配置 (使用 IMAP)
const mailListener = new MailListener({
  username: process.env.MAIL_USER,
  password: process.env.MAIL_PASS,
  host: "imap.163.com",
  port: 993,
  tls: true,
  connTimeout: 10000,
  authTimeout: 10000,
  autostart: true,
  mailbox: "INBOX",
  markSeen: false // 保持邮件为未读
});

// 3. 监听逻辑
mailListener.on("server:connected", () => {
  console.log(`[${new Date().toLocaleString()}] ✅ 成功连接到 163 邮筒！`);
});

mailListener.on("mail", (mail) => {
  console.log(`[${new Date().toLocaleString()}] 📩 收到新邮件！主题: ${mail.subject}`);
  
  // 查找链接
  const content = mail.text || "";
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const urls = content.match(urlRegex);
  
  if (urls) {
    console.log(`🔗 成功抓取链接: ${urls.join(', ')}`);
  }
});

mailListener.on("error", (err) => {
  console.error('❌ 监测出错:', err.message);
});

// 启动
mailListener.start();
