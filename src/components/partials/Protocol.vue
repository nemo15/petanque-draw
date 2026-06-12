<template>
    <div class="container protocol-container">
        <div class="protocol-gate" v-if="!skipGate && password !== 499">
            <div class="protocol-gate__card">
                <div class="protocol-gate__badge">
                    <Star :size="14"/>
                    Платна опція
                </div>
                <p class="protocol-gate__desc">Ви отримуєте на 80% готовий протокол. Треба дописати тільки тренерів команд і трохи відформатувати текстовий документ.</p>
                <div class="protocol-gate__payment">
                    <span class="protocol-gate__price">300 грн</span>
                    <span class="protocol-gate__card-number">5353 5423 2447 0856</span>
                    <button class="protocol-gate__copy" @click="copyCard" :title="cardCopied ? 'Скопійовано!' : 'Скопіювати'">
                        <Copy v-if="!cardCopied" :size="18"/>
                        <Check v-else :size="18"/>
                    </button>
                </div>
                <div class="protocol-gate__contact">
                    Після оплати пишіть у Telegram <strong>@andrewkamenev</strong> або дзвоніть <a href="tel:+380951804418"><strong>+38-095-180-44-18</strong></a>
                </div>
                <div class="protocol-gate__tips">
                    <div class="protocol-gate__tip">
                        <Info :size="16"/>
                        Ввести арбітрів можна тут же, або вже коли експортуєте у текстовий формат
                    </div>
                    <div class="protocol-gate__tip">
                        <Info :size="16"/>
                        Кнопка "Скопіювати протокол" і відредагувати у текстовому редакторі — найкращий варіант
                    </div>
                </div>
            </div>
            <div class="protocol-gate__password">
                <label class="protocol-gate__label" for="protocolPassword">Пароль</label>
                <input class="protocol-gate__input" id="protocolPassword" type="number" v-model="password" placeholder="Введіть пароль">
            </div>
        </div>
        <div v-else>
            <div class="protocol-warning">
                <AlertTriangle :size="18"/>
                <span>Протокол не є гарантовано вірним, може бути некоректна чи не вся інформація на порталі, може бути специфічний регламент, може не бути всіх даних по гравцям. Перевіряйте вручну, будь ласка!</span>
            </div>
            <div id="protocol" class="mb-3" @input="saveProtocolToStorage">
                <div class="protocol-page">
                <h2 class="text-center is-size-3 mb-2">
                    Підсумковий протокол <br>
                    {{ tournament.name }}
                </h2>
                <table class="table is-bordered protocol-info-table">
                    <tbody>
                    <tr>
                        <td>Дата початку змагань</td>
                        <td contenteditable="plaintext-only">{{ formatDateToHumanReadable(tournament.date) }}</td>
                    </tr>
                    <tr>
                        <td>Дата закінчення змагань</td>
                        <td contenteditable="plaintext-only">{{ formatDateToHumanReadable(tournament.date) }}</td>
                    </tr>
                    <tr>
                        <td>Місце/місто проведення</td>
                        <td contenteditable="plaintext-only"></td>
                    </tr>
                    <tr>
                        <td>Організатор</td>
                        <td contenteditable="plaintext-only"></td>
                    </tr>
                    <tr>
                        <td>Головний суддя</td>
                        <td contenteditable="plaintext-only">{{ arbitr }}</td>
                    </tr>
                    <tr>
                        <td>Загальна кількість гравців</td>
                        <td>{{ playersCount }}</td>
                    </tr>
                    </tbody>
                </table>
                <br>
                <h3 class="text-center is-size-4 mb-2">Учасники та результати</h3>
                <table v-if="participantChunks.length" class="table is-bordered">
                    <thead>
                    <tr class="has-text-centered">
                        <th style="width: 30px">№ <span style="white-space: nowrap">з/п</span></th>
                        <th>ПІП</th>
                        <th style="width: 16%">Регіон</th>
                        <th style="width: 18%">Тренер(и)</th>
                        <th style="width: 10%">Спортивний розряд/звання</th>
                        <th v-if="tournament.playOff?.length">Місце після відбіркових ігор</th>
                        <th style="width: 7%">Загальне підсумкове місце</th>
                    </tr>
                    </thead>
                    <tbody v-for="(team, index) in participantChunks[0]" :key="index" class="team-group">
                        <tr>
                            <td :rowspan="team.players?.length > 1 ? team.players?.length + 1 : 1" class="has-text-centered">{{ index + 1 }} </td>
                            <td class="has-text-weight-bold" :colspan="team.players?.length > 1 ? 2 : 1" contenteditable="plaintext-only">
                                <span v-if="team.players?.length > 1">{{ protocolTitles[team.title] }}</span>
                                <span v-else-if="team.players">{{ formatName(team.players[0].surname) + ' ' + formatName(team.players[0].name) + ' ' + (team.players[0].second_name ? team.players[0].second_name : getPlayerThirdName(team.players[0].surname, team.players[0].name)) }}</span>
                            </td>
                            <td v-if="team.players?.length === 1">{{ regions[team.players[0].club_id] || '' }}</td>
                            <td contenteditable="plaintext-only" :rowspan="team.players?.length > 1 ? team.players.length + 1 : 1"></td>
                            <td contenteditable="plaintext-only">{{team.players?.length === 1 && team.players[0].sport_title === 'candidate' ? 'КМСУ' : ''}}</td>
                            <td v-if="tournament.playOff?.length" class="has-text-centered" :rowspan="team.players?.length > 1 ? team.players?.length + 1 : 1">
                                {{tournament.system === 'swiss' ? index + 1 : getTeamPlaceInGroups(team.place, rankingTeams.length)}}
                            </td>
                            <td class="has-text-centered" :rowspan="team.players?.length > 1 ? team.players?.length + 1 : 1">
                                {{tournament.playOff?.length ? tournamentRanking.find(item => item.title === team.title)?.place : index + 1}}
                            </td>
                        </tr>
                        <template v-if="team.players?.length > 1">
                            <tr v-for="(player, playerIndex) in team.players" :key="playerIndex">
                                <td contenteditable="plaintext-only"><span class="is-capitalized">{{ formatName(player.surname) + ' ' + formatName(player.name) + ' ' + (player.second_name ? player.second_name.toLowerCase() : getPlayerThirdName(player.surname, player.name)) }}</span> </td>
                                <td>{{ regions[player.club_id] || '' }} </td>
                                <td contenteditable="plaintext-only">{{player.sport_title === 'candidate' ? 'КМСУ' : ''}}</td>
                            </tr>
                        </template>
                    </tbody>
                </table>
                </div>
                <div v-for="(chunk, ci) in participantChunks.slice(1)" :key="'pc'+ci" class="pdf-page-break">
                <table class="table is-bordered">
                    <thead>
                    <tr class="has-text-centered">
                        <th style="width: 30px">№ <span style="white-space: nowrap">з/п</span></th>
                        <th>ПІП</th>
                        <th style="width: 16%">Регіон</th>
                        <th style="width: 18%">Тренер(и)</th>
                        <th style="width: 10%">Спортивний розряд/звання</th>
                        <th v-if="tournament.playOff?.length">Місце після відбіркових ігор</th>
                        <th style="width: 7%">Загальне підсумкове місце</th>
                    </tr>
                    </thead>
                    <tbody v-for="(team, index) in chunk" :key="index" class="team-group">
                        <tr>
                            <td :rowspan="team.players?.length > 1 ? team.players?.length + 1 : 1" class="has-text-centered">{{ (ci + 1) * participantChunkSize + index + 1 }} </td>
                            <td class="has-text-weight-bold" :colspan="team.players?.length > 1 ? 2 : 1" contenteditable="plaintext-only">
                                <span v-if="team.players?.length > 1">{{ protocolTitles[team.title] }}</span>
                                <span v-else-if="team.players">{{ formatName(team.players[0].surname) + ' ' + formatName(team.players[0].name) + ' ' + (team.players[0].second_name ? team.players[0].second_name : getPlayerThirdName(team.players[0].surname, team.players[0].name)) }}</span>
                            </td>
                            <td v-if="team.players?.length === 1">{{ regions[team.players[0].club_id] || '' }}</td>
                            <td contenteditable="plaintext-only" :rowspan="team.players?.length > 1 ? team.players.length + 1 : 1"></td>
                            <td contenteditable="plaintext-only">{{team.players?.length === 1 && team.players[0].sport_title === 'candidate' ? 'КМСУ' : ''}}</td>
                            <td v-if="tournament.playOff?.length" class="has-text-centered" :rowspan="team.players?.length > 1 ? team.players?.length + 1 : 1">
                                {{tournament.system === 'swiss' ? ((ci + 1) * participantChunkSize + index + 1) : getTeamPlaceInGroups(team.place, rankingTeams.length)}}
                            </td>
                            <td class="has-text-centered" :rowspan="team.players?.length > 1 ? team.players?.length + 1 : 1">
                                {{tournament.playOff?.length ? tournamentRanking.find(item => item.title === team.title)?.place : ((ci + 1) * participantChunkSize + index + 1)}}
                            </td>
                        </tr>
                        <template v-if="team.players?.length > 1">
                            <tr v-for="(player, playerIndex) in team.players" :key="playerIndex">
                                <td contenteditable="plaintext-only"><span class="is-capitalized">{{ formatName(player.surname) + ' ' + formatName(player.name) + ' ' + (player.second_name ? player.second_name.toLowerCase() : getPlayerThirdName(player.surname, player.name)) }}</span> </td>
                                <td>{{ regions[player.club_id] || '' }} </td>
                                <td contenteditable="plaintext-only">{{player.sport_title === 'candidate' ? 'КМСУ' : ''}}</td>
                            </tr>
                        </template>
                    </tbody>
                </table>
                </div>
                <Results :previewTournament="tournament" :only-qualifying="true" :is-for-protocol="true" :team-titles="protocolTitles" section-title="Результати кожного раунду"/>
                <Ranking :tournament="tournament" :rankingTeams="rankingTeams" :is-for-protocol="true" :team-titles="protocolTitles" :section-title="`Результати відбіркових ігор <span class='is-size-5'>(${tournament.system === 'swiss' ? 'швейцарська' : 'кругова'} система (${tournament.games.length} раундів))</span>`"/>
                <template v-if="tournament.playOff?.length">
                    <Results :previewTournament="tournament" :is-for-protocol="true" :only-play-off="true" :team-titles="protocolTitles" section-title="Результати ігор на виліт"/>
                </template>
                <div class="pdf-page-break">
                    <h3 class="text-center is-size-4 mb-2">Судді змагання</h3>
                    <table class="table is-bordered">
                        <thead class="has-text-centered">
                        <tr>
                            <th style="width: 60px">№ з/п</th>
                            <th>Прізвище, ім'я, по батькові</th>
                            <th style="width: 22%">Посада</th>
                            <th style="width: 14%">Суддівська категорія</th>
                            <th v-if="showArbitrCertificate">№ посвідчення</th>
                            <th>Регіон</th>
                        </tr>
                        </thead>
                        <tbody>
                        <tr v-for="(item, index) in arbitres" :key="index">
                            <td>{{ index + 1 }}</td>
                            <td contenteditable="plaintext-only" v-text="item.name"></td>
                            <td contenteditable="plaintext-only"></td>
                            <td contenteditable="plaintext-only"></td>
                            <td v-if="showArbitrCertificate" contenteditable="plaintext-only"></td>
                            <td contenteditable="plaintext-only"></td>
                        </tr>
                        </tbody>
                    </table>
                    <div>
                        <table width="100%" class="is-fullwidth">
                            <tbody>
                            <tr>
                                <td>Головний суддя змагань</td>
                                <td class="has-text-centered">___________________ <br> (печатка)</td>
                                <td class="has-text-right" contenteditable="plaintext-only"></td>
                            </tr>
                            <tr>
                                <td>Суддя</td>
                                <td class="has-text-centered">___________________ <br> (підпис)</td>
                                <td class="has-text-right" contenteditable="plaintext-only"></td>
                            </tr>
                            <tr>
                                <td>Головний секретар змагань</td>
                                <td class="has-text-centered">___________________ <br> (підпис)</td>
                                <td class="has-text-right" contenteditable="plaintext-only"></td>
                            </tr>
                            <tr>
                                <td>Президент ГС «Федерація петанку України»</td>
                                <td class="has-text-centered">___________________ <br> (підпис)</td>
                                <td class="has-text-right">Литвин Лілія Миколаївна</td>
                            </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
            <div class="protocol-actions">
                <div class="protocol-actions__primary">
                    <button class="protocol-actions__btn protocol-actions__btn--primary" @click="exportPdf">
                        <FileDown :size="16"/> {{ $t('teams.exportPdf') }}
                    </button>
                    <button class="protocol-actions__btn protocol-actions__btn--primary" @click="copyProtocol">
                        <Copy :size="16"/> {{ $t('teams.copyProtocol') }}
                    </button>
                    <button class="protocol-actions__btn protocol-actions__btn--outline" @click="$emit('close')">
                        {{ $t('common.close') }}
                    </button>
                </div>
                <div class="protocol-actions__secondary">
                    <button class="protocol-actions__btn protocol-actions__btn--success" @click="addArbitr">
                        <Plus :size="16"/> Додати суддю
                    </button>
                    <a href="https://docs.google.com/spreadsheets/d/1yXDjYCX3nISBCt8-S-vmvIU31rb4SmhtRsWc8PbQy7Q/edit?usp=sharing" target="_blank" class="protocol-actions__btn protocol-actions__btn--outline">
                        <ExternalLink :size="16"/> Список суддів ФПУ
                    </a>
                    <button class="protocol-actions__btn protocol-actions__btn--outline" @click="refreshPlayersFromPortal" :disabled="refreshing">
                        <RefreshCw :size="16" :class="{'spin': refreshing}"/> Оновити дані гравців
                    </button>
                    <button class="protocol-actions__btn protocol-actions__btn--outline" @click="removeDopyshit">
                        <Eraser :size="16"/> Прибрати "ДОПИШІТЬ МЕНЕ"
                    </button>
                    <button class="protocol-actions__btn protocol-actions__btn--ghost" @click="resetProtocol">
                        <RotateCcw :size="16"/> Скинути зміни
                    </button>
                    <label class="protocol-actions__checkbox">
                        <input type="checkbox" v-model="showArbitrCertificate"> № посвідчення суддів
                    </label>
                </div>
            </div>
        </div>
    </div>
