const http = require('http');
const POP3Client = require('node-pop3');
const nodemailer = require('nodemailer');

// --- 1. Render 专属“呼吸代码” (保持服务在线) ---
const port = process.env.PORT || 3000;
http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.write('Xiao Ke Assistant is running...');
  res.end();
}).listen(port, () => {
  console.log(`[${new Date().toLocaleString()}] 🚀 服务已启动，监听端口: ${port}`);
});

// --- 2. 配置信息 ---
const config = {
  host: 'pop.163.com',
  port: 995,
  tls: true,
  user: process.env.MAIL_USER,
  pass: process.env.MAIL_PASS,
};

// --- 3. 核心邮件检查逻辑 ---
async function checkEmailTask() {
  console.log(`[${new Date().toLocaleString()}] 🔍 正在检查 163 邮箱...`);
  
  // 关键：直接引用并传入配置
  const pop3 = new POP3Client(config);

  try {
    // 使用 list 获取邮件列表
    const list = await pop3.list();
    
    if (list && list.length > 0) {
      console.log(`📩 发现邮件！共有 ${list.length} 封。`);
      // 如果需要更复杂的逻辑在这里加
      console.log(`✅ 状态：正常同步中...`);
    } else {
      console.log('📭 收件箱目前是空的。');
    }
  } catch (err) {
    console.error('❌ 运行出错:', err.message);
  } finally {
    // 强制清理，不使用可能不存在的 .quit() 方法
    console.log(`[${new Date().toLocaleString()}] ⏳ 本次检查结束，等待下一次循环...`);
  }
}

// --- 4. 启动与循环 ---
console.log('✨ 小克助理云端版已就绪。');
checkEmailTask(); 
// 每 5 分钟跑一次
setInterval(checkEmailTask, 5 * 60 * 1000);
