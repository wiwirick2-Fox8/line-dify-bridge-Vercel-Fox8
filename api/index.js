const axios = require('axios');

module.exports = async (req, res) => {
  res.status(200).send('OK');
  console.log('✅ [Vercel] LINE受信。Postman成功再現コードでDifyへ処理開始。');

  try {
    const difyPayload = {
      inputs: {
        test_message: "Hello from the Postman-proven Vercel code!"
      },
      workflow_id: process.env.DIFY_WORKFLOW_ID_TEST,
      response_mode: "blocking",
      user: "vercel-final-postman-test"
    };
    
    // ★★★ PipedreamとPostmanの成功事例を完全に再現 ★★★
    const difyResponse = await axios({
        method: 'POST',
        url: process.env.DIFY_API_ENDPOINT,
        headers: {
            'Authorization': `Bearer ${process.env.DIFY_API_KEY}`,
            'Content-Type': 'application/json'
        },
        data: difyPayload // Bodyは、必ず`data`キーに格納する
    });
    
    console.log('✅ [Vercel] Difyからの応答を正常に受信:', difyResponse.data);

  } catch (error) {
    console.error('❌ [Vercel] Difyへのリクエスト中にエラーが発生:', {
      message: error.message,
      response_data: error.response ? error.response.data : 'No response'
    });
  }
};