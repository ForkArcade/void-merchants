// sprites.js — ForkArcade pixel art sprites
// Generated from _sprites.json by create_sprite tool

var SPRITE_DEFS = {
  "player": {
    "shuttle": {
      "w": 8,
      "h": 8,
      "palette": {
        "C": "#44eeff",
        "D": "#224466",
        "B": "#4488ff",
        "W": "#ffffff"
      },
      "origin": [
        0,
        0
      ],
      "frames": [
        [
          "...CW...",
          "..CDDC..",
          "..CDDC..",
          ".CC..CC.",
          ".C....C.",
          "...CC...",
          "...BB...",
          "........"
        ]
      ]
    },
    "trader": {
      "w": 8,
      "h": 8,
      "palette": {
        "C": "#44eeff",
        "D": "#224466",
        "B": "#4488ff",
        "W": "#ffffff"
      },
      "origin": [
        0,
        0
      ],
      "frames": [
        [
          "...CW...",
          "..CDDC..",
          ".CCDDCC.",
          "CCDDDDCC",
          ".CCDDCC.",
          "..CDDC..",
          "...BB...",
          "..B..B.."
        ]
      ]
    },
    "fighter": {
      "w": 8,
      "h": 8,
      "palette": {
        "C": "#44eeff",
        "D": "#224466",
        "B": "#4488ff",
        "W": "#ffffff"
      },
      "origin": [
        0,
        0
      ],
      "frames": [
        [
          "...CW...",
          "...CC...",
          "..CDDC..",
          ".CC..CC.",
          "CC.CC.CC",
          ".C.CC.C.",
          "...BB...",
          "..B..B.."
        ]
      ]
    },
    "corvette": {
      "w": 8,
      "h": 8,
      "palette": {
        "C": "#44eeff",
        "D": "#224466",
        "B": "#4488ff",
        "W": "#ffffff"
      },
      "origin": [
        0,
        0
      ],
      "frames": [
        [
          "..CWWC..",
          ".CCDDCC.",
          "CCDDDDCC",
          "CC.DD.CC",
          "CC.DD.CC",
          ".CC..CC.",
          "..CBBC..",
          "...BB..."
        ]
      ]
    },
    "freighter": {
      "w": 8,
      "h": 8,
      "palette": {
        "C": "#44eeff",
        "D": "#224466",
        "B": "#4488ff",
        "W": "#ffffff"
      },
      "origin": [
        0,
        0
      ],
      "frames": [
        [
          ".CCCCCC.",
          "CCDDDDCC",
          "CCDDDDCC",
          "CCDDDDCC",
          "CCDDDDCC",
          ".CCCCCC.",
          "..CBBC..",
          "...BB..."
        ]
      ]
    }
  },
  "enemies": {
    "pirate": {
      "w": 8,
      "h": 8,
      "palette": {
        "O": "#ff8844",
        "E": "#663322",
        "R": "#ff4444",
        "W": "#ffffff"
      },
      "origin": [
        0,
        0
      ],
      "frames": [
        [
          "...OW...",
          "..OEEO..",
          ".OO..OO.",
          "OO.OO.OO",
          ".O.OO.O.",
          "...OO...",
          "...RR...",
          "..R..R.."
        ]
      ]
    },
    "pirateHeavy": {
      "w": 8,
      "h": 8,
      "palette": {
        "O": "#ff8844",
        "E": "#663322",
        "R": "#ff4444",
        "W": "#ffffff"
      },
      "origin": [
        0,
        0
      ],
      "frames": [
        [
          "..OWWO..",
          ".OOEEOO.",
          "OOEEEEOO",
          "OO.EE.OO",
          "OO.EE.OO",
          ".OO..OO.",
          "..ORRO..",
          "...RR..."
        ]
      ]
    },
    "militaryPatrol": {
      "w": 8,
      "h": 8,
      "palette": {
        "G": "#44ff44",
        "D": "#226622",
        "B": "#4488ff",
        "W": "#ffffff"
      },
      "origin": [
        0,
        0
      ],
      "frames": [
        [
          "...GW...",
          "..GDDG..",
          "..GDDG..",
          ".GG..GG.",
          "GG.GG.GG",
          "...GG...",
          "...BB...",
          "........"
        ]
      ]
    },
    "rebelFighter": {
      "w": 8,
      "h": 8,
      "palette": {
        "R": "#ff4444",
        "E": "#662222",
        "F": "#ff8800",
        "W": "#ffffff"
      },
      "origin": [
        0,
        0
      ],
      "frames": [
        [
          "...RW...",
          "..REER..",
          ".RR..RR.",
          "RR.RR.RR",
          ".R.RR.R.",
          "...RR...",
          "...FF...",
          "..F..F.."
        ]
      ]
    },
    "bountyHunter": {
      "w": 8,
      "h": 8,
      "palette": {
        "P": "#aa66ff",
        "D": "#442266",
        "R": "#ff4444",
        "W": "#ffffff"
      },
      "origin": [
        0,
        0
      ],
      "frames": [
        [
          "...PW...",
          "..PDDP..",
          ".PP..PP.",
          "PP.PP.PP",
          ".P.PP.P.",
          "...PP...",
          "...RR...",
          "........"
        ]
      ]
    }
  },
  "effects": {
    "laser": {
      "w": 8,
      "h": 8,
      "palette": {
        "C": "#0088cc",
        "W": "#00ffff"
      },
      "origin": [
        0,
        0
      ],
      "frames": [
        [
          "...CC...",
          "..CWWC..",
          "..CWWC..",
          "..CWWC..",
          "..CWWC..",
          "...CC...",
          "........",
          "........"
        ]
      ]
    },
    "missile": {
      "w": 8,
      "h": 8,
      "palette": {
        "M": "#ffaa00",
        "W": "#ffffff",
        "F": "#ff8800"
      },
      "origin": [
        0,
        0
      ],
      "frames": [
        [
          "...MM...",
          "..MWWM..",
          "..MFFM..",
          "..MFFM..",
          "..MFFM..",
          "...FF...",
          "...FF...",
          "........"
        ]
      ]
    },
    "explosion": {
      "w": 8,
      "h": 8,
      "palette": {
        "F": "#ff8800",
        "W": "#ffffff",
        "R": "#ff4444"
      },
      "origin": [
        0,
        0
      ],
      "frames": [
        [
          "........",
          "...FF...",
          "..FWWF..",
          "..FWWF..",
          "..FWWF..",
          "...FF...",
          "........",
          "........"
        ],
        [
          ".F..F.F.",
          "..FFRF..",
          ".FRFFRF.",
          "FRFWWFRF",
          "FFFWWFFF",
          ".FFFFFF.",
          "..FFFF..",
          ".F..F.F."
        ]
      ]
    },
    "shieldHit": {
      "w": 8,
      "h": 8,
      "palette": {
        "S": "#44ffff"
      },
      "origin": [
        0,
        0
      ],
      "frames": [
        [
          "..SSSS..",
          ".S....S.",
          "S......S",
          "S......S",
          "S......S",
          "S......S",
          ".S....S.",
          "..SSSS.."
        ]
      ]
    },
    "engineFlame": {
      "w": 8,
      "h": 8,
      "palette": {
        "B": "#4488ff",
        "F": "#ff8800",
        "Y": "#ffd444"
      },
      "origin": [
        0,
        0
      ],
      "frames": [
        [
          "........",
          "...BB...",
          "..BFFB..",
          "..BYYB..",
          "...YY...",
          "...FF...",
          "....F...",
          "........"
        ],
        [
          "........",
          "...BB...",
          "..BFFB..",
          "...FF...",
          "...YY...",
          "....F...",
          "........",
          "........"
        ]
      ]
    },
    "jumpFlash": {
      "w": 8,
      "h": 8,
      "palette": {
        "W": "#ffffff",
        "C": "#aaddff"
      },
      "origin": [
        0,
        0
      ],
      "frames": [
        [
          "...CC...",
          "..CWWC..",
          ".CWWWWC.",
          "CWWWWWWC",
          "CWWWWWWC",
          ".CWWWWC.",
          "..CWWC..",
          "...CC..."
        ]
      ]
    }
  },
  "items": {
    "cargoPod": {
      "w": 8,
      "h": 8,
      "palette": {
        "P": "#aa8844",
        "D": "#664422",
        "Y": "#ffd444"
      },
      "origin": [
        0,
        0
      ],
      "frames": [
        [
          ".PPPPPP.",
          "PPDDDDPP",
          "PD....DP",
          "PD.YY.DP",
          "PD.YY.DP",
          "PD....DP",
          "PPDDDDPP",
          ".PPPPPP."
        ]
      ]
    },
    "fuelCell": {
      "w": 8,
      "h": 8,
      "palette": {
        "B": "#4488ff",
        "W": "#88bbff"
      },
      "origin": [
        0,
        0
      ],
      "frames": [
        [
          "..BBBB..",
          ".BBBBBB.",
          "BB.WW.BB",
          "BBWWWWBB",
          "BBWWWWBB",
          "BB.WW.BB",
          ".BBBBBB.",
          "..BBBB.."
        ]
      ]
    },
    "artifact": {
      "w": 8,
      "h": 8,
      "palette": {
        "Y": "#ffd444",
        "W": "#ffffff",
        "P": "#ff44ff"
      },
      "origin": [
        0,
        0
      ],
      "frames": [
        [
          "...YY...",
          "..YWWY..",
          ".YW..WY.",
          "YW.PP.WY",
          "YW.PP.WY",
          ".YW..WY.",
          "..YWWY..",
          "...YY..."
        ]
      ]
    },
    "beacon": {
      "w": 8,
      "h": 8,
      "palette": {
        "R": "#ff4444",
        "A": "#8888aa"
      },
      "origin": [
        0,
        0
      ],
      "frames": [
        [
          "...RR...",
          "...RR...",
          "..R..R..",
          ".R....R.",
          "...RR...",
          "...RR...",
          "..AAAA..",
          "..AAAA.."
        ]
      ]
    },
    "wreckage": {
      "w": 8,
      "h": 8,
      "palette": {
        "A": "#8888aa",
        "D": "#445566"
      },
      "origin": [
        0,
        0
      ],
      "frames": [
        [
          ".AA.....",
          ".AAA.A..",
          "..AADAA.",
          "..AAAA..",
          ".AAA..A.",
          ".A.AA.A.",
          "....AA..",
          "......A."
        ]
      ]
    }
  },
  "ui": {
    "station": {
      "w": 8,
      "h": 8,
      "palette": {
        "A": "#8888aa",
        "D": "#555577",
        "Y": "#ffd444"
      },
      "origin": [
        0,
        0
      ],
      "frames": [
        [
          "..AAAA..",
          ".AADDAA.",
          "AADYYDAA",
          "AD.YY.DA",
          "AD.YY.DA",
          "AADYYDAA",
          ".AADDAA.",
          "..AAAA.."
        ]
      ]
    },
    "starSmall": {
      "w": 8,
      "h": 8,
      "palette": {
        "Y": "#ffd444",
        "W": "#ffffff"
      },
      "origin": [
        0,
        0
      ],
      "frames": [
        [
          "........",
          "........",
          "...YW...",
          "..YWWY..",
          "..YWWY..",
          "...YW...",
          "........",
          "........"
        ]
      ]
    },
    "starLarge": {
      "w": 8,
      "h": 8,
      "palette": {
        "Y": "#ffd444",
        "W": "#ffffff"
      },
      "origin": [
        0,
        0
      ],
      "frames": [
        [
          "...YY...",
          "..YWWY..",
          ".YWWWWY.",
          "YWWWWWWY",
          "YWWWWWWY",
          ".YWWWWY.",
          "..YWWY..",
          "...YY..."
        ]
      ]
    },
    "planet": {
      "w": 8,
      "h": 8,
      "palette": {
        "G": "#226644",
        "B": "#4488ff"
      },
      "origin": [
        0,
        0
      ],
      "frames": [
        [
          "..GGGG..",
          ".GBBBGG.",
          "GBBBBBBG",
          "GGGBBBGG",
          "GGGGGGGG",
          "GBBBGGGG",
          ".GGGGGG.",
          "..GGGG.."
        ]
      ]
    },
    "jumpGate": {
      "w": 8,
      "h": 8,
      "palette": {
        "C": "#44eeff"
      },
      "origin": [
        0,
        0
      ],
      "frames": [
        [
          "..CCCC..",
          ".CC..CC.",
          "CC....CC",
          "C......C",
          "C......C",
          "CC....CC",
          ".CC..CC.",
          "..CCCC.."
        ]
      ]
    },
    "missionIcon": {
      "w": 8,
      "h": 8,
      "palette": {
        "Y": "#ffd444"
      },
      "origin": [
        0,
        0
      ],
      "frames": [
        [
          "...YY...",
          "..YYYY..",
          "..YYYY..",
          "..YYYY..",
          "...YY...",
          "........",
          "...YY...",
          "...YY..."
        ]
      ]
    },
    "tradeIcon": {
      "w": 8,
      "h": 8,
      "palette": {
        "Y": "#ffd444"
      },
      "origin": [
        0,
        0
      ],
      "frames": [
        [
          "..YYYY..",
          ".YY..YY.",
          "YY....YY",
          "Y..YY..Y",
          "Y..YY..Y",
          "YY....YY",
          ".YY..YY.",
          "..YYYY.."
        ]
      ]
    },
    "combatIcon": {
      "w": 8,
      "h": 8,
      "palette": {
        "R": "#ff4444"
      },
      "origin": [
        0,
        0
      ],
      "frames": [
        [
          "...RR...",
          "...RR...",
          "..R..R..",
          "RR....RR",
          "RR....RR",
          "..R..R..",
          "...RR...",
          "...RR..."
        ]
      ]
    }
  }
}

