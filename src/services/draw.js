import { sortTeams, shuffleArray } from '@/helpers';

export function getRandomWithOneExclusion(lengthOfArray, indexToExclude1 = null, indexToExclude2 = null) {
  const exclusions = [indexToExclude1, indexToExclude2].filter((v) => v !== null);
  const validCount = lengthOfArray - exclusions.length;
  if (validCount <= 0) return 0;
  let rand;
  do {
    rand = Math.floor(Math.random() * lengthOfArray);
  } while (exclusions.includes(rand));
  return rand;
}

export function generateCompetitors(teamList, activeRound, useRating) {
  let teamIndex, opponentIndex;
  if (activeRound === 1 && !useRating) {
    teamIndex = getRandomWithOneExclusion(teamList.length);
    opponentIndex = getRandomWithOneExclusion(teamList.length, teamIndex);
    return { teamIndex, opponentIndex };
  } else {
    teamIndex = 0;
    const defaultOpponentIndex = activeRound === 1 ? teamList.length / 2 : 1;
    opponentIndex = defaultOpponentIndex;
    while (teamList[teamIndex].opponents.includes(teamList[opponentIndex].title)) {
      opponentIndex++;
      if (!teamList[opponentIndex]) {
        opponentIndex = -1;
        return { teamIndex, opponentIndex };
      }
    }
    return { teamIndex, opponentIndex };
  }
}

export function generateCompetitorsFirstLast(teamList, activeRound, useRating, reverse = false, iteration = 0) {
  let teamIndex, opponentIndex;
  if (activeRound === 1 && !useRating) {
    teamIndex = getRandomWithOneExclusion(teamList.length);
    opponentIndex = getRandomWithOneExclusion(teamList.length, teamIndex);
    return { teamIndex, opponentIndex };
  } else {
    let teamsWithSameWins, isOneTeamWithSameWins;
    if (reverse) {
      teamIndex = 0;
      opponentIndex = iteration % 2 === 0 ? teamList.length - 1 : teamIndex + 1;
    } else {
      teamsWithSameWins = teamList.filter((team) => team.wins === teamList[0].wins);
      isOneTeamWithSameWins = teamsWithSameWins.length === 1;
      if (isOneTeamWithSameWins) {
        teamsWithSameWins.push(teamList[1]);
      }
      if (teamsWithSameWins.length % 2 !== 0) {
        teamsWithSameWins.splice(teamsWithSameWins.length - 1, 1);
      }
      teamIndex = 0;
      opponentIndex = activeRound === 1 ? teamList.length / 2 : teamsWithSameWins.length - 1;
    }
    if (reverse) {
      while (teamList[teamIndex].opponents.includes(teamList[opponentIndex]?.title)) {
        opponentIndex = iteration ? (iteration % 2 === 0 ? opponentIndex - 1 : opponentIndex + 1) : opponentIndex + 1;
        if (!teamList[opponentIndex]) {
          opponentIndex = -1;
          return { teamIndex, opponentIndex };
        }
      }
    } else {
      while (teamList[teamIndex].opponents.includes(teamList[opponentIndex]?.title)) {
        isOneTeamWithSameWins || teamsWithSameWins.length < 3 ? opponentIndex++ : opponentIndex--;
        if (!teamList[opponentIndex] || teamIndex === opponentIndex) {
          opponentIndex = -1;
          return { teamIndex, opponentIndex };
        }
      }
    }
    return { teamIndex, opponentIndex };
  }
}

