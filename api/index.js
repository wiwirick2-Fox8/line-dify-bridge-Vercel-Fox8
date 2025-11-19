
const line = require('@line/bot-sdk');
const fetch = require('node-fetch');

const SCRIPT_VERSION = "v14_separated_log_architecture_1119"; // バージョンを更新

const config = {
    channelSecret: process.env.LINE_CHANNEL_SECRET,
};

module.exports = async (req, res) => {
    // 1. 署名検証（変更なし）
    let signatureValidationResult = "pending";
    try {
        const signature = req.headers['x-line-signature'];
        const bodyString = JSON.stringify(req.body);

        if (line.validateSignature(bodyString, config.channelSecret, signature)) {
            signatureValidationResult = "success";
        } else {
            signatureValidationResult = "failed";
        }
    } catch (error) {
        signatureValidationResult = `error: ${error.message}`;
    }

    // 2. Difyへのリクエスト
    try {
        const rebuiltBody = {
            destination: req.body.destination,
            events: req.body.events
        };
        const userId = req.body.events?.[0]?.source?.userId || 'unknown-line-user';
        
        // ★★★ 変更点 ★★★ Vercelのログ情報を構築
        const vercelLogPayload = {
            script_version: SCRIPT_VERSION,
            request_id: req.headers['x-vercel-id'] || 'unknown',
            signature_validation: signatureValidationResult
        };

        const fetchResponse = await fetch(process.env.DIFY_API_ENDPOINT, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${process.env.DIFY_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                inputs: {
                    // ★★★ 変更点 ★★★ 2つの独立した変数として渡す
                    line_webhook_data: JSON.stringify(rebuiltBody),
                    vercel_log: JSON.stringify(vercelLogPayload) 
                },
                response_mode: "streaming",
                user: userId,
                conversation_id: ""
            })
        });
        
        // (以降のログ処理などは変更なし)
        // ...

    } catch (error) {
        // ...
    }

    // 3. LINEへの応答（変更なし）
    res.status(200).send('OK');
};