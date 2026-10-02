"""
River Raid — Shared LFSR random number generator.

Mirrors JTZ NextRandom16 (line 2308):
  LDA  randomHi
  ASL
  ASL
  ASL
  EOR  randomHi
  ASL
  ROL  randomLo
  ROL  randomHi
  RTS

Seeded at game start: randomLo=$A8, randomHi=$14 (JTZ: $E5/$E6).

There is only ONE random pair in the ROM, shared by river generation,
enemy selection, fuel checks, X-positioning, and direction flags.
"""


class LFSR:
    """16-bit LFSR matching the Atari 2600 hardware behaviour."""

    def __init__(self, lo: int = 0xA8, hi: int = 0x14):
        self.lo = lo & 0xFF
        self.hi = hi & 0xFF

    def next(self) -> None:
        """Advance the LFSR by one step (exact JTZ NextRandom16)."""
        hi = self.hi
        lo = self.lo
        # Accumulator = (hi << 3) ^ hi  — EOR uses the ORIGINAL hi value
        acc = ((hi << 3) ^ hi) & 0xFF
        # ASL on acc: bit 7 → carry
        carry1 = (acc >> 7) & 1
        # ROL lo: lo = (lo << 1) | carry1; old_lo bit 7 → carry
        carry2 = (lo >> 7) & 1
        lo = ((lo << 1) | carry1) & 0xFF
        # ROL hi: hi = (acc << 1) | carry2
        hi = ((acc << 1) | carry2) & 0xFF
        self.lo = lo
        self.hi = hi

    def get_lo(self) -> int:
        """Return current lo byte and advance."""
        val = self.lo
        self.next()
        return val

    def get_hi(self) -> int:
        """Return current hi byte and advance."""
        val = self.hi
        self.next()
        return val

    def peek_lo(self) -> int:
        """Return current lo byte without advancing."""
        return self.lo

    def peek_hi(self) -> int:
        """Return current hi byte without advancing."""
        return self.hi

    def reset(self) -> None:
        """Reset to initial seed."""
        self.lo = 0xA8
        self.hi = 0x14
