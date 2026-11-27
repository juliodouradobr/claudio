import { Personality } from '../types';
import { dayOfYear } from '../utils/date';

type Pool = Record<Personality, string[]>;
// {nome} é trocado pelo nome. "zoeiro" = amigo zoeiro (padrão), "durao" = treinador durão, "calmo" = calmo e motivador (também usado se "mensagens engraçadas" estiver desligado)
export const MESSAGES: Record<string, Pool> = {
  madrugada: {
    zoeiro: ['Abrindo o aplicativo essa hora, {nome}? 👀 Vai dormir que amanhã tem treino!', 'Coruja detectada 🦉 O sono também faz parte do treino.'],
    durao: ['{nome}, madrugada não é hora de app. Dormir é treino também. Vai pra cama!', 'Descanso é parte do jogo. Desliga a tela e recupera.'],
    calmo: ['Está tarde, {nome}. Seu corpo cresce e se recupera dormindo 🌙', 'Um bom sono hoje é energia amanhã. Descanse.'],
  },
  manhaCedo: {
    zoeiro: ['Acordou cedo, hein! Pegou o fone? 🎧', 'Bom dia, campeão! Bora pra escola.'],
    durao: ['De pé, {nome}! Fone, mochila e vamos. Sem enrolar!', 'Dia começando. Foco e disciplina desde cedo.'],
    calmo: ['Bom dia, {nome}. Respire fundo e tenha um ótimo dia 🌅', 'Conferiu a mochila e o fone? Tudo certo pra hoje.'],
  },
  manha: {
    zoeiro: ['Bom dia, {nome}! Hoje é dia de evoluir 💪', 'Manhã livre, energia lá em cima. Bora marcar uns pontos!'],
    durao: ['Bom dia, {nome}. Hoje você supera o de ontem.', 'Sem desculpa hoje. Vamos pra cima!'],
    calmo: ['Bom dia, {nome}! Um passo de cada vez, hoje vai ser bom 🌿', 'Comece leve e vá ganhando ritmo.'],
  },
  quase13: {
    zoeiro: ['Falta pouco pro basquete! Já tá com a bola aí? 🏀', 'Prepara a bola e a água! Já já é hora do jogo.'],
    durao: ['Quase 13h. Bola, água e tênis amarrado. Pontualidade!', 'Daqui a pouco é quadra. Esquenta a cabeça.'],
    calmo: ['Quase hora do treino. Hidrate-se e se prepare com calma 💧', 'Daqui a pouco, basquete. Respire e se organize.'],
  },
  tarde: {
    zoeiro: ['Treinando agora, {nome}? 🔥', 'Hora do basquete! Cadê você?'],
    durao: ['É hora de treino, {nome}. Quadra te espera!', 'Treino não se faz sozinho. Bora!'],
    calmo: ['Boa tarde, {nome}. Que tal começar o treino agora?', 'Quando estiver pronto, a quadra está esperando 🏀'],
  },
  noite: {
    zoeiro: ['Boa noite! Já fez os exercícios de hoje?', 'Noite chegou! Falta algo na lista de hoje?'],
    durao: ['Fim de dia. Cumpriu tudo? Se não, ainda dá tempo!', 'Confere a lista: tarefa pendente não se resolve sozinha.'],
    calmo: ['Boa noite, {nome}. Como foi o dia? Ainda dá tempo de fechar a lista 🌙', 'Vamos fechar o dia com calma.'],
  },
  tardeNoite: {
    zoeiro: ['Fone carregando? 🔌 Amanhã tem aula!', 'Hora de desacelerar, {nome}.'],
    durao: ['Fone no carregador, mochila pronta, cama. Nessa ordem.', 'Hora de recuperar. Dormir bem é obrigação do atleta.'],
    calmo: ['Hora de desacelerar, {nome}. Fone carregando e cama 😴', 'Respire fundo e feche o dia.'],
  },
  startWorkout: {
    zoeiro: ['Bora, {nome}! Hoje você vai voar 🚀', 'Partiu treino! O {nome} de ontem tá com inveja.'],
    durao: ['Começou, não para! Foco total, {nome}!', 'Cada repetição conta. Vamos!'],
    calmo: ['Vamos com calma e boa postura, {nome}. Você consegue 🌿', 'Comece no seu ritmo. O importante é começar.'],
  },
  basketHalf: {
    zoeiro: ['Metade do treino feito! Bebe uma água 💧', 'Já passou da metade! Hidrata e segue.'],
    durao: ['Metade! Segura o ritmo, ainda tem muito jogo.', 'Metade feita. A outra metade define o campeão.'],
    calmo: ['Metade concluída, ótimo trabalho! Beba água 💧', 'Você está na metade. Respire e continue.'],
  },
  basketLast10: {
    zoeiro: ['Últimos 10 minutos, não para agora!', 'Reta final, {nome}! Capricha!'],
    durao: ['10 minutos! É agora que se separa os fortes!', 'Final do treino: dá tudo que sobrou!'],
    calmo: ['Faltam só 10 minutos. Você está indo muito bem.', 'Reta final tranquila. Quase lá!'],
  },
  runLap: {
    zoeiro: ['Volta {n} de {t}! Já passou da metade 🏃', 'Volta {n} de {t}! Segue o baile.'],
    durao: ['Volta {n} de {t}. Mantém o ritmo!', 'Volta {n}. Não afrouxa!'],
    calmo: ['Volta {n} de {t}. Respiração firme, ritmo constante.', 'Boa! Volta {n} concluída.'],
  },
  runFirst: {
    zoeiro: ['Primeira volta feita! Vamo que vamo 🏃', 'Largada boa, {nome}!'],
    durao: ['Primeira volta. Agora acelera!', 'Largou. Mantém!'],
    calmo: ['Primeira volta concluída. Ótimo começo.', 'Bom início, siga no seu ritmo.'],
  },
  runLast: {
    zoeiro: ['ÚLTIMA VOLTA! Dá tudo!', 'Última volta, {nome}! Joga tudo na pista!'],
    durao: ['ÚLTIMA VOLTA! SEM FREAR!', 'Última! Esvazia o tanque!'],
    calmo: ['Última volta. Você consegue, finalize com força.', 'Quase lá. Última volta!'],
  },
  runFaster: {
    zoeiro: ['Mais rápido que a última! Tá voando 🔥', 'Essa volta foi mais rápida! Turbo ligado ⚡'],
    durao: ['Mais rápido! É assim que se evolui.', 'Tempo melhor. Continua!'],
    calmo: ['Você foi mais rápido que a volta anterior. Parabéns!', 'Que evolução bonita nessa volta.'],
  },
  shotsCold: {
    zoeiro: ['Respira, ajusta o braço e tenta de novo. Até o Curry erra 😉', 'Sequência ruim acontece! Reseta e arremessa de novo.'],
    durao: ['Errou? Ajusta o cotovelo e finaliza com o pulso. De novo!', 'Erro faz parte. Volta pra mecânica.'],
    calmo: ['Respire, ajuste o braço e tente de novo. Todo mundo erra.', 'Sem pressa. Foco na forma, o resultado vem.'],
  },
  shotsHot: {
    zoeiro: ['Tá pegando fogo! 🔥🔥🔥', 'Mão quente! Não esfria agora 🔥'],
    durao: ['Sequência boa! Mantém a mecânica!', 'Acertando! Não relaxa agora!'],
    calmo: ['Que sequência bonita! Continue assim.', 'Ótimo arremesso, mantenha a calma.'],
  },
  workoutDone: {
    zoeiro: ['MONSTRO! Mais um dia cumprido 🏆', 'Treino concluído! {nome} tá imparável 😎'],
    durao: ['Treino cumprido. É assim que se constrói um atleta!', 'Missão cumprida. Amanhã tem mais.'],
    calmo: ['Treino concluído, muito bem, {nome}! Descanse e hidrate-se 💧', 'Parabéns pelo esforço de hoje.'],
  },
  record: {
    zoeiro: ['NOVO RECORDE, {nome}! 🎉', 'RECORDE QUEBRADO! Quem para o {nome}? 🎉'],
    durao: ['NOVO RECORDE! Agora supere ele!', 'Recorde! Isso é evolução real.'],
    calmo: ['Novo recorde pessoal! Parabéns pela evolução 🎉', 'Você se superou, {nome}.'],
  },
  streakHigh: {
    zoeiro: ['{n} dias seguidos! Ninguém te para 🔥', '{n} dias de fogo! Não deixa a chama apagar 🔥'],
    durao: ['{n} dias seguidos. Disciplina é isso!', '{n} dias. Não vai quebrar agora!'],
    calmo: ['{n} dias seguidos! Que constância linda 🌟', 'Sequência de {n} dias, parabéns.'],
  },
  skipped: {
    zoeiro: ['Ontem não rolou, mas hoje é um novo dia. Bora voltar?', 'Ontem passou, hoje é página nova. Vamo?'],
    durao: ['Ontem ficou pra trás. Hoje a gente recupera, {nome}!', 'Um dia perdido não define nada. Volta hoje!'],
    calmo: ['Ontem não deu, tudo bem. Hoje recomeçamos com calma.', 'Sem culpa. Hoje é um novo dia 🌿'],
  },
  basketLate: {
    zoeiro: ['Ei, {nome}… o treino de basquete já começou e você ainda não apareceu 👀', 'Cadê a bola, {nome}? O treino das 13h tá te esperando 🏀'],
    durao: ['{nome}, o treino já começou! Bora pra quadra agora!', 'Passou do horário. Ainda dá tempo, mas vai já!'],
    calmo: ['O treino de basquete já começou, {nome}. Quando puder, comece 🏀', 'Ainda dá tempo de treinar hoje. Que tal agora?'],
  },
  missed: {
    zoeiro: ['Sumiu, hein? Tava com saudade 😢 Bora retomar?', 'O {nome} sumiu! A quadra tá com saudade 🏀'],
    durao: ['{nome}, faz dias que você não aparece. Volta ao jogo hoje!', 'Retomar é o primeiro passo. Vamos!'],
    calmo: ['Faz um tempinho, {nome}. Sem pressão, vamos retomar aos poucos?', 'Que bom te ver de novo! Recomeçar é ótimo.'],
  },
  birthday: {
    zoeiro: ['Feliz aniversário, {nome}! 🎂 Hoje o treino é opcional… ou não? 😏', 'PARABÉNS, {nome}! 🎂 Hoje até a bola canta parabéns.'],
    durao: ['Feliz aniversário, {nome}! 🎂 Hoje você ganha folga… de dez minutos.', 'Parabéns, atleta! 🎂 Um presente: faça um treino leve.'],
    calmo: ['Feliz aniversário, {nome}! 🎂 Aproveite o seu dia com carinho.', 'Parabéns! Que seu novo ano seja cheio de conquistas 🎉'],
  },
  friday: {
    zoeiro: ['Sextou! Fecha a semana com chave de ouro 💪', 'Sextou, {nome}! Último gás da semana 🔥'],
    durao: ['Sexta. Fecha a semana sem afrouxar!', 'Último dia útil: termina o que começou.'],
    calmo: ['Sexta-feira! Feche a semana com tranquilidade e orgulho 🌟', 'Quase fim de semana, ótimo trabalho até aqui.'],
  },
  sunday: {
    zoeiro: ['Domingo é dia de descanso também. Mas uns arremessos não fazem mal 🏀', 'Domingão! Descansa, mas se der vontade, a bola tá ali.'],
    durao: ['Domingo é descanso — mas campeão sempre faz um arremessinho.', 'Recupere o corpo e planeje a semana.'],
    calmo: ['Domingo: dia de descansar. Alguns arremessos leves são bem-vindos 🏀', 'Recarregue as energias para a semana.'],
  },
  water: {
    zoeiro: ['Hora da aguinha, {nome}! 💧', 'Hidratação check! Bebe um copo aí 💧'],
    durao: ['Beba água agora. Atleta hidratado rende mais.', 'Um copo d’água. Já!'],
    calmo: ['Que tal um copo d’água agora? 💧', 'Lembrete gentil: hidrate-se.'],
  },
  bed: {
    zoeiro: ['Hora de dormir, {nome}! 😴 Amanhã tem mais treino.', 'Cama! O músculo cresce enquanto você dorme 😴'],
    durao: ['Hora de dormir. Recuperação é treino.', 'Desliga tudo e vai dormir, {nome}.'],
    calmo: ['Está na hora de descansar, {nome}. Boa noite 🌙', 'Hora de dormir bem para ter energia amanhã.'],
  },
  fone: {
    zoeiro: ['Coloque o fone para carregar 🎧', 'Fone no carregador, {nome}! 🔌'],
    durao: ['Fone no carregador. Agora.', 'Prepara a mochila e o fone. Nada de esquecer!'],
    calmo: ['Hora de colocar o fone para carregar 🎧', 'Lembrete: fone carregando para amanhã.'],
  },
  foneManha: {
    zoeiro: ['Pegou o fone? 🎧', 'Fone, mochila, garrafa… tudo no bolso?'],
    durao: ['Fone e mochila conferidos? Sai logo!', 'Checa a mochila antes de sair.'],
    calmo: ['Pegou o fone antes de sair? 🎧', 'Confira a mochila com calma.'],
  },
  basketPre: {
    zoeiro: ['Prepare a bola e a água! 🏀 Treino às 13:00', 'Falta 15 min pro basquete! Bola e água prontas?'],
    durao: ['15 minutos pro treino. Bola, água, tênis. Vai!', 'Se prepare agora. Treino às 13h em ponto!'],
    calmo: ['Prepare a bola e a água. Treino em 15 minutos 🏀', 'Quase hora do basquete. Comece a se preparar.'],
  },
  basketNow: {
    zoeiro: ['🏀 Hora do basquete, {nome}! Bora pra quadra!', 'São 13h! Cadê o craque? 🏀'],
    durao: ['13h. Quadra. Agora!', 'Hora do treino! Sem atrasar.'],
    calmo: ['É hora do treino de basquete, {nome} 🏀', 'Treino das 13h: quando estiver pronto, comece.'],
  },
};