</template>

<script>

import Results from "@/components/partials/Results";
import {getTournamentRanking, regions} from "@/helpers";
import Ranking from "@/components/partials/Ranking";
import playersNames from '../../data.json'
import {mapActions} from "pinia";
import {useMainStore} from "@/stores/main";
import {Star, Copy, Check, Info, AlertTriangle, Plus, ExternalLink, FileDown, RefreshCw, Eraser, RotateCcw} from "lucide-vue-next";

export default {
    name: 'Protocol',
    components: {Ranking, Results, Star, Copy, Check, Info, AlertTriangle, Plus, ExternalLink, FileDown, RefreshCw, Eraser, RotateCcw},
    props: ['tournament', 'rankingTeams', 'skipGate'],
    data() {
        return {
            password: null,
            cardCopied: false,
            regions,
            titleCounts: {},
            mixedTeamCount: 1,
            noRegionTeamCount: 1,
            protocolTitles: {},
            arbitr: '',
            refreshing: false,
            showArbitrCertificate: false,
            arbitres: [

            ]
        }
    },
    mounted() {
        if (this.tournament.system === 'groups') {
            this.rankingTeams.forEach(group => {
                group.forEach(team => {
                    this.setTeamTitle(team.title, team.players)
                })
            })
        } else {
            this.rankingTeams.forEach(team => {
                this.setTeamTitle(team.title, team.players)
            })
        }
        this.$nextTick(() => {
            this.restoreProtocolFromStorage();
        });
    },
    computed: {
        protocolStorageKey() {
            return `protocol_${this.tournament.id}`;
        },
        playersCount() {
            let playersCount = 0;
            this.tournament.teams.forEach(team => {
                playersCount = playersCount + team.players.length;
            })
            return playersCount
        },
        tournamentRanking() {
            return getTournamentRanking(this.tournament, this.rankingTeams)
        },
        participantsList() {
            return this.tournament.system === 'swiss' ? this.rankingTeams : this.getAllTeams(this.rankingTeams);
        },
        participantChunkSize() {
            return 28;
        },
        participantChunks() {
            const list = this.participantsList;
            if (!list) return [];
            const chunks = [];
            for (let i = 0; i < list.length; i += this.participantChunkSize) {
                chunks.push(list.slice(i, i + this.participantChunkSize));
            }
            return chunks;
        },
    },
    methods: {
        ...mapActions(useMainStore, ['showMessage']),
        copyCard() {
            navigator.clipboard.writeText('5353542324470856');
            this.cardCopied = true;
            this.showMessage({title: 'Скопійовано', text: 'Номер картки скопійовано'});
            setTimeout(() => { this.cardCopied = false; }, 2000);
        },
        getAllTeams(groups) {
            let allTeams = [];
            groups.forEach(group => {
                group.map((team, index) => {
                    team.place = index + 1
                });
                allTeams = [...allTeams, ...group];
            });
            return allTeams;
        },
        getTeamPlaceInGroups(place, groupsLength) {
            if (+place === 1) {
                return '1-' + (Number(place) + (groupsLength - 1))
            } else {
                return (+place * groupsLength - 1) + '-' + (Number(place) * groupsLength)
            }

        },
        formatDateToHumanReadable(dateString) {
            if (!dateString) return '';
            const date = new Date(dateString);
            if (isNaN(date.getTime())) return '';

            const options = { day: 'numeric', month: 'long', year: 'numeric' };
            const formatter = new Intl.DateTimeFormat('uk-UA', options);

            const formattedParts = formatter.formatToParts(date);

            const day = formattedParts.find(part => part.type === 'day').value;
            const month = formattedParts.find(part => part.type === 'month').value;
            const year = formattedParts.find(part => part.type === 'year').value;

            return `${day} ${month} ${year} року`;
        },
        async refreshPlayersFromPortal() {
            let portalId = this.tournament.portalIdTournament;
            if (!portalId) {
                portalId = prompt('Введіть ID турніру на порталі (з URL: portal.petanque.org.ua/tournament/XXX)');
                if (!portalId) return;
            }
            this.refreshing = true;
            try {
                console.log('Fetching portal data for tournament:', portalId);
                const res = await fetch(`https://portal.petanque.org.ua/tournament/team_export/${portalId}?format=json`);
                if (!res.ok) throw new Error('Failed to fetch');
                const data = await res.json();
                console.log('Portal data received:', data.teams?.length, 'teams');
                const portalPlayers = new Map();
                data.teams.forEach(team => {
                    if (team.players) {
                        team.players.forEach(p => {
                            if (p.id) portalPlayers.set(p.id, p);
                        });
                    }
                });
                console.log('Portal players indexed:', portalPlayers.size);
                let updated = 0;
                this.tournament.teams.forEach((team, tIdx) => {
                    if (team.players) {
                        team.players.forEach((player, pIdx) => {
                            const portalPlayer = portalPlayers.get(player.id);
                            if (portalPlayer) {
                                const newPlayer = {...player};
                                if (portalPlayer.second_name) newPlayer.second_name = portalPlayer.second_name;
                                if (portalPlayer.surname) newPlayer.surname = portalPlayer.surname;
                                if (portalPlayer.name) newPlayer.name = portalPlayer.name;
                                if (portalPlayer.club_id) newPlayer.club_id = portalPlayer.club_id;
                                if (portalPlayer.sport_title) newPlayer.sport_title = portalPlayer.sport_title;
                                this.tournament.teams[tIdx].players.splice(pIdx, 1, newPlayer);
                                updated++;
                            } else {
                                console.log('Player not found on portal:', player.id, player.surname, player.name);
                            }
                        });
                    }
                });
                console.log('Updated players:', updated);
                this.$forceUpdate();
                this.showMessage({title: 'Оновлено', text: `Оновлено ${updated} гравців з порталу`});
            } catch (e) {
                console.error('Refresh error:', e);
                this.showMessage({title: 'Помилка', text: 'Не вдалося завантажити дані з порталу', type: 'error'});
            } finally {
                this.refreshing = false;
            }
        },
        saveProtocolToStorage() {
            const el = document.getElementById('protocol');
            if (!el) return;
            localStorage.setItem(this.protocolStorageKey, el.innerHTML);
        },
        restoreProtocolFromStorage() {
            const saved = localStorage.getItem(this.protocolStorageKey);
            if (!saved) return;
            const el = document.getElementById('protocol');
            if (!el) return;
            el.innerHTML = saved;
        },
        resetProtocol() {
            localStorage.removeItem(this.protocolStorageKey);
            location.reload();
        },
        removeDopyshit() {
            const el = document.getElementById('protocol');
            if (!el) return;
            const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
            const nodes = [];
            while (walker.nextNode()) {
                if (walker.currentNode.textContent.includes('ДОПИШІТЬ МЕНЕ')) {
                    nodes.push(walker.currentNode);
                }
            }
            nodes.forEach(node => {
                node.textContent = node.textContent.replace(/\s*!!! ДОПИШІТЬ МЕНЕ!!!\s*/g, '');
            });
            this.showMessage({title: 'Готово', text: `Прибрано ${nodes.length} міток`});
        },
        addArbitr() {
            this.arbitres.push({
                name: ''
            })
        },
        formatName(name) {
            return name.substring(0,1).toUpperCase() + name.substring(1, name.length).toLowerCase()
        },
        getPlayerThirdName(surname, name) {
            const s = surname.toUpperCase();
            const n = name.toUpperCase();
            const playerInfo = playersNames.find(item => item.includes(s + ' ' + n) || item.includes(n + ' ' + s));
            if (playerInfo) {
                const playerInfoArray = playerInfo.split(' ');
                if (playerInfoArray.length >= 3) {
                    return this.formatName(playerInfoArray[2]);
                } else {
                    return '!!! ДОПИШІТЬ МЕНЕ!!!'
                }
            } else {
                return '!!! ДОПИШІТЬ МЕНЕ!!!'
            }
        },
        copyProtocol() {
            const element = document.getElementById("protocol");

            const range = document.createRange();
            range.selectNodeContents(element);

            const selection = window.getSelection();
            selection.removeAllRanges();
            selection.addRange(range);

            try {
                const successful = document.execCommand("copy");
                if (successful) {
                    this.showMessage({title: this.$t('messages.success'), text: this.$t('messages.protocolCopied')});
                } else {
                    this.showMessage({title: this.$t('messages.error'), text: this.$t('messages.cantCopyProtocol'), type: 'error' });
                }
            } catch (err) {
                console.error("Error copying to clipboard:", err);
            }

            selection.removeAllRanges();
        },
        async exportPdf() {
            const { default: html2pdf } = await import("html2pdf.js");
            const el = document.getElementById("protocol");

            el.classList.add('is-exporting');

            const overflows = [];
            el.querySelectorAll('.table-container').forEach(tc => {
                overflows.push({ el: tc, overflow: tc.style.overflow, maxWidth: tc.style.maxWidth });
                tc.style.overflow = 'visible';
                tc.style.maxWidth = 'none';
            });
            el.querySelectorAll('.is-hidden-mobile').forEach(h => {
                h.style.setProperty('display', 'inline', 'important');
            });
            el.querySelectorAll('.is-hidden-tablet').forEach(h => {
                h.style.setProperty('display', 'none', 'important');
            });

            await new Promise(r => setTimeout(r, 300));

            await html2pdf().set({
                margin: [10, 5, 10, 5],
                filename: `${this.tournament.name}_protocol.pdf`,
                pagebreak: { mode: ['avoid-all'], before: '.pdf-page-break', avoid: ['.team-group', 'tr'] },
                image: { type: 'jpeg', quality: 0.98 },
                html2canvas: { scale: 2, scrollY: 0, useCORS: true },
                jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
            }).from(el).save();

            el.classList.remove('is-exporting');

            overflows.forEach(({ el: tc, overflow, maxWidth }) => {
                tc.style.overflow = overflow;
                tc.style.maxWidth = maxWidth;
            });
            el.querySelectorAll('.is-hidden-mobile').forEach(h => {
                h.style.removeProperty('display');
            });
            el.querySelectorAll('.is-hidden-tablet').forEach(h => {
                h.style.removeProperty('display');
            });
        },
        setTeamTitle(team, players) {
            let title;
            if (players?.length > 1) {
                const firstPlayerClubName = this.regions[players[0].club_id];
                if (firstPlayerClubName){
                    if (players.every(player => this.regions[player.club_id] === firstPlayerClubName)) {
                        title = `Команда ${firstPlayerClubName.replace(/ка$/, 'кої')} області`;
                        if (this.titleCounts[title]) {
                            this.titleCounts[title]++;
                        } else {
                            this.titleCounts[title] = 1;
                        }
                        title += ` ${this.titleCounts[title]}`;
                    } else {
                        title = `Збірна команда ${this.mixedTeamCount}`;
                        this.mixedTeamCount++;
                    }
                } else {
                    const rawSurname = players[0].surname || players[0].name || '';
                    const captainSurname = rawSurname.split('/')[0].trim();
                    title = `Команда ${this.formatName(captainSurname)}`;
                    this.noRegionTeamCount++
                }
            } else {
                title = team
            }
            this.protocolTitles[team] = title
        }
    }
}
</script>

