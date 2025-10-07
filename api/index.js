const line = require('@line/bot-sdk');
const axios = require('axios'); // axiosを再度使用します

const config = {
  channelSecret: process.env.LINE_CHANNEL_SECRET,
};

module.exports = async (req, res) => {
  // LINEの署名検証
  const signature = req.headers['x-line-signature'];
  if (!line.validateSignature(JSON.stringify(req.body), config.channelSecret, signature)) {
    console.error('Signature validation failed.');
    return res.status(401).send('Unauthorized');
  }

  // LINEには、まず先に「OK」を返す
  res.status(200).send('OK');

  try {
    // ★★★ 変更点：axiosを使ってDifyにリクエストを送信 ★★★
    axios.post(process.env.DIFY_API_ENDPOINT, {
      inputs: {
        test_message: "Test with axios (no await): " + new Date().toISOString()
      },
      response_mode: "streaming", // 応答を待たないのでstreaming
      user: "vercel-axios-test-user"
    }, {
      headers: {
        'Authorization': `Bearer ${process.env.DIFY_API_KEY}`,
        'Content-Type': 'application/json'
      }
    }).catch(error => {
        // エラーが発生した場合のみ、Vercelのログに出力
        console.error('Error sending data to Dify with axios:', error.response ? error.response.data : error.message);
    });
    
    console.log('Request to Dify has been sent (with axios).');

  } catch (error) {
    // このcatchブロックは、axiosの呼び出し自体が失敗した場合にのみ実行される
    console.error('Critical error before sending data to Dify:', error.message);
  }
};