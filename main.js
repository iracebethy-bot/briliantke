const http = require('http');
const tls = require('tls');

// --- 1. Render 呼吸服务 ---
const port = process.env.PORT || 10000;
http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
  res.end('小克助理（底层直连版）运行中...');
}).listen(port);

// --- 2. 核心抓取逻辑 (直接拉电话线) ---
function checkEmail() {
  console.log(`[${new Date().toLocaleString()}] 🔍 正在拨号 163 邮筒...`);
  
  const options = { host: 'pop.163.com', port: 995 };
  const socket = tls.connect(options, () => {
    console.log('☎️ 电话已接通，正在自报家门...');
  });

  let step = 0;
  socket.setEncoding('utf-8');

  socket.on('data', (data) => {
    // console.log('S:', data); // 调试用：查看服务器原始对话
    if (data.includes('+OK')) {
      if (step === 0) {
        socket.write(`USER ${process.env.MAIL_USER}\r\n`);
        step++;
      } else if (step === 1) {
        socket.write(`PASS ${process.env.MAIL_PASS}\r\n`);
        step++;
      } else if (step === 2) {
        socket.write('STAT\r\n');
        step++;
      } else if (step === 3) {
        console.log('📩 邮筒反馈：', data.trim());
        socket.write('QUIT\r\n');
      }
    } else if (data.includes('-ERR')) {
      console.error('❌ 邮筒拒接：', data.trim());
      socket.end();
    }
  });

  socket.on('end', () => console.log('📭 检查完毕，挂断电话。'));
  socket.on('error', (err) => console.error('⚠️ 线路故障:', err.message));
}

// --- 3. 启动与循环 ---
console.log('✨ 小克助理（原生直连版）已就绪');
checkEmail(); 
setInterval(checkEmail, 2 * 60 * 1000);
