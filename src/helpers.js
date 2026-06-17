const tournamentNames = [
  'A',
  'B',
  'C',
  'D',
  'E',
  'F',
  'G',
  'H',
  'I',
  'J',
  'K',
  'L',
  'M',
  'N',
  'O',
  'P',
  'Q',
  'R',
  'S',
  'T',
  'U',
  'V',
  'W',
  'X',
  'Y',
  'Z',
];

function getGameResultInGroup(where, team1, team2, difference) {
  if (team1 === team2) {
    return '-';
  }
  const results = [];
  where.forEach((round) => {
    round.forEach((gameInRound) => {
      if (gameInRound.team_1 + gameInRound.team_2 === team1 + team2) {
        if (gameInRound.team_1_score != null || gameInRound.team_2_score != null) {
          results.push({
            score1: gameInRound.team_1_score || 0,
            score2: gameInRound.team_2_score || 0,
          });
        }
      } else if (gameInRound.team_2 + gameInRound.team_1 === team1 + team2) {
        if (gameInRound.team_1_score != null || gameInRound.team_2_score != null) {
          results.push({
            score1: gameInRound.team_2_score || 0,
            score2: gameInRound.team_1_score || 0,
          });
        }
      }
    });
  });
  if (results.length) {
    if (difference) {
      return results.reduce((sum, r) => sum + (r.score1 - r.score2), 0) || 0;
    } else {
      return results.map((r) => `${r.score1} : ${r.score2}`).join('\n');
    }
  }
}

