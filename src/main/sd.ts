import { constants } from 'fs';
import {
  access,
  copyFile,
  mkdir,
  readdir,
  readFile,
  rm,
  writeFile,
} from 'fs/promises';
import path from 'path';
import { XMLParser } from 'fast-xml-parser';
import { list } from 'drivelist';
import { app } from 'electron';
import { gt, valid } from 'semver';
import isValidISO from './iso';
import { Config, SdCard, Video } from '../common/types';

type RemovableDrive = {
  path: string;
  readonly: boolean;
  size: number;
};

const xmlParser = new XMLParser({ parseTagValue: false });

function canEnableStealthAutoboot(slippiNintendontVersion: string) {
  return (
    !valid(slippiNintendontVersion) || gt(slippiNintendontVersion, '1.13.0')
  );
}

async function getSdCard(
  removableDrive: RemovableDrive,
): Promise<SdCard | null> {
  let reason = '';
  let forwarderVersion = '';
  let slippiNintendontVersion = '';
  let validIsoPath = '';
  if (!removableDrive.readonly) {
    try {
      await access(removableDrive.path, constants.R_OK | constants.W_OK);

      const slippiNintendontMetaPath = path.join(
        removableDrive.path,
        'apps',
        'Slippi Nintendont',
        'meta.xml',
      );
      try {
        const metaXmlBuffer = await readFile(slippiNintendontMetaPath);
        const metaObj = xmlParser.parse(metaXmlBuffer);
        if (metaObj?.app?.name === 'Slippi Nintendont') {
          const { version } = metaObj.app;
          if (typeof version === 'string') {
            slippiNintendontVersion = version;
          }
        }
      } catch {
        // just catch
      }

      const forwarderMetaPath = path.join(
        removableDrive.path,
        'apps',
        'slippi-nintendont-forwarder',
        'meta.xml',
      );
      try {
        const metaXmlBuffer = await readFile(forwarderMetaPath);
        const metaObj = xmlParser.parse(metaXmlBuffer);
        if (metaObj?.app?.name === 'Forwarder for Slippi Nintendont') {
          const { version } = metaObj.app;
          if (typeof version === 'string') {
            forwarderVersion = version;
          }
        }
      } catch {
        // just catch
      }

      const gamesPath = path.join(removableDrive.path, 'games');
      try {
        const gamesPaths = await readdir(gamesPath, { recursive: true });
        const validIsos = (
          await Promise.all(
            gamesPaths
              .filter((gamePath) => gamePath.toLowerCase().endsWith('.iso'))
              .map(async (gamePath) => {
                if (await isValidISO(path.join(gamesPath, gamePath))) {
                  return gamePath;
                }
                return null;
              }),
          )
        ).filter((gamePath) => gamePath !== null) as string[];
        if (validIsos.length > 0) {
          validIsoPath = path.join('games', validIsos[0]);
        }
      } catch {
        // just catch
      }
    } catch (e: unknown) {
      reason = e instanceof Error ? e.message : JSON.stringify(e ?? 'Unknown');
    }
  } else {
    reason = 'Read Only';
  }

  return {
    key: removableDrive.path,
    reason,
    forwarderVersion,
    slippiNintendontVersion,
    validIsoPath,
  };
}

export default async function getSdCards(): Promise<SdCard[]> {
  const removableDriveList: RemovableDrive[] = (await list())
    .filter(
      (drive) =>
        !drive.error &&
        drive.isRemovable &&
        drive.size !== null &&
        !drive.isVirtual,
    )
    .map(
      (drive): RemovableDrive => ({
        path:
          process.platform === 'win32'
            ? drive.mountpoints[0].path.slice(0, -1)
            : drive.mountpoints[0].path,
        readonly: drive.isReadOnly,
        size: drive.size!,
      }),
    );

  return (await Promise.all(removableDriveList.map(getSdCard))).filter(
    (sdCard) => sdCard !== null,
  ) as SdCard[];
}

