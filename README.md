# FT Official Portfolio

A responsive, light-theme professional portfolio for Fayaz Tumrani, with a Cloudflare Pages + Pages Functions + D1 backend and protected admin panel.

## Included

- Public homepage, biography page and projects page
- Dynamic profile, brands, projects, updates/media and social links
- Admin login and content management
- TikTok post/profile links and manually managed media entries
- Public SEO metadata, canonical URL placeholders, sitemap and Person JSON-LD
- D1 database schema
- No paid services required for the intended low-traffic setup (within current free-plan quotas)

## Important privacy defaults

The public location is set to `Sindh, Pakistan`. Do not publish a home address, personal phone number, school timetable, private email, passwords, identity documents or precise live location. Use only public business/social links. The profile content is a draft; verify every statement before publishing.

## Requirements

- Cloudflare account
- Node.js and npm on a computer or Termux
- Wrangler CLI (installed through this project)
- A D1 database on Cloudflare

## 1. Install

```bash
npm install
npx wrangler login
```

## 2. Create D1 database

```bash
npx wrangler d1 create ft-portfolio-db
```

Copy the returned `database_id` into `wrangler.toml`, replacing `REPLACE_WITH_YOUR_D1_DATABASE_ID`.

Initialize the database:

```bash
npx wrangler d1 execute ft-portfolio-db --remote --file=./schema.sql
```

## 3. Create admin credentials

Choose a unique password of at least 16 characters. Do not reuse your email or social account password.

```bash
node scripts/make-admin-hash.mjs "YOUR-STRONG-UNIQUE-PASSWORD"
```

The command prints a salt and password hash. Add the following as Cloudflare Pages environment variables (Production and Preview as appropriate):

- `ADMIN_EMAIL` — the admin email address
- `ADMIN_PASSWORD_SALT` — generated salt
- `ADMIN_PASSWORD_HASH` — generated hash
- `SESSION_SECRET` — a separate random secret, at least 32 random characters

Set secrets in the Cloudflare dashboard under Workers & Pages → your Pages project → Settings → Variables and Secrets. Mark the password hash, salt and session secret as secrets. Never put these values in frontend JavaScript, GitHub, screenshots or public messages.

You can generate a session secret locally:

```bash
openssl rand -hex 32
```

## 4. Bind D1 to Pages

In Cloudflare Dashboard:
1. Workers & Pages → create a Pages project.
2. Connect this repository or upload the project using Wrangler.
3. Open Settings → Functions → D1 database bindings.
4. Add binding name `DB` and select `ft-portfolio-db`.
5. Add the four environment variables listed above.

The `DB` binding name must match exactly.

## 5. Deploy

For a direct Wrangler Pages deploy:

```bash
npx wrangler pages deploy public --project-name=ft-official-portfolio
```

For Git-connected deployments, set the build output directory to `public`; no build command is required. Ensure the Pages Functions directory is included in the project deployment. For a local test:

```bash
npx wrangler pages dev public --d1=DB=ft-portfolio-db
```

Local D1 setup may require a local database configuration; production deployment should use the dashboard binding.

## 6. First login

Open:

`https://YOUR-PROJECT.pages.dev/admin.html`

Sign in using the `ADMIN_EMAIL` and original password used to generate the hash.

## 7. Add your public content

Recommended first entries:

### Brands
- FENTRA Technologies — founder-associated technology brand
- FALCON TECHNOLOGIES — technology brand, previously associated with FZ Apps

### Projects
- FT Skills Hub — deployed educational technology platform. Add the verified public URL.
- NEXLIVO — describe as in development unless public features are verified.
- LearnOrbit — previous/in-development learning platform project.
- FALCON RealityCheck — testing/quality assurance project; describe its actual current status.

Only publish project links that you have checked. Do not label planned features as completed.

### Social links
Add only official public profiles that you control. TikTok embeds can be added as public source links. TikTok may limit embedded playback depending on its own policies, browser settings or regional availability.

### Media
Use a public HTTPS image/video URL. This starter does not include direct file uploads; it avoids requiring paid object storage. Do not use images of other people without permission.

## 8. SEO launch checklist

1. Replace `YOUR-SITE.pages.dev` in `index.html`, `projects.html`, `about.html`, `robots.txt` and `sitemap.xml` with the final Pages domain.
2. Confirm the homepage and all project links work without logging in.
3. Submit `https://YOUR-SITE.pages.dev/sitemap.xml` in Google Search Console.
4. Verify the domain in Search Console using the verification method Google provides.
5. Add the same public website URL to your official social profiles and project pages.
6. Keep the name spelling consistent: Fayaz Tumrani.

Google decides when and whether to index pages. Search ranking and knowledge panel appearance are not guaranteed.

## Security notes and limitations

- Admin APIs require a signed, HttpOnly, Secure, SameSite=Strict session cookie.
- Login attempts are rate-limited per IP using D1 records.
- Mutating requests validate same-origin requests.
- Public APIs return only public fields.
- Admin route is excluded from search indexing; robots.txt is not an access-control mechanism. Authentication is the actual protection.
- Use HTTPS links only for public URLs.
- Keep Cloudflare account recovery options secure.
- Review Cloudflare and Firebase free-tier terms and quotas; usage beyond free limits may require payment. Do not enable paid services without checking first.
- This is a deployable starter implementation, not a security certification. Test the deployed site, API permissions, login/logout, D1 CRUD and backups before announcing it as production-ready.

## Backup

Export the database periodically:

```bash
npx wrangler d1 export ft-portfolio-db --remote --output=backup.sql
```

Keep backups private and secure.
