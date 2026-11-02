# Joeltech Geek Systems — website information architecture and SEO content brief

Updated: 2026-10-14. Main branch: `main`.

## Positioning

Joeltech Geek Systems is a Kenya-registered, founder-led software development business working with clients remotely worldwide. Two distinct lines of work:
1. **Client engineering:** commissioned applications, dashboards, backend APIs, integrations and production delivery.
2. **Commercial products:** software built for the business's own product roadmap and revenue opportunities.

The founder, Joel Mbaka, is separately discoverable as a senior full-stack software engineer / React Native specialist and is open to appropriate professional engagements. Client service, company product ownership, professional identity, paid careers and developer mentorship should never be conflated.

We specialize in **React Native + Expo + TypeScript for mobile**, **Next.js + React for web**, and **Python/FastAPI + PostgreSQL for backend**. Applied AI means integrating existing AI/LLM/audio APIs and workflow logic; do not advertise foundation-model training, data-science research, Flutter or standalone native Swift/Kotlin app development.

Do not invent company headcount, a developer placement pool, visa sponsorship, commercial revenue, client testimonials, accreditation, classes, certificates, job vacancies, project outcomes or screenshots.

## Primary navigation and user intent

| Location | Purpose / distinct search intent |
| --- | --- |
| `/` | Company brand; overview of software development, products and client work |
| `/services` | Commercial engineering services: what customers can buy |
| `/services/react-native-app-development` | React Native mobile app engineering |
| `/services/web-app-development` | Next.js business web apps and dashboards |
| `/services/fastapi-backend-development` | Python FastAPI/PostgreSQL backend systems |
| `/services/saas-product-development` | End-to-end SaaS/MVP development |
| `/services/payment-integrations` | M-Pesa, billing, callbacks and reconciliation |
| `/services/ai-api-integrations` | Applied AI model/API integration, not model training |
| `/work` | Single portfolio authority with distinct in-house, client and experiment sections |
| `/[projectId]` | Unique case study for a real product or client system |
| `/about` | Company identity, registration, operating model |
| `/founder` | Joel Mbaka professional profile and production engineering evidence |
| `/mentorship` | Developer mentorship and practical learning philosophy |
| `/careers` | Paid engineering collaboration enquiries, internships and SaaS sales |
| `/industries` | Industry-specific evidence tied to case studies |
| `/contact` | Direct service enquiries and contact methods |

The primary nav is **Services / Portfolio / About / Mentorship / Careers** plus **Start a Project**. Footer links may also include Founder, Industries and Contact.

## Consolidated former routes

The old standalone `/expertise`, `/skills`, `/full-stack-web-mobile-engineer` and `/work-with-me` pages no longer represent distinct search intents. They are permanently redirected to the relevant /services or /founder page. All existing `/expertise/[slug]` URLs permanently redirect to their closest service page. They must not be included in `sitemap.xml`. Keep existing root-level project URLs stable.

Do **not** create thin near-identical keyword landing pages for unrelated cities, frameworks, or industries. The goal is one strong canonical page per unique visitor purpose, with internal links to relevant project evidence.

## Project provenance and platforms

- **Company-developed / co-founded products:** RentPayor (iOS, Android, web), JournPad (iOS, Android), SchoolPey (Android, web), CliviQue HMIS (web; co-founded initiative). Do not imply exclusively owned IP in co-founded projects.
- **Client-commissioned work:** Macsim Cargo (Android and web administration), Milliol Construction Manager (Android).
- **Experiment:** AI Stylist; do not imply a production customer base or commercially launched service.
- The app/web platform labels must describe **actual** project release targets; don't inflate Android-only products to iOS.
- Preserve evidence-rich unique project descriptions rather than copying a service sales pitch onto each case study.

## Case study page order / media requirements

1. Specific product name and outcome-oriented description
2. Engagement context: commercial product / client work / experiment; platforms
3. **Verified short video** where available: 45–90 seconds, one real workflow, readable cursor/touch actions, anonymized demo data, optional captions
4. Founder/company engineering contribution, scope and key workflows
5. Current annotated Android/iOS/web screenshots as supporting reference
6. Supporting systems, stack and real external website/store links

`config/projects.ts` allows optional `demoVideo`: `{ src, poster, title, description, duration?, publishedAt?, captions? }`. Never invent media URLs or create misleading demos. Prefer MP4/H.264 plus WebVTT captions and a stable cover image. If `publishedAt` is verified, `VideoObject` JSON-LD can describe the media. Only add date/duration after validation. Remove personal or client-sensitive data before publishing. Fresh screenshots/video are an editorial backlog, not a blocker for a non-broken case study.

## Keyword hypotheses (not validated search volumes)

Commercial: software development company in Kenya, custom software development Nairobi, mobile app development Kenya, React Native developers, Next.js web application development, FastAPI backend development, SaaS product development, M-Pesa API integration, payment reconciliation, AI API integration.

Founder / recruitment: Joel Mbaka, senior React Native engineer, senior full-stack engineer, product engineer, technical lead, remote software engineer.

Education: React Native mentorship, software development mentorship, Next.js TypeScript training, FastAPI PostgreSQL learning.

These terms are based on the search-result landscape and the actual services offered; they are **not** Google Keyword Planner volume estimates or ranking guarantees. Prioritize clear copy, demonstrated expertise, fast useful pages and real case studies.

## Pre-deployment gate (local branch, manual)

- Check remote branch sync, run `npx tsc --noEmit`, `npx eslint .` (or your existing lint workflow) and `npm run build`.
- Inspect nav and each page at 375/768/1024/1440 px, light/dark and keyboard navigation.
- Check `/sitemap.xml` includes only canonical, indexable pages; check `/robots.txt`.
- Verify all former SEO routes return permanent 308 redirects and don't appear in the sitemap.
- Check all service detail routes and project case studies load; confirm founder and mentorship have unique titles/descriptions.
- Verify app store and external product links, images/OG previews, captions and video playback when media exists.
- Preserve Google verification file and existing production DNS.
- **Do not automatically merge to main or deploy.** Deploy only after branch review and explicit manual decision.

## Post-launch measurement

Use Search Console to inspect indexing and queries for the *new canonical page set* after deployment. Watch `/services` and specific services for commercial search queries; `/founder` for personal-name/engineering-role queries; `/work` and case studies for branded products. Google may take time to update its already-read sitemap and evaluate redirects. Avoid repeatedly requesting indexing for every URL.