export function drawSwissRound(tournament, rankingTeams, activeRound) {
  const round = [];
  let teamsToDraw = JSON.parse(JSON.stringify(rankingTeams));
  teamsToDraw = sortTeams(teamsToDraw);

  let expandListIteration = 0;
  const stopExpandIndex = Math.round(teamsToDraw.length / 2 - 1);
  let teamsDrawed = [];

  const isTechnical = teamsToDraw.length % 2 !== 0;

  if (isTechnical) {
    let technicalTeamIndex =
      tournament.useRating || activeRound !== 1
        ? teamsToDraw.length - 1
        : getRandomWithOneExclusion(teamsToDraw.length);
    let technicalTeam = teamsToDraw[technicalTeamIndex];
    if (technicalTeam.opponents.includes('Technical')) {
      for (let i = 2; i < teamsToDraw.length; i++) {
        technicalTeamIndex = teamsToDraw.length - i;
        technicalTeam = teamsToDraw[technicalTeamIndex];
        if (!technicalTeam.opponents.includes('Technical')) {
          break;
        }
      }
    }
    round.push({
      team_1: technicalTeam.title,
      team_1_score: tournament.preferences.technical.technicalFirst,
      team_2: 'Technical',
      team_2_score: tournament.preferences.technical.technicalSecond,
      status: 'finished',
      winner: technicalTeam.title,
    });
    teamsToDraw.splice(technicalTeamIndex, 1);
  }

  while (teamsToDraw.length > 0) {
    let competitors = generateCompetitorsFirstLast(teamsToDraw, activeRound, tournament.useRating);
    while (competitors.opponentIndex === -1 && expandListIteration < stopExpandIndex) {
      expandListIteration++;
      if (teamsDrawed.length) {
        round.splice(-expandListIteration);
        for (let k = 1; k <= expandListIteration * 2; k++) {
          teamsToDraw.unshift(teamsDrawed[teamsDrawed.length - k]);
        }
        teamsDrawed.splice(teamsDrawed.length - expandListIteration * 2, expandListIteration * 2);
      }
      competitors = generateCompetitorsFirstLast(
        teamsToDraw,
        activeRound,
        tournament.useRating,
        true,
        expandListIteration,
      );
    }
    if (expandListIteration === stopExpandIndex && competitors.opponentIndex === -1) {
      return { round: null, error: 'cantDraw' };
    }
    round.push({
      team_1: teamsToDraw[competitors.teamIndex].title,
      team_1_score: null,
      team_2: teamsToDraw[Math.floor(competitors.opponentIndex)].title,
      team_2_score: null,
      status: 'not_started',
    });
    teamsDrawed.push(teamsToDraw[competitors.teamIndex], teamsToDraw[Math.floor(competitors.opponentIndex)]);
    const teamsToRemove = [
      teamsToDraw[competitors.teamIndex].title,
      teamsToDraw[Math.floor(competitors.opponentIndex)].title,
    ];
    teamsToDraw = teamsToDraw.filter((team) => !teamsToRemove.includes(team.title));
  }

  return { round, error: null };
}

export function drawSupermeleRound(tournament, rankingTeams) {
  const round = [];
  const playersCount = tournament.teams.length;
  const isDoubles = tournament.supermelePlayers === 2;
  let gamesCount = Math.floor(playersCount / tournament.supermelePlayers);
  while (gamesCount % 2 !== 0) {
    gamesCount = isDoubles ? gamesCount - 1 : gamesCount + 1;
  }
  if (playersCount > gamesCount * 3) {
    gamesCount += 2;
  }

  let superMeleScheme = {
    doubles: isDoubles ? gamesCount : 0,
    triples: !isDoubles ? gamesCount : 0,
  };
  let sum = superMeleScheme.doubles * 2 + superMeleScheme.triples * 3;

  while (sum !== playersCount) {
    if (isDoubles) {
      superMeleScheme.doubles--;
      superMeleScheme.triples++;
    } else {
      superMeleScheme.triples--;
      superMeleScheme.doubles++;
    }
    sum = superMeleScheme.doubles * 2 + superMeleScheme.triples * 3;
    if (superMeleScheme.doubles < 0 || superMeleScheme.triples < 0) {
      superMeleScheme.doubles = Math.max(superMeleScheme.doubles, 0);
      superMeleScheme.triples = Math.max(superMeleScheme.triples, 0);
      break;
    }
  }

  const teamsToDraw = JSON.parse(JSON.stringify(rankingTeams));
  const opponentSets = new Map(teamsToDraw.map((t) => [t.title, new Set(t.opponents || [])]));
  const teamsForRound = [];

  function removeTeams(indices) {
    indices.sort((a, b) => b - a);
    for (const idx of indices) {
      teamsToDraw.splice(idx, 1);
    }
  }

  for (let i = 1; i <= superMeleScheme.doubles; i++) {
    if (teamsToDraw.length < 2) break;
    const player1 = getRandomWithOneExclusion(teamsToDraw.length);
    let player2 = getRandomWithOneExclusion(teamsToDraw.length, player1);
    let tryToFindOpponent = 0;
    while (tryToFindOpponent < 100 && opponentSets.get(teamsToDraw[player1].title).has(teamsToDraw[player2].title)) {
      player2 = getRandomWithOneExclusion(teamsToDraw.length, player1);
      tryToFindOpponent++;
    }
    teamsForRound.push({
      title: teamsToDraw[player1].title + ', ' + teamsToDraw[player2].title,
      players: [teamsToDraw[player1].title, teamsToDraw[player2].title],
    });
    removeTeams([player1, player2]);
  }

  for (let j = 1; j <= superMeleScheme.triples; j++) {
    if (teamsToDraw.length < 3) break;
    const player1 = getRandomWithOneExclusion(teamsToDraw.length);
    let player2 = getRandomWithOneExclusion(teamsToDraw.length, player1);
    let player3 = getRandomWithOneExclusion(teamsToDraw.length, player1, player2);
    let tryToFindOpponent = 1;
    while (tryToFindOpponent < 100 && opponentSets.get(teamsToDraw[player1].title).has(teamsToDraw[player2].title)) {
      player2 = getRandomWithOneExclusion(teamsToDraw.length, player1);
      tryToFindOpponent++;
    }
    let tryToFindOpponent2 = 1;
    while (
      tryToFindOpponent2 < 100 &&
      opponentSets.get(teamsToDraw[player1].title).has(teamsToDraw[player3].title) &&
      opponentSets.get(teamsToDraw[player2].title).has(teamsToDraw[player3].title)
    ) {
      player3 = getRandomWithOneExclusion(teamsToDraw.length, player1, player2);
      tryToFindOpponent2++;
    }
    teamsForRound.push({
      title: teamsToDraw[player1].title + ', ' + teamsToDraw[player2].title + ', ' + teamsToDraw[player3].title,
      players: [teamsToDraw[player1].title, teamsToDraw[player2].title, teamsToDraw[player3].title],
    });
    removeTeams([player1, player2, player3]);
  }

  while (teamsForRound.length >= 2) {
    round.push({
      team_1: teamsForRound[0].title,
      team_1_players: teamsForRound[0].players,
      team_1_score: null,
      team_2: teamsForRound[1].title,
      team_2_players: teamsForRound[1].players,
      team_2_score: null,
      status: 'not_started',
    });
    teamsForRound.splice(0, 2);
  }

  return round;
}

