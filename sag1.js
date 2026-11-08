const PREFIX = "SAG1.";
const ZONES = ["arena", "battleground", "worldPvP"];
const FACTIONS = { 1: "Horde", 2: "Alliance" };

function fromBase64Url(text) {
  if (!/^[A-Za-z0-9_-]*$/.test(text) || text.length % 4 === 1) throw new Error("not base64url");
  const padded = text.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((text.length + 3) % 4);
  const binary = typeof atob === "function" ? atob(padded) : Buffer.from(padded, "base64").toString("binary");
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function fletcher16(bytes, count) {
  let a = 0, b = 0;
  for (let i = 0; i < count; i++) { a = (a + bytes[i]) % 255; b = (b + a) % 255; }
  return b * 256 + a;
}

export function decodeSAG1(input) {
  const text = String(input || "").trim();
  if (!text.startsWith(PREFIX)) throw new Error("Not a SoundAlerter global statistics export (SAG1).");
  const bytes = fromBase64Url(text.slice(PREFIX.length));
  if (bytes.length < 8) throw new Error("The export is too short.");
  const count = bytes.length - 2;
  if (fletcher16(bytes, count) !== bytes[count] * 256 + bytes[count + 1]) throw new Error("Checksum failed: the export is damaged or incomplete.");
  let pos = 0;
  const byte = () => { if (pos >= count) throw new Error("The export is truncated."); return bytes[pos++]; };
  const varint = () => {
    let value = 0, scale = 1;
    for (let i = 0; i < 8; i++) { const b = byte(); value += (b & 127) * scale; if (b < 128) return value; scale *= 128; }
    throw new Error("Bad number in the export.");
  };
  if (byte() !== 1) throw new Error("Unknown export version.");
  const day = varint(), players = varint();
  const realmLength = byte();
  const realmBytes = bytes.slice(pos, pos + realmLength);
  if (realmBytes.length !== realmLength) throw new Error("The export is truncated.");
  pos += realmLength;
  const realm = new TextDecoder().decode(realmBytes);
  const faction = FACTIONS[byte()] || null;
  const total = varint(), spells = [];
  let id = 0;
  for (let i = 0; i < total; i++) {
    id += varint();
    const total = varint();
    const mask = byte(), byZone = {};
    ZONES.forEach((zone, bit) => { if (mask & (1 << bit)) byZone[zone] = varint(); });
    spells.push({ id, total, byZone });
  }
  if (pos !== count) throw new Error("Unexpected data after the spell list.");
  return { version: 1, day, date: new Date(day * 86400000).toISOString().slice(0, 10), players, realm, faction, spells };
}
