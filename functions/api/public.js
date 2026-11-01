export async function onRequestGet({ env }) {
  if (!env.DB) return Response.json({ error: "Database is not configured." }, { status: 503 });
  const [profile, companies, projects, posts, socials] = await Promise.all([
    env.DB.prepare("SELECT * FROM profile WHERE id=1").first(),
    env.DB.prepare("SELECT id,name,slug,description,services,website_url,logo_url,status FROM companies ORDER BY sort_order,id").all(),
    env.DB.prepare("SELECT id,name,slug,summary,description,category,status,public_url,repository_url,image_url,featured FROM projects ORDER BY featured DESC,sort_order,id").all(),
    env.DB.prepare("SELECT id,title,slug,body,media_url,media_type,source_url,created_at FROM posts WHERE published=1 ORDER BY created_at DESC LIMIT 30").all(),
    env.DB.prepare("SELECT id,platform,label,url FROM socials ORDER BY sort_order,id").all()
  ]);
  return Response.json({ profile, companies: companies.results, projects: projects.results, posts: posts.results, socials: socials.results }, {
    headers: { "Cache-Control": "public, max-age=60, s-maxage=300" }
  });
}