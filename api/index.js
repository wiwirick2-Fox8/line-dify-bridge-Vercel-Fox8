const axios = require('axios');

module.exports = async (req, res) => {
  // Step 1: まずLINEに即座に応答を返し、接続を開放する
  res.status(200).send('OK: Request received by Vercel. Attempting to contact Dify.');
  console.log('✅ [Vercel] LINEからのリクエストを受信。Difyへの処理を開始します。');

  try {
    // Step 2: Difyに送信する、完全に固定された最小限のデータを作成
    const difyPayload = {
      inputs: {
        // Difyのテスト用ワークフローで定義した変数名に完全に一致させる
        test_message: "Hello Dify, this is a minimal test from Vercel!" 
      },
      response_mode: "blocking", // 処理の完了を待つ
      user: "vercel-final-test-user"
    };
    console.log('📤 [Vercel] Difyへ送信するデータ:', JSON.stringify(difyPayload));

    // Step 3: Dify APIを呼び出し、awaitで処理の完了を待つ
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
    
    // Step 4: Difyからの応答をVercelのログに記録する
    console.log('✅ [Vercel] Difyからの応答を正常に受信:', {
      status: difyResponse.status,
      data: difyResponse.data 
    });

  } catch (error) {
    // Step 5: もしエラーが発生した場合、その詳細をVercelのログに記録する
    console.error('❌ [Vercel] Difyへのリクエスト中にエラーが発生:', {
      message: error.message,
      response_data: error.response ? error.response.data : 'No response from server'
    });
  }
};