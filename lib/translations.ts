const translations: Record<string, Record<string, string>> = {
  // --- tour/page.tsx ---
  guide_on: { en: "Guide ON", es: "Guía ON" },
  guide: { en: "Guide", es: "Guía" },
  exit: { en: "Exit", es: "Salir" },
  generating: { en: "Generating...", es: "Generando..." },
  show_in_heyday: { en: "Show in its Heyday", es: "Ver en su Apogeo" },
  era_auto: { en: "Best era (auto)", es: "Mejor época (auto)" },
  era_ancient: { en: "Ancient (~100 AD)", es: "Antiguo (~100 d.C.)" },
  era_medieval: { en: "Medieval (~1200)", es: "Medieval (~1200)" },
  era_renaissance: { en: "Renaissance (~1500)", es: "Renacimiento (~1500)" },
  era_victorian: { en: "Victorian (~1880)", es: "Victoriano (~1880)" },
  era_midcentury: { en: "Mid-century (~1950)", es: "Mediados del s. XX (~1950)" },
  discovering: { en: "Discovering...", es: "Descubriendo..." },
  watch_the_story: { en: "Watch the Story", es: "Ver la Historia" },
  tap_anywhere: { en: "Tap anywhere to get commentary", es: "Toca en cualquier lugar para obtener comentarios" },
  generating_story: { en: "Generating your story...", es: "Generando tu historia..." },
  creating_scenes: { en: "Creating scenes & narration", es: "Creando escenas y narración" },
  show_commentary: { en: "Show Commentary", es: "Ver Comentarios" },

  // --- CommentaryPanel.tsx ---
  tour_commentary: { en: "Tour Commentary", es: "Comentarios del Tour" },
  new_location: { en: "New Location 📍", es: "Nueva Ubicación 📍" },
  tts_on: { en: "🔊 TTS On", es: "🔊 TTS On" },
  tts_off: { en: "🔇 TTS Off", es: "🔇 TTS Off" },
  point_camera: { en: "Point your camera and tap", es: "Apunta tu cámara y toca" },
  or_ask_below: { en: "or ask a question below", es: "o haz una pregunta abajo" },
  tell_surprising: { en: "Tell me something surprising", es: "Cuéntame algo sorprendente" },
  what_look_for: { en: "What should I look for here?", es: "¿Qué debo buscar aquí?" },
  hidden_details: { en: "Any hidden details nearby?", es: "¿Algún detalle oculto cerca?" },
  ask_placeholder: { en: "Ask a question...", es: "Haz una pregunta..." },
  close_panel: { en: "Close panel", es: "Cerrar panel" },

  // --- HeyDayModal.tsx ---
  then_vs_now: { en: "Then vs Now", es: "Antes vs Ahora" },
  today: { en: "Today", es: "Hoy" },
  in_its_heyday: { en: "In Its Heyday", es: "En su Apogeo" },
  close: { en: "Close", es: "Cerrar" },
  download_historical: { en: "Download Historical Image", es: "Descargar Imagen Histórica" },
  alt_current_view: { en: "Current view", es: "Vista actual" },
  alt_historical: { en: "Historical reconstruction", es: "Reconstrucción histórica" },

  // --- StoryPlayer.tsx ---
  play: { en: "\u25b6 Play", es: "\u25b6 Reproducir" },
  pause: { en: "\u23f8 Pause", es: "\u23f8 Pausa" },
  share: { en: "Share", es: "Compartir" },
  generating_audio: { en: "Generating audio...", es: "Generando audio..." },
  alt_scene: { en: "Scene", es: "Escena" },

  // --- StorySelector.tsx ---
  choose_story: { en: "Choose a story to watch", es: "Elige una historia para ver" },
  request_custom: { en: "Request a Custom Story", es: "Solicitar Historia Personalizada" },
  go: { en: "Go", es: "Ir" },
  custom_placeholder: { en: 'e.g. "What did Romans smell like?"', es: 'ej. "¿Cómo olían los romanos?"' },

  // --- WalkingTour.tsx ---
  walking_tour: { en: "Walking Tour", es: "Tour a Pie" },
  you_are_here: { en: "You are here", es: "Estás aquí" },
  min: { en: "min", es: "min" },
  landmarks_nearby: { en: "{count} landmarks nearby", es: "{count} puntos de interés cerca" },
  landmark_nearby: { en: "{count} landmark nearby", es: "{count} punto de interés cerca" },
  stories_count: { en: "{count} stories", es: "{count} historias" },
  story_count: { en: "{count} story", es: "{count} historia" },

  // --- LocationBadge.tsx ---
  gps_unavailable: { en: "GPS unavailable", es: "GPS no disponible" },
  getting_location: { en: "Getting location...", es: "Obteniendo ubicación..." },
  set: { en: "Set", es: "Fijar" },
  cancel: { en: "Cancel", es: "Cancelar" },
  click_to_set: { en: "Click to manually set coordinates", es: "Haz clic para fijar coordenadas manualmente" },

  // --- CameraView.tsx ---
  camera_required: { en: "Camera Access Required", es: "Acceso a Cámara Requerido" },
  camera_description: {
    en: "Please allow camera access in your browser settings to use the tour guide. On iOS, go to Settings > Safari > Camera.",
    es: "Por favor, permite el acceso a la cámara en la configuración de tu navegador para usar el guía turístico. En iOS, ve a Ajustes > Safari > Cámara.",
  },
  capture_frame: { en: "Capture frame", es: "Capturar imagen" },

  // --- Landmark names ---
  "lm:colosseum": { es: "El Coliseo" },
  "lm:roman_forum": { es: "El Foro Romano" },
  "lm:palatine_hill": { es: "El Monte Palatino" },
  "lm:pompeii": { es: "Pompeya" },
  "lm:vatican_museums": { es: "Museos Vaticanos y Capilla Sixtina" },
  "lm:pantheon": { es: "El Panteón" },
  "lm:trevi_fountain": { es: "Fontana de Trevi" },
  "lm:florence_duomo": { es: "Catedral de Florencia y Cúpula de Brunelleschi" },
  "lm:uffizi": { es: "La Galería Uffizi" },
  "lm:accademia_david": { es: "Galleria dell'Accademia — David" },
  "lm:ponte_vecchio": { es: "Ponte Vecchio" },
  "lm:st_marks_basilica": { es: "Basílica de San Marcos y Plaza" },
  "lm:rialto_bridge": { es: "Puente de Rialto" },
  "lm:leaning_tower_pisa": { es: "Torre Inclinada y Catedral de Pisa" },
  "lm:duomo_milano": { es: "Duomo de Milán" },
  "lm:cinque_terre": { es: "Cinque Terre — Riomaggiore" },
  "lm:amalfi_coast": { es: "Costa Amalfitana" },
  "lm:herculaneum": { es: "Herculano" },
  "lm:valley_of_temples": { es: "Valle de los Templos" },
  "lm:bellagio": { es: "Bellagio, Lago de Como" },

  // --- Story titles (keyed by chapter id) ---
  "story:construction:title": { es: "La Construcción del Coliseo" },
  "story:construction:desc": { es: "Cómo 100.000 trabajadores lo construyeron en solo 8 años" },
  "story:gladiators:title": { es: "Vida de un Gladiador" },
  "story:gladiators:desc": { es: "Entrenamiento, combate y la brutal realidad de la arena" },
  "story:beasts:title": { es: "Bestias de la Arena" },
  "story:beasts:desc": { es: "Leones, elefantes, rinocerontes — y los hombres que los enfrentaron" },
  "story:naval:title": { es: "Batallas Navales en la Arena" },
  "story:naval:desc": { es: "Cuando el Coliseo se inundaba para simulacros de guerra naval" },

  "story:daily_life:title": { es: "Un Día en el Foro" },
  "story:daily_life:desc": { es: "Mercaderes, políticos y chismes en el centro de la antigua Roma" },
  "story:caesar:title": { es: "Los Idus de Marzo" },
  "story:caesar:desc": { es: "El asesinato de César y lo que pasó después" },

  "story:romulus:title": { es: "Rómulo y Remo" },
  "story:romulus:desc": { es: "El mito fundacional de Roma — lobos, gemelos y fratricidio" },
  "story:emperors:title": { es: "El Palacio de los Emperadores" },
  "story:emperors:desc": { es: "Cómo el Monte Palatino se convirtió en la dirección más exclusiva de la historia" },

  "story:eruption:title": { es: "El Último Día de Pompeya" },
  "story:eruption:desc": { es: "24 de agosto, 79 d.C. — hora por hora" },
  "story:daily_life_pompeii:title": { es: "Lo que Pompeya Desayunaba" },
  "story:daily_life_pompeii:desc": { es: "La sorprendentemente moderna vida cotidiana congelada en el tiempo" },

  "story:sistine_ceiling:title": { es: "Pintando el Techo de la Sixtina" },
  "story:sistine_ceiling:desc": { es: "Los 4 años de calvario de Miguel Ángel en andamios a 20 metros de altura" },
  "story:vatican_treasures:title": { es: "Tesoros del Vaticano" },
  "story:vatican_treasures:desc": { es: "2.000 años de arte en 7 km de pasillos" },
  "story:last_judgment:title": { es: "El Escándalo del Juicio Final" },
  "story:last_judgment:desc": { es: "La venganza de Miguel Ángel pintada en la pared del altar" },

  "story:pantheon_dome:title": { es: "La Cúpula Imposible" },
  "story:pantheon_dome:desc": { es: "La cúpula de hormigón sin refuerzo más grande del mundo tras 2.000 años" },
  "story:pantheon_gods_to_church:title": { es: "De los Dioses a Dios" },
  "story:pantheon_gods_to_church:desc": { es: "Cómo un templo pagano se convirtió en el edificio antiguo mejor conservado de Roma" },

  "story:trevi_aqueduct:title": { es: "El Acueducto de la Virgen" },
  "story:trevi_aqueduct:desc": { es: "Un suministro de agua de 2.000 años y la fuente que alimenta" },
  "story:trevi_cinema:title": { es: "Trevi en el Cine" },
  "story:trevi_cinema:desc": { es: "De La Dolce Vita a Vacaciones en Roma" },

  "story:brunelleschi_dome:title": { es: "La Cúpula Imposible de Brunelleschi" },
  "story:brunelleschi_dome:desc": { es: "El mayor enigma de ingeniería del Renacimiento" },
  "story:florence_baptistery:title": { es: "Las Puertas del Paraíso" },
  "story:florence_baptistery:desc": { es: "Las puertas de bronce de Ghiberti que Miguel Ángel bautizó" },

  "story:medici_collection:title": { es: "El Imperio Artístico de los Médici" },
  "story:medici_collection:desc": { es: "Cómo una familia de banqueros creó la mayor colección de arte del mundo" },
  "story:birth_of_venus:title": { es: "El Nacimiento de Venus de Botticelli" },
  "story:birth_of_venus:desc": { es: "La pintura que definió la belleza renacentista" },

  "story:david_creation:title": { es: "Tallando al David de un Bloque Arruinado" },
  "story:david_creation:desc": { es: "El bloque de mármol que dos escultores abandonaron antes de Miguel Ángel" },
  "story:david_symbol:title": { es: "David: Símbolo de Florencia" },
  "story:david_symbol:desc": { es: "Por qué un héroe bíblico se convirtió en un arma política" },

  "story:ponte_vecchio_history:title": { es: "Puente de Carniceros y Orfebres" },
  "story:ponte_vecchio_history:desc": { es: "Cómo un mercado medieval de carne se convirtió en una hilera de joyerías" },
  "story:vasari_corridor:title": { es: "El Corredor Secreto" },
  "story:vasari_corridor:desc": { es: "El pasadizo privado de los Médici de palacio a palacio" },

  "story:stolen_saint:title": { es: "El Santo Robado" },
  "story:stolen_saint:desc": { es: "Cómo mercaderes venecianos sacaron el cuerpo de San Marcos de Egipto" },
  "story:venice_flooding:title": { es: "Venecia contra el Mar" },
  "story:venice_flooding:desc": { es: "Mil años luchando contra la marea creciente" },
  "story:doges_palace:title": { es: "Secretos del Palacio Ducal" },
  "story:doges_palace:desc": { es: "El Puente de los Suspiros, prisiones secretas y escaleras doradas" },

  "story:rialto_history:title": { es: "El Puente que Tardó 400 Años" },
  "story:rialto_history:desc": { es: "De puente levadizo de madera a icono de piedra" },
  "story:venice_trade:title": { es: "Venecia: Mercado del Mundo" },
  "story:venice_trade:desc": { es: "Cómo el Rialto se convirtió en el Wall Street de Europa" },

  "story:pisa_lean:title": { es: "Por Qué Se Inclina (Y Por Qué No Se Ha Caído)" },
  "story:pisa_lean:desc": { es: "800 años de desastres y rescates de ingeniería" },
  "story:galileo_pisa:title": { es: "El Experimento de Galileo" },
  "story:galileo_pisa:desc": { es: "¿Realmente dejó caer bolas desde la torre?" },
  "story:pisa_campo:title": { es: "El Campo de los Milagros" },
  "story:pisa_campo:desc": { es: "Cuatro obras maestras en un solo césped sagrado" },

  "story:milan_cathedral:title": { es: "600 Años para Construir una Catedral" },
  "story:milan_cathedral:desc": { es: "La catedral gótica más grande del mundo — y su interminable construcción" },
  "story:milan_rooftop:title": { es: "Un Bosque de Agujas" },
  "story:milan_rooftop:desc": { es: "Caminando por el tejado entre 3.400 estatuas" },

  "story:cinque_terre_villages:title": { es: "Cinco Pueblos al Borde" },
  "story:cinque_terre_villages:desc": { es: "Cómo los pescadores construyeron un paraíso en acantilados imposibles" },
  "story:cinque_terre_wine:title": { es: "El Vino Más Difícil del Mundo" },
  "story:cinque_terre_wine:desc": { es: "Viñedos en acantilados de 45 grados cosechados enteramente a mano" },

  "story:amalfi_republic:title": { es: "La República Marítima Olvidada" },
  "story:amalfi_republic:desc": { es: "Cuando la pequeña Amalfi rivalizaba con Venecia y Génova" },
  "story:path_of_gods:title": { es: "El Sendero de los Dioses" },
  "story:path_of_gods:desc": { es: "Un antiguo camino a 500 metros sobre el Mediterráneo" },

  "story:herculaneum_preserved:title": { es: "Mejor que Pompeya" },
  "story:herculaneum_preserved:desc": { es: "La ciudad tan bien conservada que se puede ver la veta de la madera" },
  "story:herculaneum_scrolls:title": { es: "Leyendo Pergaminos Quemados con IA" },
  "story:herculaneum_scrolls:desc": { es: "Cómo la tecnología moderna está descifrando una biblioteca de 2.000 años" },

  "story:agrigento_greek:title": { es: "La Edad de Oro Griega de Sicilia" },
  "story:agrigento_greek:desc": { es: "Cuando Agrigento era más rica que Atenas" },
  "story:agrigento_temple_walk:title": { es: "Caminando por la Cresta Sagrada" },
  "story:agrigento_temple_walk:desc": { es: "Siete templos a lo largo de una cresta de 2.500 años con vistas al mar" },

  "story:como_villas:title": { es: "Villas de los Ricos y Famosos" },
  "story:como_villas:desc": { es: "De senadores romanos a George Clooney — 2.000 años de lujo junto al lago" },
  "story:como_silk:title": { es: "La Capital de la Seda de Europa" },
  "story:como_silk:desc": { es: "Cómo el Lago de Como vistió a las casas de moda del mundo" },
};

export function t(key: string, lang: string): string {
  return translations[key]?.[lang] ?? translations[key]?.en ?? key;
}

/** Translate data-driven content (story titles, descriptions, landmark names).
 *  Returns the translation if available, otherwise the original fallback text. */
export function tContent(key: string, lang: string, fallback: string): string {
  if (lang === "en") return fallback;
  return translations[key]?.[lang] ?? fallback;
}

export function t_dynamic(
  key: string,
  lang: string,
  replacements: Record<string, string | number>
): string {
  let result = t(key, lang);
  for (const [k, v] of Object.entries(replacements)) {
    result = result.replace(`{${k}}`, String(v));
  }
  return result;
}
