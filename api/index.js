const line = require('@line/bot-sdk');
const fetch = require('node-fetch');

// ★★★ ログ追加点１：コードのバージョンを明確にする ★★★
const SCRIPT_VERSION = "v2_await_blocking_with_logging_1010";

const config = {
    channelSecret: process.env.LINE_CHANNEL_SECRET,
};

module.exports = async (req, res) => {
    // ★★★ ログ追加点２：関数の開始とバージョンを記録 ★★★
    console.log(`[${SCRIPT_VERSION}] Function started.`);

    // 1. LINE署名検証
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

    // 2. LINEには即座に応答を返す
    res.status(200).send('OK');

    // 3. Difyへのリクエストを実行
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
            response_mode: "blocking",
            user: userId,
            conversation_id: ""
        };

        // ★★★ ログ追加点３：Difyに送信する直前のデータを記録 ★★★
        console.log(`[${SCRIPT_VERSION}] Sending request to Dify. User: ${userId}, Mode: ${difyPayload.response_mode}`);

        const fetchResponse = await fetch(process.env.DIFY_API_ENDPOINT, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${process.env.DIFY_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(difyPayload)
        });

        // ★★★ ログ追加点４：Difyからの応答ステータスを記録 ★★★
        console.log(`[${SCRIPT_VERSION}] Received response from Dify. Status: ${fetchResponse.status}`);
        
        if (!fetchResponse.ok) {
            const errorBody = await fetchResponse.text();
            console.error(`[${SCRIPT_VERSION}] Dify returned an error. Status: ${fetchResponse.status}, Body: ${errorBody}`);
        }

    } catch (error) {
        console.error(`[${SCRIPT_VERSION}] Error forwarding request to Dify:`, error);
    }
};