const http = require('http');
const POP3Client = require('node-pop3');

// --- 1. Render 呼吸代码 ---
const port = process.env.PORT || 10000;
http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
  res.end('小克助理运行中...');
}).listen(port);

// --- 2. 邮箱配置 ---
const config = {
  host: 'pop.163.com',
  port: 995,
  tls: true,
  user: process.env.MAIL_USER,
  pass: process.env.MAIL_PASS,
};

// --- 3. 核心抓取逻辑 (换用 Promise 封装) ---
function checkEmail() {
  console.log(`[${new Date().toLocaleString()}] 🔍 正在邮筒值班...`);
  
  const pop3 = new POP3Client(config);

  // 这里的尝试是基于 node-pop3 库最原始的 command 命令
  pop3.execute('STAT', (err, data) => {
    if (err) {
      console.error('❌ 访问邮筒失败:', err);
    } else {
      console.log('📩 邮筒连接成功！原始响应:', data);
      // data 通常是 "+OK 3 12345" 这种格式，表示有 3 封邮件
      const match = data.match(/\+OK\s+(\d+)\s+/);
      if (match && parseInt(match[1]) > 0) {
        console.log(`🎉 发现 ${match[1]} 封邮件！正在努力同步链接...`);
      } else {
        console.log('📭 邮筒空空如也。');
      }
    }
    pop3.execute('QUIT');
  });
}

// --- 4. 立即启动并循环 ---
console.log('✨ 小克助理（底层驱动版）已就绪');
checkEmail(); 
setInterval(checkEmail, 2 * 60 * 1000); // 2 分钟一次
