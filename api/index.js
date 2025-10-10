const line = require('@line/bot-sdk');
const fetch = require('node-fetch');

// コードのバージョンを明確にする
const SCRIPT_VERSION = "v4_fire_and_forget_stable_1010";

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

    // ★★★ 最終的なアーキテクチャ ★★★
    // 2. Difyへのリクエストを「待たずに」投げる (Fire and Forget)
    //    LINEへの応答よりも先に実行することで、リクエストが確実に発行されることを保証する。
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
            // Dify側が即時応答を返すので、blockingでOK
            response_mode: "blocking", 
            user: userId,
            conversation_id: ""
        };

        console.log(`[${SCRIPT_VERSION}] Sending request to Dify. User: ${userId}`);

        // await を使わないことで、Vercelはこの処理の完了を待たない
        fetch(process.env.DIFY_API_ENDPOINT, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${process.env.DIFY_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(difyPayload)
        }).catch(error => {
            // fetch自体が失敗した場合（DNS解決エラーなど）のログ
            console.error(`[${SCRIPT_VERSION}] Fetch request to Dify failed:`, error);
        });

    } catch (error) {
        console.error(`[${SCRIPT_VERSION}] Critical error preparing request to Dify:`, error);
    }

    // 3. Difyへのリクエストを投げた後、すぐにLINEに応答を返す
    //    これにより、Vercel関数の実行時間は最小限に抑えられる
    res.status(200).send('OK');
};