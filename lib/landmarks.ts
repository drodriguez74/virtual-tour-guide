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
