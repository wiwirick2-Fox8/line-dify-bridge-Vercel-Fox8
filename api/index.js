const line = require('@line/bot-sdk');
const fetch = require('node-fetch');

const config = {
  channelSecret: process.env.LINE_CHANNEL_SECRET,
};

module.exports = async (req, res) => {
  // LINEの署名検証
  try {
    const signature = req.headers['x-line-signature'];
    if (!line.validateSignature(JSON.stringify(req.body), config.channelSecret, signature)) {
      console.error('Signature validation failed.');
      return res.status(401).send('Unauthorized');
    }
  } catch (error) {
    console.error('Error during signature validation:', error.message);
    return res.status(400).send('Bad Request');
  }

  // LINEには、まず先に「OK」を返す
  res.status(200).send('OK');

  try {
    // Pipedreamの知見を反映：キーの順序を保証した新しいオブジェクトを再構築
    const rebuiltBody = {
      destination: req.body.destination,
      events: req.body.events
    };

    // Difyに本番データを送信
    fetch(process.env.DIFY_API_ENDPOINT, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.DIFY_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        inputs: {
          // 本番用の`Central_Processor`が待つ変数名
          line_webhook_data: JSON.stringify(rebuiltBody)
        },
        response_mode: "streaming",
        // LINEから受け取った実際のユーザーIDを使用
        user: req.body.events[0]?.source?.userId || 'unknown-line-user'
      })
    }).catch(error => {
        console.error('Error sending data to Dify with fetch:', error.message);
    });

  } catch (error) {
    console.error('Critical error before sending data to Dify:', error.message);
  }
};