const counters: Record<string, number> = {};
export function pick(key: string, personality: Personality, funny: boolean, vars: Record<string, string | number> = {}): string {
  const pool = MESSAGES[key];
  if (!pool) return '';
  const style: Personality = funny ? personality : 'calmo';
  const list = pool[style] ?? pool.zoeiro;
  if (counters[key] === undefined) counters[key] = dayOfYear() + key.length;
  const msg = list[counters[key]++ % list.length];
  return Object.entries(vars).reduce((s, [k, v]) => s.split(`{${k}}`).join(String(v)), msg);
}

export function timeKey(h: number): string {
  if (h < 5) return 'madrugada';
  if (h < 8) return 'manhaCedo';
  if (h < 12) return 'manha';
  if (h < 13) return 'quase13';
  if (h < 18) return 'tarde';
  if (h < 22) return 'noite';
  return 'tardeNoite';
}

export const QUOTES = [
  'Disciplina vence talento quando o talento não treina.', 'Todo craque já foi iniciante.', 'Um arremesso por vez, um dia por vez.', 'O treino de hoje é o placar de amanhã.',
  'Cair é normal. Levantar é treino.', 'Não precisa ser perfeito, precisa ser constante.', 'Quem treina quando não está a fim, vence quando precisa.', 'Pequenos passos todo dia constroem grandes campeões.',
  'A quadra não mente: o que você treina, aparece.', 'Seja 1% melhor que ontem.', 'Foco no processo, o resultado vem.', 'Sua única competição é quem você era ontem.',
  'Suor hoje, troféu amanhã.', 'Respire, confie no treino e arremesse.', 'Energia se cria: levanta e começa.', 'Paciência e repetição fazem mestres.',
  'Quem desiste cedo nunca descobre até onde chegaria.', 'Cada repetição te aproxima do melhor você.', 'Dormir bem também é jogar bem.', 'Água, sono e treino: o tripé do atleta.',
  'O difícil de hoje é o fácil de amanhã.', 'Acredite no seu arremesso.', 'Constância vale mais que intensidade de um dia só.', 'Hoje é um ótimo dia para evoluir.',
  'A vitória começa antes do jogo, no treino.', 'Você não precisa de motivação, precisa de rotina.', 'Cansou? Descansa, mas não desiste.', 'Grandes jogadores treinam quando ninguém está olhando.',
  'Seu futuro agradece o treino de hoje.', 'Mente forte, corpo forte.', 'Comece de onde você está, com o que você tem.',
];
export const quoteOfDay = (d = new Date()) => QUOTES[(dayOfYear(d) + d.getFullYear()) % QUOTES.length];
