const axios = require('axios');

module.exports = async (req, res) => {
  // LINEからの署名検証やデータ処理は、このテストではすべて無視する

  // LINEには、まず先に「OK」を返して、処理を継続させる
  res.status(200).send('OK');

  try {
    // Difyに、ハードコードされた最小限のデータを送信する
    await axios.post(process.env.DIFY_API_ENDPOINT, {
      inputs: {
        // Difyのテスト用ワークフローで定義した変数名に合わせる
        test_message: "Hello from Vercel! The time is " + new Date().toISOString()
      },
      response_mode: "blocking", // 応答を待つ
      user: "vercel-connectivity-test-user"
    }, {
      headers: {
        'Authorization': `Bearer ${process.env.DIFY_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    
    // Difyへのリクエストが成功したことを、Vercelのログに出力
    console.log('Successfully sent data to Dify.');

  } catch (error) {
    // Difyへのリクエストが失敗した場合、詳細なエラーをVercelのログに出力
    console.error('Error sending data to Dify:', error.response ? error.response.data : error.message);
  }
};