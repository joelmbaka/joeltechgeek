import Link from 'next/link';
import Image from 'next/image';
import { ArrowUpRight, MonitorSmartphone } from 'lucide-react';
import { Project } from '@/config/projects';

interface CardImage {
  alt: string;
  className: string;
  src?: string;
}

function getCardImage(project: Project): CardImage {
  if (project.storePreview) {
    const label =
      project.storePreview.platform === 'ios'
        ? 'App Store listing screenshot'
        : project.storePreview.platform === 'android'
          ? 'Play Store listing screenshot'
          : 'web app screenshot';

    return {
      alt: project.id === 'callsbound' ? 'CallsBound CRM Play Store feature graphic' : `${project.title} ${label}`,
      className: project.id === 'callsbound' ? 'object-cover object-center' : project.storePreview.platform === 'android' ? 'object-cover object-top' : 'object-cover object-center',
      src: project.storePreview.src,
    };
  }

  if (project.screenshots?.web?.length) {
    return {
      alt: `${project.title} web app screenshot`,
      className: 'object-cover object-top',
      src: project.screenshots.web[0],
    };
  }

  if (project.icon) {
    return {
      alt: `${project.title} app icon`,
      className: 'object-contain p-10 sm:p-12',
      src: project.icon,
    };
  }

  return { alt: `${project.title} preview unavailable`, className: '' };
}

export default function ProjectsCarousel({ projects }: { projects: Project[] }) {
  return (
    <div className="grid grid-cols-1 items-stretch gap-5 md:grid-cols-2" role="list" aria-label="Projects">
      {projects.map((project) => {
        const cardImage = getCardImage(project);
        const iconStyle = project.iconBackground ? { backgroundColor: project.iconBackground } : undefined;

        return (
          <article
            key={project.id}
            role="listitem"
            className="group flex h-full min-w-0 flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg dark:border-gray-800 dark:bg-gray-900/70"
          >
            <Link href={`/${project.id}`} className="block shrink-0" aria-label={`View ${project.title} case study`}>
              {/* Project thumbnail: export at 1200×675 px (16:9); 1600×900 px is also suitable. Keep critical UI inside the crop-safe area. */}
              <div className="relative aspect-[16/9] w-full overflow-hidden bg-gray-100 dark:bg-gray-800" style={iconStyle}>
                {cardImage.src ? (
                  <Image
                    src={cardImage.src}
                    alt={cardImage.alt}
                    fill
                    sizes="(max-width: 767px) 92vw, (max-width: 1200px) 46vw, 550px"
                    className={cardImage.className}
                    unoptimized
                  />
                ) : (
                  <div className="flex h-full w-full flex-col items-center justify-center gap-3 bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400">
                    <MonitorSmartphone className="h-10 w-10 text-gray-400 dark:text-gray-500" aria-hidden="true" />
                    <span className="text-xs font-medium">Project preview unavailable</span>
                  </div>
                )}
              </div>
            </Link>

            <div className="flex flex-1 flex-col p-4 sm:p-6">
              <div className="flex items-start justify-between gap-3 sm:gap-4">
                <div className="min-w-0">
                  <div className="mb-2 flex flex-wrap items-center gap-2 text-[11px] font-medium uppercase tracking-[0.1em] text-gray-500 dark:text-gray-400 sm:text-xs">
                    <span>{project.engagement === 'Product' ? 'Company-developed product' : project.engagement === 'Client project' ? 'Client-commissioned work' : 'Engineering experiment'}</span>
                    <span aria-hidden>·</span>
                    <span>Case study</span>
                  </div>
                  <h3 className="min-h-[3.25rem] text-xl font-semibold leading-tight text-gray-900 dark:text-white">
                    <Link href={`/${project.id}`} className="hover:text-palm-green">
                      {project.title}
                    </Link>
                  </h3>
                </div>

                {project.url && (
                  <a
                    href={project.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-gray-200 text-gray-500 transition hover:border-palm-green hover:text-palm-green dark:border-gray-700 dark:text-gray-400"
                    aria-label={project.externalLinkLabel || `Open ${project.title} live project`}
                  >
                    <ArrowUpRight size={17} />
                  </a>
                )}
              </div>

              <p className="mt-3 line-clamp-5 text-sm leading-6 text-gray-600 dark:text-gray-300 md:min-h-[7.5rem]">
                {project.description}
              </p>

              <div className="mt-auto pt-3">
                <div className="min-h-5">
                  {project.platforms?.length ? (
                    <p className="text-xs font-semibold text-palm-green">{project.platforms.join(' · ')}</p>
                  ) : null}
                </div>

                <div className="mt-3 flex flex-wrap content-start items-start gap-2 md:min-h-16">
                  {project.tech.slice(0, 5).map((technology) => (
                    <span
                      key={technology}
                      className="rounded-full bg-gray-100 px-2.5 py-1 text-[11px] text-gray-600 dark:bg-gray-800 dark:text-gray-300 sm:text-xs"
                    >
                      {technology}
                    </span>
                  ))}
                </div>

                <Link
                  href={`/${project.id}`}
                  className="mt-3 inline-flex min-h-11 items-center gap-1.5 text-sm font-semibold text-palm-green hover:underline"
                >
                  Read engineering case study <ArrowUpRight className="h-4 w-4" aria-hidden />
                </Link>
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}
