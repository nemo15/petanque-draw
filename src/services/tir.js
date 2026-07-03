export const SCORING = { carreau: 5, reussi: 3, touche: 1, manque: 0 };
export const ATELIER_KEYS = ['atelier1', 'atelier2', 'atelier3', 'atelier4', 'atelier5'];
export const DISTANCES_FULL = [6, 7, 8, 9];
export const DISTANCES_JUNIOR = [6, 7, 8];
export const RESULT_OPTIONS = [
  { key: 'carreau', points: 5 },
  { key: 'reussi', points: 3 },
  { key: 'touche', points: 1 },
  { key: 'manque', points: 0 },
];

export function getScoreTotal(participant, key) {
  if (!participant[key]) return 0;
  let total = 0;
  Object.values(participant[key]).forEach((atelier) => {
    if (atelier && typeof atelier === 'object') {
      Object.values(atelier).forEach((val) => {
        total += SCORING[val] || 0;
      });
    }
  });
  return total;
}

export function getScoreCarreauCount(participant, key) {
  if (!participant[key]) return 0;
  let count = 0;
  Object.values(participant[key]).forEach((atelier) => {
    if (atelier && typeof atelier === 'object') {
      Object.values(atelier).forEach((val) => {
        if (val === 'carreau') count++;
      });
    }
  });
  return count;
}

export function getScoreReussiCount(participant, key) {
  if (!participant[key]) return 0;
  let count = 0;
  Object.values(participant[key]).forEach((atelier) => {
    if (atelier && typeof atelier === 'object') {
      Object.values(atelier).forEach((val) => {
        if (val === 'reussi') count++;
      });
    }
  });
  return count;
}

export function getCombinedTotal(participant) {
  return getScoreTotal(participant, 'scores') + getScoreTotal(participant, 'scores2');
}

export function getThrowCount(participant, key) {
  if (!participant[key]) return 0;
  let count = 0;
  Object.values(participant[key]).forEach((atelier) => {
    if (atelier && typeof atelier === 'object') {
      count += Object.keys(atelier).length;
    }
  });
  return count;
}

export function isParticipantComplete(participant, key, totalThrows) {
  return getThrowCount(participant, key) >= totalThrows;
}

export function getAtelierScore(participant, key, atelierIdx) {
  const scores = participant[key]?.[atelierIdx];
  if (!scores) return 0;
  return Object.values(scores).reduce((sum, val) => sum + (SCORING[val] || 0), 0);
}

export function isAtelierComplete(participant, key, atelierIdx, distancesCount) {
  const scores = participant[key]?.[atelierIdx];
  if (!scores) return false;
  return Object.keys(scores).length >= distancesCount;
}

export function rankParticipants(participants, key) {
  return [...participants].sort(
    (a, b) =>
      getScoreTotal(b, key) - getScoreTotal(a, key) || getScoreCarreauCount(b, key) - getScoreCarreauCount(a, key),
  );
}

export function rankByR1(participants) {
  return rankParticipants(participants, 'scores');
}

export function rankByCombined(participants) {
  return [...participants].sort(
    (a, b) =>
      getCombinedTotal(b) - getCombinedTotal(a) ||
      getScoreCarreauCount(b, 'scores') +
        getScoreCarreauCount(b, 'scores2') -
        (getScoreCarreauCount(a, 'scores') + getScoreCarreauCount(a, 'scores2')),
  );
}

export function getDirectQualifiers(participants, count = 4) {
  return rankByR1(participants).slice(0, count);
}

export function getR2Candidates(participants, directCount = 4, maxR2 = 16) {
  return rankByR1(participants).slice(directCount, directCount + maxR2);
}