export function assignLanes(games, tournament) {
  let technicalGame = null;
  if (tournament.system === 'swiss' && tournament.teams.length % 2 !== 0) {
    const technicalGameIndex = games.findIndex((game) => game.team_2 === 'Technical');
    if (technicalGameIndex !== -1) {
      technicalGame = games[technicalGameIndex];
      games = games.filter((_, i) => i !== technicalGameIndex);
    }
  }

  const isSupermele = tournament.system === 'supermele';
  const teamMap = new Map(tournament.teams.map((t) => [t.title, t]));
  const teamsMatrix = {};
  const firstLane = tournament.preferences.fieldsStart - 1;
  const laneCount = Math.floor(tournament.teams.length / 2);

  tournament.teams.forEach((team) => {
    teamsMatrix[team.title] = {};
    for (let i = firstLane; i < firstLane + laneCount; i++) {
      teamsMatrix[team.title][i] = 0;
    }
    if (team.lanes && team.lanes.length) {
      team.lanes.forEach((lane) => {
        if (teamsMatrix[team.title][lane] !== undefined) {
          teamsMatrix[team.title][lane]++;
        }
      });
    }
  });

  function getLastLane(teamTitle) {
    const team = teamMap.get(teamTitle);
    if (team?.lanes?.length) return team.lanes[team.lanes.length - 1];
    return null;
  }

  function getWeight(game, lane) {
    if (isSupermele) {
      const players = [...(game.team_1_players || []), ...(game.team_2_players || [])];
      let weight = players.reduce((sum, p) => sum + (teamsMatrix[p]?.[lane] || 0), 0);
      if (players.some((p) => getLastLane(p) === lane)) weight += laneCount;
      return weight;
    }
    let weight = (teamsMatrix[game.team_1]?.[lane] || 0) + (teamsMatrix[game.team_2]?.[lane] || 0);
    if (getLastLane(game.team_1) === lane || getLastLane(game.team_2) === lane) weight += laneCount;
    return weight;
  }

  function getPlayedLanes(game) {
    if (isSupermele) {
      const players = [...(game.team_1_players || []), ...(game.team_2_players || [])];
      const lanes = new Set();
      players.forEach((p) => {
        const team = teamMap.get(p);
        if (team?.lanes) team.lanes.forEach((l) => lanes.add(l));
      });
      return lanes;
    }
    const lanes = new Set();
    const team1 = teamMap.get(game.team_1);
    const team2 = teamMap.get(game.team_2);
    if (team1?.lanes) team1.lanes.forEach((l) => lanes.add(l));
    if (team2?.lanes) team2.lanes.forEach((l) => lanes.add(l));
    return lanes;
  }

  function updateMatrix(game, lane) {
    if (isSupermele) {
      const players = [...(game.team_1_players || []), ...(game.team_2_players || [])];
      players.forEach((p) => {
        if (teamsMatrix[p]?.[lane] !== undefined) teamsMatrix[p][lane]++;
      });
    } else {
      if (teamsMatrix[game.team_1]) teamsMatrix[game.team_1][lane]++;
      if (teamsMatrix[game.team_2]) teamsMatrix[game.team_2][lane]++;
    }
  }

  const scheduledMatches = [];
  let availableLanes = Array.from({ length: laneCount }, (_, i) => i + firstLane);

  games.forEach((game) => {
    if (game.team_2 !== 'Technical') {
      let bestLane = null;
      let minWeight = Infinity;
      const playedLanes = getPlayedLanes(game);

      const freshLanes = availableLanes.filter((i) => !playedLanes.has(i));
      const candidates = freshLanes.length > 0 ? freshLanes : availableLanes;

      candidates.forEach((i) => {
        const weight = getWeight(game, i);
        if (weight < minWeight) {
          minWeight = weight;
          bestLane = i;
        }
      });
      game.lane = bestLane;
      updateMatrix(game, bestLane);
      availableLanes = availableLanes.filter((lane) => lane !== bestLane);
      scheduledMatches.push(game);
    }
  });

  if (technicalGame) {
    scheduledMatches.push(technicalGame);
  }
  return scheduledMatches.sort((a, b) => a.lane - b.lane);
}

