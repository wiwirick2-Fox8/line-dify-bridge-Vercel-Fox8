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
    // ★★★ 変更点 ★★★
    // LINEのWebhookデータ（req.body）から、安全にuserIdを抽出する
    // events配列が存在し、その最初の要素が存在し、その中にsourceがあり、userIdがあることを確認
    const userId = req.body.events && req.body.events[0] && req.body.events[0].source ? req.body.events[0].source.userId : 'unknown-line-user';

    // fetch APIを使って、Difyにリクエストを送信
    fetch(process.env.DIFY_API_ENDPOINT, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.DIFY_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        inputs: {
          test_message: "Dynamic user ID test: " + new Date().toISOString()
        },
        response_mode: "streaming",
        // ★★★ 変更点 ★★★
        // 抽出したuserIdを、Difyのuserパラメータに設定する
        user: userId 
      })
    }).catch(error => {
        console.error('Error sending data to Dify with fetch:', error.message);
    });

  } catch (error) {
    console.error('Critical error before sending data to Dify:', error.message);
  }
};