export function getR2QualifiersWithTies(participants, tiebreakerCount, directCount = 4, r2EndPosition = 20) {
  const ranked = rankWithTiebreakers(participants, 'scores', tiebreakerCount);

  if (ranked.length <= r2EndPosition) {
    return ranked.slice(directCount);
  }

  const baseQualifiers = ranked.slice(directCount, r2EndPosition);
  const lastQualifier = ranked[r2EndPosition - 1];
  const lastScore = getScoreTotal(lastQualifier, 'scores');

  const extraQualifiers = [];
  for (let i = r2EndPosition; i < ranked.length; i++) {
    const p = ranked[i];
    if (getScoreTotal(p, 'scores') !== lastScore) break;
    extraQualifiers.push(p);
  }

  return [...baseQualifiers, ...extraQualifiers];
}

export function getTiebreakerKey(round) {
  return `tiebreaker_${round}`;
}

export function rankWithTiebreakers(participants, mainKey, tiebreakerCount) {
  return [...participants].sort((a, b) => {
    const diff =
      getScoreTotal(b, mainKey) - getScoreTotal(a, mainKey) ||
      getScoreCarreauCount(b, mainKey) - getScoreCarreauCount(a, mainKey) ||
      getScoreReussiCount(b, mainKey) - getScoreReussiCount(a, mainKey);
    if (diff !== 0) return diff;
    for (let i = 1; i <= tiebreakerCount; i++) {
      const tbKey = getTiebreakerKey(i);
      const tbDiff =
        getScoreTotal(b, tbKey) - getScoreTotal(a, tbKey) ||
        getScoreCarreauCount(b, tbKey) - getScoreCarreauCount(a, tbKey) ||
        getScoreReussiCount(b, tbKey) - getScoreReussiCount(a, tbKey);
      if (tbDiff !== 0) return tbDiff;
    }
    return 0;
  });
}

export function findTiesAtBoundary(rankedParticipants, boundaryIndex, mainKey, tiebreakerCount) {
  if (boundaryIndex <= 0 || boundaryIndex >= rankedParticipants.length) return [];
  const lastIn = rankedParticipants[boundaryIndex - 1];
  const firstOut = rankedParticipants[boundaryIndex];

  const lastInScore = getScoreTotal(lastIn, mainKey);
  const firstOutScore = getScoreTotal(firstOut, mainKey);
  if (lastInScore !== firstOutScore) return [];
  if (getScoreCarreauCount(lastIn, mainKey) !== getScoreCarreauCount(firstOut, mainKey)) return [];
  if (getScoreReussiCount(lastIn, mainKey) !== getScoreReussiCount(firstOut, mainKey)) return [];

  for (let i = 1; i <= tiebreakerCount; i++) {
    const tbKey = getTiebreakerKey(i);
    if (getScoreTotal(lastIn, tbKey) !== getScoreTotal(firstOut, tbKey)) return [];
    if (getScoreCarreauCount(lastIn, tbKey) !== getScoreCarreauCount(firstOut, tbKey)) return [];
    if (getScoreReussiCount(lastIn, tbKey) !== getScoreReussiCount(firstOut, tbKey)) return [];
  }

  const tiedScore = lastInScore;
  const tiedCarreau = getScoreCarreauCount(lastIn, mainKey);
  const tiedReussi = getScoreReussiCount(lastIn, mainKey);
  return rankedParticipants.filter((p) => {
    if (getScoreTotal(p, mainKey) !== tiedScore) return false;
    if (getScoreCarreauCount(p, mainKey) !== tiedCarreau) return false;
    if (getScoreReussiCount(p, mainKey) !== tiedReussi) return false;
    for (let i = 1; i <= tiebreakerCount; i++) {
      const tbKey = getTiebreakerKey(i);
      if (getScoreTotal(p, tbKey) !== getScoreTotal(lastIn, tbKey)) return false;
      if (getScoreCarreauCount(p, tbKey) !== getScoreCarreauCount(lastIn, tbKey)) return false;
      if (getScoreReussiCount(p, tbKey) !== getScoreReussiCount(lastIn, tbKey)) return false;
    }
    return true;
  });
}

