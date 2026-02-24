import { createClient } from "@supabase/supabase-js"

export const dynamic = "force-dynamic"

export async function GET() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const { data } = await supabase
    .from("settings")
    .select("value")
    .eq("key", "canary_status_code")
    .single()

  const statusCode = data ? parseInt(data.value, 10) : 200

  const html = `<!DOCTYPE html>
<html><head><title>Canary</title></head>
<body><p>Canary response: ${statusCode}</p></body>
</html>`

  return new Response(html, {
    status: statusCode,
    headers: { "Content-Type": "text/html" },
  })
}
