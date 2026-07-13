<template>
  <Modal @close-modal="$emit('close-modal')">
    <div class="prefs">
      <h2 class="prefs__title">{{ $t('modals.tournamentPreferences') }}</h2>
      <div class="prefs__body">
        <div class="prefs__list">
          <div class="prefs__section">
            <label class="prefs__section-header">
              <Trophy :size="18" />
              <input
                type="checkbox"
                v-model="tournament.preferences.playOffEnabled"
                :disabled="!!tournament.playOff"
              />
              <span>{{ $t('setup.enablePlayOff') }}</span>
            </label>
            <div v-if="tournament.preferences.playOffEnabled" class="prefs__section-body">
              <label class="prefs__label">{{ $t('modals.playOffTeams') }}</label>
              <input
                class="prefs__input"
                :class="{ 'prefs__input--disabled': tournament.playOff }"
                v-model="tournament.preferences.playOffTeams"
                type="number"
                :disabled="!!tournament.playOff"
              />
              <span class="prefs__hint">{{
                tournament.playOff ? $t('modals.playOffAlreadyStarted') : $t('modals.playOffTeamsHint')
              }}</span>
            </div>
          </div>

          <div class="prefs__section">
            <label class="prefs__section-header">
              <Timer :size="18" />
              <input type="checkbox" v-model="tournament.preferences.timeLimitEnabled" />
              <span>{{ $t('modals.timeLimit') }}</span>
            </label>
            <span class="prefs__hint">{{ $t('modals.timeLimitHint') }}</span>
            <div v-if="tournament.preferences.timeLimitEnabled" class="prefs__section-body">
              <div class="prefs__inputs" :class="{ 'prefs__inputs--double': tournament.preferences.playOffEnabled }">
                <div class="prefs__input-group">
                  <label class="prefs__label prefs__label--sub">{{
                    tournament.preferences.playOffEnabled ? $t('modals.timeLimitSwiss') : $t('modals.timeLimit')
                  }}</label>
                  <div class="select is-fullwidth">
                    <select v-model.number="tournament.preferences.timeLimit">
                      <option v-for="t in timeLimitOptions" :key="t" :value="t">{{ t }} {{ $t('modals.min') }}</option>
                    </select>
                  </div>
                </div>
                <div v-if="tournament.preferences.playOffEnabled" class="prefs__input-group">
                  <label class="prefs__label prefs__label--sub">{{ $t('modals.timeLimitPlayoff') }}</label>
                  <div class="select is-fullwidth">
                    <select v-model.number="tournament.preferences.playoffTimeLimit">
                      <option :value="0">{{ $t('modals.noTimeLimit') }}</option>
                      <option v-for="t in timeLimitOptions" :key="t" :value="t">{{ t }} {{ $t('modals.min') }}</option>
                    </select>
                  </div>
                </div>
              </div>
              <label v-if="tournament.preferences.playOffEnabled" class="prefs__label prefs__label--sub">
                <input
                  type="checkbox"
                  v-model="tournament.preferences.noTimeLimitFinale"
                  style="margin-right: 0.5rem"
                />
                {{ $t('modals.noTimeLimitFinale') }}
              </label>
              <div class="mt-3">
                <label class="prefs__label">{{ $t('modals.cochonettes') }}</label>
                <div class="select is-fullwidth">
                  <select v-model.number="tournament.preferences.cochonettes">
                    <option :value="1">1</option>
                    <option :value="2">2</option>
                  </select>
                </div>
                <span class="prefs__hint">{{ $t('modals.cochonettesHint') }}</span>
              </div>
            </div>
          </div>

          <div class="prefs__section">
            <div class="prefs__section-header prefs__section-header--static">
              <ListOrdered :size="18" />
              <span>{{ $t('modals.perRoundScoringGeneric') }}</span>
            </div>
            <span class="prefs__hint">{{ $t('modals.perRoundScoringHint') }}</span>
            <div class="prefs__section-body">
              <label v-if="tournament.system !== 'playoff'" class="prefs__label">
                <input
                  type="checkbox"
                  v-model="tournament.preferences.cochonettesEnabled"
                  style="margin-right: 0.5rem"
                />
                {{ $t('modals.perRoundScoringStage') }}
              </label>
              <label
                v-if="tournament.preferences.playOffEnabled || tournament.playOff"
                class="prefs__label"
                style="margin-top: 0.5rem"
              >
                <input
                  type="checkbox"
                  v-model="tournament.preferences.cochonettesEnabledPlayoff"
                  style="margin-right: 0.5rem"
                />
                {{ $t('modals.timeLimitPlayoff') }}
              </label>
            </div>
          </div>

          <div class="prefs__item" v-if="tournament.system === 'swiss'">
            <label class="prefs__label">{{ $t('modals.swissRoundsCount') }}</label>
            <input
              class="prefs__input"
              v-model.number="tournament.preferences.swissRoundsCount"
              type="number"
              min="1"
            />
            <span class="prefs__hint">{{ $t('modals.swissRoundsCountHint') }}</span>
          </div>
          <div
            class="prefs__item"
            v-if="tournament.system === 'swiss' && !tournament.preferences.playOffEnabled && !tournament.playOff"
          >
            <label class="prefs__label">{{ $t('modals.prizePlaces') }}</label>
            <input class="prefs__input" v-model.number="tournament.preferences.prizePlaces" type="number" min="1" />
            <span class="prefs__hint">{{ $t('modals.prizePlacesHint') }}</span>
          </div>
          <div v-if="!tournamentStarted" class="prefs__item">
            <label class="prefs__label">{{ $t('modals.maxScore') }}</label>
            <input class="prefs__input" v-model="tournament.preferences.maxScore" type="number" />
            <span class="prefs__hint">{{ $t('modals.maxScoreHint') }}</span>
          </div>
          <div v-if="!tournamentStarted" class="prefs__item">
            <label class="prefs__label">{{ $t('modals.technicalScore') }}</label>
            <div class="prefs__inputs prefs__inputs--double">
              <div class="prefs__input-group">
                <span class="prefs__input-label">{{ $t('modals.technicalScoreWinner') }}</span>
                <input class="prefs__input" v-model="tournament.preferences.technical.technicalFirst" type="number" />
              </div>
              <div class="prefs__input-group">
                <span class="prefs__input-label">{{ $t('modals.technicalScoreLoser') }}</span>
                <input class="prefs__input" v-model="tournament.preferences.technical.technicalSecond" type="number" />
              </div>
            </div>
            <span class="prefs__hint">{{ $t('modals.technicalScoreHint') }}</span>
          </div>
          <div class="prefs__item">
            <label class="prefs__label">{{ $t('modals.fieldsStart') }}</label>
            <input class="prefs__input" v-model="tournament.preferences.fieldsStart" type="number" />
            <span class="prefs__hint">{{ $t('modals.fieldsStartHint') }}</span>
          </div>
          <div v-if="!tournamentStarted" class="prefs__item">
            <label class="prefs__label">
              <input type="checkbox" v-model="tournament.preferences.isTestTournament" style="margin-right: 0.5rem" />
              {{ $t('setup.testTournament') }}
            </label>
            <span class="prefs__hint">{{ $t('setup.testTournamentHint') }}</span>
          </div>
        </div>
      </div>
      <div class="prefs__footer">
        <button
          class="prefs__btn prefs__btn--danger"
          data-testid="btn-remove-tournament"
          @click="$emit('remove-tournament')"
        >
          <Trash2 :size="16" />
          <span class="is-hidden-mobile">{{ $t('teams.removeTournament') }}</span>
        </button>
        <div class="prefs__footer-right">
          <button class="prefs__btn prefs__btn--cancel" @click="$emit('close-modal')">
            {{ $t('common.cancel') }}
          </button>
          <button class="prefs__btn" @click="save">{{ $t('common.save') }}</button>
        </div>
      </div>
    </div>
  </Modal>
