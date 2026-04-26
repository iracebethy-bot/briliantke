const http = require('http');
http.createServer((req, res) => {
  res.write('Xiao Ke is running!');
  res.end();
}).listen(process.env.PORT || 3000); // 这行就是给 Render 看的“门牌号”const Pop3Command = require("node-pop3"); // 请运行 npm install node-pop3
const { simpleParser } = require('mailparser');
const nodemailer = require("nodemailer");
const fs = require('fs');
const path = require('path');

// ================= 配置区 =================
const mailConfig = {
    user: 'briliantke@163.com',
    pass: 'TFyWeHRWwmGh3RNQ', // 163 授权码
};

// 依然保留强制 IP 补丁，双重保险
const REAL_SMTP_IP = '111.124.203.45'; 

const INBOX_FILE = path.join(__dirname, '待投喂.txt');
const REPLY_FILE = path.join(__dirname, '待发送.txt');

if (!fs.existsSync(REPLY_FILE)) fs.writeFileSync(REPLY_FILE, '');
// ==========================================

/**
 * 自动发信（SMTP）
 */
async function sendEmail(to, subject, content) {
    let transporter = nodemailer.createTransport({
        host: "smtp.163.com",
        port: 465,
        secure: true,
        lookup: (hostname, options, callback) => {
            if (hostname === 'smtp.163.com') return callback(null, [{ address: REAL_SMTP_IP, family: 4 }]);
            require('dns').lookup(hostname, options, callback);
        },
        auth: { user: mailConfig.user, pass: mailConfig.pass }
    });

    try {
        await transporter.sendMail({
            from: `"小克助理" <${mailConfig.user}>`,
            to: to,
            subject: subject.startsWith('Re:') ? subject : "Re: " + subject,
            text: content
        });
        console.log(`\n✅ 发射成功！回信至: ${to}`);
    } catch (err) {
        console.error(`\n❌ 发信失败:`, err.message);
    }
}

/**
 * 自动收信（POP3）- 替换了原来的 IMAP
 */
async function checkEmailTask() {
    console.log(`\n[${new Date().toLocaleString()}] 🔍 正在通过 POP3 检查 163 邮箱...`);
    
    const pop3 = new Pop3Command({
        user: mailConfig.user,
        password: mailConfig.pass,
        host: "pop.163.com",
        port: 995,
        tls: true
    });

    try {
        // 获取所有邮件列表
        const list = await pop3.LIST();
        if (list.length > 0) {
            // 我们只拿最后一封来处理
            const lastMsgId = list.length;
            const rawMsg = await pop3.RETR(lastMsgId);
            const parsed = await simpleParser(rawMsg);
            
            // 为了防止重复处理，我们可以简单判断一下主题或内容
            // 这里生成投喂内容
            let report = `收件人: ${parsed.from.value[0].address}\n`;
            report += `主题: ${parsed.subject}\n`;
            report += `正文内容: ${parsed.text}\n`;
            report += `====================================\n\n`;

            fs.writeFileSync(INBOX_FILE, report);
            console.log(`📩 发现邮件！已更新 [待投喂.txt] (最新的第 ${lastMsgId} 封)`);
        } else {
            console.log("📭 POP3 报告：收件箱暂无邮件。");
        }
        await pop3.QUIT();
    } catch (err) {
        console.error("❌ POP3 读信出错:", err.message);
    }
}

/**
 * 文件监听：保存 [待发送.txt] 即刻触发
 */
fs.watchFile(REPLY_FILE, { interval: 1000 }, async (curr, prev) => {
    if (curr.mtime > prev.mtime) {
        const rawContent = fs.readFileSync(REPLY_FILE, 'utf-8').trim();
        if (!rawContent) return;

        console.log("\n⚡ 检测到回信指令...");
        const lines = rawContent.split('\n');
        let to = "", subject = "", bodyLines = [];

        lines.forEach(line => {
            if (line.startsWith('收件人:')) to = line.replace('收件人:', '').trim();
            else if (line.startsWith('主题:')) subject = line.replace('主题:', '').trim();
            else bodyLines.push(line);
        });

        if (to && to.includes('@')) {
            await sendEmail(to, subject, bodyLines.join('\n').trim());
            fs.writeFileSync(REPLY_FILE, '');
        }
    }
});

setInterval(checkEmailTask, 7200000); // 2小时一次
checkEmailTask(); // 启动执行
console.log("🚀 小克助理（POP3版）已就绪。");
