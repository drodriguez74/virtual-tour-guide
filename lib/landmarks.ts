export interface StoryChapter {
  id: string;
  title: string;
  description: string;
  prompt: string;
}

export interface Landmark {
  name: string;
  coords: { lat: number; lng: number };
  radiusMeters: number;
  stories: StoryChapter[];
}

export const LANDMARK_STORIES: Record<string, Landmark> = {
  colosseum: {
    name: "The Colosseum",
    coords: { lat: 41.8902, lng: 12.4922 },
    radiusMeters: 200,
    stories: [
      {
        id: "construction",
        title: "Building the Colosseum",
        description: "How 100,000 workers built it in just 8 years",
        prompt: `Generate a vivid cinematic narration about the construction of the Roman Colosseum from 72 AD to 80 AD. Cover: Emperor Vespasian's vision, the 100,000 Jewish slaves and workers, the engineering marvel of concrete and travertine stone, the hypogeum underground network, and the grand opening games under Titus where 9,000 animals were killed in 100 days. Make it feel like a BBC documentary narration.`,
      },
      {
        id: "gladiators",
        title: "Life of a Gladiator",
        description: "Training, combat, and the brutal reality of the arena",
        prompt: `Narrate the daily life of a Roman gladiator at the Colosseum. Cover: the gladiator schools (ludi) near the arena, different gladiator types (Retiarius, Secutor, Murmillo), their surprisingly good diet and medical care, the pre-fight rituals, how fights actually ended (rarely in death), famous gladiators like Spartacus and Commodus, and what freedom meant to a gladiator.`,
      },
      {
        id: "beasts",
        title: "Beasts of the Arena",
        description: "Lions, elephants, rhinos — and the men who fought them",
        prompt: `Tell the story of the exotic animals brought to the Colosseum for the venatio (beast hunts). Cover: how animals were captured across Africa and Asia, transported to Rome, held in the underground hypogeum, lifted by elevators to the arena floor. Include lions, tigers, elephants, hippos, rhinos, ostriches, and the bestiarii fighters who specialized in animal combat.`,
      },
      {
        id: "naval",
        title: "Sea Battles in the Arena",
        description: "When the Colosseum was flooded for mock naval warfare",
        prompt: `Describe the naumachia — mock naval battles staged inside the Colosseum. The arena floor was flooded with water, full-sized warships were brought in, and condemned prisoners re-enacted famous sea battles. Make the historical debate about whether this happened in the Colosseum itself or a nearby lake part of the story.`,
      },
    ],
  },
  roman_forum: {
    name: "The Roman Forum",
    coords: { lat: 41.8925, lng: 12.4853 },
    radiusMeters: 300,
    stories: [
      {
        id: "daily_life",
        title: "A Day in the Forum",
        description:
          "Merchants, politicians, and gossip in ancient Rome's downtown",
        prompt: `Paint a vivid picture of daily life in the Roman Forum at its peak around 100 AD. Describe the morning crowd: senators in togas heading to the Curia, merchants opening stalls, lawyers arguing cases outdoors, priests performing rituals at the Temple of Vesta.`,
      },
      {
        id: "caesar",
        title: "The Ides of March",
        description: "Caesar's assassination and what happened next",
        prompt: `Tell the dramatic story of Julius Caesar's assassination on March 15, 44 BC and the chaotic days that followed in the Roman Forum. Cover: the conspiracy of 60 senators, the 23 stab wounds, Mark Antony's famous funeral speech, the crowd turning on the conspirators, Caesar's body being burned in the Forum itself.`,
      },
    ],
  },
  palatine_hill: {
    name: "Palatine Hill",
    coords: { lat: 41.8892, lng: 12.4875 },
    radiusMeters: 250,
    stories: [
      {
        id: "romulus",
        title: "Romulus & Remus",
        description: "The founding myth of Rome — wolves, twins, and fratricide",
        prompt: `Tell the founding myth of Rome on Palatine Hill. Cover: the she-wolf who suckled the abandoned twins Romulus and Remus, the shepherd Faustulus who found them, how Romulus drew the sacred boundary of Rome on Palatine Hill, and why he killed his own brother Remus for crossing it.`,
      },
      {
        id: "emperors",
        title: "Palace of the Emperors",
        description: "How Palatine Hill became history's most exclusive address",
        prompt: `Describe how Palatine Hill evolved from Rome's founding village into the most exclusive real estate in the ancient world — home to Augustus, Tiberius, Caligula, Domitian and their vast palace complexes. Cover the etymology: 'Palatine' is the origin of the word 'palace' in every European language.`,
      },
    ],
  },
  pompeii: {
    name: "Pompeii",
    coords: { lat: 40.751, lng: 14.4989 },
    radiusMeters: 500,
    stories: [
      {
        id: "eruption",
        title: "The Last Day of Pompeii",
        description: "August 24, 79 AD — hour by hour",
        prompt: `Narrate the last 24 hours of Pompeii on August 24, 79 AD as if you are a witness. Start the morning normally — market day, the smell of fresh bread, gladiators training. Then at 1 PM Vesuvius erupts. Hour by hour: the ash cloud, the pyroclastic surge, why people who stayed died. Reference Pliny the Younger's real eyewitness letters.`,
      },
      {
        id: "daily_life_pompeii",
        title: "What Pompeii Ate for Breakfast",
        description: "The surprisingly modern daily life frozen in time",
        prompt: `Describe daily life in Pompeii based on what archaeologists have actually found preserved under the ash. Cover: the 80 fast-food thermopolia, graffiti on walls (love poems, election slogans, crude insults), the perfectly preserved bakery with bread still in the oven.`,
      },
    ],
  },

  // ── Rome ──────────────────────────────────────────────
  vatican_museums: {
    name: "Vatican Museums & Sistine Chapel",
    coords: { lat: 41.9065, lng: 12.4536 },
    radiusMeters: 300,
    stories: [
      {
        id: "sistine_ceiling",
        title: "Painting the Sistine Ceiling",
        description: "Michelangelo's 4-year ordeal on scaffolding 20 metres high",
        prompt: `Narrate the story of Michelangelo painting the Sistine Chapel ceiling from 1508 to 1512. Cover: Pope Julius II's commission, how Michelangelo considered himself a sculptor not a painter, the custom scaffolding he designed, painting standing up (not lying down as myth says), the physical toll — paint dripping into his eyes, his neck permanently bent. Describe the unveiling moment when Rome gasped at the Creation of Adam.`,
      },
      {
        id: "vatican_treasures",
        title: "Treasures of the Vatican",
        description: "2,000 years of art crammed into 7 km of corridors",
        prompt: `Describe the Vatican Museums' most extraordinary pieces across its 54 galleries. Cover: the Laocoön sculpture that stunned Michelangelo, the Raphael Rooms that rival the Sistine Chapel, the Gallery of Maps — 40 huge topographic maps of Italy painted in the 1580s, and the Bramante Staircase. Mention that the collection spans Egyptian mummies to modern art by Dalí and Van Gogh.`,
      },
      {
        id: "last_judgment",
        title: "The Last Judgment Scandal",
        description: "Michelangelo's revenge painted on the altar wall",
        prompt: `Tell the dramatic story of Michelangelo's Last Judgment on the Sistine Chapel altar wall, painted 25 years after the ceiling. Cover: why it caused a scandal — 300+ nude figures, the Pope's master of ceremonies Biagio da Cesena who objected and was painted into Hell as Minos with donkey ears, and the 'fig leaf campaign' where later painters were hired to add drapery over the nudity.`,
      },
    ],
  },
  pantheon: {
    name: "The Pantheon",
    coords: { lat: 41.8986, lng: 12.4769 },
    radiusMeters: 150,
    stories: [
      {
        id: "pantheon_dome",
        title: "The Impossible Dome",
        description: "Still the world's largest unreinforced concrete dome after 2,000 years",
        prompt: `Narrate the engineering marvel of the Pantheon's dome, built around 125 AD under Emperor Hadrian. Cover: the oculus — the 9-metre open hole at the top that is the only light source, the hidden coffers that reduce weight, the Roman concrete recipe (volcanic ash) that made it possible, why it has survived 2,000 years while modern concrete crumbles, and the rain that falls through the oculus and drains through the slightly convex floor.`,
      },
      {
        id: "pantheon_gods_to_church",
        title: "From Gods to God",
        description: "How a pagan temple became Rome's best-preserved ancient building",
        prompt: `Tell how the Pantheon survived while other Roman temples were quarried for stone. Cover: it was a temple to all gods, then abandoned, then saved in 609 AD when Emperor Phocas gifted it to Pope Boniface IV who consecrated it as a church. Mention the Renaissance tombs inside — Raphael is buried here, and so are two Italian kings.`,
      },
    ],
  },
  trevi_fountain: {
    name: "Trevi Fountain",
    coords: { lat: 41.9009, lng: 12.4833 },
    radiusMeters: 100,
    stories: [
      {
        id: "trevi_aqueduct",
        title: "The Virgin's Aqueduct",
        description: "A 2,000-year-old water supply and the fountain it feeds",
        prompt: `Tell the story of the Trevi Fountain from its ancient origins to today. Cover: the Aqua Virgo aqueduct built in 19 BC — named for the young girl who showed soldiers the spring, the baroque masterpiece designed by Nicola Salvi in 1762, the central figure of Neptune taming the seas, and the tradition of throwing coins — about €3,000 per day is collected and donated to charity.`,
      },
      {
        id: "trevi_cinema",
        title: "Trevi in the Movies",
        description: "From La Dolce Vita to Roman Holiday",
        prompt: `Describe the Trevi Fountain's starring role in cinema. Cover: Anita Ekberg's iconic midnight wade in Fellini's La Dolce Vita (1960) and how it took multiple freezing nights to film, the Three Coins in the Fountain (1954) that popularized the coin-tossing tradition worldwide, and its appearances in Roman Holiday and The Lizzie McGuire Movie. Explain how the fountain became synonymous with romance in Rome.`,
      },
    ],
  },

  // ── Florence ──────────────────────────────────────────
  florence_duomo: {
    name: "Florence Cathedral & Brunelleschi's Dome",
    coords: { lat: 43.7731, lng: 11.2560 },
    radiusMeters: 200,
    stories: [
      {
        id: "brunelleschi_dome",
        title: "Brunelleschi's Impossible Dome",
        description: "The greatest engineering puzzle of the Renaissance",
        prompt: `Narrate how Filippo Brunelleschi built the dome of Florence Cathedral from 1420 to 1436. Cover: the 50-year gap where the cathedral stood roofless because nobody knew how to dome a 45-metre span, Brunelleschi's bitter rivalry with Ghiberti, the herringbone brick pattern that made it self-supporting without scaffolding, the ox-hoist he invented, and the moment he sealed the lantern on top — the largest dome built since the Pantheon.`,
      },
      {
        id: "florence_baptistery",
        title: "The Gates of Paradise",
        description: "Ghiberti's bronze doors that Michelangelo named",
        prompt: `Tell the story of the Florence Baptistery's bronze doors. Cover: the 1401 competition — Brunelleschi vs Ghiberti, why Ghiberti won, the 27 years he spent creating the 10 gilded panels of the East Doors, and how Michelangelo reportedly called them the 'Gates of Paradise.' Describe the intricate Biblical scenes and the Renaissance perspective techniques Ghiberti pioneered in bronze.`,
      },
    ],
  },
  uffizi: {
    name: "The Uffizi Gallery",
    coords: { lat: 43.7687, lng: 11.2553 },
    radiusMeters: 150,
    stories: [
      {
        id: "medici_collection",
        title: "The Medici Art Empire",
        description: "How a banking family built the world's greatest art collection",
        prompt: `Narrate how the Medici family created the Uffizi collection. Cover: Cosimo de' Medici's patronage of Botticelli, the construction of the Uffizi by Vasari in 1560 as government offices, how Anna Maria Luisa de' Medici's 1743 Pact ensured the collection would never leave Florence, and the masterpieces within — Botticelli's Birth of Venus, Leonardo's Annunciation, Caravaggio's Medusa.`,
      },
      {
        id: "birth_of_venus",
        title: "Botticelli's Birth of Venus",
        description: "The painting that defined Renaissance beauty",
        prompt: `Tell the story behind Botticelli's Birth of Venus (c. 1485). Cover: the model Simonetta Vespucci — the most beautiful woman in Florence who died at 22, the pagan subject matter that was radical for its time, how the Medici protected Botticelli from charges of immorality, the painting's near-destruction during Savonarola's Bonfire of the Vanities, and its rediscovery centuries later.`,
      },
    ],
  },
  accademia_david: {
    name: "Galleria dell'Accademia — David",
    coords: { lat: 43.7768, lng: 11.2588 },
    radiusMeters: 100,
    stories: [
      {
        id: "david_creation",
        title: "Carving David from a Ruined Block",
        description: "The marble slab two sculptors abandoned before Michelangelo",
        prompt: `Narrate how Michelangelo carved David from 1501 to 1504. Cover: the 5.17-metre block of Carrara marble that had been abandoned for 25 years after two sculptors gave up on it, the 26-year-old Michelangelo's audacious proposal, his secret 2-year process behind a wooden screen, the committee debate about where to place it (including Leonardo da Vinci's opinion), and the dramatic overnight move to the Piazza della Signoria.`,
      },
      {
        id: "david_symbol",
        title: "David: Symbol of Florence",
        description: "Why a Biblical hero became a political weapon",
        prompt: `Explain how Michelangelo's David was more political statement than religious art. Cover: Florence had just expelled the Medici and declared a republic, David represented the small city-state standing against larger powers (Goliath = Milan, Rome, or the Medici), the defiant gaze toward Rome, and how the statue has been attacked multiple times — a chair thrown at it in 1991 damaged the left foot.`,
      },
    ],
  },
  ponte_vecchio: {
    name: "Ponte Vecchio",
    coords: { lat: 43.7680, lng: 11.2532 },
    radiusMeters: 100,
    stories: [
      {
        id: "ponte_vecchio_history",
        title: "Bridge of Butchers and Goldsmiths",
        description: "How a medieval meat market became a jewellery row",
        prompt: `Tell the story of Ponte Vecchio from its Roman origins to today. Cover: it's the only Florentine bridge the Nazis didn't destroy in 1944 (allegedly on Hitler's direct order), the butchers and tanners who originally occupied the shops (and threw waste into the Arno), Grand Duke Ferdinand I's 1593 decree expelling them and inviting goldsmiths instead, and the Vasari Corridor — the secret elevated passageway the Medici built above the shops.`,
      },
      {
        id: "vasari_corridor",
        title: "The Secret Corridor Above",
        description: "The Medici's private walkway from palace to palace",
        prompt: `Describe the Vasari Corridor, the 1-km elevated passageway built in just 5 months in 1565 connecting the Palazzo Vecchio to the Pitti Palace via the Uffizi and over Ponte Vecchio. Cover: why Cosimo I needed it (to walk safely above the common people), the windows overlooking the Arno, the self-portrait collection inside, and its role as an escape route during WWII.`,
      },
    ],
  },

  // ── Venice ────────────────────────────────────────────
  st_marks_basilica: {
    name: "St. Mark's Basilica & Piazza",
    coords: { lat: 45.4345, lng: 12.3397 },
    radiusMeters: 200,
    stories: [
      {
        id: "stolen_saint",
        title: "The Stolen Saint",
        description: "How Venetian merchants smuggled St. Mark's body from Egypt",
        prompt: `Narrate the audacious theft of St. Mark's relics from Alexandria, Egypt in 828 AD. Cover: two Venetian merchants hid the body under layers of pork and cabbage to disgust Muslim customs inspectors, the stormy voyage home, how Venice replaced its previous patron saint Theodore with Mark, and the spectacular basilica built to house the stolen relics — covered in 85,000 square feet of gold mosaics.`,
      },
      {
        id: "venice_flooding",
        title: "Venice vs. the Sea",
        description: "A thousand years of fighting the rising tide",
        prompt: `Tell the story of Venice's eternal battle with water. Cover: how the city was built on 118 islands on wooden pilings driven into mud, the acqua alta floods that regularly submerge St. Mark's Piazza, the devastating 1966 flood, and the MOSE barrier system — a €6 billion project of 78 mobile gates designed to protect the lagoon, finally activated in 2020 after decades of delays and corruption scandals.`,
      },
      {
        id: "doges_palace",
        title: "Secrets of the Doge's Palace",
        description: "The Bridge of Sighs, secret prisons, and golden staircases",
        prompt: `Describe the Doge's Palace and its hidden secrets. Cover: the Scala d'Oro golden staircase, the world's largest oil painting (Tintoretto's Paradise), the Bridge of Sighs — connecting the palace to the prison where Casanova was famously held (and escaped), the secret itineraries tour through hidden rooms where the Council of Ten conducted espionage, and the bocche di leone (lion's mouth) letter boxes for anonymous denunciations.`,
      },
    ],
  },
  rialto_bridge: {
    name: "Rialto Bridge",
    coords: { lat: 45.4381, lng: 12.3360 },
    radiusMeters: 100,
    stories: [
      {
        id: "rialto_history",
        title: "The Bridge That Took 400 Years",
        description: "From wooden drawbridge to stone icon",
        prompt: `Tell the story of the Rialto Bridge. Cover: the first wooden bridge in 1181, its multiple collapses (including under the weight of a crowd watching a boat parade in 1444), the 1587 design competition — Michelangelo, Palladio, and Sansovino all submitted designs but the unknown Antonio da Ponte won, the merchants who have occupied the shops since it opened in 1591, and Shakespeare's Merchant of Venice set in this very spot.`,
      },
      {
        id: "venice_trade",
        title: "Venice: Marketplace of the World",
        description: "How the Rialto became Europe's Wall Street",
        prompt: `Describe the Rialto as the commercial heart of the Venetian Republic. Cover: the Rialto market operating continuously since the 11th century, how Venice invented modern banking and double-entry bookkeeping, the first state bond market, spice and silk traders from Constantinople, Marco Polo departing from here, and how the word 'bank' comes from the Italian 'banco' — the benches money-changers used at the Rialto.`,
      },
    ],
  },

  // ── Pisa ──────────────────────────────────────────────
  leaning_tower_pisa: {
    name: "Leaning Tower & Cathedral of Pisa",
    coords: { lat: 43.7230, lng: 10.3966 },
    radiusMeters: 150,
    stories: [
      {
        id: "pisa_lean",
        title: "Why It Leans (And Why It Hasn't Fallen)",
        description: "800 years of engineering disasters and rescues",
        prompt: `Narrate the story of the Leaning Tower of Pisa from 1173 to today. Cover: the soft clay foundation that caused the lean after just 3 storeys, the 200-year construction pause that actually saved it (allowing the soil to settle), how builders tried to correct the lean by making upper floors taller on one side (giving it a banana curve), Mussolini's disastrous concrete injection that nearly toppled it, and the 1990–2001 rescue that removed 38 cubic metres of soil to reduce the lean from 5.5° to 3.97°.`,
      },
      {
        id: "galileo_pisa",
        title: "Galileo's Dropping Experiment",
        description: "Did he really drop balls from the tower?",
        prompt: `Tell the famous (and possibly apocryphal) story of Galileo dropping two balls of different mass from the Leaning Tower around 1589 to disprove Aristotle's theory that heavier objects fall faster. Cover: the historical evidence for and against it happening, Galileo's actual connection to Pisa (he was born there and was a professor at Pisa University), his inclined plane experiments that DID prove the theory, and why the story endures as one of science's great legends.`,
      },
      {
        id: "pisa_campo",
        title: "The Field of Miracles",
        description: "Four masterpieces on one sacred lawn",
        prompt: `Describe the Piazza dei Miracoli — the extraordinary ensemble of the Cathedral, Baptistery, Tower, and Camposanto cemetery all on one green lawn. Cover: the Cathedral's blend of Romanesque, Byzantine, and Islamic architecture reflecting Pisa's maritime empire, the Baptistery's perfect acoustics (a guard demonstrates the echo every 30 minutes), and the Camposanto's legend — built around sacred soil brought from Calvary during the Crusades.`,
      },
    ],
  },

  // ── Milan ─────────────────────────────────────────────
  duomo_milano: {
    name: "Duomo di Milano",
    coords: { lat: 45.4642, lng: 9.1900 },
    radiusMeters: 200,
    stories: [
      {
        id: "milan_cathedral",
        title: "600 Years to Build a Cathedral",
        description: "The largest Gothic cathedral in the world — and its endless construction",
        prompt: `Narrate the construction of Milan's Duomo from 1386 to its completion in 1965. Cover: Gian Galeazzo Visconti's vision, the Candoglia marble quarried from 100 km away and transported by canal, the 3,400 statues (more than any building on Earth), the 135 spires, Napoleon ordering the facade finished for his coronation in 1805, and the Madonnina — the golden Virgin Mary statue on the highest spire that is Milan's symbol. Mention the law that no building in Milan may be taller than the Madonnina.`,
      },
      {
        id: "milan_rooftop",
        title: "A Forest of Spires",
        description: "Walking on the rooftop among 3,400 statues",
        prompt: `Describe the experience of walking on the Duomo rooftop terraces. Cover: the 135 Gothic spires surrounding you like a stone forest, the 3,400 statues (saints, animals, gargoyles, and even a statue of the Statue of Liberty — the Duomo inspired Bartholdi's design), the pink Candoglia marble that glows at sunset, and the panoramic view stretching to the Alps on clear days. It's the only major cathedral where visitors can walk freely on the roof.`,
      },
    ],
  },

  // ── Coastal ───────────────────────────────────────────
  cinque_terre: {
    name: "Cinque Terre — Riomaggiore",
    coords: { lat: 44.1461, lng: 9.6563 },
    radiusMeters: 800,
    stories: [
      {
        id: "cinque_terre_villages",
        title: "Five Villages on the Edge",
        description: "How fishermen built a paradise on impossible cliffs",
        prompt: `Narrate the story of the Cinque Terre's five villages. Cover: how they were virtually unreachable by road until the 1960s, the terraced vineyards held together by an estimated 6,700 km of dry-stone walls (longer than the Great Wall of China), the colourful houses originally painted so fishermen could spot their village from the sea, the anchovy-based cuisine born of isolation, and the Via dell'Amore — the romantic cliffside path connecting Riomaggiore to Manarola.`,
      },
      {
        id: "cinque_terre_wine",
        title: "The World's Most Difficult Wine",
        description: "Vineyards on 45-degree cliffs harvested entirely by hand",
        prompt: `Tell the story of Cinque Terre's heroic viticulture. Cover: the terraced vineyards on near-vertical cliffs maintained since the 12th century, the rare Sciacchetrà dessert wine made from sun-dried grapes (selling for €50+ per half-bottle), how every grape must be harvested by hand since no machines can reach the terraces, the monorail systems villagers built to transport grapes up the cliffs, and why UNESCO protects this landscape as a World Heritage cultural landscape.`,
      },
    ],
  },
  amalfi_coast: {
    name: "Amalfi Coast",
    coords: { lat: 40.6340, lng: 14.6027 },
    radiusMeters: 500,
    stories: [
      {
        id: "amalfi_republic",
        title: "The Forgotten Maritime Republic",
        description: "When tiny Amalfi rivalled Venice and Genoa",
        prompt: `Narrate the rise and fall of the Maritime Republic of Amalfi from the 9th to 12th centuries. Cover: how this tiny cliff-side town became one of Italy's four great maritime republics, its invention of the maritime compass (or adoption from Arab traders), the Tabula Amalfitana — the oldest maritime law code that governed Mediterranean trade for centuries, the devastating tsunami of 1343 that destroyed the lower town, and how the discovery of Amalfi's cathedral crypt revealed the remains of St. Andrew the Apostle.`,
      },
      {
        id: "path_of_gods",
        title: "The Path of the Gods",
        description: "An ancient trail 500 metres above the Mediterranean",
        prompt: `Describe the Sentiero degli Dei (Path of the Gods), the ancient trail connecting Agerola to Positano along the Amalfi Coast at 500 metres above sea level. Cover: why the ancient Greeks named it — they believed the gods used this route, the terraced lemon groves along the path (Amalfi lemons are the size of grapefruits), the vertigo-inducing views of Capri, and the trail's use by shepherds and monks for over a thousand years before tourists discovered it.`,
      },
    ],
  },

  // ── Southern / Sicily ─────────────────────────────────
  herculaneum: {
    name: "Herculaneum",
    coords: { lat: 40.8062, lng: 14.3478 },
    radiusMeters: 300,
    stories: [
      {
        id: "herculaneum_preserved",
        title: "Better Than Pompeii",
        description: "The town preserved so perfectly you can see the wood grain",
        prompt: `Compare Herculaneum to its more famous neighbour Pompeii. Cover: while Pompeii was buried in ash, Herculaneum was sealed under 20 metres of volcanic mud that preserved wood, food, fabric, and even a library of papyrus scrolls. Describe the perfectly intact houses with original wooden furniture, the carbonised bread found in ovens, the boat houses where 300 skeletons were found huddled during the eruption, and the Villa of the Papyri — the inspiration for the Getty Villa in Malibu.`,
      },
      {
        id: "herculaneum_scrolls",
        title: "Reading Burned Scrolls with AI",
        description: "How modern technology is unlocking a 2,000-year-old library",
        prompt: `Tell the story of the Herculaneum papyri — nearly 2,000 carbonised scrolls found in 1752 in a buried villa believed to belong to Julius Caesar's father-in-law. Cover: early attempts to unroll them that destroyed many, the use of X-ray CT scanning, and the 2023 Vesuvius Challenge where AI and machine learning finally read text on unopened scrolls for the first time — revealing previously unknown works of Greek philosophy. This is one of the most exciting archaeological breakthroughs of the 21st century.`,
      },
    ],
  },
  valley_of_temples: {
    name: "Valley of the Temples",
    coords: { lat: 37.2906, lng: 13.5883 },
    radiusMeters: 500,
    stories: [
      {
        id: "agrigento_greek",
        title: "Sicily's Greek Golden Age",
        description: "When Agrigento was richer than Athens",
        prompt: `Narrate the story of ancient Akragas (Agrigento), founded by Greek colonists in 581 BC. Cover: how the philosopher Empedocles described its citizens as people who 'feast as if they'll die tomorrow, and build as if they'll live forever,' the Temple of Concordia — one of the best-preserved Greek temples anywhere (better than most in Greece itself), the 500,000 population at its peak, and the tyrant Phalaris who allegedly roasted enemies alive inside a bronze bull.`,
      },
      {
        id: "agrigento_temple_walk",
        title: "Walking the Sacred Ridge",
        description: "Seven temples along a 2,500-year-old ridge overlooking the sea",
        prompt: `Describe a walk along the Valley of the Temples ridge at sunset. Cover: the Temple of Concordia (converted to a church in the 6th century, which saved it), the massive ruins of the Temple of Olympian Zeus (which would have been the largest Greek temple ever built but was never finished), the fallen Telamon — giant stone figures that supported the Zeus temple, the ancient olive and almond trees between the ruins, and the view south toward Africa across the Mediterranean.`,
      },
    ],
  },

  // ── Lake Como ─────────────────────────────────────────
  bellagio: {
    name: "Bellagio, Lake Como",
    coords: { lat: 45.9878, lng: 9.2573 },
    radiusMeters: 600,
    stories: [
      {
        id: "como_villas",
        title: "Villas of the Rich and Famous",
        description: "From Roman senators to George Clooney — 2,000 years of lakeside luxury",
        prompt: `Narrate the history of Lake Como's legendary villas. Cover: Pliny the Younger's two villas in the 1st century AD, the 18th-century Villa Melzi with its Japanese garden, Villa Carlotta with its botanical collection, Villa del Balbianello (featured in Star Wars and James Bond), and George Clooney's Villa Oleandra in Laglio. Explain why this specific lake — deep, shielded by Alps, with a microclimate that grows olive trees and citrus — has attracted the elite for two millennia.`,
      },
      {
        id: "como_silk",
        title: "The Silk Capital of Europe",
        description: "How Lake Como clothed the world's fashion houses",
        prompt: `Tell the story of Como's silk industry. Cover: how mulberry trees and silkworms arrived from China via the Silk Road in the 15th century, how Como became the silk supplier to the great fashion houses — Hermès, Gucci, Versace, Louis Vuitton all source silk from Como, the hand-printing techniques still used today, and how at its peak the region produced 80% of Europe's silk. Mention the Silk Museum in Como that traces this 500-year history.`,
      },
    ],
  },
};

export function findNearbyLandmark(
  lat: number,
  lng: number
): { key: string; landmark: Landmark } | null {
  for (const [key, landmark] of Object.entries(LANDMARK_STORIES)) {
    const distance = getDistanceMeters(
      lat,
      lng,
      landmark.coords.lat,
      landmark.coords.lng
    );
    if (distance <= landmark.radiusMeters) {
      return { key, landmark };
    }
  }
  return null;
}

function getDistanceMeters(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