export async function writeNincfg(
  sdCard: SdCard,
  config: Config,
  codePath: string,
) {
  const buffer = Buffer.alloc(324);

  // magic
  buffer.writeUint32BE(0x01070cf6, 0);

  // config version
  buffer.writeUint32BE(0x0000000d, 4);

  // config bits
  let configUint = config.cheats ? 1 : 0;
  if (config.forceProgressive) {
    configUint |= 1 << 5;
  }
  if (config.autoBoot) {
    configUint |= 1 << 10;
  }
  if (config.replays) {
    configUint |= 1 << 14;
  }
  buffer.writeUint32BE(configUint, 8);

  // video mode
  switch (config.video) {
    // high bits
    // 0000: Auto
    // 0001: Force
    // 0002: None
    // 0004: Force DF
    // low bits
    // 0001: PAL50
    // 0002: PAL60
    // 0004: NTSC
    // 0008: MPAL
    case Video.PAL60:
      buffer.writeUint32BE(0x00010002, 12);
      break;
    default:
      // Auto
      buffer.writeUint32BE(0, 12);
      break;
  }

  // language
  buffer.writeUint32BE(0xffffffff, 16);

  // game path
  let gamePath = sdCard.validIsoPath;
  if (process.platform === 'win32') {
    const gamePathParts = gamePath.split(path.sep);
    gamePath = gamePathParts.join('/');
  }
  gamePath = `/${gamePath}`;
  const gamePathLength = gamePath.length;
  if (gamePathLength < 256) {
    const gamePathBuffer = Buffer.from(gamePath);
    gamePathBuffer.copy(buffer, 20);
    for (let i = 20 + gamePathLength; i < 276; i += 1) {
      buffer.writeUint8(0, i);
    }
  }

  // game id
  buffer.writeUint32BE(0x47414c45, 276);

  // mem card blocks
  buffer.writeUint8(2, 280);

  // video scale
  buffer.writeUint8(0, 281);

  // video offset
  buffer.writeUint8(0, 282);

  // unused
  buffer.writeUint8(0, 283);

  // UseUSB
  buffer.writeUInt32BE(0, 284);

  // melee codes
  buffer.writeUInt32BE(config.ucf, 288);
  buffer.writeUInt32BE(config.pal ? 2 : 1, 292);
  buffer.writeUInt32BE(config.mods, 296);
  buffer.writeUInt32BE(config.lag, 300);
  buffer.writeUInt32BE(config.frozen, 304);
  buffer.writeUInt32BE(config.gameplay, 308);
  buffer.writeUInt32BE(config.widescreen, 312);
  buffer.writeUInt32BE(config.safety ? 2 : 1, 316);

  // replay led
  buffer.writeUint32BE(0, 320);

  await writeFile(path.join(sdCard.key, 'slippi_nincfg.bin'), buffer);
  if (config.cheats) {
    // remove any existing codes
    const isoDir = path.dirname(path.join(sdCard.key, sdCard.validIsoPath));
    await rm(path.join(isoDir, 'game.gct'), { force: true });
    await rm(path.join(isoDir, 'GALE01.gct'), { force: true });
    await rm(path.join(sdCard.key, 'games', 'GALE01', 'GALE01.gct'), {
      force: true,
    });

    // copy in our codefile
    await mkdir(path.join(sdCard.key, 'codes'), { recursive: true });
    const dstPath = path.join(sdCard.key, 'codes', 'GALE01.gct');
    if (codePath) {
      await copyFile(codePath, dstPath);
    } else {
      await copyFile(
        app.isPackaged
          ? path.join(process.resourcesPath, 'assets', 'GALE01.gct')
          : path.join(__dirname, '..', '..', 'assets', 'GALE01.gct'),
        dstPath,
      );
    }
  }
  if (canEnableStealthAutoboot(sdCard.slippiNintendontVersion)) {
    if (config.stealthAutoBoot) {
      await writeFile(path.join(sdCard.key, 'enable_stealth_autoboot.txt'), '');
    } else {
      await rm(path.join(sdCard.key, 'enable_stealth_autoboot.txt'), {
        force: true,
      });
    }
  }
}