export function resetGroupsScheme(tournament) {
  const schemas = [];
  tournament.groups.forEach((group) => {
    let groupIndexes = [];
    group.forEach((_, index) => {
      groupIndexes.push(index);
    });
    if (group.length % 2 !== 0) {
      groupIndexes.push(group.length);
    }
    const scheme = { top: [], bottom: [] };
    for (let i = 0; i < groupIndexes.length / 2; i++) {
      scheme.top.push(i);
    }
    for (let i = groupIndexes.length - 1; i >= groupIndexes.length / 2; i--) {
      scheme.bottom.push(i);
    }
    schemas.push(scheme);
  });
  return schemas;
}

function createGroupsSeeded(tournament, teamsToDraw, groups, groupsQuantity) {
  if (groupsQuantity === 2 && teamsToDraw.length < 33) {
    const indexesScheme = {
      0: [1, 32, 16, 17, 9, 24, 8, 25, 5, 28, 12, 21, 13, 20, 4, 29],
      1: [3, 30, 14, 19, 11, 22, 6, 27, 7, 26, 10, 23, 15, 18, 2, 31],
    };
    Object.keys(indexesScheme).forEach((key) => {
      indexesScheme[key].forEach((item) => {
        const teamIndexInList = teamsToDraw[item - 1]
          ? tournament.teams.findIndex((team) => team.title === teamsToDraw[item - 1].title)
          : -1;
        if (teamIndexInList !== -1) {
          groups[key].push(tournament.teams[teamIndexInList]);
        }
      });
    });
  } else {
    const teamsPerPot = groupsQuantity;
    const pots = [];
    for (let i = 0; i < teamsToDraw.length; i += teamsPerPot) {
      pots.push(teamsToDraw.slice(i, i + teamsPerPot));
    }
    pots.forEach((pot) => {
      const shuffled = shuffleArray([...pot]);
      shuffled.forEach((team, i) => {
        const groupIdx = i % groupsQuantity;
        const teamIndexInList = tournament.teams.findIndex((t) => t.title === team.title);
        if (teamIndexInList !== -1) {
          groups[groupIdx].push(tournament.teams[teamIndexInList]);
        }
      });
    });
  }
}

function createGroupsSnake(tournament, teamsToDraw, groups, groupsQuantity) {
  let direction = 1;
  let groupIdx = 0;
  for (let i = 0; i < teamsToDraw.length; i++) {
    const teamIndexInList = tournament.teams.findIndex((t) => t.title === teamsToDraw[i].title);
    if (teamIndexInList !== -1) {
      groups[groupIdx].push(tournament.teams[teamIndexInList]);
    }
    if (direction === 1 && groupIdx === groupsQuantity - 1) {
      direction = -1;
    } else if (direction === -1 && groupIdx === 0) {
      direction = 1;
    } else {
      groupIdx += direction;
    }
  }
}

