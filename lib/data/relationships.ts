export interface Relationship {
  hindi: string
  english: string
  definition: string
  category: string
}

export const INDIAN_RELATIONSHIPS: Relationship[] = [
  // Grandparents
  { hindi: 'Dada', english: "Father's Father", definition: 'Paternal Grandfather', category: 'Grandparents' },
  { hindi: 'Dadi', english: "Father's Mother", definition: 'Paternal Grandmother', category: 'Grandparents' },
  { hindi: 'Nana', english: "Mother's Father", definition: 'Maternal Grandfather', category: 'Grandparents' },
  { hindi: 'Nani', english: "Mother's Mother", definition: 'Maternal Grandmother', category: 'Grandparents' },
  { hindi: 'Pardada', english: "Father's Father's Father", definition: 'Paternal Great-Grandfather', category: 'Grandparents' },
  { hindi: 'Pardadi', english: "Father's Father's Mother", definition: 'Paternal Great-Grandmother', category: 'Grandparents' },
  { hindi: 'Parnana', english: "Mother's Father's Father", definition: 'Maternal Great-Grandfather', category: 'Grandparents' },
  { hindi: 'Parnani', english: "Mother's Father's Mother", definition: 'Maternal Great-Grandmother', category: 'Grandparents' },

  // Parents
  { hindi: 'Papa / Pita', english: 'Father', definition: 'Father', category: 'Parents' },
  { hindi: 'Maa / Mata', english: 'Mother', definition: 'Mother', category: 'Parents' },

  // Siblings
  { hindi: 'Bhaiya / Bada Bhai', english: 'Elder Brother', definition: 'Elder Brother', category: 'Siblings' },
  { hindi: 'Chota Bhai', english: 'Younger Brother', definition: 'Younger Brother', category: 'Siblings' },
  { hindi: 'Didi / Badi Behen', english: 'Elder Sister', definition: 'Elder Sister', category: 'Siblings' },
  { hindi: 'Choti Behen', english: 'Younger Sister', definition: 'Younger Sister', category: 'Siblings' },

  // Spouse
  { hindi: 'Pati', english: 'Husband', definition: 'Husband', category: 'Spouse' },
  { hindi: 'Patni / Biwi', english: 'Wife', definition: 'Wife', category: 'Spouse' },

  // Paternal Aunts & Uncles
  { hindi: 'Tau / Taya', english: "Father's Elder Brother", definition: "Father's Elder Brother", category: 'Paternal Side' },
  { hindi: 'Tai / Tayi', english: "Father's Elder Brother's Wife", definition: "Father's Elder Brother's Wife", category: 'Paternal Side' },
  { hindi: 'Chacha', english: "Father's Younger Brother", definition: "Father's Younger Brother", category: 'Paternal Side' },
  { hindi: 'Chachi', english: "Father's Younger Brother's Wife", definition: "Father's Younger Brother's Wife", category: 'Paternal Side' },
  { hindi: 'Bua', english: "Father's Sister", definition: "Father's Sister (Paternal Aunt)", category: 'Paternal Side' },
  { hindi: 'Fufa / Phupha', english: "Father's Sister's Husband", definition: "Father's Sister's Husband", category: 'Paternal Side' },

  // Maternal Aunts & Uncles
  { hindi: 'Mama', english: "Mother's Brother", definition: "Mother's Brother (Maternal Uncle)", category: 'Maternal Side' },
  { hindi: 'Mami', english: "Mother's Brother's Wife", definition: "Mother's Brother's Wife", category: 'Maternal Side' },
  { hindi: 'Mausi / Masi', english: "Mother's Sister", definition: "Mother's Sister (Maternal Aunt)", category: 'Maternal Side' },
  { hindi: 'Mausa / Mausaji', english: "Mother's Sister's Husband", definition: "Mother's Sister's Husband", category: 'Maternal Side' },

  // Siblings' spouses
  { hindi: 'Bhabhi', english: "Brother's Wife", definition: "Brother's Wife (Sister-in-Law)", category: 'Siblings' },
  { hindi: 'Jija / Jeeja', english: "Sister's Husband", definition: "Sister's Husband (Brother-in-Law)", category: 'Siblings' },

  // Children
  { hindi: 'Beta', english: 'Son', definition: 'Son', category: 'Children' },
  { hindi: 'Beti', english: 'Daughter', definition: 'Daughter', category: 'Children' },
  { hindi: 'Damaad / Jamaai', english: "Daughter's Husband", definition: 'Son-in-Law', category: 'Children' },
  { hindi: 'Bahu', english: "Son's Wife", definition: 'Daughter-in-Law', category: 'Children' },

  // Grandchildren
  { hindi: 'Pota', english: "Son's Son", definition: 'Paternal Grandson', category: 'Grandchildren' },
  { hindi: 'Poti', english: "Son's Daughter", definition: 'Paternal Granddaughter', category: 'Grandchildren' },
  { hindi: 'Nati', english: "Daughter's Son", definition: 'Maternal Grandson', category: 'Grandchildren' },
  { hindi: 'Natin', english: "Daughter's Daughter", definition: 'Maternal Granddaughter', category: 'Grandchildren' },

  // Nephews & Nieces
  { hindi: 'Bhatija', english: "Brother's Son", definition: "Brother's Son (Nephew)", category: 'Nephews & Nieces' },
  { hindi: 'Bhatiji', english: "Brother's Daughter", definition: "Brother's Daughter (Niece)", category: 'Nephews & Nieces' },
  { hindi: 'Bhanja', english: "Sister's Son", definition: "Sister's Son (Nephew)", category: 'Nephews & Nieces' },
  { hindi: 'Bhanji', english: "Sister's Daughter", definition: "Sister's Daughter (Niece)", category: 'Nephews & Nieces' },

  // Cousins
  { hindi: 'Chachera Bhai', english: "Father's Younger Brother's Son", definition: 'Male cousin via Chacha', category: 'Cousins' },
  { hindi: 'Chacheri Behen', english: "Father's Younger Brother's Daughter", definition: 'Female cousin via Chacha', category: 'Cousins' },
  { hindi: 'Tauera Bhai', english: "Father's Elder Brother's Son", definition: 'Male cousin via Tau', category: 'Cousins' },
  { hindi: 'Taueri Behen', english: "Father's Elder Brother's Daughter", definition: 'Female cousin via Tau', category: 'Cousins' },
  { hindi: 'Phuphera Bhai', english: "Father's Sister's Son", definition: 'Male cousin via Bua', category: 'Cousins' },
  { hindi: 'Phupheri Behen', english: "Father's Sister's Daughter", definition: 'Female cousin via Bua', category: 'Cousins' },
  { hindi: 'Mamera Bhai', english: "Mother's Brother's Son", definition: 'Male cousin via Mama', category: 'Cousins' },
  { hindi: 'Mameri Behen', english: "Mother's Brother's Daughter", definition: 'Female cousin via Mama', category: 'Cousins' },
  { hindi: 'Mausera Bhai', english: "Mother's Sister's Son", definition: 'Male cousin via Mausi', category: 'Cousins' },
  { hindi: 'Mauseri Behen', english: "Mother's Sister's Daughter", definition: 'Female cousin via Mausi', category: 'Cousins' },

  // In-laws
  { hindi: 'Sasur', english: "Spouse's Father", definition: 'Father-in-Law', category: 'In-Laws' },
  { hindi: 'Saas', english: "Spouse's Mother", definition: 'Mother-in-Law', category: 'In-Laws' },
  { hindi: 'Jeth', english: "Husband's Elder Brother", definition: "Husband's Elder Brother", category: 'In-Laws' },
  { hindi: 'Jethani', english: "Husband's Elder Brother's Wife", definition: "Husband's Elder Brother's Wife", category: 'In-Laws' },
  { hindi: 'Devar', english: "Husband's Younger Brother", definition: "Husband's Younger Brother", category: 'In-Laws' },
  { hindi: 'Devrani', english: "Husband's Younger Brother's Wife", definition: "Husband's Younger Brother's Wife", category: 'In-Laws' },
  { hindi: 'Nanad', english: "Husband's Sister", definition: "Husband's Sister", category: 'In-Laws' },
  { hindi: 'Nandoi', english: "Husband's Sister's Husband", definition: "Husband's Sister's Husband", category: 'In-Laws' },
  { hindi: 'Saala', english: "Wife's Brother", definition: "Wife's Brother", category: 'In-Laws' },
  { hindi: 'Salhaj', english: "Wife's Brother's Wife", definition: "Wife's Brother's Wife", category: 'In-Laws' },
  { hindi: 'Saali', english: "Wife's Sister", definition: "Wife's Sister", category: 'In-Laws' },
  { hindi: 'Saadu', english: "Wife's Sister's Husband", definition: "Wife's Sister's Husband", category: 'In-Laws' },
  { hindi: 'Samdhi', english: "Child's Father-in-Law", definition: "Your son/daughter's spouse's father", category: 'In-Laws' },
  { hindi: 'Samdhan', english: "Child's Mother-in-Law", definition: "Your son/daughter's spouse's mother", category: 'In-Laws' },
]

export const RELATIONSHIP_CATEGORIES = [...new Set(INDIAN_RELATIONSHIPS.map(r => r.category))]

// Flat list of display labels for the picker: "Dada (Father's Father)"
export const RELATIONSHIP_LABELS = INDIAN_RELATIONSHIPS.map(r => `${r.hindi} — ${r.english}`)