<style>
.protocol-container {
    background: #e8e8e8;
    padding: 1.5rem;
    border-radius: 8px;
    margin-top: 1rem;
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
}

@media (max-width: 900px) {
    .protocol-container {
        padding: 1rem 0.5rem;
    }
}

.protocol-gate {
    margin-bottom: 1.5rem;
}

.protocol-gate__card {
    border: 1px solid var(--color-border);
    border-radius: 10px;
    padding: 1.25rem 1.5rem;
    background: var(--color-bg-input);
}

.protocol-gate__badge {
    display: inline-flex;
    align-items: center;
    gap: 0.3rem;
    padding: 0.25rem 0.7rem;
    font-size: 1rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    background: var(--color-warning);
    color: var(--color-btn-text);
    border-radius: 4px;
    margin-bottom: 0.75rem;
}

.protocol-gate__desc {
    font-size: 1rem;
    color: var(--color-text-secondary);
    line-height: 1.5;
    margin-bottom: 1rem;
}

.protocol-gate__payment {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    margin-bottom: 0.5rem;
}

.protocol-gate__price {
    font-size: 1.1rem;
    font-weight: 700;
    color: var(--color-text);
}

.protocol-gate__card-number {
    font-size: 1rem;
    font-weight: 600;
    font-family: monospace;
    background: var(--color-white);
    border: 1px solid var(--color-border);
    padding: 0.25rem 0.6rem;
    border-radius: 4px;
    color: var(--color-text);
}

