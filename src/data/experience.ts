export interface ExperienceItem {
  company: string
  role: string
  period: string
}

export interface EducationItem {
  degree: string
  school: string
  period: string
}

export const experiences: ExperienceItem[] = [
  { company: 'Freelance', role: 'Web Integrator', period: 'Since 2025' },
  { company: 'Beaulieu Canada', role: 'Frontend Developer', period: 'Since 2022' },
  { company: 'DIY Robotics', role: 'Webmaster', period: '2021-2022 (since then consultant)' },
  { company: 'Avril', role: 'Copywriter & Social Media Manager', period: '2021' },
  { company: 'Sens Public', role: 'Digital Publisher', period: '2017-2020' },
]

export const education: EducationItem[] = [
  {
    degree: 'PgDip. Digital Editing',
    school: 'School of Library and Information Science',
    period: '2019 — 2020',
  },
  {
    degree: 'Internet Programming',
    school: 'University of Montreal',
    period: '2018',
  },
  {
    degree: 'B. French Literature',
    school: 'University of Montreal',
    period: '2015 — 2018',
  },
  {
    degree: 'DEC Humanities',
    school: 'Édouard-Montpetit College',
    period: '2012 — 2014',
  },
]
