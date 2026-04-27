const http = require('http');
const Pop3Client = require('node-pop3');

// --- 1. Render 呼吸服务 ---
const port = process.env.PORT || 10000;
http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
  res.end('小克助理（POP3稳定版）运行中...');
}).listen(port);

// --- 2. 邮箱配置 ---
const config = {
  host: 'pop.163.com',
  port: 995,
  tls: true,
  user: process.env.MAIL_USER,
  pass: process.env.MAIL_PASS
};

// --- 3. 抓取逻辑 ---
async function checkMail() {
  console.log(`[${new Date().toLocaleString()}] 🔍 正在邮筒值班...`);
  const pop3 = new Pop3Client(config);

  try {
    // 获取列表
    const list = await pop3.command('LIST');
    // list 返回格式通常是 [['1', 'size'], ['2', 'size']]
    if (list && list.length > 0) {
      const lastMsgIdx = list.length; // 最新一封的索引
      console.log(`📩 发现 ${lastMsgIdx} 封邮件，正在读取最新的一封...`);
      
      const msg = await pop3.command('RETR', lastMsgIdx.toString());
      
      const urlRegex = /(https?:\/\/[^\s]+)/g;
      const urls = msg.match(urlRegex);
      
      if (urls) {
        console.log(`🔗 成功抓取链接: ${urls.join(', ')}`);
      } else {
        console.log('📝 收到新邮件，但没找到链接。');
      }
    } else {
      console.log('📭 邮筒空空如也。');
    }
    await pop3.command('QUIT');
  } catch (err) {
    if (err.message.includes('permission denied') || err.message.includes('login failed')) {
      console.error('❌ 登录失败！请检查：1. 授权码是否过期？ 2. 网页端POP3服务是否开启？');
    } else {
      console.error('⚠️ 遇到状况:', err.message);
    }
  }
}

// --- 4. 启动 ---
console.log('✨ 小克助理（POP3版）已就绪');
checkMail(); // 立即执行一次
setInterval(checkMail, 3 * 60 * 1000); // 每 3 分钟检查一次
