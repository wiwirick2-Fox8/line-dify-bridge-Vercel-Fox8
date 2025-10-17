const { GoogleAuth } = require('google-auth-library');

// この関数は、VercelによってAPIエンドポイントとして公開されます
module.exports = async (req, res) => {
    // Vercelの環境変数から、Base64エンコードされたJSONキーを取得
    const serviceAccountBase64 = process.env.GOOGLE_SERVICE_ACCOUNT_BASE64;

    if (!serviceAccountBase64) {
        return res.status(500).json({ error: "Google Service Account is not configured in Vercel environment variables (Base64)." });
    }

    try {
        // Base64文字列をデコードして、元のJSON文字列に戻す
        const serviceAccountJson = Buffer.from(serviceAccountBase64, 'base64').toString('utf-8');
        
        // 文字列形式のJSONキーをパース
        const credentials = JSON.parse(serviceAccountJson);

        // ★★★重要★★★
        // 読み取りと書き込みの両方が可能な、広範なスコープを要求する
        const auth = new GoogleAuth({
            credentials,
            scopes: 'https://www.googleapis.com/auth/spreadsheets',
        });

        // アクセストークンを取得
        const token = await auth.getAccessToken();

        // 成功したら、アクセストークンをJSON形式で返す
        res.status(200).json({ access_token: token });

    } catch (error) {
        console.error("Error getting Google access token:", error);
        res.status(500).json({ error: "Failed to get Google access token.", details: error.message });
    }
};