const line = require('@line/bot-sdk');
const fetch = require('node-fetch');

const config = {
    channelSecret: process.env.LINE_CHANNEL_SECRET,
};

// メインのハンドラ関数
module.exports = async (req, res) => {
    // 1. まずLINEからのリクエストの正当性を同期的に検証する
    try {
        const signature = req.headers['x-line-signature'];
        if (!line.validateSignature(JSON.stringify(req.body), config.channelSecret, signature)) {
            console.error("Signature validation failed");
            return res.status(401).send('Signature validation failed');
        }
    } catch (error) {
        console.error("Error during signature validation:", error);
        return res.status(500).send('Error during signature validation');
    }

    // ★★★ 最大の変更点 ★★★
    // 2. LINEには、Difyへの処理を始める前に、即座に応答を返す
    res.status(200).send('OK');

    // 3. Difyへのリクエストは、LINEへの応答後に「非同期」で実行する
    //    await を使うことで、Vercel関数は、このfetch処理が完了するまで終了しない
    try {
        const rebuiltBody = {
            destination: req.body.destination,
            events: req.body.events
        };
        
        const userId = req.body.events && req.body.events[0] && req.body.events[0].source ? req.body.events[0].source.userId : 'unknown-line-user';

        // Difyにリクエストを送信
        await fetch(process.env.DIFY_API_ENDPOINT, {
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
                conversation_id: "" // 必要に応じて設定
            })
        });

        // Vercelのログに成功したことを記録（オプション）
        console.log(`Successfully forwarded request to Dify for user: ${userId}`);

    } catch (error) {
        // もしDifyへのリクエスト自体が失敗した場合、Vercelのログにエラーを記録
        console.error("Error forwarding request to Dify:", error);
    }
};