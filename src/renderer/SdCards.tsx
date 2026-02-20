import {
  Alert,
  Button,
  IconButton,
  InputBase,
  LinearProgress,
  Paper,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material';
import { useCallback, useEffect, useState } from 'react';
import { Eject, Refresh } from '@mui/icons-material';
import { SdCard } from '../common/types';

function SdCardContent({
  keyToPercent,
  sdCard,
  forwarderVersion,
  slippiNintendontVersion,
  openErrorMessage,
  refresh,
}: {
  keyToPercent: Map<string, number>;
  sdCard: SdCard;
  forwarderVersion: string;
  slippiNintendontVersion: string;
  openErrorMessage: (message: string) => void;
  refresh: () => Promise<void>;
}) {
  const [copyingIso, setCopyingIso] = useState(false);
  const [copyingApps, setCopyingApps] = useState(false);
  const [writing, setWriting] = useState(false);
  const [wrote, setWrote] = useState(false);

  return sdCard.reason ? (
    <Alert severity="warning">{sdCard.reason}</Alert>
  ) : (
    <>
      <Typography variant="caption" lineHeight="20px">
        {sdCard.validIsoPath ? '✅' : '❌'} Melee ISO
        {sdCard.validIsoPath ? `: ${sdCard.validIsoPath}` : ' not found'}
      </Typography>
      <Typography variant="caption" lineHeight="20px">
        {sdCard.forwarderVersion === forwarderVersion ? '✅' : '❌'} Forwarder
        for Slippi Nintendont{' '}
        {sdCard.forwarderVersion
          ? `version: ${sdCard.forwarderVersion}`
          : 'not found'}
      </Typography>
      <Typography variant="caption" lineHeight="20px">
        {sdCard.slippiNintendontVersion === slippiNintendontVersion
          ? '✅'
          : '❌'}{' '}
        Slippi Nintendont{' '}
        {sdCard.slippiNintendontVersion
          ? `version: ${sdCard.slippiNintendontVersion}`
          : 'not found'}
      </Typography>
      {copyingIso && (
        <LinearProgress
          variant="determinate"
          value={(keyToPercent.get(sdCard.key) ?? 0) * 100}
        />
      )}
      <Stack direction="row" justifyContent="end" gap="8px" marginTop="8px">
        <Button
          disabled={Boolean(sdCard.validIsoPath) || copyingIso}
          variant="contained"
          onClick={async () => {
            setCopyingIso(true);
            try {
              await window.electron.copyIso(sdCard);
              refresh();
            } catch (e: unknown) {
              openErrorMessage(
                e instanceof Error ? e.message : JSON.stringify(e ?? ''),
              );
            } finally {
              setCopyingIso(false);
            }
          }}
        >
          {copyingIso ? 'Copying ISO...' : 'Copy ISO'}
        </Button>
        <Button
          disabled={
            (sdCard.forwarderVersion === forwarderVersion &&
              sdCard.slippiNintendontVersion === slippiNintendontVersion) ||
            copyingApps
          }
          variant="contained"
          onClick={async () => {
            setCopyingApps(true);
            try {
              await window.electron.copyApps(sdCard);
              refresh();
            } catch (e: unknown) {
              openErrorMessage(
                e instanceof Error ? e.message : JSON.stringify(e ?? ''),
              );
            } finally {
              setCopyingApps(false);
            }
          }}
        >
          Copy Apps
        </Button>
        <Button
          disabled={
            !sdCard.validIsoPath ||
            sdCard.slippiNintendontVersion !== slippiNintendontVersion ||
            writing ||
            wrote
          }
          variant="contained"
          onClick={async () => {
            setWriting(true);
            try {
              await window.electron.writeConfig(sdCard);
              setWrote(true);
              setTimeout(() => {
                setWrote(false);
              }, 5000);
            } catch (e: unknown) {
              openErrorMessage(
                e instanceof Error ? e.message : JSON.stringify(e ?? ''),
              );
            } finally {
              setWriting(false);
            }
          }}
        >
          {wrote ? 'Copied!' : 'Copy Config'}
        </Button>
      </Stack>
    </>
  );
}

function SdCardEl({
  keyToPercent,
  sdCard,
  forwarderVersion,
  slippiNintendontVersion,
  openErrorMessage,
  refresh,
  removeSdCard,
}: {
  keyToPercent: Map<string, number>;
  sdCard: SdCard;
  forwarderVersion: string;
  slippiNintendontVersion: string;
  openErrorMessage: (message: string) => void;
  refresh: () => Promise<void>;
  removeSdCard: () => void;
}) {
  const [ejecting, setEjecting] = useState(false);

  return (
    <Paper
      elevation={2}
      style={{ display: 'flex', flexDirection: 'column', padding: '0 8px 8px' }}
    >
      <Stack direction="row">
        <InputBase
          disabled
          size="small"
          value={sdCard.key}
          style={{ flexGrow: 1 }}
        />
        <Tooltip arrow placement="left" title="Eject">
          <IconButton
            disabled={ejecting}
            onClick={async () => {
              setEjecting(true);
              try {
                await window.electron.ejectSdCard(sdCard.key);
                removeSdCard();
              } catch (e: unknown) {
                openErrorMessage(
                  e instanceof Error ? e.message : JSON.stringify(e ?? ''),
                );
              } finally {
                setEjecting(false);
              }
            }}
          >
            <Eject />
          </IconButton>
        </Tooltip>
      </Stack>
      <SdCardContent
        keyToPercent={keyToPercent}
        sdCard={sdCard}
        forwarderVersion={forwarderVersion}
        slippiNintendontVersion={slippiNintendontVersion}
        openErrorMessage={openErrorMessage}
        refresh={refresh}
      />
    </Paper>
  );
}

export default function SdCards({
  slippiNintendontVersion,
  openErrorMessage,
}: {
  slippiNintendontVersion: string;
  openErrorMessage: (message: string) => void;
}) {
  const [sdCards, setSdCards] = useState<SdCard[]>([]);
  const [forwarderVersion, setForwarderVersion] = useState('');
  useEffect(() => {
    (async () => {
      const sdCardsPromise = window.electron.getSdCards();
      const forwarderVersionPromise = window.electron.getForwarderVersion();
      setSdCards(await sdCardsPromise);
      setForwarderVersion(await forwarderVersionPromise);
    })();
  }, []);

  const [keyToPercent, setKeyToPercent] = useState(new Map<string, number>());
  useEffect(() => {
    window.electron.onProgress((event, progress) => {
      setKeyToPercent(
        new Map(progress.map(({ key, percent }) => [key, percent])),
      );
    });
  }, []);

  const [refreshing, setRefreshing] = useState(false);
  const refresh = useCallback(async () => {
    setRefreshing(true);
    try {
      setSdCards(await window.electron.getSdCards());
    } catch (e: unknown) {
      openErrorMessage(
        e instanceof Error ? e.message : JSON.stringify(e ?? ''),
      );
    } finally {
      setRefreshing(false);
    }
  }, [openErrorMessage]);

  const [ejecting, setEjecting] = useState(false);

  return (
    <Stack margin="8px -8px" gap="8px">
      <Paper
        elevation={2}
        style={{
          display: 'flex',
          flexDirection: 'column',
          padding: '0 8px 8px',
        }}
      >
        <Stack direction="row">
          <InputBase
            disabled
            size="small"
            value={sdCards.length > 0 ? sdCards[0].key : 'Insert SD Card...'}
            style={{ flexGrow: 1 }}
          />
          {sdCards.length > 0 && (
            <Tooltip arrow placement="left" title="Eject">
              <IconButton
                disabled={ejecting}
                onClick={async () => {
                  setEjecting(true);
                  try {
                    await window.electron.ejectSdCard(sdCards[0].key);
                    const newSdCards = sdCards.slice(1);
                    setSdCards(newSdCards);
                  } catch (e: unknown) {
                    openErrorMessage(
                      e instanceof Error ? e.message : JSON.stringify(e ?? ''),
                    );
                  } finally {
                    setEjecting(false);
                  }
                }}
              >
                <Eject />
              </IconButton>
            </Tooltip>
          )}
          <Tooltip arrow placement="top" title="Refresh">
            <IconButton disabled={refreshing} onClick={refresh}>
              <Refresh />
            </IconButton>
          </Tooltip>
        </Stack>
        {sdCards.length > 0 && (
          <SdCardContent
            keyToPercent={keyToPercent}
            sdCard={sdCards[0]}
            forwarderVersion={forwarderVersion}
            slippiNintendontVersion={slippiNintendontVersion}
            openErrorMessage={openErrorMessage}
            refresh={refresh}
          />
        )}
      </Paper>
      {sdCards.slice(1).map((sdCard) => (
        <SdCardEl
          key={sdCard.key}
          keyToPercent={keyToPercent}
          sdCard={sdCard}
          forwarderVersion={forwarderVersion}
          slippiNintendontVersion={slippiNintendontVersion}
          openErrorMessage={openErrorMessage}
          refresh={refresh}
          removeSdCard={() => {
            const newSdCards = sdCards.filter(
              (newSdCard) => newSdCard.key !== sdCard.key,
            );
            setSdCards(newSdCards);
          }}
        />
      ))}
    </Stack>
  );
}
