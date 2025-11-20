
const line = require('@line/bot-sdk');
const fetch = require('node-fetch');

const SCRIPT_VERSION = "v15_retry_on_error_1120"; // バージョンを更新

const config = {
    channelSecret: process.env.LINE_CHANNEL_SECRET,
};

// --- 非同期で少し待つためのヘルパー関数 ---
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

module.exports = async (req, res) => {
    // 1. 署名検証（変更なし：記録係として動作）
    let signatureValidationResult = "pending";
    try {
        const signature = req.headers['x-line-signature'];
        const bodyString = JSON.stringify(req.body);

        if (line.validateSignature(bodyString, config.channelSecret, signature)) {
            signatureValidationResult = "success";
        } else {
            signatureValidationResult = "failed";
            console.warn(`[${SCRIPT_VERSION}] Signature validation failed, but proceeding anyway.`);
        }
    } catch (error) {
        signatureValidationResult = `error: ${error.message}`;
        console.error(`[${SCRIPT_VERSION}] Error during signature validation process:`, error);
    }

    // 2. Difyへのリクエスト（★ここにリトライ機能を追加★）
    const rebuiltBody = {
        destination: req.body.destination,
        events: req.body.events
    };
    const userId = req.body.events?.[0]?.source?.userId || 'unknown-line-user';
    
    const vercelLogPayload = {
        script_version: SCRIPT_VERSION,
        request_id: req.headers['x-vercel-id'] || 'unknown',
        signature_validation: signatureValidationResult
    };

    const payload = JSON.stringify({
        inputs: {
            line_webhook_data: JSON.stringify(rebuiltBody),
            vercel_log: JSON.stringify(vercelLogPayload) 
        },
        response_mode: "streaming",
        user: userId,
        conversation_id: ""
    });

    const maxRetries = 3; // 最大3回試行する
    let attempt = 0;
    let success = false;

    // ★★★ リトライループの開始 ★★★
    while (attempt < maxRetries && !success) {
        attempt++;
        try {
            console.log(`[${SCRIPT_VERSION}] Attempt ${attempt}: Sending request to Dify...`);

            const fetchResponse = await fetch(process.env.DIFY_API_ENDPOINT, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${process.env.DIFY_API_KEY}`,
                    'Content-Type': 'application/json'
                },
                body: payload
            });

            // ステータスコードのチェック (200番台なら成功とみなす)
            if (fetchResponse.ok) {
                console.log(`[${SCRIPT_VERSION}] Attempt ${attempt}: Success. Dify accepted request. Status: ${fetchResponse.status}`);
                success = true;
            } else {
                // Difyがエラー(500など)を返した場合
                const errorBody = await fetchResponse.text();
                console.warn(`[${SCRIPT_VERSION}] Attempt ${attempt}: Failed. Dify returned error status: ${fetchResponse.status}. Body: ${errorBody}`);
                // ここではbreakせず、次のリトライに進む（一時的な障害の可能性があるため）
                throw new Error(`Dify API returned ${fetchResponse.status}`);
            }

        } catch (error) {
            // 通信エラーや、上記でthrowされたエラーをキャッチ
            console.error(`[${SCRIPT_VERSION}] Attempt ${attempt}: Error occurred:`, error.message);
            
            if (attempt < maxRetries) {
                // 次のリトライまでの待機時間（1回目失敗後は1秒、2回目失敗後は2秒）
                const delay = attempt * 1000;
                console.log(`[${SCRIPT_VERSION}] Waiting ${delay}ms before retry...`);
                await sleep(delay);
            } else {
                console.error(`[${SCRIPT_VERSION}] All ${maxRetries} attempts failed. Giving up.`);
            }
        }
    }
    // ★★★ リトライループ終了 ★★★

    // 3. LINEへの応答（変更なし）
    // Difyへの送信が成功しても失敗しても、LINEにはOKを返して再送を防ぐ
    res.status(200).send('OK');
};