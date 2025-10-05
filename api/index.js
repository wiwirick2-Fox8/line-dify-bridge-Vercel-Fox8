const line = require('@line/bot-sdk');
const axios = require('axios');

const config = {
  channelSecret: process.env.LINE_CHANNEL_SECRET,
};

module.exports = async (req, res) => {
  // LINEの署名検証
  const signature = req.headers['x-line-signature'];
  if (!line.validateSignature(JSON.stringify(req.body), config.channelSecret, signature)) {
    res.status(401).send('Unauthorized');
    return;
  }
  
  // 先にLINEに応答を返し、接続を切断させる
  res.status(200).send('OK');

  // ★★★ 最重要の修正点 ★★★
  // LINEへの応答が終わった後で、Difyへの処理を「待って」実行する
  try {
    const rebuiltBody = {
      destination: req.body.destination,
      events: req.body.events
    };

    // await を使って、axiosの処理が完了するのを待つ
    await axios.post(process.env.DIFY_API_ENDPOINT, {
      inputs: {
        line_webhook_data: JSON.stringify(rebuiltBody)
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
    // このエラーはVercelのログにのみ記録される
    console.error('Error sending data to Dify:', error.message);
  }
};