function createGroupsBalancedRandom(tournament, teamsToDraw, groups, groupsQuantity) {
  const iterations = 1000;
  let bestGroups = null;
  let bestDiff = Infinity;

  for (let iter = 0; iter < iterations; iter++) {
    const shuffled = shuffleArray([...teamsToDraw]);
    const candidate = [];
    for (let i = 0; i < groupsQuantity; i++) candidate.push([]);

    shuffled.forEach((team, i) => {
      candidate[i % groupsQuantity].push(team);
    });

    const totals = candidate.map((g) => g.reduce((sum, t) => sum + (t.rating || 0), 0));
    const diff = Math.max(...totals) - Math.min(...totals);

    if (diff < bestDiff) {
      bestDiff = diff;
      bestGroups = candidate;
    }
  }

  bestGroups.forEach((group, gIdx) => {
    group.forEach((team) => {
      const teamIndexInList = tournament.teams.findIndex((t) => t.title === team.title);
      if (teamIndexInList !== -1) {
        groups[gIdx].push(tournament.teams[teamIndexInList]);
      }
    });
  });
}

function computeRoundRobinSchedule(n) {
  const rounds = [];
  const positions = Array.from({ length: n }, (_, i) => i);
  for (let r = 0; r < n - 1; r++) {
    const pairs = [];
    for (let i = 0; i < n / 2; i++) {
      pairs.push([positions[i], positions[n - 1 - i]]);
    }
    rounds.push(pairs);
    const last = positions.pop();
    positions.splice(1, 0, last);
  }
  return rounds;
}

function getMeetingRound(schedule, posA, posB) {
  for (let r = 0; r < schedule.length; r++) {
    for (const [a, b] of schedule[r]) {
      if ((a === posA && b === posB) || (a === posB && b === posA)) return r;
    }
  }
  return -1;
}

function getTeamClub(team) {
  return team.players?.[0]?.club || null;
}

function buildClubMap(teams) {
  const map = {};
  teams.forEach((t) => {
    const club = getTeamClub(t);
    if (club) {
      if (!map[club]) map[club] = [];
      map[club].push(t.title);
    }
  });
  return map;
}

function findSameClubPairs(teams) {
  const clubMap = buildClubMap(teams);
  const pairs = [];
  Object.values(clubMap).forEach((members) => {
    if (members.length >= 2) {
      for (let i = 0; i < members.length; i++) {
        for (let j = i + 1; j < members.length; j++) {
          pairs.push([members[i], members[j]]);
        }
      }
    }
  });
  return pairs;
}

function scoreConstraints(orderedTeams, schedule) {
  const titleToPos = {};
  orderedTeams.forEach((t, i) => {
    titleToPos[t.title] = i;
  });

  const sameClubPairs = findSameClubPairs(orderedTeams);
  if (!sameClubPairs.length) return 0;

  let totalRound = 0;
  for (const [titleA, titleB] of sameClubPairs) {
    const posA = titleToPos[titleA];
    const posB = titleToPos[titleB];
    const round = getMeetingRound(schedule, posA, posB);
    totalRound += round;
  }
  return totalRound;
}

export function generateConstrainedGroups(tournament, teamsInGroup) {
  const groupsQuantity = Math.round(tournament.teams.length / teamsInGroup);
  if (groupsQuantity !== 1) {
    return createGroups(tournament, teamsInGroup);
  }

  const n = tournament.teams.length;
  if (n < 4 || n % 2 !== 0) {
    return createGroups(tournament, teamsInGroup);
  }

  const schedule = computeRoundRobinSchedule(n);
  const sameClubPairs = findSameClubPairs(tournament.teams);

  let bestResult = [...tournament.teams];
  let bestScore = sameClubPairs.length ? scoreConstraints(bestResult, schedule) : 0;

  if (sameClubPairs.length) {
    for (let attempt = 0; attempt < 1000; attempt++) {
      const shuffled = shuffleArray([...tournament.teams]);
      const score = scoreConstraints(shuffled, schedule);
      if (score < bestScore) {
        bestResult = shuffled;
        bestScore = score;
      }
      if (bestScore === 0) break;
    }
  }

  const group = bestResult.map((t) => tournament.teams.find((orig) => orig.title === t.title));

  let groupIndexes = Array.from({ length: n }, (_, i) => i);
  if (n % 2 !== 0) groupIndexes.push(n);
  const scheme = { top: [], bottom: [] };
  for (let i = 0; i < groupIndexes.length / 2; i++) {
    scheme.top.push(i);
  }
  for (let i = groupIndexes.length - 1; i >= groupIndexes.length / 2; i--) {
    scheme.bottom.push(i);
  }

  return { groups: [group], schemas: [scheme], warning: null };
}

