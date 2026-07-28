import { RegionInfo, LanguageInfo, SampleLesson } from '../types';

export const PHILIPPINE_REGIONS: RegionInfo[] = [
  {
    id: 'bicol_naga',
    name: 'Bicol Region',
    province: 'Camarines Sur',
    majorCity: 'Naga City',
    description: 'Home of Mt. Isarog, Naga People’s Mall, tricycles, pili nuts, and Bikol Express.',
    defaultLanguageId: 'central_bikol',
    commonEntities: {
      transport: 'tricycle',
      market: "Naga People's Mall",
      food: 'saging (bananas)',
      landmark: 'Peñafrancia Basilica',
    },
  },
  {
    id: 'cebu_city',
    name: 'Central Visayas',
    province: 'Cebu',
    majorCity: 'Cebu City',
    description: 'Home of Carbon Market, habal-habal, e-trikes, Cebu mangoes, and Colon Street.',
    defaultLanguageId: 'cebuano',
    commonEntities: {
      transport: 'habal-habal',
      market: 'Carbon Public Market',
      food: 'mangga (sweet mangoes)',
      landmark: "Magellan's Cross",
    },
  },
  {
    id: 'davao_city',
    name: 'Davao Region',
    province: 'Davao del Sur',
    majorCity: 'Davao City',
    description: 'Home of Bankerohan Market, Mt. Apo, durian, and colorful utility tricycles.',
    defaultLanguageId: 'cebuano',
    commonEntities: {
      transport: 'multicab',
      market: 'Bankerohan Public Market',
      food: 'durian',
      landmark: 'Mount Apo Park',
    },
  },
  {
    id: 'ilocos_laoag',
    name: 'Ilocos Region',
    province: 'Ilocos Norte',
    majorCity: 'Laoag City',
    description: 'Home of Laoag Market, kalesa, Ilocos empanada, dragonfruit, and Paoay Church.',
    defaultLanguageId: 'ilocano',
    commonEntities: {
      transport: 'kalesa',
      market: 'Laoag City Commercial Complex',
      food: 'empanada',
      landmark: 'Paoay Church Plaza',
    },
  },
  {
    id: 'ncr_manila',
    name: 'National Capital Region (NCR)',
    province: 'Metro Manila',
    majorCity: 'Manila / Quezon City',
    description: 'Home of Divisoria Market, LRT/MRT, jeepneys, Luneta Park, and street food stalls.',
    defaultLanguageId: 'tagalog',
    commonEntities: {
      transport: 'jeepney',
      market: 'Divisoria Market',
      food: 'saging na saba',
      landmark: 'Rizal Park (Luneta)',
    },
  },
  {
    id: 'panay_iloilo',
    name: 'Western Visayas',
    province: 'Iloilo',
    majorCity: 'Iloilo City',
    description: 'Home of Iloilo Central Market, tricycle, La Paz batchoy, and Iloilo Esplanade.',
    defaultLanguageId: 'hiligaynon',
    commonEntities: {
      transport: 'jeepney',
      market: 'Iloilo Central Market',
      food: 'batchoy',
      landmark: 'Iloilo River Esplanade',
    },
  },
  {
    id: 'leyte_tacloban',
    name: 'Eastern Visayas',
    province: 'Leyte',
    majorCity: 'Tacloban City',
    description: 'Home of Tacloban Supermarket, motorcabs, binagol, and San Juanico Bridge.',
    defaultLanguageId: 'waray',
    commonEntities: {
      transport: 'motorcab',
      market: 'Tacloban City Public Market',
      food: 'binagol',
      landmark: 'San Juanico Bridge Park',
    },
  },
];

export const TARGET_LANGUAGES: LanguageInfo[] = [
  { id: 'central_bikol', name: 'Central Bikol', nativeName: 'Bikol Central', region: 'Bicol Region' },
  { id: 'cebuano', name: 'Cebuano', nativeName: 'Sinugbuanong Binisaya', region: 'Central & Southern Philippines' },
  { id: 'ilocano', name: 'Ilocano', nativeName: 'Ilokano', region: 'Northern Luzon' },
  { id: 'hiligaynon', name: 'Hiligaynon', nativeName: 'Ilonggo', region: 'Western Visayas' },
  { id: 'waray', name: 'Waray-Waray', nativeName: 'Winaray', region: 'Eastern Visayas' },
  { id: 'tagalog', name: 'Tagalog / Filipino', nativeName: 'Wikang Tagalog', region: 'National / NCR' },
  { id: 'kapampangan', name: 'Kapampangan', nativeName: 'Amanung Kapampangan', region: 'Central Luzon' },
  { id: 'pangasinan', name: 'Pangasinan', nativeName: 'Salitan Pangasinan', region: 'Pangasinan' },
  { id: 'chavacano', name: 'Chavacano', nativeName: 'Chavacano de Zamboanga', region: 'Zamboanga Peninsula' },
];

