const http = require('http');
const { MailListener } = require('mail-listener5');

// --- 1. Render 呼吸服务 ---
const port = process.env.PORT || 10000;
http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
  res.end('小克助理（终极绕过版）运行中...');
}).listen(port);

// --- 2. 核心配置 (注入网易官方 ID 标识) ---
const mailListener = new MailListener({
  username: process.env.MAIL_USER,
  password: process.env.MAIL_PASS,
  host: "imap.163.com",
  port: 993,
  tls: true,
  // 核心：模拟网易官方网页版 ID，彻底解决 Unsafe Login
  customInterface: "ID (" + JSON.stringify({
    name: "NeteaseMailAntispam",
    version: "1.0.0",
    vendor: "netease",
    "support-email": "kefu@188.com"
  }) + ")",
  connTimeout: 20000,
  authTimeout: 20000,
  autostart: true,
  mailbox: "INBOX",
  markSeen: false 
});

// --- 3. 监听逻辑 ---
mailListener.on("server:connected", () => {
  console.log(`[${new Date().toLocaleString()}] ✅ 芜湖！成功进入 163 邮筒！小克正式上班！`);
});

mailListener.on("mail", (mail) => {
  console.log(`[${new Date().toLocaleString()}] 📩 抓到新邮件：${mail.subject || '无主题'}`);
  const content = mail.text || "";
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const urls = content.match(urlRegex);
  
  if (urls) {
    console.log(`🔗 抓取到链接: ${urls.join(', ')}`);
  }
});

mailListener.on("error", (err) => {
  if (err.message.includes('Unsafe Login')) {
    console.error('❌ 仍然报错不安全。请检查：1. 授权码是否填错？ 2. 网页端安全提示是否有点确认？');
  } else {
    console.error('❌ 遇到新状况:', err.message);
  }
});

console.log('✨ 小克正在使用“超级工牌”冲击 163 邮筒...');
mailListener.start();