export function detectTiebreakersNeeded(participants, tiebreakerCount) {
  const ranked = rankWithTiebreakers(participants, 'scores', tiebreakerCount);
  const top4Ties = findTiesAtBoundary(ranked, 4, 'scores', tiebreakerCount);
  return { top4Ties, r2Ties: [], ranked };
}

export function isTiebreakerComplete(participant, tbKey) {
  const scores = participant[tbKey];
  if (!scores) return false;
  let count = 0;
  Object.values(scores).forEach((atelier) => {
    if (atelier && typeof atelier === 'object') {
      count += Object.keys(atelier).length;
    }
  });
  return count >= 5;
}

export function generateSeededBracket(n) {
  if (n === 2) return [[0, 1]];
  if (n === 4)
    return [
      [0, 3],
      [1, 2],
    ];
  if (n === 8)
    return [
      [0, 7],
      [3, 4],
      [1, 6],
      [2, 5],
    ];
  return buildSeededPairs(n);
}

function buildSeededPairs(n) {
  if (n === 2) return [[0, 1]];
  const half = buildSeededPairs(n / 2);
  const pairs = [];
  for (const [a, b] of half) {
    pairs.push([a, n - 1 - a]);
    pairs.push([b, n - 1 - b]);
  }
  return pairs;
}

export function createMatch(player1, player2) {
  return {
    player1,
    player2,
    scores1: {},
    scores2: {},
    score1: null,
    score2: null,
    complete: false,
    winner: null,
    loser: null,
    tieWinner: null,
  };
}

export function buildPlayoffBracket(qualifiedNames, size) {
  if (size === 2) {
    return {
      rounds: [],
      qualified: qualifiedNames,
      size,
      thirdPlace: null,
      final: createMatch(qualifiedNames[0], qualifiedNames[1]),
    };
  }
  const pairs = generateSeededBracket(size);
  const matches = pairs.map(([a, b]) => createMatch(qualifiedNames[a], qualifiedNames[b]));
  return {
    rounds: [{ matches }],
    qualified: qualifiedNames,
    size,
    thirdPlace: null,
    final: null,
  };
}

export function advancePlayoff(playoff) {
  if (!playoff || !playoff.rounds || !playoff.rounds.length) return false;
  if (playoff.final) return false;

  const lastRound = playoff.rounds[playoff.rounds.length - 1];
  const allComplete = lastRound.matches.every((m) => m.complete);
  if (!allComplete) return false;

  const winners = lastRound.matches.map((m) => m.winner);
  const losers = lastRound.matches.map((m) => m.loser);

  if (winners.length === 2) {
    playoff.final = createMatch(winners[0], winners[1]);
    if (playoff.size >= 4) {
      playoff.thirdPlace = createMatch(losers[0], losers[1]);
    }
  } else if (winners.length > 2) {
    const nextMatches = [];
    for (let i = 0; i < winners.length; i += 2) {
      nextMatches.push(createMatch(winners[i], winners[i + 1]));
    }
    playoff.rounds.push({ matches: nextMatches });
  }
  return true;
}

export function getMatchPlayerScore(match, playerNum) {
  const key = playerNum === 1 ? 'scores1' : 'scores2';
  const scores = match[key];
  if (!scores) return 0;
  let total = 0;
  Object.values(scores).forEach((atelier) => {
    if (atelier && typeof atelier === 'object') {
      Object.values(atelier).forEach((val) => {
        total += SCORING[val] || 0;
      });
    }
  });
  return total;
}

export function getMatchPlayerThrows(match, playerNum) {
  const key = playerNum === 1 ? 'scores1' : 'scores2';
  const scores = match[key];
  if (!scores) return 0;
  let count = 0;
  Object.values(scores).forEach((atelier) => {
    if (atelier && typeof atelier === 'object') {
      count += Object.keys(atelier).length;
    }
  });
  return count;
}