.protocol-gate__copy {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    border: none;
    border-radius: 6px;
    background: transparent;
    color: var(--color-text-muted);
    cursor: pointer;
    transition: color 0.15s, background 0.15s;
}

.protocol-gate__copy:hover {
    background: var(--color-primary-bg);
    color: var(--color-primary);
}

.protocol-gate__contact {
    font-size: 1rem;
    color: var(--color-text-muted);
    margin-bottom: 1rem;
}

.protocol-gate__contact strong {
    color: var(--color-text-secondary);
}

.protocol-gate__tips {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
    border-top: 1px solid var(--color-border);
    padding-top: 0.75rem;
}

.protocol-gate__tip {
    display: flex;
    align-items: flex-start;
    gap: 0.4rem;
    font-size: 1rem;
    color: var(--color-text-muted);
    line-height: 1.4;
}

.protocol-gate__tip svg {
    flex-shrink: 0;
    margin-top: 1px;
    color: var(--color-primary);
}

.protocol-gate__password {
    margin-top: 1rem;
    max-width: 240px;
}

.protocol-gate__label {
    display: block;
    font-size: 1rem;
    font-weight: 600;
    color: var(--color-text);
    margin-bottom: 0.3rem;
}

.protocol-gate__input {
    width: 100%;
    padding: 0.5rem 0.75rem;
    font-size: 1rem;
    border: 1px solid var(--color-border);
    border-radius: 6px;
    background: var(--color-white);
    outline: none;
    transition: border-color 0.2s;
}

