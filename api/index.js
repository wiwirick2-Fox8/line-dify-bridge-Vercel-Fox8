const line = require('@line/bot-sdk');
const fetch = require('node-fetch');

const SCRIPT_VERSION = "v6_final_with_waitUntil_1011";

const config = {
    channelSecret: process.env.LINE_CHANNEL_SECRET,
};

// Vercelの`context`オブジェクトを受け取るために、シグネチャを変更
module.exports = async (req, res, context) => {
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

    // 2. Difyへのリクエスト処理をPromiseとして定義
    const difyRequestPromise = async () => {
        try {
            const rebuiltBody = {
                destination: req.body.destination,
                events: req.body.events
            };
            const userId = req.body.events?.[0]?.source?.userId || 'unknown-line-user';

            console.log(`[${SCRIPT_VERSION}] Preparing to send request to Dify. User: ${userId}`);

            const fetchResponse = await fetch(process.env.DIFY_API_ENDPOINT, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${process.env.DIFY_API_KEY}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    inputs: {
                        line_webhook_data: JSON.stringify(rebuiltBody)
                    },
                    response_mode: "blocking",
                    user: userId,
                    conversation_id: ""
                })
            });
            
            console.log(`[${SCRIPT_VERSION}] Received response from Dify. Status: ${fetchResponse.status}`);
            if (!fetchResponse.ok) {
                const errorBody = await fetchResponse.text();
                console.error(`[${SCRIPT_VERSION}] Dify returned an error. Status: ${fetchResponse.status}, Body: ${errorBody}`);
            }

        } catch (error) {
            console.error(`[${SCRIPT_VERSION}] Critical error during Dify request:`, error);
        }
    };

    // 3. ★★★ ここが最後の核心 ★★★
    //    Difyへのリクエスト処理を `waitUntil` に渡し、バックグラウンドでの実行を保証させる
    if (context && typeof context.waitUntil === 'function') {
        context.waitUntil(difyRequestPromise());
        console.log(`[${SCRIPT_VERSION}] Dify request handed off to waitUntil.`);
    } else {
        // ローカル開発環境など、waitUntilが使えない場合のためのフォールバック
        difyRequestPromise();
        console.log(`[${SCRIPT_VERSION}] waitUntil not available. Fired request without guarantee.`);
    }

    // 4. LINEには、Difyへの処理を待たずに、即座に応答を返す
    res.status(200).send('OK');
};