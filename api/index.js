// axiosはもう使いません

module.exports = async (req, res) => {
  // LINEには、まず先に「OK」を返す
  res.status(200).send('OK');

  try {
    // Node.js標準のfetch APIを使って、Difyにリクエストを送信
    const difyResponse = await fetch(process.env.DIFY_API_ENDPOINT, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.DIFY_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        inputs: {
          test_message: "Hello from Vercel with fetch! The time is " + new Date().toISOString()
        },
        response_mode: "blocking",
        user: "vercel-fetch-test-user"
      })
    });

    // Difyからの応答が成功したかを確認
    if (!difyResponse.ok) {
      // もし失敗していたら、Difyが返したエラー内容をログに出力
      const errorData = await difyResponse.json();
      console.error('Dify API returned an error:', errorData);
    } else {
      // 成功したら、その旨をログに出力
      console.log('Successfully sent data to Dify with fetch. Status:', difyResponse.status);
    }

  } catch (error) {
    // ネットワークレベルのエラーをログに出力
    console.error('Error sending data to Dify with fetch:', error.message);
  }
};