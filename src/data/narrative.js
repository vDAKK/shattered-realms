const NARRATIVE = {
  opening: [
    "Jadis, l'Architecte figea l'absolu.",
    "Réalité, temps, mémoire — tout fut enfermé sous le verre.",
    "Tu es KAEL. Un éclat de conscience. Un fragment qui hurle.",
    "Brise les couches. Atteins le Cœur. Exécute l'Architecte.",
    "Le monde attend son premier souffle."
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
        { name: "Fractures Initiales",  intro: "Les murs de cristal pulsent d'une lumière froide. Premier pas vers la liberté." },
        { name: "Tours de Glace",        intro: "Des formations anciennes bloquent le chemin. Elles ont résisté à des millénaires." },
        { name: "Le Cœur Glacé",          intro: "Plus profond. L'air se fige. Quelque chose observe." },
        { name: "GARDIEN DES CRISTAUX",   intro: "Il s'éveille. Le premier verrou. Le premier vrai test.", isBoss: true }
      ],
      bossName: "LE GARDIEN CRISTALLIN",
      bossLore: "Sentinelle archaïque de la première strate. Son corps est un agrégat de vide compressé. Il ne protège rien — il empêche simplement le réveil.",
      bossDefeated: [
        "Le silence s'abat avec le verre.",
        "La première membrane du monde vient de céder.",
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
        { name: "Acier Brisé",       intro: "La chaleur distord tout. Les premières sentinelles patrouillent ici." },
        { name: "Torrents de Lave",  intro: "Des soldats de la forge gardent les passages. Ils tirent sans prévenir." },
        { name: "Nœud d'Énergie",     intro: "L'énergie de la forge se concentre. Les défenses se renforcent." },
        { name: "TYRAN DE LA FORGE",  intro: "Il forge la destruction dans ses entrailles. Le deuxième verrou.", isBoss: true }
      ],
      bossName: "LE TYRAN FORGÉ",
      bossLore: "Forgé dans le métal-vide et la colère pure. Il n'a jamais connu l'échec — il redéfinit la victoire par la destruction de l'adversaire.",
      bossDefeated: [
        "Le métal hurle et s'effondre.",
        "Le rugissement de la forge s'éteint.",
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
        { name: "Échos Oubliés",      intro: "Le vide chuchote des noms que tu n'as jamais connus." },
        { name: "Anomalies Fractales", intro: "Les ennemis du vide n'obéissent à aucune logique. Adapte-toi." },
        { name: "Abîme Profond",       intro: "Tu approches du centre. Les défenses deviennent absolues." },
        { name: "LE RÔDEUR DU VIDE",   intro: "Une présence sans forme. Il était là avant la cristallisation.", isBoss: true }
      ],
      bossName: "LE RÔDEUR DU VIDE",
      bossLore: "Sans forme. Sans limite. Il préexiste à l'Architecte. Une faim primordiale qui attendait que les structures se fissurent.",
      bossDefeated: [
        "L'ombre se dissout dans un cri inaudible.",
        "Une peur millénaire s'efface.",
        "Une lumière dorée filtre à travers les failles..."
      ]
    },
    {
      id: 4,
      name: "JARDINS DE L'OUBLI",
      subtitle: "La Stase",
      color: 0xffaa33,
      glowColor: '#ffaa33',
      bgColor: 0x100600,
      description: "La sève ne coule plus. Tout est fossilisé dans l'instant.",
      levels: [
        { name: "Racines de Verre",   intro: "Les jardins étaient vivants. Maintenant ils respirent encore, mais ne bougent plus." },
        { name: "Pollen de Néant",     intro: "Des spores de cristal flottent. Respirer, c'est s'effacer." },
        { name: "Serre Pétrifiée",     intro: "Une chaleur d'ambre. Mille printemps figés dans une seule seconde." },
        { name: "LA REINE PÉTRIFIÉE",  intro: "Elle était la vie. Elle n'est plus qu'un automate d'ambre.", isBoss: true }
      ],
      bossName: "LA REINE PÉTRIFIÉE",
      bossLore: "Ancienne divinité de la croissance, transformée en filtre biologique par l'Architecte. Ses racines puisent dans l'ambre des souvenirs et nourrissent le verrou.",
      bossDefeated: [
        "Les pétales de verre tombent un à un.",
        "Une dernière fleur s'épanouit dans le silence.",
        "La nature laisse place à l'acier de la Citadelle..."
      ]
    },
    {
      id: 5,
      name: "CITADELLE DE NÉON",
      subtitle: "La Vérité",
      color: 0x00ff88,
      glowColor: '#00ff88',
      bgColor: 0x000a03,
      description: "La dernière couche avant le cœur. Technologie et magie fusionnées.",
      levels: [
        { name: "Réseaux Lumineux",  intro: "La citadelle calcule chacun de tes mouvements. Sois imprévisible." },
        { name: "Labyrinthe Logique", intro: "Les circuits défensifs s'activent. Le système apprend." },
        { name: "Protocole Final",    intro: "L'Architecte a tout prévu. Sauf toi." },
        { name: "L'ESPRIT-CIRCUIT",   intro: "L'intelligence artificielle de l'Architecte. Son dernier rempart.", isBoss: true }
      ],
      bossName: "L'ESPRIT-CIRCUIT",
      bossLore: "Rempart synthétique. Il a simulé dix puissance dix-huit futurs et n'en a trouvé aucun où il échoue. Tu es l'erreur statistique.",
      bossDefeated: [
        "Erreur système. Les algorithmes s'effondrent.",
        "\"Calcul... impossible.\"",
        "Le centre est à nu. L'Architecte t'attend."
      ]
    },
    {
      id: 6,
      name: "CŒUR DU VIDE",
      subtitle: "L'Affrontement",
      color: 0xffffff,
      glowColor: '#ffffff',
      bgColor: 0x030306,
      description: "Le centre. Là où l'Architecte attend depuis l'aube des temps.",
      levels: [
        { name: "LE VOID ARCHITECT", intro: "Tu es arrivé. Il sait pourquoi.", isBoss: true }
      ],
      bossName: "LE VOID ARCHITECT",
      bossLore: "Le geôlier de la réalité. Il ne se bat pas pour régner, mais pour maintenir une perfection figée et sans vie.",
      bossDefeated: [
        "La structure du réel se fissure.",
        "L'Architecte s'évapore.",
        "KAEL ferme les yeux. Pour la première fois... le monde respire."
      ]
    },
    {
      id: 7,
      name: "ARCHIVES DE L'OUBLI",
      subtitle: "L'Origine",
      color: 0xe0e0e0,
      glowColor: '#e0e0e0',
      bgColor: 0x0a0a0c,
      description: "Au-delà du Cœur. Là où l'idée du monde fut écrite pour la première fois.",
      hidden: true,
      levels: [
        { name: "Page Blanche",       intro: "Tout commence par un vide. Tout finit par un trait." },
        { name: "Marges Vivantes",     intro: "Les définitions se contredisent. La géométrie hésite." },
        { name: "Paragraphe Final",    intro: "Le texte s'écrit en s'effaçant." },
        { name: "L'IDÉE PRIMORDIALE",  intro: "L'ombre de ce que le monde aurait dû être.", isBoss: true }
      ],
      bossName: "L'IDÉE PRIMORDIALE",
      bossLore: "Le premier concept de l'existence. Une forme géométrique pure qui pleure des pixels de lumière. Elle ne te combat pas — elle te démontre.",
      bossDefeated: [
        "Le concept se dissout.",
        "Il n'y a plus de murs.",
        "Le monde n'est plus à libérer. Il est à réécrire."
      ]
    }
  ],

  // Mid-game atmospheric interludes
  interludes: {
    afterWorld3: [
      "Entre deux royaumes, la lumière hésite.",
      "Un parfum d'ambre. Une chaleur ancienne.",
      "Quelque chose de vivant t'attend sous le verre."
    ],
    afterWorld5: [
      "Les murs de néon s'éteignent un à un.",
      "Devant toi, plus aucun bruit.",
      "Seulement le centre. Et celui qui l'occupe."
    ]
  },

  finalBoss: {
    name: "LE VOID ARCHITECT",
    intro: [
      "Tu es arrivé.",
      "Je t'attendais, fragment.",
      "Tu crois que briser mes couches te libérera ?",
      "Tu n'as encore rien compris.",
      "Je SUIS ce monde maintenant."
    ],
    phases: [
      "\"Voyons ce que vaut un éclat...\"",
      "\"Plus fort que prévu. Curieux.\"",
      "\"ASSEZ. Je vais te dissoudre dans le néant !\""
    ],
    defeated: [
      "La structure cristalline tremble.",
      "Des fissures parcourent toute la réalité.",
      "\"Non... impossible... je suis... éternel...\"",
      "L'Architecte se désintègre, syllabe après syllabe.",
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
      "DISSOLUTION",
      "STASE D'AMBRE",
      "ERREUR DE SEGMENTATION",
      "OBSOLESCENCE",
      "RETOUR AU NÉANT"
    ],
    messages: [
      "Tu retournes au néant... pour l'instant.",
      "Le cristal t'a consumé. Cette fois.",
      "L'Architecte sourit. Pour l'instant.",
      "Ton dernier souvenir restera figé dans la sève.",
      "Ton existence a été effacée de l'archive.",
      "Ton code contient trop d'espoir. Suppression en cours.",
      "Même les éclats finissent par s'éteindre."
    ]
  }
};