function getTournamentRanking(tournament, rankingTeams) {
  let tournamentRanking = [];
  if (tournament.playOffBracket) {
    const playOffList = JSON.parse(JSON.stringify(tournament.playOffBracket.stages)).reverse();
    const thirdPlaceGame = tournament.playOffBracket.thirdPlace
      ? JSON.parse(JSON.stringify(tournament.playOffBracket.thirdPlace))
      : undefined;
    let teamsInRanking = [];
    for (let i = 0; i < playOffList.length; i++) {
      if (playOffList[i].stageLabel === 'cadrage') continue;
      if (playOffList[i].stageLabel === 1) {
        const firstPlace = {
          place: '1',
          title:
            playOffList[i].teams[0].team_1_score > playOffList[i].teams[0].team_2_score
              ? playOffList[i].teams[0].team_1
              : playOffList[i].teams[0].team_2,
          players:
            tournament.teams.find(
              (team) =>
                team.title ===
                (playOffList[i].teams[0].team_1_score > playOffList[i].teams[0].team_2_score
                  ? playOffList[i].teams[0].team_1
                  : playOffList[i].teams[0].team_2),
            )?.players || [],
        };
        tournamentRanking.push(firstPlace);
        teamsInRanking.push(firstPlace.title);
        const secondPlace = {
          place: '2',
          title:
            playOffList[i].teams[0].team_1_score > playOffList[i].teams[0].team_2_score
              ? playOffList[i].teams[0].team_2
              : playOffList[i].teams[0].team_1,
          players:
            tournament.teams.find(
              (team) =>
                team.title ===
                (playOffList[i].teams[0].team_1_score > playOffList[i].teams[0].team_2_score
                  ? playOffList[i].teams[0].team_2
                  : playOffList[i].teams[0].team_1),
            )?.players || [],
        };
        tournamentRanking.push(secondPlace);
        teamsInRanking.push(secondPlace.title);
      } else if (playOffList[i].stageLabel === 2) {
        if (thirdPlaceGame) {
          const thirdPlace = {
            place: thirdPlaceGame.team_1_score && thirdPlaceGame.team_2_score ? '3' : '3-4',
            title:
              thirdPlaceGame.team_1_score && thirdPlaceGame.team_2_score
                ? thirdPlaceGame.team_1_score > thirdPlaceGame.team_2_score
                  ? thirdPlaceGame.team_1
                  : thirdPlaceGame.team_2
                : thirdPlaceGame.team_1,
            players:
              tournament.teams.find(
                (team) =>
                  team.title ===
                  (thirdPlaceGame.team_1_score && thirdPlaceGame.team_2_score
                    ? thirdPlaceGame.team_1_score > thirdPlaceGame.team_2_score
                      ? thirdPlaceGame.team_1
                      : thirdPlaceGame.team_2
                    : thirdPlaceGame.team_1),
              )?.players || [],
          };
          tournamentRanking.push(thirdPlace);
          teamsInRanking.push(thirdPlace.title);
          const fourthPlace = {
            place: thirdPlaceGame.team_1_score && thirdPlaceGame.team_2_score ? '4' : '3-4',
            title:
              thirdPlaceGame.team_1_score && thirdPlaceGame.team_2_score
                ? thirdPlaceGame.team_1_score > thirdPlaceGame.team_2_score
                  ? thirdPlaceGame.team_2
                  : thirdPlaceGame.team_1
                : thirdPlaceGame.team_2,
            players:
              tournament.teams.find(
                (team) =>
                  team.title ===
                  (thirdPlaceGame.team_1_score && thirdPlaceGame.team_2_score
                    ? thirdPlaceGame.team_1_score > thirdPlaceGame.team_2_score
                      ? thirdPlaceGame.team_2
                      : thirdPlaceGame.team_1
                    : thirdPlaceGame.team_2),
              )?.players || [],
          };
          tournamentRanking.push(fourthPlace);
          teamsInRanking.push(fourthPlace.title);
        }
      } else {
        playOffList[i].teams.forEach((round) => {
          const teamTitle = teamsInRanking.includes(round.team_1) ? round.team_2 : round.team_1;
          const teamPlace = {
            place: playOffList[i].stageLabel + 1 + '-' + playOffList[i].stageLabel * 2,
            title: teamTitle,
            players: tournament.teams.find((team) => team.title === teamTitle)?.players || [],
          };
          tournamentRanking.push(teamPlace);
          teamsInRanking.push(teamPlace.title);
        });
      }
    }

    const cadrageStage = tournament.playOffBracket.stages.find((s) => s.stageLabel === 'cadrage');
    if (cadrageStage) {
      const cadrageGamesPlayed = cadrageStage.teams.some((g) => g.team_1_score != null);
      if (cadrageGamesPlayed) {
        const cadrageRangeStart = teamsInRanking.length + 1;
        const cadrageRangeEnd = cadrageRangeStart + cadrageStage.teams.length - 1;
        const cadragePlace = cadrageRangeStart + '-' + cadrageRangeEnd;
        cadrageStage.teams.forEach((game) => {
          const loser = game.team_1_score > game.team_2_score ? game.team_2 : game.team_1;
          if (!teamsInRanking.includes(loser)) {
            tournamentRanking.push({
              place: cadragePlace,
              title: loser,
              players: tournament.teams.find((team) => team.title === loser)?.players || [],
            });
            teamsInRanking.push(loser);
          }
        });
      }
    }

    if (tournament.games?.length > 0) {
      if (
        tournament.system === 'swiss' ||
        ((tournament.system === 'groups' || tournament.system === 'poules') && rankingTeams.length === 1)
      ) {
        const remainingTeams = rankingTeams.filter((team) => !teamsInRanking.includes(team.title));
        const rangeStart = teamsInRanking.length + 1;
        remainingTeams.forEach((team, index) => {
          const teamPlace = {
            place: rangeStart + index,
            title: team.title,
            players: team.players,
          };
          tournamentRanking.push(teamPlace);
        });
      } else {
        const groupsCount = rankingTeams.length;
        const teamsCountPlayOff = tournament.playOffBracket.stages[0].teamsCount;
        let teamsGroupsAfterPlayOff = [];
        rankingTeams.forEach((group, index) => {
          teamsGroupsAfterPlayOff[index] = group.slice(teamsCountPlayOff / groupsCount);
        });
        for (let i = 0; i < teamsGroupsAfterPlayOff[0].length; i++) {
          teamsGroupsAfterPlayOff.forEach((group) => {
            if (group[i]) {
              const teamPlace = {
                place:
                  teamsCountPlayOff + i * groupsCount + 1 + '-' + (teamsCountPlayOff + i * groupsCount + groupsCount),
                title: group[i].title,
              };
              tournamentRanking.push(teamPlace);
            }
          });
        }
      }
    }
  } else {
    if (
      tournament.system === 'swiss' ||
      ((tournament.system === 'groups' || tournament.system === 'poules') && rankingTeams?.length === 1)
    ) {
      const rankingTeamsList = tournament.system === 'swiss' ? rankingTeams : rankingTeams[0];
      rankingTeamsList.forEach((team, index) => {
        const teamPlace = {
          place: index + 1,
          title: team.title,
          players: team.players,
        };
        tournamentRanking.push(teamPlace);
      });
    } else if ((tournament.system === 'groups' || tournament.system === 'poules') && rankingTeams?.length > 1) {
      const groupsCount = rankingTeams.length;
      const maxTeams = Math.max(...rankingTeams.map((g) => g.length));
      for (let i = 0; i < maxTeams; i++) {
        rankingTeams.forEach((group) => {
          if (group[i]) {
            const placeStart = i * groupsCount + 1;
            const placeEnd = placeStart + groupsCount - 1;
            tournamentRanking.push({
              place: placeStart === placeEnd ? placeStart : `${placeStart}-${placeEnd}`,
              title: group[i].title,
              players: group[i].players,
            });
          }
        });
      }
    }
  }

  return tournamentRanking;
}