export function createGroups(tournament, teamsInGroup) {
  const groupsQuantity = Math.round(tournament.teams.length / teamsInGroup);
  let groups = [];
  for (let i = 1; i <= groupsQuantity; i++) {
    groups.push([]);
  }
  let teamsToDraw = JSON.parse(JSON.stringify([...tournament.teams].sort((a, b) => b.rating - a.rating)));

  const drawMethod = tournament.useRating ? tournament.preferences?.groupDrawMethod || 'seeded' : null;

  if (!tournament.useRating) {
    while (teamsToDraw.length >= 1) {
      for (let j = 0; j < teamsToDraw.length; j++) {
        for (let i = 0; i < groupsQuantity; i++) {
          const teamIndex = getRandomWithOneExclusion(teamsToDraw.length);
          if (teamIndex !== -1 && teamsToDraw.length >= 1) {
            const teamIndexInList = tournament.teams.findIndex((team) => team.title === teamsToDraw[teamIndex].title);
            groups[i].push(tournament.teams[teamIndexInList]);
            teamsToDraw.splice(teamIndex, 1);
          }
        }
      }
    }
  } else if (drawMethod === 'snake') {
    createGroupsSnake(tournament, teamsToDraw, groups, groupsQuantity);
  } else if (drawMethod === 'balanced_random') {
    createGroupsBalancedRandom(tournament, teamsToDraw, groups, groupsQuantity);
  } else {
    createGroupsSeeded(tournament, teamsToDraw, groups, groupsQuantity);
  }

  const schemas = [];
  groups.forEach((group) => {
    group.sort((a, b) => b.rating - a.rating);
    let groupIndexes = [];
    group.forEach((_, index) => {
      groupIndexes.push(index);
    });
    if (group.length % 2 !== 0) {
      groupIndexes.push(group.length);
    }
    const scheme = { top: [], bottom: [] };
    for (let i = 0; i < groupIndexes.length / 2; i++) {
      scheme.top.push(i);
    }
    for (let i = groupIndexes.length - 1; i >= groupIndexes.length / 2; i--) {
      scheme.bottom.push(i);
    }
    schemas.push(scheme);
  });

  return { groups, schemas };
}

function rotateRoundRobinScheme(scheme) {
  const { top, bottom } = scheme;
  // Move last from top to end of bottom
  bottom.push(top[top.length - 1]);
  // Move first from bottom to second position in top
  top.unshift(bottom[0]);
  // Remove the element that was at end (now second-to-last after unshift)
  top.splice(top.length - 1, 1);
  // Remove the duplicate that landed at index 1
  top.splice(1, 1);
  // Pin position 0 (it stays fixed in round-robin rotation)
  top.unshift(0);
  // Remove the element we moved from bottom
  bottom.splice(0, 1);
}

export function drawGroupsRound(tournament) {
  const round = [];
  tournament.groups.forEach((group, index) => {
    const isTechnical = group.length % 2 !== 0;
    const roundsPerCircle = isTechnical ? group.length : group.length - 1;
    const circles = tournament.roundRobinCircle || 1;
    if (tournament.games?.length >= roundsPerCircle * circles) {
      return;
    }
    const scheme = tournament.groupsScheme[index];
    for (let i = 0; i < scheme.top.length; i++) {
      if (!isTechnical || (scheme.top[i] !== group.length && scheme.bottom[i] !== group.length)) {
        round.push({
          group: index,
          team_1: group[scheme.top[i]].title,
          team_1_score: null,
          team_2: group[scheme.bottom[i]].title,
          team_2_score: null,
          status: 'not_started',
        });
      }
    }
    rotateRoundRobinScheme(scheme);
  });
  return round;
}

export function reshuffleGroupSchedule(tournament) {
  const groups = tournament.groups;
  const newGroups = [];
  const schemas = [];

  groups.forEach((group) => {
    const n = group.length;
    const schedule = computeRoundRobinSchedule(n % 2 === 0 ? n : n + 1);
    const shuffled = findBalancedOrder(group, schedule);
    newGroups.push(shuffled);

    let groupIndexes = Array.from({ length: n }, (_, i) => i);
    if (n % 2 !== 0) groupIndexes.push(n);
    const scheme = { top: [], bottom: [] };
    for (let i = 0; i < groupIndexes.length / 2; i++) {
      scheme.top.push(i);
    }
    for (let i = groupIndexes.length - 1; i >= groupIndexes.length / 2; i--) {
      scheme.bottom.push(i);
    }
    schemas.push(scheme);
  });

  return { groups: newGroups, schemas };
}

