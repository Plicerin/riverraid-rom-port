import re, json

with open('extraction/riverraid_annotated_asm_map.html') as f:
    html = f.read()

rows = re.findall(r'<td>([^<]+)</td>\s*<td>\$([0-9A-F]+)</td>\s*<td>(0x[0-9A-F]+)</td>', html)
print('All labels from ASM map:')
for label, cpu, rom in rows:
    print(f'  {label}: CPU=${cpu}, ROM={rom}')

# Now extract PFPat0 data
# PFPat0 is at ROM 0x00E6, 16 bytes (one pattern row set)
# The patterns are 16-byte rows repeated

# Extract from the verified report
with open('extraction/riverraid_verified_playfield_report.json') as f:
    pf_data = json.load(f)

print('\nVerified playfield patterns:')
for p in pf_data.get('patterns', []):
    if isinstance(p, dict):
        name = p.get('name', '?')
        meta = p.get('meta', {})
        hex_data = meta.get('bytesHex', '')
        cpu = meta.get('cpuAddr', '?')
        byte_list = [int(b, 16) for b in hex_data.split()] if hex_data else []
        print(f'  {name}: CPU=${cpu}, {len(byte_list)} bytes')

# Now read the raw ROM bytes for patterns
print('\n\nReading raw ROM...')
with open('extraction/riverraid.rom', 'rb') as f:
    rom = f.read()

print(f'ROM size: {len(rom)} bytes')

# Extract PFPat0 at 0x00E6
offset = 0x00E6
pat0 = rom[offset:offset+32]
print(f'PFPat0 at 0x00E6: {pat0.hex(" ")}')

# The patterns are 16 bytes (one 8x16 block)
# PFPat0-PFPat8 are river banks, PFPat9-PFPat14 are islands
# Each pattern is 16 bytes (8 bits x 16 rows)

# Let's look at the BankPtrTab at 0x01D7
bank_tab_offset = 0x01D7
bank_tab = rom[bank_tab_offset:bank_tab_offset+20]
print(f'BankPtrTab at 0x01D7: {bank_tab.hex(" ")}')

# ShapePosTab at 0x00C6
shape_pos_offset = 0x00C6
shape_pos = rom[shape_pos_offset:shape_pos_offset+20]
print(f'ShapePosTab at 0x00C6: {shape_pos.hex(" ")}')

# EnemyIdTab at 0x0459
enemy_tab_offset = 0x0459
enemy_tab = rom[enemy_tab_offset:enemy_tab_offset+20]
print(f'EnemyIdTab at 0x0459: {enemy_tab.hex(" ")}')

# ScoreTab - look for it
# From JTZ: ScoreTab has 11 entries
# Plane=100, Heli=60, Ship=30, Bridge=500, House=0, Fuel=80
# These are stored as digit arrays in the DIGIT_H*value format

# Let's look at what patterns look like in the ROM
print('\n\nPattern analysis:')
# PFPat0 at 0x00E6
for pat_id in range(15):
    # Find pattern data by looking at the verified report
    for p in pf_data.get('patterns', []):
        if isinstance(p, dict) and p.get('name') == f'PFPat{pat_id}':
            meta = p.get('meta', {})
            cpu = meta.get('cpuAddr', '')
            if cpu:
                rom_off = int(cpu.replace('$', '0x'), 16)
                byte_list = [int(b, 16) for b in meta.get('bytesHex', '').split()]
                print(f'  PFPat{pat_id}: ROM={hex(rom_off)}, {len(byte_list)} bytes')
                break
    else:
        print(f'  PFPat{pat_id}: NOT FOUND in verified report')

# Also check for PFPat1, PFPat2, etc. in the ROM
# From JTZ, PFPat0-8 are 16-byte patterns (river banks)
# They're at consecutive locations
print('\n\nRaw ROM bytes around pattern area:')
for off in range(0x00E6, 0x0200, 16):
    chunk = rom[off:off+16]
    print(f'  0x{off:04X}: {chunk.hex(" ")}')