function sortTeams(teamsToSort) {
  countBuhgolts(teamsToSort, 'buhgolts');
  countBuhgolts(teamsToSort, 'smallBuhgolts');
  return teamsToSort.sort(
    (a, b) =>
      b.wins - a.wins ||
      b.buhgolts - a.buhgolts ||
      b.smallBuhgolts - a.smallBuhgolts ||
      b.pointsPlus - b.pointsMinus - (a.pointsPlus - a.pointsMinus) ||
      b.pointsPlus - a.pointsPlus ||
      b.rating - a.rating,
  );
}

function countBuhgolts(whereCount, whatBuhgolts) {
  const whatCount = whatBuhgolts === 'buhgolts' ? 'wins' : 'buhgolts';
  whereCount.forEach((team) => {
    let currentTeamBuhgolts = 0;
    if (team.opponents[0] !== 'placeholder' && team.opponents.length) {
      team.opponents.forEach((opponent) => {
        const opponentIndex = whereCount.findIndex((team) => team.title === opponent);
        if (opponentIndex !== -1) {
          currentTeamBuhgolts += whereCount[opponentIndex][whatCount];
        }
      });
    }
    team[whatBuhgolts] = currentTeamBuhgolts;
  });
  return whereCount;
}

function sortTeamsForSupermele(teamsToSort) {
  return teamsToSort.sort(
    (a, b) =>
      b.wins - a.wins ||
      b.pointsPlus - b.pointsMinus - (a.pointsPlus - a.pointsMinus) ||
      b.pointsPlus - a.pointsPlus ||
      b.rating - a.rating,
  );
}

function getH2HStats(games, teamNames) {
  const stats = {};
  teamNames.forEach((name) => {
    stats[name] = { pointsPlus: 0, pointsMinus: 0 };
  });
  const nameSet = new Set(teamNames);
  games.forEach((round) => {
    round.forEach((game) => {
      if (game.team_1_score == null || game.team_2_score == null) return;
      if (game.status === 'in_progress' || game.status === 'not_started') return;
      const t1 = game.team_1;
      const t2 = game.team_2;
      if (!nameSet.has(t1) || !nameSet.has(t2)) return;
      const s1 = Number(game.team_1_score);
      const s2 = Number(game.team_2_score);
      stats[t1].pointsPlus += s1;
      stats[t1].pointsMinus += s2;
      stats[t2].pointsPlus += s2;
      stats[t2].pointsMinus += s1;
    });
  });
  return stats;
}

function splitByCriterion(teams, getValue) {
  const groups = [];
  let currentGroup = [teams[0]];
  let currentVal = getValue(teams[0]);
  for (let i = 1; i < teams.length; i++) {
    const val = getValue(teams[i]);
    if (val === currentVal) {
      currentGroup.push(teams[i]);
    } else {
      groups.push(currentGroup);
      currentGroup = [teams[i]];
      currentVal = val;
    }
  }
  groups.push(currentGroup);
  return groups;
}