function scoreRatingBalance(orderedTeams, schedule) {
  const n = orderedTeams.length;
  const effectiveN = n % 2 === 0 ? n : n + 1;
  const totalRounds = effectiveN - 1;
  let penalty = 0;

  for (let r = 0; r < Math.min(schedule.length, totalRounds); r++) {
    let maxRating = 0;
    for (const [a, b] of schedule[r]) {
      if (a >= n || b >= n) continue;
      const combined = orderedTeams[a].rating + orderedTeams[b].rating;
      if (combined > maxRating) maxRating = combined;
    }
    penalty += maxRating * maxRating;
  }
  return penalty;
}

function findBalancedOrder(group, schedule) {
  const n = group.length;
  if (n < 4) return [...group];

  let bestOrder = [...group];
  let bestScore = scoreRatingBalance(bestOrder, schedule);

  for (let attempt = 0; attempt < 1000; attempt++) {
    const shuffled = shuffleArray([...group]);
    const score = scoreRatingBalance(shuffled, schedule);
    if (score < bestScore) {
      bestOrder = shuffled;
      bestScore = score;
    }
  }
  return bestOrder;
}

export function createPoules(tournament) {
  const teamsCount = tournament.teams.length;
  const groupsQuantity = teamsCount / 4;
  const groups = [];
  for (let i = 0; i < groupsQuantity; i++) {
    groups.push([]);
  }

  const teamsSorted = [...tournament.teams].sort((a, b) => b.rating - a.rating);

  // Seeding pattern: snake distribution
  // Pot 1 (seeds 1..N/4) go to groups 0,1,2,...
  // Pot 2 (seeds N/4+1..N/2) go to groups ...,2,1,0 (reversed)
  // Pot 3 reversed again, etc.
  let direction = 1;
  let groupIdx = 0;
  for (let i = 0; i < teamsCount; i++) {
    const teamIndexInList = tournament.teams.findIndex((t) => t.title === teamsSorted[i].title);
    groups[groupIdx].push(tournament.teams[teamIndexInList]);

    if (direction === 1 && groupIdx === groupsQuantity - 1) {
      direction = -1;
    } else if (direction === -1 && groupIdx === 0) {
      direction = 1;
    } else {
      groupIdx += direction;
    }
  }

  return { groups };
}

export function drawPoulesRound(tournament) {
  const round = [];
  const poulesRound = tournament.poulesRound || 1;

  tournament.groups.forEach((group, groupIndex) => {
    if (poulesRound === 1) {
      round.push({
        group: groupIndex,
        team_1: group[0].title,
        team_1_score: null,
        team_2: group[2].title,
        team_2_score: null,
        status: 'not_started',
      });
      round.push({
        group: groupIndex,
        team_1: group[1].title,
        team_1_score: null,
        team_2: group[3].title,
        team_2_score: null,
        status: 'not_started',
      });
    } else if (poulesRound === 2) {
      // Round 2: winners play winners, losers play losers
      const r1Games = tournament.games[tournament.games.length - 1].filter((g) => g.group === groupIndex);
      const game1 = r1Games[0];
      const game2 = r1Games[1];

      const winner1 = game1.team_1_score > game1.team_2_score ? game1.team_1 : game1.team_2;
      const loser1 = game1.team_1_score > game1.team_2_score ? game1.team_2 : game1.team_1;
      const winner2 = game2.team_1_score > game2.team_2_score ? game2.team_1 : game2.team_2;
      const loser2 = game2.team_1_score > game2.team_2_score ? game2.team_2 : game2.team_1;

      round.push({
        group: groupIndex,
        team_1: winner1,
        team_1_score: null,
        team_2: winner2,
        team_2_score: null,
        status: 'not_started',
      });
      round.push({
        group: groupIndex,
        team_1: loser1,
        team_1_score: null,
        team_2: loser2,
        team_2_score: null,
        status: 'not_started',
      });
    } else if (poulesRound === 3) {
      // Round 3 (barrage): two teams with exactly 1 win play each other
      const teamWins = {};
      group.forEach((t) => {
        teamWins[t.title] = 0;
      });

      tournament.games.forEach((roundGames) => {
        roundGames
          .filter((g) => g.group === groupIndex)
          .forEach((game) => {
            if (game.team_1_score > game.team_2_score) {
              teamWins[game.team_1]++;
            } else if (game.team_2_score > game.team_1_score) {
              teamWins[game.team_2]++;
            }
          });
      });

      const oneWinTeams = Object.entries(teamWins)
        .filter(([, wins]) => wins === 1)
        .map(([title]) => title);

      if (oneWinTeams.length === 2) {
        round.push({
          group: groupIndex,
          team_1: oneWinTeams[0],
          team_1_score: null,
          team_2: oneWinTeams[1],
          team_2_score: null,
          status: 'not_started',
        });
      }
    }
  });
  return round;
}