.protocol-gate__input:focus {
    border-color: var(--color-primary);
}

.protocol-warning {
    display: flex;
    align-items: flex-start;
    gap: 0.6rem;
    padding: 0.75rem 1rem;
    border-radius: 8px;
    border: 1px solid var(--color-warning-border);
    background: var(--color-warning-bg);
    color: var(--color-warning-text);
    font-size: 1rem;
    line-height: 1.5;
    margin-bottom: 1.25rem;
}

.protocol-warning svg {
    flex-shrink: 0;
    margin-top: 2px;
}

.protocol-actions {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    margin-top: 1.5rem;
    padding: 1.25rem;
    border-radius: 10px;
    background: var(--color-bg-input);
    border: 1px solid var(--color-border);
}

.protocol-actions__primary {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    padding-bottom: 1rem;
    border-bottom: 1px solid var(--color-border);
}

.protocol-actions__secondary {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    align-items: center;
}

.protocol-actions__btn {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    padding: 0.5rem 0.9rem;
    font-size: 1rem;
    font-weight: 500;
    border-radius: 6px;
    border: 1px solid;
    cursor: pointer;
    transition: all 0.15s;
    text-decoration: none;
}

.protocol-actions__btn--primary {
    background: var(--color-primary);
    border-color: var(--color-primary);
    color: var(--color-btn-text);
}

