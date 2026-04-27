const http = require('http');
const POP3Client = require('node-pop3');
const nodemailer = require('nodemailer');

// --- 1. Render 呼吸代码 (保持 24 小时在线) ---
const port = process.env.PORT || 10000;
http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
  res.write('小克助理云端运行中...');
  res.end();
}).listen(port, () => {
  console.log(`[${new Date().toLocaleString()}] 🚀 呼吸服务已启动，监听端口: ${port}`);
});

// --- 2. 邮箱配置 ---
const config = {
  host: 'pop.163.com',
  port: 995,
  tls: true,
  user: process.env.MAIL_USER,
  pass: process.env.MAIL_PASS,
};

// --- 3. 核心抓取逻辑 (修正版) ---
async function checkEmailTask() {
  const currentTime = new Date().toLocaleString();
  console.log(`[${currentTime}] 🔍 正在邮筒值班...`);
  
  const pop3 = new POP3Client(config);

  try {
    // 使用 stat 获取邮件总数，避免使用 list() 报错
    const info = await pop3.stat(); 
    const totalMsg = info[0]; // 邮件总数
    
    if (totalMsg > 0) {
      console.log(`📩 发现邮件！共有 ${totalMsg} 封。`);
      
      // 读取最新的一封邮件 (最后一封)
      const lastMsg = await pop3.retr(totalMsg);
      
      // 在日志里打印出我们抓到的内容，看看有没有你发的链接
      if (lastMsg.includes('http')) {
        console.log('🔗 抓到链接了！正在同步至内存...');
      } else {
        console.log('📝 收到纯文本邮件，暂无新链接。');
      }
    } else {
      console.log('📭 邮筒目前是空的，小克继续待命。');
    }
  } catch (err) {
    console.error('❌ 抓取遇到小麻烦:', err.message);
  } finally {
    // 确保每次都彻底关闭连接，防止占用
    try { await pop3.quit(); } catch (e) {}
  }
}

// --- 4. 立即执行并设置 2 分钟轮询 ---
console.log('✨ 小克助理（稳定版）已就绪，正在开启自动监测...');
checkEmailTask(); 

// 设置为 120000 毫秒 = 2 分钟
setInterval(() => {
  checkEmailTask();
}, 2 * 60 * 1000);
