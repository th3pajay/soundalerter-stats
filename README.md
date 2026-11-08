# SoundAlerter Realm Stats

What players face in arenas, battlegrounds and world PvP, by realm and faction, from the [SoundAlerter](https://github.com/th3pajay/soundalerter-forever) addon's Global statistics.

The site is served by GitHub Pages from this repository's `main` branch.

## Data

- `data/index.json` lists each realm and faction, the days published, and when each was last updated.
- `data/<realm>-<faction>/<day>.sag1` holds one SAG1 export line: the realm's 7-day totals up to that server day (days since 1970-01-01 UTC).
- Every count is players, corrected for the decoys the addon adds. No player names, sender keys or raw reports are ever stored here.

Files are committed by the SoundAlerter Companion, a PowerShell script that reads the line the addon saves at logout. Each publisher uses a fine-grained token that can write only to this repository.

## Files

- `index.html`: the site.
- `sag1.js`: the SAG1 decoder, an ES module with no dependencies.
- `spells.json`: spell names and types for the alert spells the addon can share.

## SAG1 format, version 1 (frozen)

`SAG1.` followed by base64url without padding. The bytes are:

1. A version byte, `1`.
2. The server day, as a varint.
3. Players, as a varint.
4. The realm: a length byte, then that many UTF-8 bytes.
5. The faction: 1 Horde, 2 Alliance, 0 unknown.
6. The spell count, as a varint.
7. Each spell, by ascending ID:
   - the ID delta from the previous spell, as a varint;
   - the total players, as a varint;
   - a zone mask byte (1 Arena, 2 Battlegrounds, 4 World PvP);
   - a varint for each zone in the mask.
8. A 2-byte Fletcher-16 checksum.

Varints use 7 bits per byte, least significant first.
