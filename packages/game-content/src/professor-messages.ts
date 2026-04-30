import type { ExponentProperty, GameEventType } from '@reino/game-core';
import { professorTipsByProperty } from './professor-tips';

export type ProfessorTone = 'praise' | 'combo' | 'coach' | 'warning' | 'celebrate' | 'neutral';

export interface ProfessorMessage {
  tone: ProfessorTone;
  text: string;
}

export interface ProfessorMessageInput {
  eventTypes: GameEventType[];
  combo: number;
  property: ExponentProperty;
  playerHp?: number;
  previousText?: string;
}

const messageBanks = {
  praise: [
    'Boa! Você aplicou a regra certa e enfraqueceu o inimigo.',
    'Excelente leitura dos expoentes. Continue nesse ritmo.',
    'Isso! A propriedade apareceu e você reconheceu o caminho.',
  ],
  combo: [
    'Sequência poderosa! Você está dominando a regra.',
    'Combo brilhante! O reino já sente sua evolução.',
    'Muito bem! Quando você encadeia acertos, a estratégia fica clara.',
  ],
  timeout: {
    multiplication: 'O tempo apertou. Na próxima, confirme bases iguais e some os expoentes.',
    division: 'O tempo apertou. Em divisão com bases iguais, subtraia os expoentes.',
    powerOfPower: 'O tempo apertou. Potência de potência multiplica os expoentes.',
    zeroExponent: 'O tempo apertou. Expoente zero leva a base não nula para 1.',
    negative: 'O tempo apertou. Expoente negativo pede o inverso da potência.',
    complex: 'O tempo apertou. Quebre a expressão em partes antes de responder.',
  },
  lowHp: [
    'Atenção ao HP. Use uma poção se precisar ganhar fôlego.',
    'Você ainda pode virar isso. Calma, observe a propriedade e escolha com cuidado.',
  ],
  item: [
    'Bom uso do recurso. Estratégia também faz parte da matemática.',
    'Ótima escolha! Um item no momento certo muda a batalha.',
  ],
  victory: {
    multiplication: [
      'Produto dominado! Você somou os expoentes como quem abre uma trilha na floresta.',
      'O Guardião da Floresta caiu porque você reconheceu bases iguais e juntou forças.',
      'Excelente! Na Floresta dos Produtos, somar expoentes virou instinto.',
    ],
    division: [
      'Divisão vencida! Você atravessou a caverna subtraindo expoentes com precisão.',
      'O Morcego Divisor perdeu força quando você separou as potências do jeito certo.',
      'Muito bem! Bases iguais na divisão pedem subtração, e você enxergou isso.',
    ],
    powerOfPower: [
      'Torre conquistada! Você multiplicou expoentes e subiu cada andar com segurança.',
      'O Fantasma da Torre não resistiu quando você transformou potência de potência em multiplicação.',
      'Regra alta, raciocínio firme: potência de potência agora é sua aliada.',
    ],
    zeroExponent: [
      'Deserto superado! Você lembrou que expoente zero transforma a base em 1.',
      'O Escorpião do Zero perdeu o veneno quando você reconheceu o poder do 1.',
      'Perfeito! No deserto, qualquer base não nula elevada a zero encontra unidade.',
    ],
    negative: [
      'Abismo vencido! Expoente negativo virou inverso, e você saiu da escuridão.',
      'O Demônio Negativo recuou quando você inverteu a potência sem medo.',
      'Muito forte! Você entendeu que negativo no expoente pede mudança de posição.',
    ],
    complex: [
      'Trono do Caos conquistado! Você resolveu por partes e organizou a mistura.',
      'O Rei do Caos caiu porque você separou produto, divisão e simplificação com calma.',
      'Domínio completo! Quando tudo se mistura, você já sabe quebrar o problema em etapas.',
    ],
  },
  gameOver: [
    'Não foi derrota, foi treino. Volte com calma e ataque a regra por partes.',
    'Cada tentativa revela onde ajustar. Vamos tentar novamente.',
  ],
} as const;

export function getProfessorMessage(input: ProfessorMessageInput): ProfessorMessage {
  if (input.eventTypes.includes('GAME_OVER')) return choose('coach', messageBanks.gameOver, input.previousText);
  if (input.eventTypes.includes('LEVEL_COMPLETE') || input.eventTypes.includes('GAME_COMPLETED')) {
    return choose('celebrate', messageBanks.victory[input.property], input.previousText);
  }
  if (input.playerHp !== undefined && input.playerHp <= 25) return choose('warning', messageBanks.lowHp, input.previousText);
  if (input.eventTypes.includes('TIMEOUT')) return { tone: 'coach', text: messageBanks.timeout[input.property] };
  if (input.eventTypes.includes('ANSWER_WRONG')) {
    return choose('coach', [`Quase! ${professorTipsByProperty[input.property]}`, 'Errar faz parte. Releia a expressão e resolva por etapas.'], input.previousText);
  }
  if (input.eventTypes.includes('ANSWER_CORRECT') && input.combo >= 3) return choose('combo', messageBanks.combo, input.previousText);
  if (input.eventTypes.includes('ANSWER_CORRECT')) return choose('praise', messageBanks.praise, input.previousText);
  return { tone: 'neutral', text: `Dica: ${professorTipsByProperty[input.property]}` };
}

function choose(tone: ProfessorTone, messages: readonly string[], previousText?: string): ProfessorMessage {
  const selected = messages.find((message) => message !== previousText) ?? messages[0];
  return { tone, text: selected };
}
