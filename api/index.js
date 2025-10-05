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

  // ★★★ Pipedreamの知見を反映した、最重要の修正点 ★★★
  // req.bodyから、destinationとeventsを明示的に取り出し、
  // 正しい順序で新しいオブジェクトを再構築する。
  const rebuiltBody = {
    destination: req.body.destination,
    events: req.body.events
  };

  try {
    axios.post(process.env.DIFY_API_ENDPOINT, {
      inputs: {
        // 再構築したオブジェクトを文字列化して送信する
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
    console.error('Error sending data to Dify:', error.message);
  }

  res.status(200).send('OK');
};