export const SAMPLE_LESSONS: SampleLesson[] = [
  {
    id: 'math_grade3',
    title: 'Grade 3 Math — Multiplication & Budgeting',
    subject: 'Mathematics',
    gradeLevel: 'Grade 3',
    description: 'Generic word problems featuring US subways, supermarkets, and dollars.',
    text: `LESSON PLAN: GRADE 3 MATHEMATICS
Topic: Solving Real-World Word Problems Using Multiplication and Addition
Duration: 45 Minutes

LEARNING OBJECTIVES:
At the end of the lesson, students will be able to:
1. Solve 2-step word problems involving multiplication and addition.
2. Calculate total expenditure in practical shopping scenarios.

WARM-UP EXERCISES & WORD PROBLEMS:

Problem 1:
Maria took the subway train to Walmart. At the supermarket, she bought 3 fresh red apples for $2 each and 2 blueberry muffins for $3 each. How much money did Maria spend in total at Walmart?

Problem 2:
David boarded the yellow school bus to the downtown subway central station. On his way home, he stopped by Target to buy 4 blue notebooks for $1.50 each and 1 yellow pencil box for $4. How much did David spend before riding the bus home?

Problem 3:
Teacher Sarah asked the students to count items for a classroom party. Alex bought 5 packages of strawberries from Trader Joe's. Each package contains 6 strawberries. How many strawberries does Alex have in total?

CLASSROOM ACTIVITY & EVALUATION:
Group students into pairs and ask them to write their own purchasing scenario using local transportation and store examples.`,
  },
  {
    id: 'science_grade5',
    title: 'Grade 5 Science — Ecosystems & Human Activity',
    subject: 'Science',
    gradeLevel: 'Grade 5',
    description: 'Science lesson plan about habitats, transport pollution, and local produce markets.',
    text: `LESSON PLAN: GRADE 5 SCIENCE
Topic: Human Communities, Transport Ecosystems, and Local Food Systems
Duration: 60 Minutes

1. OBJECTIVES:
- Identify common modes of transportation used in urban and rural communities.
- Explain how local markets distribute farm produce to neighborhood households.

2. MOTIVATION SCENARIO:
Every Saturday morning, Mrs. Johnson rides the electric subway to Whole Foods Market. She meets local farmer Robert, who brings fresh peaches and maple syrup from his farm in Vermont via highway cargo trucks. Mrs. Johnson buys 2 kilograms of peaches and 1 bottle of syrup.

3. DISCUSSION QUESTIONS:
a) What mode of transit did Mrs. Johnson take to reach Whole Foods Market?
b) How does farmer Robert transport his crops from the farm to the city supermarket?
c) How does buying fresh fruit from neighborhood stalls support local farming communities?

4. HANDS-ON EXERCISE:
Students will draw a diagram showing how food travels from a nearby agricultural field to a local neighborhood public market.`,
  },
  {
    id: 'english_grade2',
    title: 'Grade 2 Reading — Community Helpers & Places',
    subject: 'English / Reading',
    gradeLevel: 'Grade 2',
    description: 'Reading comprehension exercise with western city landmarks and stores.',
    text: `LESSON PLAN: GRADE 2 ENGLISH
Topic: Community Places, Transportation, and Helper Occupations

STORY: A DAY IN THE TOWN
On a sunny Monday, Ben and his mother woke up early. They walked to the subway station and rode the metro train to the Grand Central Mall. 

First, they visited Mr. Peterson at the bakery to buy 4 fresh cinnamon rolls for $1 each. Next, they walked to the big supermarket to buy milk and oranges. 

Before heading home, Ben saw Firefighter Jim driving a red fire engine past the city library. Ben waved and said, "Thank you for keeping our neighborhood safe!"

COMPREHENSION QUESTIONS:
1. How did Ben and his mother travel to the mall?
2. What item did they buy from Mr. Peterson's bakery?
3. Name two community helpers mentioned in the story.`,
  },
];
