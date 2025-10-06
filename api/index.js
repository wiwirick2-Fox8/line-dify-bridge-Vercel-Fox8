const axios = require('axios');

module.exports = async (req, res) => {
  res.status(200).send('OK: Request received. Attempting to contact Dify.');
  console.log('✅ [Vercel] LINEからのリクエストを受信。Difyへの処理を開始します。');

  try {
    const difyPayload = {
      inputs: {
        test_message: "Hello Dify, this is the final, correct test from Vercel!" 
      },
      // ★★★ 修正点：workflow_idを追加 ★★★
      workflow_id: process.env.DIFY_WORKFLOW_ID_TEST,
      response_mode: "blocking",
      user: "vercel-final-test-user"
    };
    console.log('📤 [Vercel] Difyへ送信するデータ:', JSON.stringify(difyPayload));

    const difyResponse = await axios.post(
      process.env.DIFY_API_ENDPOINT, 
      difyPayload,
      {
        headers: {
          'Authorization': `Bearer ${process.env.DIFY_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('✅ [Vercel] Difyからの応答を正常に受信:', {
      status: difyResponse.status,
      data: difyResponse.data 
    });

  } catch (error) {
    console.error('❌ [Vercel] Difyへのリクエスト中にエラーが発生:', {
      message: error.message,
      response_data: error.response ? error.response.data : 'No response from server'
    });
  }
};