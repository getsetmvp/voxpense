export const site = {
  name: 'VoxPense',
  tagline: 'Speak it. We log it.',
  description:
    'Voice-first personal expense tracker. Talk to it like a friend; AI parses, categorizes, and budgets in the background.',
  url: 'https://voxpense.getsetmvp.com',
  ogImage: '/og.png',
  twitter: '@yashgptdev',
  email: 'yash.g@pei.group',
  playStoreUrl:
    'https://play.google.com/store/apps/details?id=com.getsetmvp.voxpense',
  appStoreUrl: null as string | null,
  github: null as string | null,
  brand: '#6366F1',
  brandDeep: '#4F46E5',
  androidPackage: 'com.getsetmvp.voxpense',
  version: '1.0.0',
  launchDate: '2026-06-10',
  nav: [
    { label: 'Features', href: '#features' },
    { label: 'How it works', href: '#how' },
    { label: 'Screenshots', href: '#screens' },
    { label: 'Privacy', href: '/privacy' },
    { label: 'FAQ', href: '#faq' },
  ],
};

export type Site = typeof site;
