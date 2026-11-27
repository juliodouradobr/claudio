export interface Block { id: string; name: string; min: number; emoji: string; tips: string }
// Cada bloco termina com 1 min de hidratação (já incluído na duração) -> total = 120 min
export const HYDRATION_SEC = 60;
export const BLOCKS: Block[] = [
  { id: 'warm', name: 'Aquecimento', min: 15, emoji: '🔥', tips: 'Trote leve, mobilidade de ombro/quadril, polichinelos e deslocamentos laterais.' },
  { id: 'shoot', name: 'Arremessos', min: 25, emoji: '🎯', tips: 'Lance livre, média distância e 3 pontos. Registre acertos/tentativas na aba!' },
  { id: 'drible', name: 'Drible e controle', min: 20, emoji: '🏀', tips: 'Drible baixo, cruzado, entre as pernas e atrás das costas. Cabeça erguida!' },
  { id: 'bandeja', name: 'Bandeja e finalização', min: 20, emoji: '🏃', tips: 'Bandejas com as duas mãos, contato e finalização em movimento.' },
  { id: 'jogo', name: 'Jogo / situação', min: 25, emoji: '⚔️', tips: '1x1, 2x2 ou jogo de situação: leitura, passe e tomada de decisão.' },
  { id: 'cond', name: 'Condicionamento', min: 15, emoji: '🫀', tips: 'Sprints, defesa em slide e escadinha. Termine forte e alongue.' },
];
export const TOTAL_MIN = BLOCKS.reduce((a, b) => a + b.min, 0);
