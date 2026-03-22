/**
 * Scavenger Hunt — challenge data + localStorage progress tracking.
 * ~3 challenges per landmark for the top 10 Italian landmarks.
 */

const STORAGE_KEY = "vtg-scavenger";

export interface Challenge {
  id: string;
  landmarkKey: string;
  prompt: { en: string; es: string };
  hint: { en: string; es: string };
  points: number;
}

const CHALLENGES: Challenge[] = [
  // --- Colosseum ---
  {
    id: "col-1",
    landmarkKey: "colosseum",
    prompt: {
      en: "Find the Roman numerals carved above one of the arched entrances",
      es: "Encuentra los números romanos tallados sobre una de las entradas en arco",
    },
    hint: {
      en: "Look at the second level — each arch was numbered for seating sections",
      es: "Mira el segundo nivel — cada arco estaba numerado para las secciones de asientos",
    },
    points: 10,
  },
  {
    id: "col-2",
    landmarkKey: "colosseum",
    prompt: {
      en: "Spot the iron clamp holes dotting the travertine walls",
      es: "Encuentra los agujeros de abrazaderas de hierro en los muros de travertino",
    },
    hint: {
      en: "Small round holes everywhere — medieval looters extracted the iron brackets",
      es: "Pequeños agujeros redondos por todas partes — los saqueadores medievales extrajeron los soportes de hierro",
    },
    points: 20,
  },
  {
    id: "col-3",
    landmarkKey: "colosseum",
    prompt: {
      en: "Find the cross mounted on the arena floor level",
      es: "Encuentra la cruz montada a nivel de la arena",
    },
    hint: {
      en: "It's at the eastern end of the arena, marking Christian martyrdom tradition",
      es: "Está en el extremo este de la arena, marcando la tradición del martirio cristiano",
    },
    points: 10,
  },

  // --- Roman Forum ---
  {
    id: "for-1",
    landmarkKey: "roman_forum",
    prompt: {
      en: "Find the three remaining columns of the Temple of Castor and Pollux",
      es: "Encuentra las tres columnas restantes del Templo de Cástor y Pólux",
    },
    hint: {
      en: "They're the tallest standing columns — Corinthian capitals on top",
      es: "Son las columnas más altas en pie — capiteles corintios en la parte superior",
    },
    points: 10,
  },
  {
    id: "for-2",
    landmarkKey: "roman_forum",
    prompt: {
      en: "Spot the Arch of Septimius Severus and count its large archways",
      es: "Encuentra el Arco de Septimio Severo y cuenta sus grandes arcadas",
    },
    hint: {
      en: "It's at the northwest end — there are three arched passages",
      es: "Está en el extremo noroeste — hay tres pasajes en arco",
    },
    points: 10,
  },
  {
    id: "for-3",
    landmarkKey: "roman_forum",
    prompt: {
      en: "Find the spot where Julius Caesar was cremated (marked by a small altar)",
      es: "Encuentra el lugar donde Julio César fue cremado (marcado por un pequeño altar)",
    },
    hint: {
      en: "Look for a circular stone structure covered with a small roof near the Arch of Titus end",
      es: "Busca una estructura circular de piedra cubierta con un pequeño techo cerca del Arco de Tito",
    },
    points: 30,
  },

  // --- Pantheon ---
  {
    id: "pan-1",
    landmarkKey: "pantheon",
    prompt: {
      en: "Look up! Find the oculus — the open hole in the center of the dome",
      es: "¡Mira arriba! Encuentra el óculo — el agujero abierto en el centro de la cúpula",
    },
    hint: {
      en: "It's 9 meters (30 feet) across — the only source of natural light",
      es: "Tiene 9 metros de diámetro — la única fuente de luz natural",
    },
    points: 10,
  },
  {
    id: "pan-2",
    landmarkKey: "pantheon",
    prompt: {
      en: "Find Raphael's tomb inside the Pantheon",
      es: "Encuentra la tumba de Rafael dentro del Panteón",
    },
    hint: {
      en: "Look for a marble sarcophagus with an inscription on the left side as you enter",
      es: "Busca un sarcófago de mármol con una inscripción en el lado izquierdo al entrar",
    },
    points: 20,
  },
  {
    id: "pan-3",
    landmarkKey: "pantheon",
    prompt: {
      en: "Read the inscription on the portico — whose name is carved there?",
      es: "Lee la inscripción en el pórtico — ¿de quién es el nombre tallado allí?",
    },
    hint: {
      en: "M·AGRIPPA — Marcus Agrippa, though Hadrian actually rebuilt it",
      es: "M·AGRIPPA — Marco Agripa, aunque Adriano lo reconstruyó en realidad",
    },
    points: 10,
  },

  // --- Trevi Fountain ---
  {
    id: "tre-1",
    landmarkKey: "trevi_fountain",
    prompt: {
      en: "Find the two Triton figures taming sea horses at the fountain base",
      es: "Encuentra las dos figuras de Tritón domando caballos marinos en la base de la fuente",
    },
    hint: {
      en: "One horse is calm, the other wild — representing the moods of the sea",
      es: "Un caballo está en calma, el otro salvaje — representando los estados del mar",
    },
    points: 10,
  },
  {
    id: "tre-2",
    landmarkKey: "trevi_fountain",
    prompt: {
      en: "Spot the small drinking fountain on the right side of the Trevi",
      es: "Encuentra la pequeña fuente para beber en el lado derecho de la Trevi",
    },
    hint: {
      en: "Called 'Ace of Cups' — legend says drinking from it ensures your return to Rome",
      es: "Llamada 'As de Copas' — la leyenda dice que beber de ella asegura tu regreso a Roma",
    },
    points: 20,
  },
  {
    id: "tre-3",
    landmarkKey: "trevi_fountain",
    prompt: {
      en: "Find the large statue of Neptune (Oceanus) in the central niche",
      es: "Encuentra la gran estatua de Neptuno (Oceanus) en el nicho central",
    },
    hint: {
      en: "He's standing on a shell-shaped chariot pulled by the sea horses",
      es: "Está de pie sobre un carro en forma de concha tirado por los caballos marinos",
    },
    points: 10,
  },

  // --- Florence Duomo ---
  {
    id: "duo-1",
    landmarkKey: "florence_duomo",
    prompt: {
      en: "Count the colors of marble on the cathedral facade",
      es: "Cuenta los colores de mármol en la fachada de la catedral",
    },
    hint: {
      en: "Three: white (Carrara), green (Prato), and pink (Maremma)",
      es: "Tres: blanco (Carrara), verde (Prato) y rosa (Maremma)",
    },
    points: 10,
  },
  {
    id: "duo-2",
    landmarkKey: "florence_duomo",
    prompt: {
      en: "Find the clock face inside the cathedral painted by Paolo Uccello",
      es: "Encuentra el reloj pintado dentro de la catedral por Paolo Uccello",
    },
    hint: {
      en: "Look above the main entrance on the inside — it runs counter-clockwise!",
      es: "Mira sobre la entrada principal por dentro — ¡funciona en sentido contrario!",
    },
    points: 30,
  },
  {
    id: "duo-3",
    landmarkKey: "florence_duomo",
    prompt: {
      en: "Spot Brunelleschi's dome from the piazza — notice it has no external buttresses",
      es: "Observa la cúpula de Brunelleschi desde la plaza — nota que no tiene contrafuertes externos",
    },
    hint: {
      en: "That's the engineering miracle — it's entirely self-supporting with a double shell",
      es: "Ese es el milagro de ingeniería — es completamente autoportante con una doble capa",
    },
    points: 10,
  },

  // --- Ponte Vecchio ---
  {
    id: "pv-1",
    landmarkKey: "ponte_vecchio",
    prompt: {
      en: "Find a bust of Benvenuto Cellini on the bridge",
      es: "Encuentra un busto de Benvenuto Cellini en el puente",
    },
    hint: {
      en: "It's in the middle of the bridge on the downstream side, surrounded by padlocks",
      es: "Está en el medio del puente en el lado río abajo, rodeado de candados",
    },
    points: 10,
  },
  {
    id: "pv-2",
    landmarkKey: "ponte_vecchio",
    prompt: {
      en: "Look up to spot the Vasari Corridor windows running above the shops",
      es: "Mira hacia arriba para ver las ventanas del Corredor Vasariano sobre las tiendas",
    },
    hint: {
      en: "Small round windows on the upper level — the Medici's private elevated walkway",
      es: "Pequeñas ventanas redondas en el nivel superior — el pasadizo privado elevado de los Médici",
    },
    points: 20,
  },
  {
    id: "pv-3",
    landmarkKey: "ponte_vecchio",
    prompt: {
      en: "Notice the shop overhangs (sporto) jutting out over the river",
      es: "Nota los voladizos de las tiendas (sporto) que sobresalen sobre el río",
    },
    hint: {
      en: "The back rooms were added later, hanging precariously over the Arno",
      es: "Las trastiendas se añadieron después, colgando precariamente sobre el Arno",
    },
    points: 10,
  },

  // --- St. Mark's Basilica ---
  {
    id: "smb-1",
    landmarkKey: "st_marks_basilica",
    prompt: {
      en: "Find the four bronze horses on the basilica's upper facade",
      es: "Encuentra los cuatro caballos de bronce en la fachada superior de la basílica",
    },
    hint: {
      en: "They're replicas — the originals from Constantinople are inside the museum",
      es: "Son réplicas — los originales de Constantinopla están dentro del museo",
    },
    points: 10,
  },
  {
    id: "smb-2",
    landmarkKey: "st_marks_basilica",
    prompt: {
      en: "Spot the two pillars brought from Acre in the 13th century at the south side",
      es: "Encuentra los dos pilares traídos de Acre en el siglo XIII en el lado sur",
    },
    hint: {
      en: "They're darker colored, standing at the corner near the Doge's Palace",
      es: "Son de color más oscuro, de pie en la esquina cerca del Palacio Ducal",
    },
    points: 20,
  },
  {
    id: "smb-3",
    landmarkKey: "st_marks_basilica",
    prompt: {
      en: "Look at the floor inside — find a spot where it waves and undulates",
      es: "Mira el suelo dentro — encuentra un lugar donde ondula",
    },
    hint: {
      en: "The mosaic floor has settled unevenly over centuries, creating rolling waves",
      es: "El suelo de mosaico se ha asentado de manera desigual durante siglos, creando ondulaciones",
    },
    points: 30,
  },

  // --- Leaning Tower of Pisa ---
  {
    id: "pisa-1",
    landmarkKey: "leaning_tower_pisa",
    prompt: {
      en: "Count the levels of arcaded galleries on the tower",
      es: "Cuenta los niveles de galerías con arcadas en la torre",
    },
    hint: {
      en: "There are 8 levels total including the base and the bell chamber at the top",
      es: "Hay 8 niveles en total incluyendo la base y la cámara de campanas en la parte superior",
    },
    points: 10,
  },
  {
    id: "pisa-2",
    landmarkKey: "leaning_tower_pisa",
    prompt: {
      en: "Notice that the columns on the lean side are slightly taller than the opposite side",
      es: "Nota que las columnas del lado inclinado son ligeramente más altas que las del lado opuesto",
    },
    hint: {
      en: "Medieval builders tried to correct the lean by making one side taller — it didn't work!",
      es: "¡Los constructores medievales intentaron corregir la inclinación haciendo un lado más alto — no funcionó!",
    },
    points: 20,
  },
  {
    id: "pisa-3",
    landmarkKey: "leaning_tower_pisa",
    prompt: {
      en: "Find the baptistery building — it also leans slightly!",
      es: "Encuentra el edificio del baptisterio — ¡también se inclina ligeramente!",
    },
    hint: {
      en: "The round building west of the cathedral — it leans 0.6 degrees toward the cathedral",
      es: "El edificio redondo al oeste de la catedral — se inclina 0.6 grados hacia la catedral",
    },
    points: 20,
  },

  // --- Vatican Museums ---
  {
    id: "vat-1",
    landmarkKey: "vatican_museums",
    prompt: {
      en: "Find the spiral staircase (Bramante Staircase) at the museum exit",
      es: "Encuentra la escalera de caracol (Escalera de Bramante) en la salida del museo",
    },
    hint: {
      en: "It's actually a double helix — people going up never cross those going down",
      es: "En realidad es una doble hélice — los que suben nunca cruzan con los que bajan",
    },
    points: 10,
  },
  {
    id: "vat-2",
    landmarkKey: "vatican_museums",
    prompt: {
      en: "In the Sistine Chapel, find where Michelangelo painted his own face",
      es: "En la Capilla Sixtina, encuentra dónde Miguel Ángel pintó su propio rostro",
    },
    hint: {
      en: "He's the flayed skin held by St. Bartholomew in the Last Judgment",
      es: "Es la piel desollada sostenida por San Bartolomé en el Juicio Final",
    },
    points: 30,
  },
  {
    id: "vat-3",
    landmarkKey: "vatican_museums",
    prompt: {
      en: "Find the Gallery of Maps — spot the map of your favorite Italian region",
      es: "Encuentra la Galería de los Mapas — busca el mapa de tu región italiana favorita",
    },
    hint: {
      en: "40 topographical maps painted on the walls of a 120-meter corridor",
      es: "40 mapas topográficos pintados en las paredes de un corredor de 120 metros",
    },
    points: 10,
  },
];

export function getChallengesForLandmark(key: string): Challenge[] {
  return CHALLENGES.filter((c) => c.landmarkKey === key);
}

export function getAllChallenges(): Challenge[] {
  return CHALLENGES;
}

// --- Progress tracking ---

function loadProgress(): Record<string, boolean> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return {};
}

function saveProgress(progress: Record<string, boolean>): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  } catch { /* best-effort */ }
}

export function markCompleted(id: string): void {
  const progress = loadProgress();
  progress[id] = true;
  saveProgress(progress);
}

export function getCompleted(): Set<string> {
  return new Set(Object.keys(loadProgress()));
}

export function getScore(): number {
  const completed = loadProgress();
  return CHALLENGES.filter((c) => completed[c.id]).reduce((sum, c) => sum + c.points, 0);
}

export function getTotalPossibleScore(): number {
  return CHALLENGES.reduce((sum, c) => sum + c.points, 0);
}

export function resetProgress(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch { /* best-effort */ }
}

/** Get unique landmark keys that have challenges. */
export function getLandmarkKeysWithChallenges(): string[] {
  return Array.from(new Set(CHALLENGES.map((c) => c.landmarkKey)));
}
