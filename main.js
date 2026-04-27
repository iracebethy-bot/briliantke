const http = require('http');
const { MailListener } = require('mail-listener5');

// --- 1. Render 呼吸服务 (确保服务不被判定为故障) ---
const port = process.env.PORT || 10000;
http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
  res.end('小克助理（通行证版）运行中...');
}).listen(port);

// --- 2. 核心配置 (加入 ID 识别，解决 Unsafe Login) ---
const mailListener = new MailListener({
  username: process.env.MAIL_USER,
  password: process.env.MAIL_PASS, // 必须是授权码
  host: "imap.163.com",
  port: 993,
  tls: true,
  // 关键：给小克办一张“工牌”，模拟网易信任的客户端
  customInterface: "ID (" + JSON.stringify({
    name: "NeteaseMailAntispam",
    version: "1.0.0",
    vendor: "netease"
  }) + ")",
  connTimeout: 15000,
  authTimeout: 15000,
  autostart: true,
  mailbox: "INBOX",
  markSeen: false 
});

// --- 3. 监听逻辑 ---
mailListener.on("server:connected", () => {
  console.log(`[${new Date().toLocaleString()}] ✅ 成功连接到 163 邮筒！小克开始值班。`);
});

mailListener.on("mail", (mail) => {
  const subject = mail.subject || "无主题";
  console.log(`[${new Date().toLocaleString()}] 📩 收到新邮件！主题: ${subject}`);
  
  // 查找内容里的链接
  const content = mail.text || "";
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const urls = content.match(urlRegex);
  
  if (urls) {
    console.log(`🔗 成功抓取链接: ${urls.join(', ')}`);
    // 提示：目前链接仅打印在日志中，下一步我们可以对接 GitHub 自动保存
  } else {
    console.log('📝 收到邮件，但没发现链接。');
  }
});

mailListener.on("error", (err) => {
  // 如果依然报 Unsafe Login，日志会提示
  if (err.message.includes('Unsafe Login')) {
    console.error('❌ 网易说登录不安全。请去网页端点“去确认”解除锁定。');
  } else {
    console.error('❌ 监测出错:', err.message);
  }
});

// 启动
console.log('✨ 小克助理正在尝试通过“通行证”进入邮筒...');
mailListener.start();
