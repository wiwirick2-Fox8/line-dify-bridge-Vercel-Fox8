const line = require('@line/bot-sdk');
const fetch = require('node-fetch');

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
    // ★★★ 変更点：awaitキーワードをここから削除 ★★★
    const difyResponse = fetch(process.env.DIFY_API_ENDPOINT, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.DIFY_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        inputs: {
          test_message: "Test without await: " + new Date().toISOString()
        },
        response_mode: "blocking",
        user: "vercel-await-test-user"
      })
    });

    // このログは、Difyへのリクエストが完了する「前」に表示される
    console.log('Request to Dify has been sent (without await).');

  } catch (error) {
    console.error('Error sending data to Dify:', error.message);
  }
};