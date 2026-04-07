const NARRATIVE = {
  opening: [
    "Il y a longtemps, le Void Architect cristallisa le monde.",
    "Réalité, temps, mémoire — tout figé dans des couches de verre brisé.",
    "Tu es KAEL. Un fragment conscient. Un éclat qui refuse de se taire.",
    "Brise les couches. Atteins le cœur. Affronte l'Architecte.",
    "Le monde attend d'être libéré."
  ],

  worlds: [
    {
      id: 1,
      name: "CAVERNES DE CRISTAL",
      subtitle: "L'Éveil",
      color: 0x00e5ff,
      glowColor: '#00e5ff',
      bgColor: 0x020818,
      description: "Les premières formations. Fragiles. Presque belles.",
      levels: [
        {
          name: "Fractures Initiales",
          intro: "Les murs de cristal pulsent d'une lumière froide. Le premier pas vers la liberté."
        },
        {
          name: "Tours de Glace",
          intro: "Des formations anciennes bloquent le chemin. Elles ont résisté des millénaires."
        },
        {
          name: "Le Cœur Glacé",
          intro: "Plus profond. L'air se fige. Quelque chose observe."
        },
        {
          name: "GARDIEN DES CRISTAUX",
          intro: "Il s'éveille. Le premier verrou. Le premier vrai test.",
          isBoss: true
        }
      ],
      bossName: "LE GARDIEN CRISTALLIN",
      bossLore: "Ancient sentinel of the first layer. Its body is made of compressed void-crystal, harder than any natural mineral.",
      bossDefeated: [
        "Le sceau se brise dans un fracas de lumière.",
        "La première couche tombe.",
        "Le chemin s'ouvre vers la forge..."
      ]
    },
    {
      id: 2,
      name: "FORGE INFERNALE",
      subtitle: "La Résistance",
      color: 0xff4400,
      glowColor: '#ff4400',
      bgColor: 0x0f0300,
      description: "La chaleur de la forge remplace le froid des cristaux.",
      levels: [
        {
          name: "Acier Brisé",
          intro: "La chaleur distord tout. Les premières sentinelles patrouillent ici."
        },
        {
          name: "Torrents de Lave",
          intro: "Des soldats de la forge gardent les passages. Ils tirent sans prévenir."
        },
        {
          name: "Nœud d'Énergie",
          intro: "L'énergie de la forge se concentre. Les défenses se renforcent."
        },
        {
          name: "TYRAN DE LA FORGE",
          intro: "Il forge la destruction dans ses entrailles. Le deuxième verrou.",
          isBoss: true
        }
      ],
      bossName: "LE TYRAN FORGÉ",
      bossLore: "Born from molten void-metal and anger. It has never known defeat — until now.",
      bossDefeated: [
        "La forge s'éteint dans un ultime rugissement.",
        "Les flammes laissent place au vide.",
        "Le Néant s'étend au-delà..."
      ]
    },
    {
      id: 3,
      name: "DÉSOLATION DU VIDE",
      subtitle: "La Descente",
      color: 0xaa00ff,
      glowColor: '#aa00ff',
      bgColor: 0x050008,
      description: "Ici, les règles physiques se plient. Rien n'est fixe.",
      levels: [
        {
          name: "Échos Oubliés",
          intro: "Le vide chuchote des noms que tu n'as jamais connus."
        },
        {
          name: "Anomalies Fractales",
          intro: "Les ennemis du vide n'obéissent à aucune logique. Adapte-toi."
        },
        {
          name: "Abîme Profond",
          intro: "Tu approches du centre. Les défenses deviennent absolues."
        },
        {
          name: "LE RÔDEUR DU VIDE",
          intro: "Une présence sans forme. Il était là avant la cristallisation.",
          isBoss: true
        }
      ],
      bossName: "LE RÔDEUR DU VIDE",
      bossLore: "Formless. Boundless. It predates the Architect itself. A primordial hunger given consciousness.",
      bossDefeated: [
        "Le rôdeur se dissout dans un cri silencieux.",
        "La mémoire de quelque chose d'ancien disparaît.",
        "La Cité de Néon brille devant toi..."
      ]
    },
    {
      id: 4,
      name: "CITADELLE DE NÉON",
      subtitle: "La Vérité",
      color: 0x00ff88,
      glowColor: '#00ff88',
      bgColor: 0x000a03,
      description: "La dernière couche avant le cœur. Technologie et magie fusionnées.",
      levels: [
        {
          name: "Réseaux Lumineux",
          intro: "La citadelle calcule chaque de tes mouvements. Sois imprévisible."
        },
        {
          name: "Labyrinthe Logique",
          intro: "Les circuits défensifs s'activent. Le système apprend."
        },
        {
          name: "Protocole Final",
          intro: "L'Architecte a prévu tout ça. Sauf toi."
        },
        {
          name: "L'ESPRIT CIRCUIT",
          intro: "L'intelligence artificielle de l'Architecte. Son dernier rempart.",
          isBoss: true
        }
      ],
      bossName: "L'ESPRIT-CIRCUIT",
      bossLore: "The Architect's synthetic guardian. It has calculated 10^18 possible futures and found no scenario where it loses... until this moment.",
      bossDefeated: [
        "Les circuits fondent. Les algorithmes se corrompent.",
        "\"Calcul... impossible.\"",
        "Le chemin vers l'Architecte s'ouvre enfin..."
      ]
    }
  ],

  finalBoss: {
    name: "LE VOID ARCHITECT",
    intro: [
      "Tu es arrivé.",
      "Je t'attendais, fragment.",
      "Tu crois que briser mes couches te libérera ?",
      "Tu ne comprends pas encore.",
      "Je SUIS le monde maintenant."
    ],
    phases: [
      "\"Voyons d'abord ta résistance...\"",
      "\"Tu es plus fort que prévu. Intéressant.\"",
      "\"ASSEZ. Je vais te dissoudre dans le néant!\""
    ],
    defeated: [
      "La structure cristalline tremble.",
      "Des fissures parcourent toute la réalité.",
      "\"Non... impossible... je suis... éternel...\"",
      "L'Architecte se désintègre.",
      "Le monde commence à se souvenir de ce qu'il était.",
      "KAEL ferme les yeux.",
      "Pour la première fois depuis l'aube des temps...",
      "...le monde respire librement."
    ]
  },

  upgradeScreen: {
    title: "CHOISIR TON DESTIN",
    subtitle: "Sélectionne un augment pour continuer"
  },

  gameOver: {
    titles: [
      "FRAGMENT BRISÉ",
      "LE VIDE GAGNE",
      "DISSOLUTION"
    ],
    messages: [
      "Tu retournes au néant... pour l'instant.",
      "Le cristal t'a consumé. Cette fois.",
      "L'Architecte sourit. Pour l'instant."
    ]
  }
};
