const line = require('@line/bot-sdk');
const axios = require('axios');

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
    // ★★★ 変更点：awaitを追加し、response_modeをblockingに変更 ★★★
    const difyResponse = await axios.post(process.env.DIFY_API_ENDPOINT, {
      inputs: {
        test_message: "Final test with axios + blocking: " + new Date().toISOString()
      },
      response_mode: "blocking", // Difyからの応答を待つ
      user: "vercel-axios-blocking-test"
    }, {
      headers: {
        'Authorization': `Bearer ${process.env.DIFY_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Successfully sent data to Dify with axios + blocking. Status:', difyResponse.status);

  } catch (error) {
    console.error('Error sending data to Dify with axios + blocking:', error.response ? error.response.data : error.message);
  }
};