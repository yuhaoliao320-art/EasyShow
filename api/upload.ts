// Vercel Serverless Function
// 作用：前端 → Vercel → ImgBB（API Key 只在這裡，不進前端 bundle）
// 部署後路由：POST /api/upload

export default async function handler(
  req: { method: string; body: { image?: string } },
  res: any
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { image } = req.body
  if (!image) {
    return res.status(400).json({ error: 'Missing image' })
  }

  const imgbbKey = process.env.IMGBB_API_KEY
  if (!imgbbKey) {
    return res.status(500).json({ error: 'Server configuration error' })
  }

  // 移除 data URL 前綴（如 data:image/jpeg;base64,）
  // ImgBB 只接受純 base64 字串
  const rawBase64 = image.startsWith('data:')
    ? image.replace(/^data:image\/[a-zA-Z]+;base64,/, '')
    : image

  const formData = new FormData()
  formData.append('key', imgbbKey)
  formData.append('image', rawBase64)

  const r = await fetch('https://api.imgbb.com/1/upload', {
    method: 'POST',
    body: formData,
  })

  const data = await r.json()
  res.status(r.status).json(data)
}