.protocol-actions__btn--primary:hover {
    background: var(--color-primary-light);
    border-color: var(--color-primary-light);
}

.protocol-actions__btn--success {
    background: var(--color-success);
    border-color: var(--color-success);
    color: var(--color-btn-text);
}

.protocol-actions__btn--success:hover {
    background: var(--color-success-hover);
    border-color: var(--color-success-hover);
}

.protocol-actions__btn--outline {
    background: transparent;
    border-color: var(--color-border);
    color: var(--color-text-secondary);
}

.protocol-actions__btn--outline:hover {
    border-color: var(--color-primary);
    color: var(--color-primary);
    background: var(--color-primary-bg);
}

.protocol-actions__btn--ghost {
    background: transparent;
    border-color: transparent;
    color: var(--color-text-muted);
}

.protocol-actions__btn--ghost:hover {
    color: var(--color-danger, #e53935);
    background: rgba(229, 57, 53, 0.06);
    border-color: transparent;
}

.protocol-actions__checkbox {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    font-size: 1rem;
    color: var(--color-text-secondary);
    cursor: pointer;
    margin-left: auto;
}

.spin {
    animation: spin 1s linear infinite;
}

@keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
}

#protocol {
    color: #000;
    font-family: 'Times New Roman';
    width: 210mm;
    min-width: 210mm;
    margin: 0 auto;
    counter-reset: protocol-page 1;
}

