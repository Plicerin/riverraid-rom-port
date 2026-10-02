"""
River Raid — Collision detection system.

Mirrors JTZ collision logic (lines 987–1407):
  - TIA collision registers: COLPM0, COLPM1, COLGRP
  - missileFlag ($E6): $FF = missile active
  - hitEnemyIdx ($E2): index of enemy hit by missile
  - collidedEnemy ($E8): enemy type ID that player collided with
  - PFCrashFlag ($E4): player crashed into playfield (river bank)
"""


class CollisionSystem:
    """Handles all collision detection in the game."""

    def __init__(self):
        pass

    def check_all(self, player, bullets, enemies, fuel_depots, explosions,
                  river, scoring, on_enemy_destroyed, on_fuel_pickup,
                  on_crash):
        """
        Run all collision checks for the current frame.

        Args:
            player: Player object
            bullets: List of Bullet objects
            enemies: List of Enemy objects
            fuel_depots: List of FuelDepot objects
            explosions: List of Explosion objects (no collision)
            river: River object
            scoring: ScoringSystem object
            on_enemy_destroyed: Callback(enemy) when bullet hits enemy
            on_fuel_pickup: Callback(fuel) when player touches fuel
            on_crash: Callback() when player crashes
        """
        # Bullet-enemy collisions
        for bullet in bullets:
            if not bullet.active:
                continue
            bx, by, bw, bh = bullet.x, bullet.y, 8, 8

            for enemy in enemies:
                if not enemy.alive:
                    continue
                if enemy.collides_with(bx, by, bw, bh):
                    enemy.alive = False
                    on_enemy_destroyed(enemy)
                    bullet.active = False
                    break

        # Bullet-fuel collisions (destroying fuel = bad!)
        for bullet in bullets:
            if not bullet.active:
                continue
            bx, by, bw, bh = bullet.x, bullet.y, 8, 8

            for fuel in fuel_depots:
                if not fuel.alive:
                    continue
                fx, fy, fw, fh = fuel.rect
                if (bx < fx + fw and bx + bw > fx and
                        by < fy + fh and by + bh > fy):
                    on_fuel_pickup(fuel)
                    bullet.active = False
                    break

        # Player-fuel collision (refueling)
        for fuel in fuel_depots:
            if not fuel.alive:
                continue
            fx, fy, fw, fh = fuel.rect
            if (player.x < fx + fw and player.x + 8 > fx and
                    player.y < fy + fh and player.y + 18 > fy):
                on_fuel_pickup(fuel)
                break

        # Player-river bank collision
        if player.state == 0:
            if river.check_collision(player.x, player.y, 8, 18):
                on_crash()

        # Player-enemy collision
        for enemy in enemies:
            if not enemy.alive:
                continue
            if enemy.collides_with(player.x, player.y, 8, 18):
                on_crash()
                enemy.alive = False
                break

        # Update multiplier decay
        scoring.update()
