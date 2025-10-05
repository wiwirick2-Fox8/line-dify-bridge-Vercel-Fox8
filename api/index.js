const line = require('@line/bot-sdk');
const axios = require('axios');

// Vercelの環境変数から設定を読み込む
const config = {
  channelSecret: process.env.LINE_CHANNEL_SECRET,
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN
};

const client = new line.Client(config);

module.exports = async (req, res) => {
  // LINEの署名検証
  const signature = req.headers['x-line-signature'];
  if (!line.validateSignature(JSON.stringify(req.body), config.channelSecret, signature)) {
    res.status(401).send('Unauthorized');
    return;
  }

  // Difyにリクエストを非同期で送信（Fire and Forget）
  try {
    axios.post(process.env.DIFY_API_ENDPOINT, {
      inputs: {
        line_webhook_data: JSON.stringify(req.body)
      },
      response_mode: "streaming",
      user: req.body.events[0]?.source?.userId || 'unknown-line-user'
    }, {
      headers: {
        'Authorization': `Bearer ${process.env.DIFY_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    // Difyへのリクエストが失敗しても、LINEには成功応答を返す
    // エラーはVercelのログで確認する
    console.error('Error sending data to Dify:', error.message);
  }

  // LINEに常に200 OKを即座に返す
  res.status(200).send('OK');
};