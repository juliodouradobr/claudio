# 🏀 Rotina Pro

App mobile (React Native + Expo) para organizar treinos e rotina diária, com visual moderno, tema escuro/claro e **modo videogame** (XP, níveis, atributos, loja, missões, baús, conquistas e amigos).
Funciona **offline** (tudo salvo no aparelho com AsyncStorage) e agenda alarmes/lembretes com `expo-notifications`.

## ▶️ Como rodar no celular com o Expo Go (passo a passo)

1. **Instale o Node.js** (versão 20 ou mais nova): https://nodejs.org
2. **No celular**, instale o app **Expo Go** (Play Store ou App Store). Use a versão mais recente (o projeto usa o Expo SDK 58).
3. **No computador**, abra o terminal na pasta do projeto e rode:
   ```bash
   npm install
   npx expo start
   ```
4. Vai aparecer um **QR Code** no terminal.
   - **Android:** abra o Expo Go › *Scan QR code*.
   - **iPhone:** abra a **Câmera** do iPhone e aponte para o QR Code › toque no aviso para abrir no Expo Go.
5. Celular e computador precisam estar **na mesma rede Wi‑Fi**. Se não conectar, rode `npx expo start --tunnel`.
6. Na primeira abertura: informe seu nome, horário da escola e de dormir, e **permita as notificações**.

> Dica: para testar os cronômetros rapidamente, ligue **Perfil › Config › Modo teste** (tempo acelerado, mas sem XP — o XP só vale com o cronômetro rodando de verdade).

## 🔔 Notificações e alarmes (importante)

- Os lembretes são **notificações locais agendadas**: tocam com o app fechado (basquete 13:00 e 12:45, fone 21:30 e 06:30, água, sono, “treino atrasado” 13:15, “sumiu, hein?”, aniversário).
- Eles são reagendados sempre que você abre o app ou muda horários/ajustes (aí as frases também são trocadas).
- Fone: lembrete da **manhã** de segunda a sexta; o da **noite** é de domingo a quinta (a noite antes da aula). Fins de semana/férias podem ser silenciados nas configurações.
- **Limites do Expo Go:** o som da notificação é o padrão do sistema (sons personalizados exigem um *development build*), e um “alarme de verdade” que toca no silencioso/Não Perturbe também exige build nativo. No Android, permita “Alarmes e lembretes” para o app se o celular pedir. Para um app instalável: `npx eas build` (precisa de conta Expo).
- O **alarme de som da loja** toca dentro do app (troca de bloco do basquete, fim do descanso).

## 🗂️ Estrutura

```
App.tsx                       # navegação (5 abas), fontes, overlays globais
scripts/generate-sounds.js    # gera os efeitos sonoros (assets/sounds/*.wav)
src/
  types.ts                    # tipos do estado
  theme.ts                    # cores (#0F1115 / #FF6B1A / #22D3A6), fonte Inter, tema claro/escuro
  data/                       # exercícios, blocos de basquete, mensagens do coach, loja, missões, conquistas, XP/níveis
  store/                      # estado global + persistência (AsyncStorage) + toda a lógica do jogo
  services/                   # sons/vibração e notificações
  components/                 # UI (glass cards), gráficos SVG (anel, radar, linha), avatar, carta, overlays (confete, level up, baú), roleta
  screens/                    # Hoje, Treinos, Corrida, Basquete, Perfil (+ Carta, Missões, Loja, Prêmios, Troféus, Amigos, Config)
```

## 🎮 Regras do jogo

- **XP:** exercícios +50 · corrida 5 voltas +80 · basquete 2h +150 · fone/mochila +10 · meta de água +20 · dormir no horário +30. Multiplicador de sequência: 3 dias ×1.2 · 7 dias ×1.5 · 30 dias ×2. Moedas = ~60% do XP base.
- **Anti-trapaça:** corrida e basquete só dão XP se o cronômetro rodar até o fim; cada série de exercício tem tempo mínimo; volta de corrida com menos de 15 s é recusada.
- **Níveis 1–100** (Novato → Amador → Titular → Destaque → Estrela → Lenda → GOAT). A curva dá ~4–5 níveis na 1ª semana e fica mais difícil depois.
- **Dia cumprido** = 50%+ das tarefas do dia (alimenta a sequência 🔥, o calendário e o escudo 🛡️).
- **Missões:** 3 diárias (renovam à meia-noite), 2 semanais, 1 chefe do mês. Baú diário grátis, baú especial com o dia 100% completo e roleta semanal (sequência de 7 dias).
- **Amigos:** sem servidor (offline-first). Vocês trocam um **código** (botão compartilhar); o ranking e os desafios usam o último código recebido de cada amigo. Ranking em tempo real exigiria um backend.

## ✅ Checagens

```bash
npx tsc --noEmit                              # tipos
npx expo export --platform android            # garante que o bundle compila
node scripts/generate-sounds.js               # regenera os sons
```

Os ícones/splash em `assets/` são os padrões do template — troque por suas imagens quando quiser.
