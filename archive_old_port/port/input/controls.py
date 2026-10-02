"""
River Raid — Input handling.

Mirrors JTZ joystick reading:
  $84 joystick = ?000rldu  (bit7=unused, bit6=fire, bit5=right, bit4=left, bit3=down, bit2=up)
"""

import pygame

from port.core import config


class Controls:
    """Keyboard/gamepad input state."""

    def __init__(self):
        self.pressed = set()
        self.just_pressed = set()

    def handle_event(self, event: pygame.event.Event):
        if event.type == pygame.KEYDOWN:
            self.pressed.add(event.key)
            self.just_pressed.add(event.key)
        elif event.type == pygame.KEYUP:
            self.pressed.discard(event.key)
            self.just_pressed.discard(event.key)

    def update(self):
        """Clear just-pressed after each frame."""
        self.just_pressed = set()

    def left(self) -> bool:
        return pygame.K_LEFT in self.pressed or pygame.K_a in self.pressed

    def right(self) -> bool:
        return pygame.K_RIGHT in self.pressed or pygame.K_d in self.pressed

    def up(self) -> bool:
        return pygame.K_UP in self.pressed or pygame.K_w in self.pressed

    def down(self) -> bool:
        return pygame.K_DOWN in self.pressed or pygame.K_s in self.pressed

    def fire(self) -> bool:
        return pygame.K_SPACE in self.pressed

    def just_fired(self) -> bool:
        return pygame.K_SPACE in self.just_pressed

    def restart(self) -> bool:
        return pygame.K_RETURN in self.just_pressed or pygame.K_r in self.just_pressed