#protocol > .protocol-page,
#protocol .pdf-page-break {
    background: #fff;
    border: 1px solid #bbb;
    box-shadow: 0 2px 8px rgba(0,0,0,0.10);
    box-sizing: border-box;
    padding: 15mm;
    padding-bottom: 20mm;
    min-height: 297mm;
    position: relative;
    counter-increment: protocol-page;
    margin-bottom: 24px;
    page-break-before: always;
    break-before: page;
    overflow: hidden;
}

#protocol > .protocol-page {
    page-break-before: auto;
    break-before: auto;
}

#protocol > .protocol-page::after,
#protocol .pdf-page-break::after {
    content: counter(protocol-page);
    position: absolute;
    bottom: 10mm;
    left: 50%;
    transform: translateX(-50%);
    font-size: 10pt;
    color: #aaa;
    font-family: Arial, sans-serif;
}

#protocol h2, #protocol h3 {
    font-weight: bold;
    page-break-after: avoid;
}

#protocol table tr,
#protocol table tbody.team-group {
    page-break-inside: avoid;
    break-inside: avoid;
}

#protocol table {
    width: 100%;
}

#protocol .content h3,
#protocol .content h4,
#protocol table th,
#protocol table td {
    color: #000;
}

#protocol table td {
    padding: 0.2em 0.3em;
}

#protocol table td[contenteditable] {
    user-select: text;
    -webkit-user-select: text;
    cursor: text;
    min-height: 1.4em;
}

#protocol .table-container {
    overflow: visible;
    max-width: none;
}

.protocol-info-table {
    width: 100%;
}

.protocol-info-table td:first-child {
    width: 40%;
    white-space: nowrap;
}

.protocol-info-table td:last-child {
    width: 60%;
    min-width: 300px;
}

#protocol.is-exporting > .protocol-page,
#protocol.is-exporting .pdf-page-break {
    border: none;
    box-shadow: none;
    min-height: auto;
    padding: 0;
    margin: 0;
    overflow: visible;
    page-break-before: auto;
    break-before: auto;
}

#protocol.is-exporting .pdf-page-break {
    border-top: 40px solid #fff;
}

#protocol.is-exporting > .protocol-page::after,
#protocol.is-exporting .pdf-page-break::after {
    display: none;
}
</style>