</template>

<script>
import { mapState, mapActions } from 'pinia';
import { useMainStore } from '@/stores/main';
import Modal from '@/components/Modal';
import { Trash2, Timer, Trophy, ListOrdered } from 'lucide-vue-next';

export default {
  name: 'Preferences',
  components: { Modal, Trash2, Timer, Trophy, ListOrdered },
  emits: ['close-modal', 'remove-tournament'],
  computed: {
    ...mapState(useMainStore, ['tournaments', 'currentTournamentIndex', 'currentTournament', 'activeTournament']),
    tournament() {
      return this.activeTournament || this.currentTournament;
    },
    tournamentStarted() {
      const t = this.tournament;
      return !!(t.games?.length || t.playOff || t.cadrage || t.playOffBracket);
    },
    timeLimitOptions() {
      const options = [];
      for (let i = 20; i <= 120; i += 5) options.push(i);
      return options;
    },
  },
  methods: {
    ...mapActions(useMainStore, ['savePreferences', 'showMessage']),
    save() {
      this.savePreferences();
      this.showMessage({ title: this.$t('messages.preferencesSaved') });
      this.$emit('close-modal');
    },
  },
};
</script>

<style scoped>
.prefs {
  margin: -1.25rem -1.5rem;
  display: flex;
  flex-direction: column;
  max-height: calc(100vh - 120px);
}

