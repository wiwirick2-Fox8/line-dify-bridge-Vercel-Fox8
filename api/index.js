import axios from 'axios';

// 署名検証ライブラリ(@line/bot-sdk)は、もう不要

export default async function handler(req, res) {
  // 常にLINEに即座に応答を返し、タイムアウトを防ぐ
  res.status(200).send('OK');

  try {
    // LINEから受け取ったbodyを、そのままDifyに送るデータとして利用する
    const body = req.body;

    // Pipedreamの知見を反映：キーの順序を保証するためにデータを再構築
    const rebuiltBody = {
      destination: body.destination,
      events: body.events
    };

    const difyPayload = {
      inputs: {
        line_webhook_data: JSON.stringify(rebuiltBody)
      },
      workflow_id: process.env.DIFY_WORKFLOW_ID_MAIN,
      response_mode: "streaming",
      user: body.events[0]?.source?.userId || 'unknown-line-user'
    };
    
    // Postmanの成功事例を再現
    await axios({
        method: 'POST',
        url: process.env.DIFY_API_ENDPOINT,
        headers: {
            'Authorization': `Bearer ${process.env.DIFY_API_KEY_MAIN}`,
            'Content-Type': 'application/json'
        },
        data: difyPayload
    });
    
    console.log(`✅ [Vercel] Successfully sent data to Dify for user: ${difyPayload.user}`);

  } catch (error) {
    console.error('❌ [Vercel] An error occurred:', error.message);
  }
};