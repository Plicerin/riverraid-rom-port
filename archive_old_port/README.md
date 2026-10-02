# River Raid — Python Port

A Python/pygame port of Atari's River Raid (1982), built from a complete
ROM data extraction cross-referenced against Thomas Jentzsch's 2001
6502 disassembly.

## Project Structure

```
riverraid-rom-extract/
├── reference/           JTZ disassembly (authoritative reference)
│   ├── jentzsch_2001/   Original v0.9 (Aug 2001)
│   └── river-raid-wiz/  Giz-Wiz port with vcs.h fixes
├── extraction/          Our ROM extraction data (already exists)
├── port/                The Python port implementation
│   ├── main.py          Entry point
│   ├── core/            Game engine & state machine
│   ├── assets/          Sprite loading & rendering
│   ├── entities/        Player, enemies, fuel, bullets
│   ├── systems/         Scoring, spawning, collision, river
│   ├── rendering/       Screens, HUD, effects
│   └── input/           Keyboard & gamepad controls
├── verify/              Cross-check extraction vs JTZ disassembly
├── tests/               Unit tests
├── requirements.txt     Dependencies
└── PORT_PLAN.md         Master plan
```

## Quick Start

```bash
pip install -r requirements.txt
cd port
python main.py
```

## Controls

- **Arrow keys**: Move jet (left/right)
- **Space**: Fire
- **Up/Down**: Adjust altitude (changes scroll speed)
- **Enter**: Start game / restart

## Attribution

- **Original game**: River Raid, Atari, Inc. (1982) by Larry Kaplan
- **Disassembly**: Thomas Jentzsch (JTZ), 2001, Stella mailing list
- **Port**: Python/pygame reimplementation

## License

This port is provided for educational purposes only. The original game
is copyrighted by Atari. This port does not distribute any copyrighted
ROM data — it uses our own extracted sprite tables and re-implements
the game logic based on JTZ's disassembly.
