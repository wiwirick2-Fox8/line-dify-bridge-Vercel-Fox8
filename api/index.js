const line = require('@line/bot-sdk'); // LINEの署名検証に必要
const fetch = require('node-fetch'); // fetchを明示的にrequireする

const config = {
  channelSecret: process.env.LINE_CHANNEL_SECRET,
};

module.exports = async (req, res) => {
  // LINEの署名検証だけは行う
  const signature = req.headers['x-line-signature'];
  if (!line.validateSignature(JSON.stringify(req.body), config.channelSecret, signature)) {
    console.error('Signature validation failed.');
    return res.status(401).send('Unauthorized');
  }

  // LINEには、まず先に「OK」を返して、処理を継続させる
  res.status(200).send('OK');

  try {
    // Difyに、ハードコードされた最小限のデータを送信する
    const difyResponse = await fetch(process.env.DIFY_API_ENDPOINT, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.DIFY_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        inputs: {
          test_message: "Final connectivity test: " + new Date().toISOString()
        },
        response_mode: "blocking",
        user: "vercel-final-test-user"
      })
    });

    if (!difyResponse.ok) {
      const errorData = await difyResponse.text();
      console.error('Dify API returned an error:', {
        status: difyResponse.status,
        body: errorData
      });
    } else {
      console.log('Successfully sent data to Dify. Status:', difyResponse.status);
    }

  } catch (error) {
    console.error('Error sending data to Dify:', error.message);
  }
};