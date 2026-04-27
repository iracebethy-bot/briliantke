const http = require('http');
const tls = require('tls');

// --- 1. Render 呼吸服务 ---
const port = process.env.PORT || 10000;
http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
  res.end('小克助理（原生协议版）运行中...');
}).listen(port);

// --- 2. 核心 POP3 逻辑 (原生 TLS 直连) ---
function checkEmail() {
  console.log(`[${new Date().toLocaleString()}] 🔍 正在接入 163 邮筒...`);
  
  const socket = tls.connect({
    host: 'pop.163.com',
    port: 995,
    rejectUnauthorized: false
  });

  let step = 0;
  socket.setEncoding('utf-8');

  socket.on('data', (data) => {
    // console.log('S:', data); // 调试用
    if (data.includes('+OK')) {
      switch(step) {
        case 0:
          socket.write(`USER ${process.env.MAIL_USER}\r\n`);
          step++;
          break;
        case 1:
          socket.write(`PASS ${process.env.MAIL_PASS}\r\n`);
          step++;
          break;
        case 2:
          socket.write('STAT\r\n');
          step++;
          break;
        case 3:
          const match = data.match(/\+OK\s+(\d+)\s+/);
          const count = match ? match[1] : 0;
          if (count > 0) {
            console.log(`📩 邮筒反馈：发现 ${count} 封邮件，正在读取最新内容...`);
            socket.write(`RETR ${count}\r\n`);
            step++;
          } else {
            console.log('📭 邮筒目前是空的。');
            socket.write('QUIT\r\n');
          }
          break;
        case 4:
          const urlRegex = /(https?:\/\/[^\s]+)/g;
          const urls = data.match(urlRegex);
          if (urls) {
            console.log(`🔗 成功抓取链接: ${urls[0]}`); // 只取第一个链接
          } else {
            console.log('📝 收到邮件，但未提取到有效链接。');
          }
          socket.write('QUIT\r\n');
          break;
      }
    } else if (data.includes('-ERR')) {
      console.error('❌ 邮筒返回错误:', data.trim());
      socket.end();
    }
  });

  socket.on('error', (err) => console.error('⚠️ 通讯故障:', err.message));
}

// --- 3. 启动 ---
console.log('✨ 小克助理（原生协议版）已就绪');
checkEmail();
setInterval(checkEmail, 5 * 60 * 1000); // 5 分钟检查一次