.prefs__title {
  font-size: 1.2rem;
  font-weight: 700;
  margin: 0;
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid var(--color-border);
  color: var(--color-text);
  flex-shrink: 0;
}

.prefs__body {
  padding: 1.25rem 1.5rem;
  overflow-y: auto;
  flex: 1;
  min-height: 0;
}

.prefs__list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.prefs__item {
  padding-bottom: 1rem;
  border-bottom: 1px solid var(--color-border);
}

.prefs__item:last-child {
  border-bottom: none;
  padding-bottom: 0;
}

.prefs__label {
  display: block;
  font-size: 1rem;
  font-weight: 600;
  color: var(--color-text);
  margin-bottom: 0.4rem;
}

.prefs__hint {
  display: block;
  font-size: 1rem;
  color: var(--color-text-muted);
  line-height: 1.3;
  margin-top: 0.3rem;
}

.prefs__nested {
  margin-top: 0.5rem;
  padding-left: 1rem;
  border-left: 2px solid var(--color-border);
}

.prefs__label--sub {
  display: flex;
  align-items: center;
  font-size: 1rem;
  font-weight: 500;
  color: var(--color-text);
  margin-top: 0.5rem;
  margin-bottom: 0.25rem;
}

.prefs__inputs--double {
  display: flex;
  gap: 0.75rem;
}

.prefs__input-group {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  flex: 1;
}

.prefs__input-label {
  font-size: 1rem;
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

.prefs__input {
  width: 100%;
  padding: 0.5rem 0.75rem;
  font-size: 1rem;
  border: 1px solid var(--color-border);
  border-radius: 6px;
  background: var(--color-bg-input);
  color: var(--color-text);
  outline: none;
  transition: border-color 0.2s;
}

.prefs__input:focus {
  border-color: var(--color-primary);
}

.prefs__input--disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.prefs__footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.25rem 1.5rem;
  border-top: 1px solid var(--color-border);
  flex-shrink: 0;
}

.prefs__footer-right {
  display: flex;
  gap: 0.5rem;
}

.prefs__btn {
  padding: 0.55rem 1.5rem;
  font-size: 1rem;
  font-weight: 500;
  border-radius: 6px;
  border: none;
  background: var(--color-primary);
  color: var(--color-btn-text);
  cursor: pointer;
  transition: background 0.15s;
}

.prefs__btn:hover {
  background: var(--color-primary-light);
}

.prefs__btn--cancel {
  background: transparent;
  border: 1px solid var(--color-border);
  color: var(--color-text-secondary);
}

.prefs__btn--cancel:hover {
  background: var(--color-surface-hover);
  border-color: var(--color-text-muted);
}

.prefs__btn--danger {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  background: transparent;
  border: 1px solid var(--color-error);
  color: var(--color-error);
}

.prefs__btn--danger:hover {
  background: var(--color-error);
  color: var(--color-btn-text);
}

.prefs__section {
  margin-bottom: 0.25rem;
  padding: 1rem;
  border: 1px solid var(--color-border);
  border-radius: 0.5rem;
  background: var(--color-bg-soft, #fafafa);
}

.prefs__section-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 600;
  font-size: 1rem;
  color: var(--color-text);
  cursor: pointer;
}

.prefs__section-header svg {
  color: var(--color-text-muted, #888);
  flex-shrink: 0;
  width: 18px;
  height: 18px;
}

.prefs__section-header--static {
  cursor: default;
}

.prefs__section-body {
  margin-top: 0.75rem;
  padding-top: 0.75rem;
  border-top: 1px solid var(--color-border);
}

.prefs__section input[type='checkbox']:not(:checked) {
  background-color: #fff;
}

.prefs__section .prefs__input {
  background: #fff;
}

.prefs__section-body .prefs__label {
  font-weight: 400;
}

.mt-3 {
  margin-top: 0.75rem;
}
</style>
