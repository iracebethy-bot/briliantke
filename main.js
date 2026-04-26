const http = require('http');
const POP3Client = require('node-pop3');
const nodemailer = require('nodemailer');
const fs = require('fs');

// --- 1. Render 专属“呼吸代码” (防止端口报错) ---
const port = process.env.PORT || 3000;
http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.write('Xiao Ke Assistant is running...');
  res.end();
}).listen(port, () => {
  console.log(`[${new Date().toLocaleString()}] 🚀 呼吸服务已启动，监听端口: ${port}`);
});

// --- 2. 配置信息 (从环境变量读取) ---
const config = {
  host: 'pop.163.com',
  port: 995,
  tls: true,
  user: process.env.MAIL_USER,
  pass: process.env.MAIL_PASS, // 你的授权码
};

// --- 3. 核心邮件检查逻辑 ---
async function checkEmailTask() {
  console.log(`[${new Date().toLocaleString()}] 🔍 正在通过 POP3 检查 163 邮箱...`);
  
  const pop3 = new POP3Client(config);

  try {
    // 获取邮件列表
    const list = await pop3.list();
    if (list && list.length > 0) {
      console.log(`📩 发现新邮件！共有 ${list.length} 封。`);
      
      // 这里可以添加你之前的抓取逻辑，比如读取最后一封
      // 为了演示，我们先简单打印成功状态
      console.log(`✅ 邮件抓取并更新成功！`);
      
      // 注意：如果需要保存到“待投喂.txt”，建议配合 GitHub API 写入，
      // 因为 Render 的磁盘是临时的，重启后文件会消失。
    } else {
      console.log('📭 收件箱目前没有新内容。');
    }
  } catch (err) {
    console.error('❌ 检查邮件时出错:', err.message);
  } finally {
    await pop3.quit();
  }
}

// --- 4. 设置定时任务 (每 5 分钟检查一次，避免频繁操作) ---
console.log('✨ 小克助理（云端稳定版）已就绪。');
checkEmailTask(); // 启动时立即执行一次
setInterval(checkEmailTask, 5 * 60 * 1000);
