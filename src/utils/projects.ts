export interface Project {
  title: string
  category: string
  year: string
  link: string
  image: string
  imageAlt: string
  imageHeight: string
}

export const projects: Project[] = [
  {
    title: 'City of Granby Intranet',
    category: 'Information Architecture, User Experience',
    year: '2026',
    link: 'https://wallace.granby.ca',
    image: '/images/wallace.jpg',
    imageAlt:
      'The Wallace intranet home page: a purple header over a grid of quick-access tiles and a news feed',
    imageHeight: 'h-[440px]',
  },
  {
    title: 'Beaulieu Canada',
    category: 'Web Design, Development',
    year: '2024',
    link: 'https://canada.beaulieucanada.com',
    image: '/images/beaulieu.jpg',
    imageAlt:
      'A Beaulieu Canada laminate product page, a room photo above the product name and its description',
    imageHeight: 'h-[430px]',
  },
  {
    title: 'Canada Research Chair on Digital Textualities',
    category: 'Coding, Digital Editing',
    year: '2020',
    link: 'https://www.ecrituresnumeriques.ca',
    image: '/images/research.jpg',
    imageAlt:
      'The Digital Textualities laboratory home page, its title set over a circuit-board pattern',
    imageHeight: 'h-[480px]',
  },
  {
    title: 'Haute-Yamaska Regional Development&nbsp;Table',
    category: 'UI/UX Design, Product Thinking',
    year: '2026',
    link: 'https://tabledeveloppementhy.ca',
    image: '/images/haute-yamaska.jpg',
    imageAlt:
      'The Table de développement Haute-Yamaska home page, headed “Agir ensemble pour la vitalité de la Haute-Yamaska”',
    imageHeight: 'h-[520px]',
  },
  {
    title: 'DIY-Robotics.com',
    category: 'Development, 3D Modelling',
    year: '2022',
    link: 'https://diy-robotics.com/',
    image: '/images/robotics.jpg',
    imageAlt:
      'The DIY Robotics modular products page, headed “Find the perfect robotic cell”',
    imageHeight: 'h-[420px]',
  },
]
