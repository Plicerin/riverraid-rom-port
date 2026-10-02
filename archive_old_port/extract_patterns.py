import re
import json

with open('reference/jentzsch_2001/River Raid.asm', 'r') as f:
    lines = f.readlines()

pfpats = {}
current = None
for i, line in enumerate(lines):
    stripped = line.rstrip()
    if stripped.endswith(':') and stripped[:-1].startswith('PFPat'):
        current = stripped[:-1]
        pfpats[current] = []
        continue
    if current and stripped.strip().startswith('.byte'):
        m = re.match(r'\s+\.byte\s+\$([0-9A-Fa-f]+)', stripped)
        if m:
            pfpats[current].append(int(m.group(1), 16))
            if len(pfpats[current]) > 28:
                current = None

for name in sorted(pfpats.keys(), key=lambda x: int(x[5:])):
    bl = pfpats[name]
    print(name + ': ' + ' '.join(format(b, '02X') for b in bl[:28]))

# Also extract BankPtrTab low bytes
print("\n--- BankPtrTab ---")
for i, line in enumerate(lines):
    if 'BankPtrTab:' in line and i > 2800:
        # Next lines are .byte <PFPatX
        for j in range(i+1, min(i+5, len(lines))):
            print(lines[j].rstrip())
        break

# EnemyIdTab
print("\n--- EnemyIdTab ---")
for i, line in enumerate(lines):
    if line.strip() == 'EnemyIdTab:':
        for j in range(i+1, min(i+3, len(lines))):
            print(lines[j].rstrip())
        break

# ShapePosTab
print("\n--- ShapePosTab ---")
for i, line in enumerate(lines):
    if 'ShapePosTab' in line and '.byte' not in line:
        for j in range(i, min(i+3, len(lines))):
            print(lines[j].rstrip())
        break
