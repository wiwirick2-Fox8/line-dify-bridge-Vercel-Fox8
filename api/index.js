const line = require('@line/bot-sdk');
const fetch = require('node-fetch');

const SCRIPT_VERSION = "v5_full_error_logging_1011";

const config = {
    channelSecret: process.env.LINE_CHANNEL_SECRET,
};

module.exports = async (req, res) => {
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
            response_mode: "streaming", // Fire and ForgetなのでstreamingでOK
            user: userId,
            conversation_id: ""
        };

        console.log(`[${SCRIPT_VERSION}] Sending request to Dify. User: ${userId}`);

        // fetchの処理をPromiseとして扱い、エラーを捕捉する
        fetch(process.env.DIFY_API_ENDPOINT, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${process.env.DIFY_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(difyPayload)
        })
        .then(fetchResponse => {
            // ★★★ ここが重要 ★★★
            // Difyからの応答ステータスを非同期でログに出力
            console.log(`[${SCRIPT_VERSION}] Fetch response status: ${fetchResponse.status}`);
            if (!fetchResponse.ok) {
                return fetchResponse.text().then(text => {
                    console.error(`[${SCRIPT_VERSION}] Fetch failed with status ${fetchResponse.status}: ${text}`);
                });
            }
        })
        .catch(error => {
            console.error(`[${SCRIPT_VERSION}] Fetch request itself failed:`, error);
        });

    } catch (error) {
        console.error(`[${SCRIPT_VERSION}] Critical error preparing request to Dify:`, error);
    }

    // 3. すぐにLINEに応答を返す
    res.status(200).send('OK');
};