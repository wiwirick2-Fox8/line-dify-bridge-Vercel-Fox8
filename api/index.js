const line = require('@line/bot-sdk');
const axios = require('axios');

const config = {
  channelSecret: process.env.LINE_CHANNEL_SECRET,
};

module.exports = async (req, res) => {
  // 常にLINEに即座に応答を返し、タイムアウトを防ぐ
  res.status(200).send('OK');

  try {
    // LINEの署名検証
    const signature = req.headers['x-line-signature'];
    if (!line.validateSignature(JSON.stringify(req.body), config.channelSecret, signature)) {
      console.error('[Vercel] Signature validation failed.');
      return; // 検証失敗時はここで処理を中断
    }
    console.log('✅ [Vercel] Signature validation successful.');

    // Pipedreamの知見を反映：キーの順序を保証するためにデータを再構築
    const rebuiltBody = {
      destination: req.body.destination,
      events: req.body.events
    };

    const difyPayload = {
      inputs: {
        line_webhook_data: JSON.stringify(rebuiltBody)
      },
      workflow_id: process.env.DIFY_WORKFLOW_ID_MAIN, // 本番用IDを参照
      response_mode: "streaming", // 非同期でOK
      user: req.body.events[0]?.source?.userId || 'unknown-line-user'
    };
    
    // Postmanの成功事例を再現：axiosの呼び出し方を修正
    await axios({
        method: 'POST',
        url: process.env.DIFY_API_ENDPOINT,
        headers: {
            'Authorization': `Bearer ${process.env.DIFY_API_KEY_MAIN}`, // 本番用APIキーを参照
            'Content-Type': 'application/json'
        },
        data: difyPayload
    });
    
    console.log(`✅ [Vercel] Successfully sent data to Dify for user: ${difyPayload.user}`);

  } catch (error) {
    console.error('❌ [Vercel] An error occurred:', {
      message: error.message,
      response_data: error.response ? error.response.data : 'No response'
    });
  }
};