function drawSprite(ctx, spriteDef, x, y, size, frame) {
  if (!spriteDef) return false
  frame = frame || 0
  frame = frame % spriteDef.frames.length
  var key = size + '_' + frame
  if (!spriteDef._c) spriteDef._c = {}
  if (!spriteDef._c[key]) {
    var cv = document.createElement('canvas')
    cv.width = size
    cv.height = size
    var cc = cv.getContext('2d')
    var pixels = spriteDef.frames[frame]
    var pw = size / spriteDef.w
    var ph = size / spriteDef.h
    for (var row = 0; row < spriteDef.h; row++) {
      var line = pixels[row]
      for (var col = 0; col < spriteDef.w; col++) {
        var ch = line[col]
        if (ch === ".") continue
        var color = spriteDef.palette[ch]
        if (!color) continue
        cc.fillStyle = color
        cc.fillRect(col * pw, row * ph, Math.ceil(pw), Math.ceil(ph))
      }
    }
    spriteDef._c[key] = cv
  }
  var ox = spriteDef.origin[0] * (size / spriteDef.w)
  var oy = spriteDef.origin[1] * (size / spriteDef.h)
  ctx.drawImage(spriteDef._c[key], x - ox, y - oy)
  return true
}

function getSprite(category, name) {
  return SPRITE_DEFS[category] && SPRITE_DEFS[category][name] || null
}

function spriteFrames(spriteDef) {
  return spriteDef ? spriteDef.frames.length : 0
}
