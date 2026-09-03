import type { Scenario } from '../types';

/**
 * Пример базового сценария для игры
 * "Тень в полночь" - убийство в старом отеле
 */
export const sampleScenario: Scenario = {
  id: 'shadow-at-midnight',
  title: 'Тень в полночь',
  author: 'Система',
  description: 'В старом отеле "Гранд" найдено тело известного бизнесмена. Ваша задача - найти убийцу среди гостей и персонала отеля.',
  startingLocationId: 'hotel-lobby',
  startingTime: new Date('2024-01-15T08:00:00').toISOString(),
  timeLimit: 720, // 12 часов до нового преступления
  requiredClueCount: 5,
  suspects: ['victim-wife', 'business-partner', 'hotel-manager'],
  correctSuspect: 'business-partner',
  initialFlags: {
    'crimeDiscovered': false,
    'policeArrived': false,
    'autopsyComplete': false,
  },
  
  locations: [
    {
      id: 'hotel-lobby',
      name: 'Лобби отеля',
      description: 'Роскошное лобби старого отеля. Мраморные колонны, хрустальная люстра, запах дорогого парфюма смешивается с запахом смерти.',
      backgroundImage: '/images/locations/hotel-lobby.jpg',
      isUnlocked: true,
      mapPoints: [
        {
          id: 'reception-desk',
          x: 50,
          y: 30,
          type: 'interactive',
          label: 'Стойка регистрации',
          isDiscovered: true,
        },
        {
          id: 'npc-receptionist',
          x: 45,
          y: 35,
          type: 'npc',
          targetId: 'receptionist',
          label: 'Портье',
          isDiscovered: true,
        },
        {
          id: 'elevator',
          x: 70,
          y: 50,
          type: 'exit',
          label: 'Лифт на этажи',
          isDiscovered: true,
        },
        {
          id: 'clue-newspaper',
          x: 20,
          y: 60,
          type: 'clue',
          targetId: 'newspaper-clue',
          label: 'Газета',
          isDiscovered: false,
        },
      ],
      availableActions: [
        {
          id: 'examine-lobby',
          name: 'Осмотреть лобби',
          description: 'Внимательно изучить лобби в поисках улик',
          timeCost: 30,
          isAvailable: true,
          result: {
            message: 'Вы заметили следы грязи на полу, ведущие к лифту.',
            timeCost: 30,
            flagsSet: { 'lobbyExamined': true },
          },
        },
      ],
    },
    {
      id: 'victim-room',
      name: 'Номер жертвы (Люкс 404)',
      description: 'Роскошный номер с видом на город. Тело найдено у окна. Повсюду следы борьбы.',
      backgroundImage: '/images/locations/victim-room.jpg',
      isUnlocked: false,
      state: { doorLocked: false, examined: false },
      mapPoints: [
        {
          id: 'body-location',
          x: 60,
          y: 40,
          type: 'interactive',
          label: 'Место преступления',
          isDiscovered: true,
        },
        {
          id: 'npc-coroner',
          x: 65,
          y: 45,
          type: 'npc',
          targetId: 'coroner',
          label: 'Коронер',
          isDiscovered: true,
        },
        {
          id: 'window',
          x: 80,
          y: 20,
          type: 'interactive',
          label: 'Окно',
          isDiscovered: true,
        },
        {
          id: 'clue-broken-glass',
          x: 75,
          y: 50,
          type: 'clue',
          targetId: 'broken-glass-clue',
          label: 'Осколки стекла',
          isDiscovered: false,
        },
      ],
      availableActions: [
        {
          id: 'search-room',
          name: 'Обыскать номер',
          description: 'Тщательно обыскать номер в поисках улик',
          timeCost: 60,
          isAvailable: true,
          requirements: [
            { type: 'hasFlag', value: 'policeArrived' },
          ],
          result: {
            message: 'Вы нашли записку в ящике стола.',
            timeCost: 60,
            cluesGranted: ['note-from-killer'],
          },
        },
      ],
    },
    {
      id: 'hotel-bar',
      name: 'Бар "Шепот"',
      description: 'Темный бар на первом этаже. Здесь гости отеля любят проводить вечера.',
      backgroundImage: '/images/locations/hotel-bar.jpg',
      isUnlocked: true,
      mapPoints: [
        {
          id: 'bar-counter',
          x: 40,
          y: 30,
          type: 'interactive',
          label: 'Барная стойка',
          isDiscovered: true,
        },
        {
          id: 'npc-bartender',
          x: 35,
          y: 35,
          type: 'npc',
          targetId: 'bartender',
          label: 'Бармен',
          isDiscovered: true,
        },
      ],
      availableActions: [],
    },
  ],

  npcs: [
    {
      id: 'receptionist',
      name: 'Мистер Хадсон',
      description: 'Портье среднего возраста с безупречными манерами.',
      portrait: '/images/npcs/receptionist.png',
      currentLocationId: 'hotel-lobby',
      dialogTree: {
        id: 'receptionist-greeting',
        text: 'Доброе утро, детектив. Чем могу помочь? Это ужасно - то, что случилось в нашем отеле...',
        speakerId: 'receptionist',
        choices: [
          {
            id: 'ask-about-victim',
            text: 'Что вы можете рассказать о жертве?',
            nextNodeId: 'receptionist-about-victim',
          },
          {
            id: 'ask-about-night',
            text: 'Что происходило прошлой ночью?',
            nextNodeId: 'receptionist-about-night',
            requirements: [
              { type: 'hasFlag', value: 'policeArrived' },
            ],
          },
          {
            id: 'end-conversation',
            text: 'Спасибо, на этом всё.',
            nextNodeId: 'receptionist-end',
          },
        ],
      },
    },
    {
      id: 'coroner',
      name: 'Доктор Ватсон',
      description: 'Опытный коронер с холодным взглядом.',
      portrait: '/images/npcs/coroner.png',
      currentLocationId: 'victim-room',
      dialogTree: {
        id: 'coroner-greeting',
        text: 'А, детектив. Я как раз закончил предварительный осмотр.',
        speakerId: 'coroner',
        choices: [
          {
            id: 'ask-cause-of-death',
            text: 'Причина смерти?',
            nextNodeId: 'coroner-cause-of-death',
          },
          {
            id: 'ask-time-of-death',
            text: 'Когда он умер?',
            nextNodeId: 'coroner-time-of-death',
          },
          {
            id: 'end-conversation',
            text: 'Ясно. Спасибо.',
            nextNodeId: 'coroner-end',
          },
        ],
      },
    },
    {
      id: 'bartender',
      name: 'Джек',
      description: 'Бармен с татуировками и доброй улыбкой.',
      portrait: '/images/npcs/bartender.png',
      currentLocationId: 'hotel-bar',
      dialogTree: {
        id: 'bartender-greeting',
        text: 'Привет, детектив. Что будете пить? Хотя сейчас не до этого, да?',
        speakerId: 'bartender',
        choices: [
          {
            id: 'ask-about-victim-drinking',
            text: 'Жертва часто здесь бывала?',
            nextNodeId: 'bartender-about-victim',
          },
          {
            id: 'end-conversation',
            text: 'Нет, спасибо. Мне нужно идти.',
            nextNodeId: 'bartender-end',
          },
        ],
      },
    },
  ],

  clues: [
    {
      id: 'newspaper-clue',
      name: 'Утренняя газета',
      description: 'Газета за сегодня. На первой полосе статья о банкротстве компании жертвы.',
      type: 'text',
      content: 'Заголовок: "Крупный бизнесмен на грани разорения". Компания "Вектор" объявила о банкротстве после серии неудачных инвестиций.',
      tags: ['финансы', 'мотив'],
      isHidden: false,
    },
    {
      id: 'broken-glass-clue',
      name: 'Осколки бокала',
      description: 'Разбитый бокал для вина рядом с телом. Следы борьбы?',
      type: 'photo',
      content: '/images/clues/broken-glass.jpg',
      tags: ['место преступления', 'борьба'],
      isHidden: true,
      hiddenUntil: ['policeArrived'],
    },
    {
      id: 'note-from-killer',
      name: 'Записка',
      description: 'Смятая записка, найденная в ящике стола.',
      type: 'text',
      content: '"Ты предал меня. Завтра мы встретимся и поговорим об этом в последний раз. - П."',
      tags: ['угроза', 'инициал'],
      isHidden: true,
      hiddenUntil: ['lobbyExamined'],
    },
  ],
};

/**
 * Промпты для генерации ассетов
 */
export const assetPrompts = {
  locations: {
    'hotel-lobby': `Noir style hotel lobby from 1940s, dark atmosphere, marble columns, crystal chandelier, dramatic lighting, black and white with high contrast, detective game art style`,
    'victim-room': `Noir style luxury hotel room at night, body silhouette near window, broken glass on floor, dramatic shadows, 1940s decor, black and white high contrast`,
    'hotel-bar': `Dark noir bar interior, dim lighting, wooden counter, bottles on shelves, smoky atmosphere, 1940s style, black and white with deep shadows`,
  },
  npcs: {
    'receptionist': `Portrait of middle-aged hotel receptionist, 1940s suit, well-groomed, neutral expression, noir style, black and white, dramatic side lighting`,
    'coroner': `Portrait of male coroner in white coat, stern expression, glasses, 1940s style, noir aesthetic, black and white with harsh shadows`,
    'bartender': `Portrait of bartender with tattoos on arms, friendly smile, 1940s vest, noir style, black and white, atmospheric lighting`,
  },
  clues: {
    'broken-glass': `Close-up photo of broken wine glass on carpet, shards scattered, noir crime scene photography, black and white, high contrast`,
  },
};
