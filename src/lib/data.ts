
import type { Participant, Criterion } from './types';


const placeholderDescription =
  'Lorem ipsum dolor sit amet, consectetur adipiscing elit. La descripción del participante se actualizará cuando tengamos más información.';

const participant = (
  id: string,
  name: string,
  eventType: Participant['eventType'],
  category?: Participant['category']
): Participant => ({
  id: `2026-${id}`,
  name,
  description: `Presentación de ${eventType.toLowerCase()}.`,
  longDescription: placeholderDescription,
  photoUrl: '/images/participant-placeholder.svg',
  ...(category ? { category } : {}),
  eventType,
});

export const participants: Participant[] = [
  // Canto - Categoría A
  participant('01', 'Oriana Sánchez Yanci', 'Canto', 'A'),
  participant('02', 'Thiago Santodomingo', 'Canto', 'A'),
  participant('03', 'Andrea Sofía Villegas Bandera', 'Canto', 'A'),
  participant('04', 'Jean Pierre Rodríguez Mendoza', 'Canto', 'A'),
  participant('05', 'Eileen Sofía Chinchilla Muñoz', 'Canto', 'A'),
  participant('06', 'Ana Ruiz (con agrupación musical)', 'Canto', 'A'),
  participant('07', 'Jaime Vilarete', 'Canto', 'A'),
  participant('08', 'Vivian Sofía Barreto Brito', 'Canto', 'A'),
  participant('09', 'Andrea Mishell Pacheco Fontalvo', 'Canto', 'A'),
  // Canto - Categoría B
  participant('10', 'Alexandra Sofía Atencio Rozo Alejandrino', 'Canto', 'B'),
  participant('11', 'Lin JFC (Jhodelin Castro)', 'Canto', 'B'),
  participant('12', 'Valeria Isabel Carrillo Montaño', 'Canto', 'B'),
  participant('13', 'Camila Velásquez', 'Canto', 'B'),
  participant('14', 'Grupo 20 Latidos', 'Canto', 'B'),
  participant('15', 'Eliana Campo Robles', 'Canto', 'B'),
  participant('16', 'Leomarys Monasterio', 'Canto', 'B'),
  participant('17', 'Michell Velásquez', 'Canto', 'B'),
  participant('18', 'Isabella González Torres', 'Canto', 'B'),
  participant('19', 'Klisdenis Roca', 'Canto', 'B'),
  participant('20', 'Cesar Alfaro', 'Canto', 'B'),
  participant('21', 'Zoe Bornachera Cuello', 'Canto', 'B'),
  participant('22', 'Angélica Julio y Ruth Olasvoaga', 'Canto', 'B'),
  participant('23', 'Adara Liz Estrada Meza', 'Canto', 'B'),
  participant('24', 'Luisa Fernanda Redondo López', 'Canto', 'B'),
  participant('25', 'Arianna Rodríguez y Gabriela Guzmán', 'Canto', 'B'),
  // Baile - el documento no asigna categorías
  participant('26', 'Grupo Pequeños con Ritmo', 'Baile'),
  participant('27', 'Comparsa Sueños de Mar Infantil', 'Baile'),
  participant('28', 'ML K-Pop', 'Baile'),
  participant('29', 'Grupo Folclórico Dariásta', 'Baile'),
  participant('30', 'Ismag Fuerza Tamborera', 'Baile'),
  participant('31', 'Jailis Polo (Ruth Olazcoaga)', 'Baile'),
  participant('32', 'Dumbira', 'Baile'),
  participant('33', 'Comparsa Juvenil Sueños de Mar', 'Baile'),
  participant('34', 'Body & Soul', 'Baile'),
  participant('35', 'Elite Style', 'Baile'),
  participant('36', 'Divino Señor', 'Baile'),
];

export const cantoCriteria: Criterion[] = [
  {
    id: 'expression',
    name: 'Expresión e interpretación',
    description: 'Capacidad de transmitir emociones y conectar con la audiencia.',
    weight: 30,
  },
  {
    id: 'tuning',
    name: 'Afinación y ritmo',
    description: 'Precisión en la entonación y sincronía con la música.',
    weight: 25,
  },
  {
    id: 'diction',
    name: 'Dicción y claridad',
    description: 'Claridad en la pronunciación y articulación de las palabras.',
    weight: 15,
  },
  {
    id: 'stage_presence',
    name: 'Presencia escénica',
    description: 'Confianza, carisma y desenvolvimiento en el escenario.',
    weight: 20,
  },
  {
    id: 'originality',
    name: 'Originalidad',
    description: 'Propuesta única y creativa en la interpretación.',
    weight: 10,
  },
];

export const baileCriteria: Criterion[] = [
  {
    id: 'technique',
    name: 'Técnica',
    description: 'Ejecución precisa y limpia de los movimientos.',
    weight: 20,
  },
  {
    id: 'rhythm',
    name: 'Ritmo y musicalidad',
    description: 'Sincronización con la música y la interpretación del ritmo.',
    weight: 15,
  },
  {
    id: 'coordination',
    name: 'Coordinación y sincronía',
    description: 'Uniformidad y precisión en los movimientos grupales.',
    weight: 15,
  },
  {
    id: 'body_expression',
    name: 'Expresión corporal y emocional',
    description: 'Capacidad de comunicar emociones a través del movimiento.',
    weight: 15,
  },
  {
    id: 'costume',
    name: 'Vestuario y presencia escénica',
    description: 'Adecuación y creatividad del vestuario y la puesta en escena.',
    weight: 10,
  },
  {
    id: 'creativity',
    name: 'Originalidad y creatividad',
    description: 'Propuesta coreográfica innovadora y única.',
    weight: 15,
  },
  {
    id: 'difficulty',
    name: 'Dificultad de la coreografía',
    description: 'Complejidad y exigencia técnica de la coreografía.',
    weight: 10,
  },
];
