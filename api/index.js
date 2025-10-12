const line = require('@line/bot-sdk');
const fetch = require('node-fetch');

const SCRIPT_VERSION = "v10_final_stable_architecture_1012";

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

    // 2. Difyへのリクエストを先に実行し、即時応答を待つ
    try {
        const rebuiltBody = {
            destination: req.body.destination,
            events: req.body.events
        };
        const userId = req.body.events?.[0]?.source?.userId || 'unknown-line-user';

        console.log(`[${SCRIPT_VERSION}] Sending request to Dify. User: ${userId}, Mode: blocking`);

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
        console.error(`[${SCRIPT_VERSION}] Critical error forwarding request to Dify:`, error);
    }

    // 3. Difyからの応答を受け取った後で、最後にLINEに応答を返す
    res.status(200).send('OK');
};