export function isMatchComplete(match, totalThrows) {
  const t1 = getMatchPlayerThrows(match, 1);
  const t2 = getMatchPlayerThrows(match, 2);
  if (t1 < totalThrows || t2 < totalThrows) return false;
  const s1 = getMatchPlayerScore(match, 1);
  const s2 = getMatchPlayerScore(match, 2);
  if (s1 === s2) return !!match.tieWinner;
  return true;
}

export function getMatchWinner(match, totalThrows) {
  if (!isMatchComplete(match, totalThrows)) return null;
  const s1 = getMatchPlayerScore(match, 1);
  const s2 = getMatchPlayerScore(match, 2);
  if (s1 === s2) return match.tieWinner === 1 ? match.player1 : match.player2;
  return s1 > s2 ? match.player1 : match.player2;
}

export function buildTableRows({
  participants,
  directIds,
  r2Ids,
  r2CandidateIds,
  playoff,
  currentRound,
  isTwoRoundSystem,
  hasPlayoffScores,
  labels,
  tiebreakerCount = 0,
}) {
  const r1Ranked = rankWithTiebreakers(participants, 'scores', tiebreakerCount);

  const allPlayers = r1Ranked.map((p) => {
    const isDirect = directIds.includes(p.id);
    const isR2 = r2Ids.includes(p.id);
    const r1Started = getThrowCount(p, 'scores') > 0;
    const r1Score = getScoreTotal(p, 'scores');
    const r2Started = isR2 && getThrowCount(p, 'scores2') > 0;
    const r2Score = isR2 ? getScoreTotal(p, 'scores2') : null;
    const combined = isR2 ? r1Score + r2Score : r1Score;

    let place, rowClass;
    const qualifiedNames = playoff?.qualified || [];
    const isPlayoffQualified = qualifiedNames.includes(p.name);
    if (isDirect || (!isR2 && isPlayoffQualified)) {
      rowClass = 'tir-table__row--direct';
      place = labels.direct;
    } else if (isR2 && isPlayoffQualified) {
      rowClass = 'tir-table__row--direct';
      place = labels.r2Qualifier;
    } else if (isR2) {
      rowClass = 'tir-table__row--r2';
      place = '';
    } else if (isTwoRoundSystem && currentRound === 1 && r2CandidateIds.includes(p.id)) {
      rowClass = 'tir-table__row--r2';
      place = labels.goToR2;
    } else if (isTwoRoundSystem && currentRound === 1) {
      rowClass = '';
      place = '';
    } else {
      rowClass = 'tir-table__row--eliminated';
      place = labels.eliminated;
    }

    const matchScores = getPlayoffMatchScores(p.name, playoff);

    let playoffStage = 0;
    let playoffLastScore = 0;
    if (matchScores.final !== '') {
      playoffStage = 3;
      playoffLastScore = matchScores.final;
    } else if (matchScores.sf !== '') {
      playoffStage = 2;
      playoffLastScore = matchScores.sf;
    } else if (matchScores.qf !== '') {
      playoffStage = 1;
      playoffLastScore = matchScores.qf;
    }

    return {
      id: p.id,
      name: p.name,
      r1: r1Started ? r1Score : '—',
      r2: isDirect ? '—' : r2Score !== null ? (r2Started ? r2Score : '—') : '',
      r2Num: r2Score || 0,
      combined: isR2 ? (r1Started || r2Started ? combined : '—') : isDirect ? (r1Started ? r1Score : '—') : '',
      qf: matchScores.qf,
      sf: matchScores.sf,
      final: matchScores.final,
      place,
      rowClass,
      combinedNum: combined,
      playoffStage,
      playoffLastScore,
      isDirect,
    };
  });

  if (currentRound >= 2 && r2Ids.length) {
    const qualifiedRows = allPlayers.filter((r) => r.rowClass === 'tir-table__row--direct');
    const r2Rows = allPlayers.filter((r) => r.rowClass === 'tir-table__row--r2');
    const eliminatedRows = allPlayers.filter((r) => r.rowClass === 'tir-table__row--eliminated');

    if (playoff && hasPlayoffScores) {
      const playoffParticipants = [...qualifiedRows, ...r2Rows];

      const finalMatch = playoff.final;
      if (finalMatch?.winner) {
        const winner = finalMatch.winner;
        const loser = winner === finalMatch.player1 ? finalMatch.player2 : finalMatch.player1;
        const thirdWinner = playoff.thirdPlace?.winner;

        playoffParticipants.forEach((row) => {
          if (row.name === winner) {
            row.rowClass = 'place-gold';
            row.place = '1';
            row.placeNum = 1;
          } else if (row.name === loser) {
            row.rowClass = 'place-silver';
            row.place = '2';
            row.placeNum = 2;
          } else if (thirdWinner && row.name === thirdWinner) {
            row.rowClass = 'place-bronze';
            row.place = '3';
            row.placeNum = 3;
          }
        });
      }

      playoffParticipants.sort((a, b) => {
        if (a.placeNum || b.placeNum) return (a.placeNum || 99) - (b.placeNum || 99);
        const stageA = Math.max(a.playoffStage, 1);
        const stageB = Math.max(b.playoffStage, 1);
        return (
          stageB - stageA ||
          b.playoffLastScore - a.playoffLastScore ||
          (b.isDirect ? 1 : 0) - (a.isDirect ? 1 : 0) ||
          b.combinedNum - a.combinedNum
        );
      });

      return [...playoffParticipants, ...eliminatedRows];
    }

    return [...qualifiedRows, ...r2Rows.sort((a, b) => b.combinedNum - a.combinedNum), ...eliminatedRows];
  }
  return allPlayers;
}