function rankGroupByRegulations(group, games) {
  const sorted = group.slice().sort((a, b) => b.wins - a.wins);
  const winClusters = splitByCriterion(sorted, (t) => t.wins);
  const result = [];
  winClusters.forEach((cluster) => {
    result.push(...rankCluster(cluster, games));
  });
  return result;
}

function rankCluster(cluster, games) {
  if (cluster.length <= 1) return cluster;

  const names = cluster.map((t) => t.title);

  if (cluster.length === 2) {
    return rankTwoTeams(cluster, games);
  }

  const h2h = getH2HStats(games, names);
  const withDiff = cluster.map((t) => ({
    team: t,
    h2hDiff: h2h[t.title].pointsPlus - h2h[t.title].pointsMinus,
  }));
  withDiff.sort((a, b) => b.h2hDiff - a.h2hDiff);

  const diffGroups = splitByCriterion(withDiff, (item) => item.h2hDiff);
  if (diffGroups.length > 1) {
    const result = [];
    diffGroups.forEach((g) => {
      result.push(
        ...rankCluster(
          g.map((item) => item.team),
          games,
        ),
      );
    });
    return result;
  }

  const withPlus = cluster.map((t) => ({
    team: t,
    h2hPlus: h2h[t.title].pointsPlus,
  }));
  withPlus.sort((a, b) => b.h2hPlus - a.h2hPlus);

  const plusGroups = splitByCriterion(withPlus, (item) => item.h2hPlus);
  if (plusGroups.length > 1) {
    const result = [];
    plusGroups.forEach((g) => {
      result.push(
        ...rankCluster(
          g.map((item) => item.team),
          games,
        ),
      );
    });
    return result;
  }

  const withOverall = cluster.slice().sort((a, b) => b.pointsPlus - b.pointsMinus - (a.pointsPlus - a.pointsMinus));

  const overallGroups = splitByCriterion(withOverall, (t) => t.pointsPlus - t.pointsMinus);
  if (overallGroups.length > 1) {
    const result = [];
    overallGroups.forEach((g) => {
      result.push(...rankCluster(g, games));
    });
    return result;
  }

  return cluster;
}

function rankTwoTeams(pair, games) {
  const [a, b] = pair;
  const h2hResult = getGameResultBetween(games, a.title, b.title);
  if (h2hResult > 0) return [a, b];
  if (h2hResult < 0) return [b, a];
  const diffA = a.pointsPlus - a.pointsMinus;
  const diffB = b.pointsPlus - b.pointsMinus;
  if (diffA !== diffB) return diffA > diffB ? [a, b] : [b, a];
  return pair;
}

function getGameResultBetween(games, team1, team2) {
  let diff = 0;
  games.forEach((round) => {
    round.forEach((game) => {
      if (game.team_1_score == null || game.team_2_score == null) return;
      if (game.status === 'in_progress' || game.status === 'not_started') return;
      if (game.team_1 === team1 && game.team_2 === team2) {
        diff += Number(game.team_1_score) - Number(game.team_2_score);
      } else if (game.team_1 === team2 && game.team_2 === team1) {
        diff += Number(game.team_2_score) - Number(game.team_1_score);
      }
    });
  });
  return diff;
}

function accumulateGroupStats(group, allRoundGames, { filterByGroup = null, requireFinished = false } = {}) {
  const teamWins = {};
  const teamPointsPlus = {};
  const teamPointsMinus = {};
  group.forEach((t) => {
    teamWins[t.title] = 0;
    teamPointsPlus[t.title] = 0;
    teamPointsMinus[t.title] = 0;
  });

  allRoundGames.forEach((roundGames) => {
    const games = filterByGroup !== null ? roundGames.filter((g) => g.group === filterByGroup) : roundGames;
    games.forEach((game) => {
      if (game.team_1_score == null || game.team_2_score == null) return;
      if (requireFinished && (game.status === 'in_progress' || game.status === 'not_started')) return;
      const t1 = game.team_1;
      const t2 = game.team_2;
      if (!(t1 in teamWins) || !(t2 in teamWins)) return;
      const s1 = Number(game.team_1_score);
      const s2 = Number(game.team_2_score);
      teamPointsPlus[t1] = (teamPointsPlus[t1] || 0) + s1;
      teamPointsMinus[t1] = (teamPointsMinus[t1] || 0) + s2;
      teamPointsPlus[t2] = (teamPointsPlus[t2] || 0) + s2;
      teamPointsMinus[t2] = (teamPointsMinus[t2] || 0) + s1;
      if (s1 > s2) {
        teamWins[t1]++;
      } else if (s2 > s1) {
        teamWins[t2]++;
      }
    });
  });

  group.forEach((team) => {
    team.wins = teamWins[team.title] || 0;
    team.pointsPlus = teamPointsPlus[team.title] || 0;
    team.pointsMinus = teamPointsMinus[team.title] || 0;
  });
}

