# Joeltech Geek Systems

Official Next.js website for **Joeltech Geek Systems**, a Kenya-registered, founder-led software development business. The business develops its own commercial software products and delivers commissioned software engineering work for clients in Kenya and internationally.

- Production: https://joeltechgeek.com
- Founder & lead software engineer: Joel Mbaka
- Business registration: BN-P7SEWW57 (Kenya)
- Main branch: `main`; production deployments are reviewed and performed manually (no automatic merge)
- SEO, editorial/route policy: [docs/SEO_CONTENT_STRATEGY.md](docs/SEO_CONTENT_STRATEGY.md)

## Public website

| Route | Visitor intent |
| --- | --- |
| `/` | Company and product/client proof |
| `/services` | Client-facing services |
| `/services/[slug]` | Six distinct service detail pages |
| `/work` | Portfolio: in-house products, client work and experiments |
| `/[projectId]` | Specific evidence-rich project case study |
| `/about` | Company identity and operating model |
| `/founder` | Joel Mbaka, senior engineer and founder |
| `/mentorship` | Practical developer mentorship |
| `/careers` | Paid engineering enquiries, internships and SaaS sales |
| `/industries` | Actual industry experience supported by project evidence |
| `/contact` | Enquiries |

Legacy overlapping SEO routes under `/expertise`, plus `/skills`, `/work-with-me` and `/full-stack-web-mobile-engineer`, have permanent redirects to appropriate service/founder URLs and are omitted from the sitemap. Do not delete or modify the Google verification file.

Core technologies: React Native/Expo/TypeScript for mobile, Next.js/React for web, Python/FastAPI/PostgreSQL for APIs and transactional systems. AI work integrates existing models and APIs; it is not model training. Do not imply staff headcount, active vacancies, accredited schooling, placement guarantees, unproven clients or revenue, or released platforms without evidence.

## Development and verification

```bash
npm install
npx tsc --noEmit
npx eslint .
npm run build
```

After local validation, review navigation, responsive layouts at 375/768/1024/1440 px, accessibility, unique SEO metadata, all canonical sitemap URLs, preserved project links and permanent redirects. The website is **deployed manually** after review with `vercel --prod`. Never automatically deploy or merge into `main`.

`/robots.txt` must advertise `https://joeltechgeek.com/sitemap.xml`. Search Console verification is maintained through the published verification file. Some project screenshots show previous UI versions; only attach a product walkthrough when genuine media and approved poster assets are available.

## Contact

Founder: Joel Mbaka · mbakajoe26@gmail.com · https://linkedin.com/in/joelmbaka
