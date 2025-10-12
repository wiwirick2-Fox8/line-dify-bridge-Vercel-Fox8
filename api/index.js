const line = require('@line/bot-sdk');
const fetch = require('node-fetch');
// ★★★ ここが最後の核心 ★★★
// HTTPエージェントをインポートし、コネクションを再利用しない設定を作成
const http = require('http');
const agent = new http.Agent({ keepAlive: false });

const SCRIPT_VERSION = "v7_final_connection_close_1012";

const config = {
    channelSecret: process.env.LINE_CHANNEL_SECRET,
};

module.exports = async (req, res) => {
    console.log(`[${SCRIPT_VERSION}] Function started.`);

    // 1. LINE署名検証 (変更なし)
    try {
        // ... (省略) ...
    } catch (error) {
        // ... (省略) ...
    }

    // 2. Difyへのリクエストを「待たずに」投げる
    try {
        const rebuiltBody = { /* ... */ };
        const userId = req.body.events?.[0]?.source?.userId || 'unknown-line-user';
        const difyPayload = { /* ... */ };

        console.log(`[${SCRIPT_VERSION}] Sending request to Dify. User: ${userId}`);

        fetch(process.env.DIFY_API_ENDPOINT, {
            method: 'POST',
            headers: { /* ... */ },
            body: JSON.stringify(difyPayload),
            // ★★★ ここが最後の核心 ★★★
            // 毎回新しいコネクションを使うようにエージェントを指定
            agent: agent 
        }).catch(error => {
            console.error(`[${SCRIPT_VERSION}] Fetch request failed:`, error);
        });

    } catch (error) {
        console.error(`[${SCRIPT_VERSION}] Critical error preparing request:`, error);
    }

    // 3. すぐにLINEに応答を返す
    res.status(200).send('OK');
};