function getTeamsRanking(tournament, activeRound) {
  if (tournament.teams) {
    if (tournament.system === 'poules' && tournament.groups && activeRound > 1) {
      let sortedGroups = [];
      tournament.groups.forEach((group, groupIndex) => {
        accumulateGroupStats(group, tournament.games, { filterByGroup: groupIndex });
        let groupRanking = group
          .slice()
          .sort((a, b) => b.wins - a.wins || b.pointsPlus - b.pointsMinus - (a.pointsPlus - a.pointsMinus));
        sortedGroups.push(groupRanking);
      });
      return sortedGroups;
    } else if (tournament.system === 'groups' && (activeRound > 1 || tournament.groupSchedule)) {
      let sortedGroups = [];
      tournament.groups.forEach((group) => {
        if (tournament.games) {
          accumulateGroupStats(group, tournament.games, { requireFinished: true });
        }
        let groupRanking = rankGroupByRegulations(group, tournament.games || []);
        sortedGroups.push(groupRanking);
      });
      return sortedGroups;
    } else if (
      tournament.barrage &&
      tournament.barrage.groups &&
      activeRound > tournament.barrage.startIndex &&
      !tournament.playOff &&
      !tournament.tournamentIsFinished
    ) {
      let sortedGroups = [];
      const barrageGames = tournament.games.slice(tournament.barrage.startIndex);
      tournament.barrage.groups.forEach((group, groupIndex) => {
        accumulateGroupStats(group, barrageGames, { filterByGroup: groupIndex });
        let groupRanking = group
          .slice()
          .sort((a, b) => b.wins - a.wins || b.pointsPlus - b.pointsMinus - (a.pointsPlus - a.pointsMinus));
        sortedGroups.push(groupRanking);
      });
      return sortedGroups;
    } else if (tournament.system === 'supermele') {
      return sortTeamsForSupermele(tournament.teams);
    } else if (tournament.system === 'tir') {
      return tournament.teams || [];
    } else if (tournament.system === 'swiss') {
      return sortTeams(tournament.teams);
    }
  } else {
    return [];
  }
}
function gameHasError(game, maxScore) {
  return (
    (game.team_1_score && game.team_2_score && game.team_1_score === game.team_2_score) ||
    game.team_1_score < 0 ||
    game.team_1_score > maxScore ||
    game.team_2_score < 0 ||
    game.team_2_score > maxScore
  );
}
function copyContent(data) {
  navigator.clipboard.writeText(data.trim());
}

function isScoreError(game, maxScore) {
  return (
    game.team_1_score === game.team_2_score ||
    game.team_1_score === null ||
    game.team_1_score < 0 ||
    game.team_1_score > maxScore ||
    game.team_2_score === null ||
    game.team_2_score < 0 ||
    game.team_2_score > maxScore
  );
}

const regions = {
  1: 'Київ',
  2: 'Харківська',
  3: 'Харківська',
  4: 'Закарпатська',
  6: 'Харківська',
  7: 'Львівська',
  8: 'Львівська',
  9: 'Івано-Франківська',
  10: 'Закарпатська',
  11: 'Львівська',
  12: 'Харківська',
  13: 'Закарпатська',
  14: 'Львівська',
  15: 'Закарпатська',
  16: 'Київська',
  17: 'Полтавська',
  18: 'Чернігівська',
  19: 'Київська',
  20: 'Закарпатська',
  21: 'Київська',
  22: 'Волинська',
  23: 'Закарпатська',
  24: 'Закарпатська',
  25: 'Волинська',
  26: 'Тернопільська',
  27: 'Харківська',
};

