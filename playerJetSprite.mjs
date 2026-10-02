import * as visiblePort from './riverraidVisiblePort.mjs';

const PLAYER_JET_VARIANTS_RAW = {
  Straight: ['00000000','00000000','00000000','00000000','00000000','00101010','00111110','00011100','00001000','01001001','01101011','01111111','01111111','00111110','00011100','00001000','00001000','00001000'],
  Move: ['00000000','00000000','00000000','00000000','00000010','00101110','00111100','00011000','00001000','00001010','00101110','00111110','00111110','00111100','00011000','00001000','00001000','00001000'],
};

function orientPlayerJet(bitmap) {
  return [...bitmap].reverse();
}

function resolvePlayerJetBitmap(frameCnt = 0, gameMode = 0) {
  if (gameMode === 0xff) {
    return visiblePort.resolveVisibleSpriteVariant(visiblePort.SHAPE_IDS.ID_EXPLOSION0, frameCnt).bitmap;
  }
  const base = (frameCnt & 1) ? PLAYER_JET_VARIANTS_RAW.Move : PLAYER_JET_VARIANTS_RAW.Straight;
  return orientPlayerJet(base);
}

export { PLAYER_JET_VARIANTS_RAW, orientPlayerJet, resolvePlayerJetBitmap };
