import { FiExternalLink, FiGithub } from 'react-icons/fi'

const footerSections = [
  {
    description:
      '네트워크관리사 2급 기출문제를 랜덤 학습과 회차별 모의고사 방식으로 풀어볼 수 있는 학습 앱입니다.',
    items: ['제작: hahbr88(하병로)', 'Version 0.1.0'],
    title: 'Project',
  },
  {
    description:
      '문제 원문은 공식 시험 자료를 기반으로 정리되어 있습니다.',
    link: {
      href: 'https://www.icqa.or.kr/',
      label: '한국정보통신자격협회(icqa.or.kr)',
      prefix: '시험 관련 정보는',
      suffix: '에서 확인할 수 있습니다.',
    },
    title: 'Source',
  },
] as const

export function FooterSection() {
  return (
    <footer className="rounded-[1.75rem] border border-slate-200/70 bg-white/82 px-6 py-5 text-slate-900 shadow-[0_20px_60px_-36px_rgba(15,23,42,0.4)] backdrop-blur md:px-7">
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {footerSections.map((section) => (
          <div key={section.title}>
            <p className="text-xs font-semibold tracking-[0.24em] text-sky-700 uppercase">
              {section.title}
            </p>
            <div className="mt-3 grid gap-3 text-sm text-slate-600">
              {section.title === 'Project' ? (
                <>
                  <p className="text-lg font-semibold text-slate-950">
                    Network Master
                  </p>
                  <p className="leading-7">{section.description}</p>
                  <div className="grid gap-2">
                    {section.items?.map((item) => <p key={item}>{item}</p>)}
                  </div>
                </>
              ) : (
                <>
                  <p>{section.description}</p>
                  <p className="leading-7">
                    {section.link?.prefix}{' '}
                    <a
                      href={section.link?.href}
                      target="_blank"
                      rel="noreferrer"
                      className="font-semibold text-slate-900 underline decoration-slate-300 underline-offset-4 transition hover:text-sky-700"
                    >
                      {section.link?.label}
                    </a>{' '}
                    {section.link?.suffix}
                  </p>
                </>
              )}
            </div>
          </div>
        ))}

        <div>
          <p className="text-xs font-semibold tracking-[0.24em] text-sky-700 uppercase">
            Links
          </p>
          <div className="mt-3 grid gap-3 text-sm text-slate-600">
            <a
              href="https://github.com/hahbr88/network_master?tab=readme-ov-file#network_master"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 font-semibold text-slate-900 transition hover:text-sky-700"
            >
              <FiGithub className="h-4 w-4" />
              <span>GitHub README</span>
              <FiExternalLink className="h-4 w-4" />
            </a>
            <p>React 19, Vite, Tailwind CSS 4 기반으로 구성되어 있습니다.</p>
            <p>문의: hahbr88@gmail.com</p>
          </div>
        </div>
      </div>
    </footer>
  )
}
