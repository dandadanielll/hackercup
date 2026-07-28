import { RegionProfile, RegionKey, SampleLesson } from '../types';

// ─── Region Profiles (3 scoped regions for demo) ─────────────────────────
export const REGION_PROFILES: Record<RegionKey, RegionProfile> = {
  ncr: {
    name: 'National Capital Region (NCR)',
    motherTongue: 'Filipino',
    motherTongueLabel: 'Filipino/Tagalog',
    environment: 'urban',
    environmentDescriptor:
      'Dense urban setting: jeepneys, MRT/LRT trains, malls, heavy traffic, sari-sari stores, market vendors, condominiums, call center culture',
    knownEntities: {
      transport: ['jeepney', 'MRT', 'LRT', 'tricycle', 'grab/taxi'],
      places: ['SM Mall', 'Divisoria Market', 'public market', 'barangay hall'],
      food: ['street food (fishball, kwek-kwek)', 'carinderia meals', 'saging na saba'],
    },
  },
  bicol: {
    name: 'Bicol Region',
    motherTongue: 'Central Bikol',
    motherTongueLabel: 'Central Bikol (Bikol Central)',
    environment: 'agricultural-coastal',
    environmentDescriptor:
      'Mixed agricultural and coastal setting: pili nut farming, rice fields, fishing communities, Mt. Isarog/Mt. Mayon backdrop, tricycles as primary transport',
    knownEntities: {
      transport: ['tricycle', 'Bikol Express (bus)'],
      places: ["Naga People's Mall", 'public market', 'Peñafrancia Basilica'],
      food: ['pili nuts', 'saging na saba', 'Bicol Express (dish)', 'laing'],
    },
  },
  central_visayas: {
    name: 'Central Visayas (Cebu)',
    motherTongue: 'Cebuano',
    motherTongueLabel: 'Cebuano (Bisaya)',
    environment: 'island-marine',
    environmentDescriptor:
      'Island and marine-heavy setting: fishing ports, coastal towns, inter-island ferries, tricycles/habal-habal, mountain barangays',
    knownEntities: {
      transport: ['habal-habal', 'tricycle', 'pump boat/ferry'],
      places: ['Carbon Market', 'local port', 'public market'],
      food: ['bangus (milkfish)', 'dried fish', 'lechon', 'budbud'],
    },
  },
};

export function getRegionProfile(key: RegionKey): RegionProfile {
  return REGION_PROFILES[key];
}

// ─── Sample Lessons ───────────────────────────────────────────────────────
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
