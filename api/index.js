
const line = require('@line/bot-sdk');
const fetch = require('node-fetch');

const SCRIPT_VERSION = "v13_logging_gatekeeper_1118"; // バージョンを更新

const config = {
    channelSecret: process.env.LINE_CHANNEL_SECRET,
};

module.exports = async (req, res) => {
    // 1. ★★★ 署名検証を「記録係」に変更 ★★★
    let signatureValidationResult = "pending"; // 検証結果を格納する変数
    try {
        const signature = req.headers['x-line-signature'];
        const bodyString = JSON.stringify(req.body);

        if (line.validateSignature(bodyString, config.channelSecret, signature)) {
            signatureValidationResult = "success";
        } else {
            // 失敗しても処理を止めず、結果を記録するだけ
            signatureValidationResult = "failed";
            console.warn(`[${SCRIPT_VERSION}] Signature validation failed, but proceeding anyway.`);
        }
    } catch (error) {
        // 検証プロセス自体でエラーが起きても処理を止めない
        signatureValidationResult = `error: ${error.message}`;
        console.error(`[${SCRIPT_VERSION}] Error during signature validation process:`, error);
    }

    // 2. Difyへのリクエスト (ここから下はほぼ変更なし)
    try {
        const rebuiltBody = {
            destination: req.body.destination,
            events: req.body.events,
            // ★★★ ログ情報を荷物に追加 ★★★
            vercel_log: {
                script_version: SCRIPT_VERSION,
                request_id: req.headers['x-vercel-id'] || 'unknown',
                signature_validation: signatureValidationResult
            }
        };
        const userId = req.body.events?.[0]?.source?.userId || 'unknown-line-user';

        // awaitを使い、Difyからの最初の応答（ストリーム開始）まで待つ
        const fetchResponse = await fetch(process.env.DIFY_API_ENDPOINT, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${process.env.DIFY_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                inputs: {
                    // ★★★ ログ情報を含んだ、新しい荷物を送る ★★★
                    line_webhook_data: JSON.stringify(rebuiltBody)
                },
                response_mode: "streaming",
                user: userId,
                conversation_id: ""
            })
        });
        
        // Difyからの応答ステータスはログに残す
        if (!fetchResponse.ok) {
            const errorBody = await fetchResponse.text();
            console.error(`[${SCRIPT_VERSION}] Dify returned an error. Status: ${fetchResponse.status}, Body: ${errorBody}`);
        }

    } catch (error) {
        console.error(`[${SCRIPT_VERSION}] Critical error forwarding request to Dify:`, error);
    }

    // 3. すべての処理が終わった後で、LINEに応答を返す
    res.status(200).send('OK');
};