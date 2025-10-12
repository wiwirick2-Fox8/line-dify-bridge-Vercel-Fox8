const line = require('@line/bot-sdk');
const fetch = require('node-fetch');
// ★★★ ここが最後の、そして唯一の修正点 ★★★
// httpではなく、httpsモジュールをインポートする
const https = require('https');
const agent = new https.Agent({ keepAlive: false });

const SCRIPT_VERSION = "v8_final_https_close_1012";

const config = {
    channelSecret: process.env.LINE_CHANNEL_SECRET,
};

module.exports = async (req, res) => {
    console.log(`[${SCRIPT_VERSION}] Function started.`);

    // 1. LINE署名検証 (変更なし)
    try {
        const signature = req.headers['x-line-signature'];
        if (!line.validateSignature(JSON.stringify(req.body), config.channelSecret, signature)) {
            console.error(`[${SCRIPT_VERSION}] Signature validation failed.`);
            return res.status(401).send('Signature validation failed');
        }
    } catch (error) {
        console.error(`[${SCRIPT_VERSION}] Error during signature validation:`, error);
        return res.status(500).send('Error during signature validation');
    }

    // 2. Difyへのリクエストを「待たずに」投げる
    try {
        const rebuiltBody = {
            destination: req.body.destination,
            events: req.body.events
        };
        const userId = req.body.events?.[0]?.source?.userId || 'unknown-line-user';

        const difyPayload = {
            inputs: {
                line_webhook_data: JSON.stringify(rebuiltBody)
            },
            response_mode: "streaming",
            user: userId,
            conversation_id: ""
        };

        console.log(`[${SCRIPT_VERSION}] Sending request to Dify. User: ${userId}`);

        fetch(process.env.DIFY_API_ENDPOINT, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${process.env.DIFY_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(difyPayload),
            // 毎回新しいHTTPSコネクションを使うようにエージェントを指定
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