export function getPlayoffMatchScores(playerName, playoff) {
  const result = { qf: '', sf: '', final: '' };
  if (!playoff) return result;
  if (playoff.rounds) {
    playoff.rounds.forEach((round) => {
      round.matches.forEach((m) => {
        if (m.player1 === playerName || m.player2 === playerName) {
          const score = m.player1 === playerName ? m.score1 : m.score2;
          if (score != null) {
            if (round.matches.length >= 4) result.qf = score;
            else if (round.matches.length === 2) result.sf = score;
            else if (round.matches.length === 1) result.final = score;
          }
        }
      });
    });
  }
  if (playoff.final && (playoff.final.player1 === playerName || playoff.final.player2 === playerName)) {
    const score = playoff.final.player1 === playerName ? playoff.final.score1 : playoff.final.score2;
    if (score != null) result.final = score;
  }
  if (playoff.thirdPlace && (playoff.thirdPlace.player1 === playerName || playoff.thirdPlace.player2 === playerName)) {
    const score = playoff.thirdPlace.player1 === playerName ? playoff.thirdPlace.score1 : playoff.thirdPlace.score2;
    if (score != null) result.final = score;
  }
  return result;
}

export function findPlayoffMatchForParticipant(participantName, matches) {
  if (!matches) return null;
  for (const m of matches) {
    if (m.player1 === participantName) return { match: m, playerNum: 1, scoresKey: 'scores1' };
    if (m.player2 === participantName) return { match: m, playerNum: 2, scoresKey: 'scores2' };
  }
  return null;
}

export function getPlayoffMatchThrowsForParticipant(participantName, matches) {
  const info = findPlayoffMatchForParticipant(participantName, matches);
  if (!info) return 0;
  return getMatchPlayerThrows(info.match, info.playerNum);
}

export function getPlayoffMatchAtelierPercent(participantName, matches, atelierIdx, distancesCount) {
  const info = findPlayoffMatchForParticipant(participantName, matches);
  if (!info) return 0;
  const scores = info.match[info.scoresKey]?.[atelierIdx];
  if (!scores || typeof scores !== 'object') return 0;
  return Math.round((Object.keys(scores).length / distancesCount) * 100);
}
