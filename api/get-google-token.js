const { GoogleAuth } = require('google-auth-library');

// この関数は、VercelによってAPIエンドポイントとして公開されます
module.exports = async (req, res) => {
    // Vercelの環境変数から、Difyでハードコーディングしたのと同じJSONキーを取得
    const serviceAccountJson = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;

    if (!serviceAccountJson) {
        return res.status(500).json({ error: "Google Service Account JSON is not configured in Vercel environment variables." });
    }

    try {
        // 文字列形式のJSONキーをパース
        const credentials = JSON.parse(serviceAccountJson);

        // google-auth-libraryを使って認証オブジェクトを作成
        const auth = new GoogleAuth({
            credentials,
            scopes: 'https://www.googleapis.com/auth/spreadsheets.readonly',
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