const shuffleArray = (array) => {
  let currentIndex = array.length,
    randomIndex;
  while (currentIndex !== 0) {
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;
    [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
  }
  return array;
};

function updateScoreHistory(game) {
  const s1 = Number(game.team_1_score) || 0;
  const s2 = Number(game.team_2_score) || 0;
  if (s1 === 0 && s2 === 0) {
    if (game.score_history?.length) game.score_history = [];
    return;
  }
  if (!game.score_history) game.score_history = [];
  const last = game.score_history[game.score_history.length - 1];
  if (!last) {
    game.score_history.push({ s1, s2 });
    return;
  }
  if (s1 === last.s1 && s2 === last.s2) {
    return;
  }
  if (s1 < last.s1 || s2 < last.s2) {
    return;
  }
  game.score_history.push({ s1, s2 });
}

function buildGroupBView(tournament) {
  const gb = tournament?.groupB;
  if (!gb) return null;
  return {
    ...tournament,
    teams: gb.teams,
    games: gb.games,
    playOff: gb.playOff,
    playOffBracket: gb.playOffBracket,
    playOffStage: gb.playOffStage ?? gb.playOff?.[0]?.stage ?? null,
    cadrage: gb.cadrage,
    barrage: gb.barrage,
    eliminationRound: gb.eliminationRound,
    roundIsActive: gb.roundIsActive,
    tournamentIsFinished: gb.tournamentIsFinished,
    system: gb.mode === 'playoff' ? 'playoff' : 'swiss',
    isGroupB: true,
  };
}

function buildEliminationGames(teams, elimCount) {
  const pool = teams.slice(teams.length - elimCount);
  const games = [];
  const half = Math.floor(pool.length / 2);
  for (let i = 0; i < half; i++) {
    games.push({
      team_1: pool[i].title,
      team_2: pool[pool.length - 1 - i].title,
      team_1_score: null,
      team_2_score: null,
    });
  }
  return {
    games,
    qualifiedFrom: teams.length - elimCount,
    bracketSize: teams.length - half,
    completed: false,
  };
}

function pluralizeRounds(n, locale) {
  if (locale === 'ua') {
    const mod10 = n % 10;
    const mod100 = n % 100;
    if (mod10 === 1 && mod100 !== 11) return 'коло';
    if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return 'кола';
    return 'кіл';
  }
  return n === 1 ? 'round' : 'rounds';
}

function formatSwissDescription(tournament, locale, labels) {
  const { swiss, playOff, poulesBarrage, systemLabel } = labels;
  let desc;
  if (tournament.games?.length) {
    const barrage = tournament.barrage;
    const swissRounds = barrage ? barrage.startIndex : tournament.games.length;
    const total = tournament.preferences?.swissRoundsCount;
    if (total && swissRounds > 1) {
      desc = swissRounds + '/' + total + ' ' + pluralizeRounds(swissRounds, locale) + ' ' + swiss;
    } else if (total) {
      desc = total + ' ' + pluralizeRounds(total, locale) + ' ' + swiss;
    } else {
      desc = swissRounds + ' ' + pluralizeRounds(swissRounds, locale) + ' ' + swiss;
    }
    if (barrage) {
      desc += ' + ' + poulesBarrage;
    }
  } else {
    desc = systemLabel;
    const total = tournament.preferences?.swissRoundsCount;
    if (total) {
      desc += ' (' + total + ' ' + pluralizeRounds(total, locale) + ')';
    }
  }
  if (tournament.playOff || tournament.playoff || tournament.preferences?.playOffEnabled) {
    desc += ' + ' + playOff;
  }
  return desc;
}

export {
  tournamentNames,
  getGameResultInGroup,
  getTournamentRanking,
  getTeamsRanking,
  gameHasError,
  copyContent,
  regions,
  sortTeams,
  countBuhgolts,
  isScoreError,
  shuffleArray,
  rankGroupByRegulations,
  updateScoreHistory,
  buildGroupBView,
  buildEliminationGames,
  pluralizeRounds,
  formatSwissDescription,
};
