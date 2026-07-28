import { LocalizeResponse } from '../types';

// ─── Demo Fallback Responses ──────────────────────────────────────────────
// Pre-verified output for the 3 core demo scenarios.
// Key format: "grade{N}_{subject}_{region}"
// Served silently if the live Groq call times out or fails during the demo.

export const DEMO_FALLBACK_RESPONSES: Record<string, LocalizeResponse> = {
  // ── Grade 3 Math – Bicol ─────────────────────────────────────────────────
  grade3_math_bicol: {
    original: `LESSON PLAN: GRADE 3 MATHEMATICS
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
    localized: `LESSON PLAN: GRADE 3 MATHEMATICS
Topic: Solving Real-World Word Problems Using Multiplication and Addition
Duration: 45 Minutes

LEARNING OBJECTIVES:
At the end of the lesson, students will be able to:
1. Solve 2-step word problems involving multiplication and addition.
2. Calculate total expenditure in practical market scenarios.

WARM-UP EXERCISES & WORD PROBLEMS:

Problem 1:
Si Maria nagsakay nin tricycle paduman sa Naga People's Mall. Sa merkado, nagbakal siya nin 3 pirasong pili nuts para ₱20 kada piraso asin 2 pirasong tinapay para ₱30 kada piraso. Gurano an gastar ni Maria sa Naga People's Mall?

Problem 2:
Si Juan nagsakay nin Bikol Express bus paduman sa Naga terminal. Sa pagbalik niya, nagpundo siya sa Naga People's Mall para magbakal nin 4 na asul na kuwaderno para ₱15 kada piraso asin 1 kahon nin lapis para ₱40. Gurano an gastar ni Juan bago siya magbalik sa harong?

Problem 3:
Si Maestra Ana nagpadara sa mga estudyante na magbilang nin mga pili nuts para sa handaan sa klase. Si Nena nagbakal nin 5 pakete nin pili nuts hali sa Naga People's Mall. Kada pakete igwa nin 6 na pili nuts. Pira na lahat an pili nuts ni Nena?

CLASSROOM ACTIVITY & EVALUATION:
I-grupo ang mga estudyante sa duwang miyembro asin hilingon sinda na magsurat nin sarong scenario sa pagbabayad gamit ang lokal na transportasyon asin tindahan.`,
    changes: [
      { original: 'subway train', replacement: 'tricycle', category: 'entity', entityType: 'transport' },
      { original: 'Walmart', replacement: "Naga People's Mall", category: 'entity', entityType: 'place' },
      { original: 'red apples', replacement: 'pili nuts', category: 'entity', entityType: 'food' },
      { original: '$2', replacement: '₱20', category: 'entity', entityType: 'currency' },
      { original: 'blueberry muffins', replacement: 'tinapay', category: 'entity', entityType: 'food' },
      { original: '$3', replacement: '₱30', category: 'entity', entityType: 'currency' },
      { original: 'David', replacement: 'Juan', category: 'entity', entityType: 'character_name' },
      { original: 'yellow school bus', replacement: 'Bikol Express bus', category: 'entity', entityType: 'transport' },
      { original: 'Target', replacement: "Naga People's Mall", category: 'entity', entityType: 'place' },
      { original: '$1.50', replacement: '₱15', category: 'entity', entityType: 'currency' },
      { original: '$4', replacement: '₱40', category: 'entity', entityType: 'currency' },
      { original: 'Teacher Sarah', replacement: 'Maestra Ana', category: 'entity', entityType: 'character_name' },
      {
        original: 'Alex bought 5 packages of strawberries from Trader Joe\'s',
        replacement: "Si Nena nagbakal nin 5 pakete ning pili nuts hali sa Naga People's Mall",
        category: 'scenario_reframe',
      },
    ],
    translation: {
      text: `BANGHAY-ARALIN: GRADE 3 MATEMATIKA
Paksa: Pagsolbar kan mga Problema sa Totoong Buhay Gamit ang Multiplikasyon asin Adisyon
Haloy: 45 Minuto

MGA LAYUNIN SA PAGKATUTO:
Sa katapusan kan aralin, ang mga estudyante inaasahang:
1. Makasolbar nin 2-step na word problem gamit ang multiplikasyon asin adisyon.
2. Maka-compute kan kabuuang gastos sa aktwal na sitwasyon sa merkado.

MGA EHERSISYO:

Problema 1:
Si Maria nagsakay nin tricycle paduman sa Naga People's Mall. Nagbakal siya nin 3 pirasong pili nuts para ₱20 kada piraso asin 2 pirasong tinapay para ₱30 kada piraso. Gurano an gastar ni Maria sa Naga People's Mall?

Problema 2:
Si Juan nagsakay nin Bikol Express bus paduman sa Naga terminal. Sa pagbalik niya, nagpundo siya sa Naga People's Mall para magbakal nin 4 na asul na kuwaderno para ₱15 kada piraso asin 1 kahon nin lapis para ₱40. Gurano an gastar ni Juan bago siya magbalik sa harong?

Problema 3:
Si Maestra Ana nagpadara sa mga estudyante na magbilang nin mga pili nuts para sa handaan. Si Nena nagbakal nin 5 pakete nin pili nuts. Kada pakete igwa nin 6 na pili nuts. Pira na lahat an pili nuts ni Nena?

AKTIBIDAD:
I-grupo ang mga estudyante sa duwang miyembro asin hilingon sinda na magsurat nin sarong scenario sa pagbabayad gamit ang lokal na transportasyon asin tindahan.`,
      language: 'Central Bikol',
      notes:
        'Translated into Central Bikol (Bikol Central). "Gurano" = How much, "nagbakal" = bought, "paduman" = going to. Review with a native Bikolano speaker before classroom use.',
    },
    competencyMatch: {
      found: true,
      competencyCode: 'M3NS-Ic-15',
      competencyText:
        'Solves routine and non-routine problems involving multiplication and addition of whole numbers including money using appropriate problem-solving strategies and tools.',
    },
  },

  // ── Grade 3 Math – NCR ───────────────────────────────────────────────────
  grade3_math_ncr: {
    original: `LESSON PLAN: GRADE 3 MATHEMATICS
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
    localized: `LESSON PLAN: GRADE 3 MATHEMATICS
Topic: Solving Real-World Word Problems Using Multiplication and Addition
Duration: 45 Minutes

LEARNING OBJECTIVES:
At the end of the lesson, students will be able to:
1. Solve 2-step word problems involving multiplication and addition.
2. Calculate total expenditure in practical market scenarios.

WARM-UP EXERCISES & WORD PROBLEMS:

Problem 1:
Si Maria sumakay ng jeepney papunta sa Divisoria Market. Sa palengke, bumili siya ng 3 piraso ng saging na saba para ₱20 bawat isa at 2 tinapay para ₱30 bawat isa. Magkano ang nagastos ni Maria sa Divisoria Market?

Problem 2:
Si Juan sumakay ng LRT papunta sa central station. Sa uwi niya, tumigil siya sa SM Mall para bumili ng 4 na asul na notebook para ₱15 bawat isa at 1 lalagyan ng lapis para ₱40. Magkano ang nagastos ni Juan bago umuwi?

Problem 3:
Si Titser Ana ay nagpahitung sa mga bata ng mga fishball para sa party sa klase. Si Alex bumili ng 5 pakete ng fishball sa tindahan. Bawat pakete ay may 6 na fishball. Ilan lahat ang fishball ni Alex?

CLASSROOM ACTIVITY & EVALUATION:
Ipangkat ang mga mag-aaral nang dalawa-dalawa at hilingin sa kanila na gumawa ng sariling buying scenario gamit ang lokal na transportasyon at tindahan.`,
    changes: [
      { original: 'subway train', replacement: 'jeepney', category: 'entity', entityType: 'transport' },
      { original: 'Walmart', replacement: 'Divisoria Market', category: 'entity', entityType: 'place' },
      { original: 'red apples', replacement: 'saging na saba', category: 'entity', entityType: 'food' },
      { original: '$2', replacement: '₱20', category: 'entity', entityType: 'currency' },
      { original: 'blueberry muffins', replacement: 'tinapay', category: 'entity', entityType: 'food' },
      { original: '$3', replacement: '₱30', category: 'entity', entityType: 'currency' },
      { original: 'David', replacement: 'Juan', category: 'entity', entityType: 'character_name' },
      { original: 'yellow school bus', replacement: 'LRT', category: 'entity', entityType: 'transport' },
      { original: 'Target', replacement: 'SM Mall', category: 'entity', entityType: 'place' },
      { original: '$1.50', replacement: '₱15', category: 'entity', entityType: 'currency' },
      { original: '$4', replacement: '₱40', category: 'entity', entityType: 'currency' },
      { original: 'Teacher Sarah', replacement: 'Titser Ana', category: 'entity', entityType: 'character_name' },
      {
        original: 'Alex bought 5 packages of strawberries from Trader Joe\'s',
        replacement: 'Si Alex bumili ng 5 pakete ng fishball sa tindahan',
        category: 'scenario_reframe',
      },
    ],
    translation: {
      text: `LESSON PLAN: GRADE 3 MATEMATIKA
Paksa: Paglutas ng mga Salitang Problema Gamit ang Multiplikasyon at Pagdaragdag
Tagal: 45 Minuto

MGA LAYUNIN:
Sa pagtatapos ng aralin, ang mga mag-aaral ay makakagawa ng:
1. Makalutas ng 2-hakbang na salitang problema gamit ang multiplikasyon at pagdaragdag.
2. Makalkula ang kabuuang gastos sa mga praktikal na sitwasyon sa palengke.

MGA EHERSISYO:

Problema 1:
Si Maria sumakay ng jeepney papunta sa Divisoria Market. Sa palengke, bumili siya ng 3 piraso ng saging na saba para ₱20 bawat isa at 2 tinapay para ₱30 bawat isa. Magkano ang nagastos ni Maria?

Problema 2:
Si Juan sumakay ng LRT papunta sa central station. Sa uwi niya, tumigil siya sa SM Mall para bumili ng 4 na asul na notebook para ₱15 bawat isa at 1 lalagyan ng lapis para ₱40. Magkano ang nagastos ni Juan?

Problema 3:
Si Titser Ana ay nagpahitung sa mga bata ng mga fishball para sa party. Si Alex bumili ng 5 pakete ng fishball. Bawat pakete ay may 6 na fishball. Ilan lahat ang fishball ni Alex?

AKTIBIDAD:
Ipangkat ang mga mag-aaral nang dalawa-dalawa at hilingin sa kanila na gumawa ng sariling buying scenario gamit ang lokal na transportasyon at tindahan.`,
      language: 'Filipino',
      notes:
        'Translated into Filipino/Tagalog for NCR context. Language is relatively close to the source; review for natural classroom register before use.',
    },
    competencyMatch: {
      found: true,
      competencyCode: 'M3NS-Ic-15',
      competencyText:
        'Solves routine and non-routine problems involving multiplication and addition of whole numbers including money using appropriate problem-solving strategies and tools.',
    },
  },

  // ── Grade 3 Math – Central Visayas ────────────────────────────────────────
  grade3_math_central_visayas: {
    original: `LESSON PLAN: GRADE 3 MATHEMATICS
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
    localized: `LESSON PLAN: GRADE 3 MATHEMATICS
Topic: Solving Real-World Word Problems Using Multiplication and Addition
Duration: 45 Minutes

LEARNING OBJECTIVES:
At the end of the lesson, students will be able to:
1. Solve 2-step word problems involving multiplication and addition.
2. Calculate total expenditure in practical fishing port and market scenarios.

WARM-UP EXERCISES & WORD PROBLEMS:

Problem 1:
Si Maria nisakay ang habal-habal padulong sa Carbon Market. Sa merkado, nipalit niya ang 3 piraso nga bangus para ₱20 ang matag usa ug 2 pirasong budbud para ₱30 ang matag usa. Pila ang gikuha ni Maria sa Carbon Market?

Problem 2:
Si Juan nisakay ang pump boat gikan sa isla padulong sa lungsod. Sa iyang pagpauli, mipundo siya sa Carbon Market aron mopalit ug 4 ka asul nga kuwaderno para ₱15 ang matag usa ug 1 ka kahon sa lapis para ₱40. Pila ang gigasto ni Juan sa wala pa siya mopauli?

Problem 3:
Si Maestra Ana nagpahimangno sa mga estudyante nga magihap sa isda alang sa selebrasyon sa klase. Nagtiyabaw ang mga mangingisda og 5 buok nga bangus sa pantalan. Ang matag bangus gibaligya og 6 ka piraso. Pila tanan ang mga piraso sa isda?

CLASSROOM ACTIVITY & EVALUATION:
Ipangkat ang mga estudyante sa duhang miyembro ug paghangyon kanila nga mosulat sa ilang kaugalingong buying scenario gamit ang lokal nga transportasyon ug tindahan.`,
    changes: [
      { original: 'subway train', replacement: 'habal-habal', category: 'entity', entityType: 'transport' },
      { original: 'Walmart', replacement: 'Carbon Market', category: 'entity', entityType: 'place' },
      { original: 'red apples', replacement: 'bangus (milkfish)', category: 'entity', entityType: 'food' },
      { original: '$2', replacement: '₱20', category: 'entity', entityType: 'currency' },
      { original: 'blueberry muffins', replacement: 'budbud', category: 'entity', entityType: 'food' },
      { original: '$3', replacement: '₱30', category: 'entity', entityType: 'currency' },
      { original: 'David', replacement: 'Juan', category: 'entity', entityType: 'character_name' },
      { original: 'yellow school bus', replacement: 'pump boat', category: 'entity', entityType: 'transport' },
      { original: 'Target', replacement: 'Carbon Market', category: 'entity', entityType: 'place' },
      { original: '$1.50', replacement: '₱15', category: 'entity', entityType: 'currency' },
      { original: '$4', replacement: '₱40', category: 'entity', entityType: 'currency' },
      { original: 'Teacher Sarah', replacement: 'Maestra Ana', category: 'entity', entityType: 'character_name' },
      {
        original: 'Alex bought 5 packages of strawberries from Trader Joe\'s. Each package contains 6 strawberries.',
        replacement:
          'Nagtiyabaw ang mga mangingisda og 5 buok nga bangus sa pantalan. Ang matag bangus gibaligya og 6 ka piraso.',
        category: 'scenario_reframe',
      },
    ],
    translation: {
      text: `LESSON PLAN: GRADE 3 MATEMATIKA
Hilisgutan: Pagsulbad sa mga Problema sa Tinuod nga Kinabuhi Gamit ang Multiplikasyon ug Pagdugang
Tagal: 45 Minuto

MGA TUMONG:
Sa katapusan sa leksyon, ang mga estudyante makabuhat ug:
1. Makasolbar sa 2-lakang nga problema gamit ang multiplikasyon ug pagdugang.
2. Maka-komputo sa kinatibuk-ang gasto sa aktwal nga sitwasyon sa merkado.

MGA EHERSISYO:

Problema 1:
Si Maria nisakay ang habal-habal padulong sa Carbon Market. Nipalit siya og 3 piraso nga bangus para ₱20 ang matag usa ug 2 pirasong budbud para ₱30 ang matag usa. Pila ang gikuha ni Maria?

Problema 2:
Si Juan nisakay ang pump boat gikan sa isla padulong sa lungsod. Mipundo siya sa Carbon Market aron mopalit ug 4 ka asul nga kuwaderno para ₱15 ang matag usa ug 1 ka kahon sa lapis para ₱40. Pila ang gasto ni Juan?

Problema 3:
Nagtiyabaw ang mga mangingisda og 5 buok nga bangus sa pantalan. Ang matag bangus gibaligya og 6 ka piraso. Pila tanan ang mga piraso sa isda?

AKTIBIDAD:
Ipangkat ang mga estudyante sa duhang miyembro ug paghangyon kanila nga mosulat sa ilang kaugalingong buying scenario gamit ang lokal nga transportasyon ug tindahan.`,
      language: 'Cebuano',
      notes:
        'Translated into Cebuano (Bisaya). Key terms: "nipalit" = bought, "pila" = how much/how many, "padulong" = going to. Recommend review by a native Cebuano teacher before classroom use.',
    },
    competencyMatch: {
      found: true,
      competencyCode: 'M3NS-Ic-15',
      competencyText:
        'Solves routine and non-routine problems involving multiplication and addition of whole numbers including money using appropriate problem-solving strategies and tools.',
    },
  },
};

export function getFallbackKey(grade: number, subject: string, region: string): string {
  return `grade${grade}_${subject}_${region}`;
}

export function getDemoFallback(grade: number, subject: string, region: string): LocalizeResponse | null {
  const key = getFallbackKey(grade, subject, region);
  return DEMO_FALLBACK_RESPONSES[key] ?? null;
}
