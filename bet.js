// ✅ SỬA LỖI: Thêm .default vào cuối require để sửa lỗi Constructor trên Node.js mới
const TelegramBot = require('node-telegram-bot-api').default;
const axios = require('axios');
const express = require('express'); 

const app = express();
const PORT = process.env.PORT || 3000;

// Tạo trang web để các dịch vụ như Render/VPS có thể ping giữ bot chạy 24/7
app.get('/', (req, res) => {
    res.send('⚡️ BETVIP AI BOT IS RUNNING 24/7 ⚡️');
});

app.listen(PORT, () => {
    console.log(`🌐 Server Express đang chạy tại port: ${PORT}`);
});

// ⚠️ THAY TOKEN BOT CỦA BẠN VÀO ĐÂY
const TOKEN = '8309878066:AAGeOuiPqOqMKb4hLG0bYVblvlsgves8b9k'; 
const bot = new TelegramBot(TOKEN, { polling: true });

const API_URL = 'https://betvip-u0od.onrender.com/taixiu';
let activeChats = new Map();

// Hàm vẽ thanh phần trăm AI Confidence tự động theo dữ liệu API
function veThanhPhanTram(phanTramStr) {
    const phanTram = parseInt(phanTramStr) || 80;
    const soOVuong = Math.round(phanTram / 10);
    const soOTrong = 10 - soOVuong;
    return '█'.repeat(soOVuong) + '░'.repeat(soOTrong);
}

// Hàm quét dữ liệu API và gửi tin nhắn giao diện Royal Box
async function checkPrediction(chatId, isFirstRun = false) {
    try {
        const response = await axios.get(API_URL);
        const data = response.data;

        if (!data || !data.phien) return;

        let chatState = activeChats.get(chatId);
        if (!chatState || !chatState.isCounting) return;

        // Chỉ gửi tin khi chạy lần đầu HOẶC khi hệ thống cập nhật phiên mới
        if (isFirstRun || data.phien !== chatState.lastPhien) {
            chatState.lastPhien = data.phien;
            activeChats.set(chatId, chatState);

            const phienMucTieu = data.phien + 1;
            const ketQuaDuDoan = String(data.du_doan_phien_tiep || data.du_doan || 'TÀI').toUpperCase();
            const doTinCayStr = data.do_tin_cay || (data.do_tin_cau ? data.do_tin_cau + '%' : '83%');
            const thanhTienTrinh = veThanhPhanTram(doTinCayStr);

            // Giao diện Khung Hộp Hoàng Gia VIP chuẩn mẫu của bạn
            const msg = `╔══════════════════════╗\n` +
                        `        👑 **BETVIP AI VIP** 👑        \n` +
                        `╚══════════════════════╝\n\n` +
                        `🎯 **Phiên: #${phienMucTieu}**\n\n` +
                        `💎 **PRO MODE**\n\n` +
                        `🔴 **KẾT QUẢ: ${ketQuaDuDoan}**\n\n` +
                        `📊 **AI Confidence**\n` +
                        `\`${thanhTienTrinh}\` **${doTinCayStr}**\n\n` +
                        `━━━━━━━━━━━━━━━━━━\n` +
                        `✨ **BETVIP AI • PREMIUM SYSTEM**`;

            bot.sendMessage(chatId, msg, { parse_mode: 'Markdown' });
        }
    } catch (error) {
        console.error('Lỗi gọi API:', error.message);
    }
}

// 1. Lệnh /start hiển thị menu điều khiển VIP bằng nút bấm
bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    const welcomeMsg = `Welcome to **BETVIP AI PREMIUM** 🛰\n` +
                       `══════════════════════\n` +
                       `Hệ thống phân tích dữ liệu và dự đoán Tài Xỉu tự động.\n\n` +
                       `👇 Vui lòng sử dụng bảng điều khiển bên dưới:`;

    bot.sendMessage(chatId, welcomeMsg, {
        parse_mode: 'Markdown',
        reply_markup: {
            inline_keyboard: [[
                { text: '🟢 KHỞI CHẠY AI', callback_data: 'cmd_bat' },
                { text: '🔴 TẠM DỪNG', callback_data: 'cmd_tat' }
            ]]
        }
    });
});

// 2. Xử lý sự kiện khi người dùng tương tác bấm nút
bot.on('callback_query', (callbackQuery) => {
    const action = callbackQuery.data;
    const msg = callbackQuery.message;
    const chatId = msg.chat.id;

    bot.answerCallbackQuery(callbackQuery.id);

    if (action === 'cmd_bat') {
        if (activeChats.has(chatId) && activeChats.get(chatId).isCounting) return;

        let intervalId = setInterval(() => checkPrediction(chatId, false), 4000);
        activeChats.set(chatId, { isCounting: true, lastPhien: null, intervalId: intervalId });
        
        bot.sendMessage(chatId, '⚙️ **KÍCH HOẠT HỆ THỐNG VIP THÀNH CÔNG**', { parse_mode: 'Markdown' });
        checkPrediction(chatId, true); // Đưa ra dự đoán phiên hiện tại ngay lập tức
    } 
    else if (action === 'cmd_tat') {
        if (!activeChats.has(chatId) || !activeChats.get(chatId).isCounting) return;
        
        clearInterval(activeChats.get(chatId).intervalId);
        activeChats.delete(chatId);
        bot.sendMessage(chatId, '🔌 **ĐÃ NGẮT KẾT NỐI MÁY CHỦ DỰ ĐOÁN**', { parse_mode: 'Markdown' });
    }
});

// 3. Xử lý dự phòng nếu người dùng gõ lệnh bằng tay (/bat hoặc /tat)
bot.onText(/\/(bat|tat)/, (msg, match) => {
    const chatId = msg.chat.id;
    const command = match[1];

    if (command === 'bat') {
        if (activeChats.has(chatId) && activeChats.get(chatId).isCounting) return;
        let intervalId = setInterval(() => checkPrediction(chatId, false), 4000);
        activeChats.set(chatId, { isCounting: true, lastPhien: null, intervalId: intervalId });
        bot.sendMessage(chatId, '⚙️ **KÍCH HOẠT HỆ THỐNG VIP THÀNH CÔNG**', { parse_mode: 'Markdown' });
        checkPrediction(chatId, true);
    } 
    else if (command === 'tat') {
        if (!activeChats.has(chatId) || !activeChats.get(chatId).isCounting) return;
        clearInterval(activeChats.get(chatId).intervalId);
        activeChats.delete(chatId);
        bot.sendMessage(chatId, '🔌 **ĐÃ NGẮT KẾT NỐI MÁY CHỦ DỰ ĐOÁN**', { parse_mode: 'Markdown' });
    }
});

console.log("🤖 Máy chủ Bot Đang Chạy...");