export function getPoulesQualifiedTeams(tournament) {
  const groupQualified = [];
  tournament.groups.forEach((group, groupIndex) => {
    const teamWins = {};
    const teamPoints = {};
    group.forEach((t) => {
      teamWins[t.title] = 0;
      teamPoints[t.title] = 0;
    });

    tournament.games.forEach((roundGames) => {
      roundGames
        .filter((g) => g.group === groupIndex)
        .forEach((game) => {
          if (game.team_1_score > game.team_2_score) {
            teamWins[game.team_1]++;
          } else if (game.team_2_score > game.team_1_score) {
            teamWins[game.team_2]++;
          }
          teamPoints[game.team_1] = (teamPoints[game.team_1] || 0) + (game.team_1_score - game.team_2_score);
          teamPoints[game.team_2] = (teamPoints[game.team_2] || 0) + (game.team_2_score - game.team_1_score);
        });
    });

    const qualifiedFromGroup = Object.entries(teamWins)
      .filter(([, wins]) => wins >= 2)
      .sort((a, b) => b[1] - a[1] || (teamPoints[b[0]] || 0) - (teamPoints[a[0]] || 0))
      .map(([title]) => tournament.teams.find((t) => t.title === title));

    groupQualified.push(qualifiedFromGroup);
  });

  // Interleave: all group winners first, then all runners-up
  const qualified = [];
  const maxPerGroup = Math.max(...groupQualified.map((g) => g.length));
  for (let i = 0; i < maxPerGroup; i++) {
    groupQualified.forEach((group) => {
      if (group[i]) qualified.push(group[i]);
    });
  }

  // Pad to next power of 2 with bye placeholders for proper bracket generation
  const nextPow2 = Math.pow(2, Math.ceil(Math.log2(qualified.length)));
  while (qualified.length < nextPow2) {
    qualified.push({ title: null, isBye: true });
  }

  return qualified;
}

export function saveResultsForRound(tournament, round) {
  if (tournament.games.length <= 2) {
    tournament.teams.forEach((team) => {
      team.opponents = (team.opponents || []).filter((item) => item !== 'placeholder');
    });
  }
  const teamMap = new Map(tournament.teams.map((t) => [t.title, t]));
  if (tournament.system === 'supermele') {
    tournament.games[round].forEach((game) => {
      game.team_1_players.forEach((player) => {
        const team = teamMap.get(player);
        if (team) {
          if (!team.opponents) team.opponents = [];
          const partners = game.team_1_players.filter((item) => item !== player);
          partners.forEach((item) => team.opponents.push(item));
          team.pointsPlus += game.team_1_score;
          team.pointsMinus += game.team_2_score;
          if (game.team_1_score > game.team_2_score) {
            team.wins++;
          }
        }
      });
      game.team_2_players.forEach((player) => {
        const team = teamMap.get(player);
        if (team) {
          if (!team.opponents) team.opponents = [];
          const partners = game.team_2_players.filter((item) => item !== player);
          partners.forEach((item) => team.opponents.push(item));
          team.pointsPlus += game.team_2_score;
          team.pointsMinus += game.team_1_score;
          if (game.team_2_score > game.team_1_score) {
            team.wins++;
          }
        }
      });
    });
  } else {
    tournament.games[round].forEach((game) => {
      const firstTeam = teamMap.get(game.team_1);
      if (firstTeam) {
        if (!firstTeam.opponents) firstTeam.opponents = [];
        firstTeam.opponents.push(game.team_2);
        firstTeam.pointsPlus += game.team_1_score;
        firstTeam.pointsMinus += game.team_2_score;
      }
      const secondTeam = teamMap.get(game.team_2);
      if (secondTeam) {
        if (!secondTeam.opponents) secondTeam.opponents = [];
        secondTeam.opponents.push(game.team_1);
        secondTeam.pointsPlus += game.team_2_score;
        secondTeam.pointsMinus += game.team_1_score;
      }
      if (game.team_1_score > game.team_2_score) {
        if (firstTeam) {
          firstTeam.wins++;
        }
      } else if (game.team_2_score > game.team_1_score && secondTeam && game.team_2 !== 'Technical') {
        secondTeam.wins++;
      }
    });
  }
}
