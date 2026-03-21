export interface Project {
  title: string
  category: string
  year: string
  link: string
  image: string
  imageAlt: string
  imageHeight: string
  offset?: boolean
}

export const projects: Project[] = [
  {
    title: 'Haute-Yamaska Regional Development&nbsp;Table',
    category: 'UI/UX Design, Product Thinking',
    year: '2026',
    link: 'https://tabledeveloppementhy.ca',
    image: '/images/haute-yamaska.png',
    imageAlt:
      'minimalist laptop mockup showcasing a dark elegant website interface design, high end photography, studio lighting',
    imageHeight: 'h-[520px]',
  },
  {
    title: 'DIY-Robotics.com',
    category: 'Development, 3D Modeling',
    year: '2022',
    link: 'https://diy-robotics.com/',
    image:
      'https://storage.googleapis.com/uxpilot-auth.appspot.com/ab9d9c0dac-f2ff011627c7c97ae3b8.png',
    imageAlt:
      'isometric laptop mockup displaying a colorful modern digital magazine layout, clean background, soft shadows',
    imageHeight: 'h-[340px]',
    offset: true,
  },
  {
    title: 'Beaulieu Canada',
    category: 'Web Design, Development',
    year: '2024',
    link: 'https://canada.beaulieucanada.com',
    image: '/images/beaulieu.png',
    imageAlt:
      'tablet mockup floating in air showing a minimalist furniture ecommerce app, beige background, high fashion aesthetic',
    imageHeight: 'h-[430px]',
  },
  {
    title: 'Canada Research Chair on Digital Textualities',
    category: 'Coding, Digital Editing',
    year: '2020',
    link: 'https://www.ecrituresnumeriques.ca',
    image:
      'https://storage.googleapis.com/uxpilot-auth.appspot.com/04c3a335f9-63cf1b3f707ca3da0874.png',
    imageAlt:
      'smartphone mockup showing a fintech dashboard app with dark mode interface, neon accents, futuristic vibe',
    imageHeight: 'h-[480px]',
    offset: true,
  },
]
