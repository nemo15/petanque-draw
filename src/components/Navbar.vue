<template>
  <nav class="navbar" role="navigation" aria-label="main navigation">
    <div class="navbar-brand">
      <router-link class="navbar-item" to="/">
        <img src="../assets/img/logo.webp" alt="logo" />
      </router-link>

      <div class="navbar-center-mobile" v-if="user">
        <button class="navbar-icon-link navbar-icon-link--orange" @click="activeOverlayOpen = true">
          <Flame :size="18" />
        </button>
        <router-link class="navbar-icon-link navbar-icon-link--purple" to="/">
          <Shuffle :size="18" />
        </router-link>
        <router-link class="navbar-icon-link navbar-icon-link--blue" to="/stats">
          <BarChart3 :size="18" />
        </router-link>
        <router-link class="navbar-icon-link navbar-icon-link--green" to="/training">
          <Target :size="18" />
        </router-link>
      </div>

      <button class="menu-burger" @click="$emit('open-menu')" aria-label="menu" aria-expanded="false">
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <line x1="3" y1="6" x2="21" y2="6" />
          <line x1="3" y1="12" x2="17" y2="12" />
          <line x1="3" y1="18" x2="14" y2="18" />
        </svg>
      </button>
    </div>

    <div class="navbar-center" v-if="user">
      <button class="navbar-nav-link navbar-nav-link--orange" @click="activeOverlayOpen = true">
        <Flame :size="18" />
        <span>{{ $t('common.activeTournaments') }}</span>
      </button>
      <router-link class="navbar-nav-link navbar-nav-link--purple" to="/">
        <Shuffle :size="18" />
        <span>{{ $t('common.draw') }}</span>
      </router-link>
      <router-link class="navbar-nav-link navbar-nav-link--blue" to="/stats">
        <BarChart3 :size="18" />
        <span>{{ $t('common.stat') }}</span>
      </router-link>
      <router-link class="navbar-nav-link navbar-nav-link--green" to="/training">
        <Target :size="18" />
        <span>{{ $t('common.training') }}</span>
      </router-link>
    </div>

    <!-- Active tournaments overlay -->
    <Teleport to="body">
      <div v-if="activeOverlayOpen" class="active-overlay" @click.self="activeOverlayOpen = false">
        <div class="active-overlay__panel">
          <div class="active-overlay__header">
            <h2 class="active-overlay__title">
              <Flame :size="20" class="active-overlay__title-icon" />
              {{ $t('common.activeTournaments') }}
            </h2>
            <button class="active-overlay__close" @click="activeOverlayOpen = false">
              <X :size="20" />
            </button>
          </div>
          <div class="active-overlay__list" v-if="sortedTournaments.length">
            <div
              v-for="item in sortedTournaments"
              :key="item.id"
              class="active-overlay__item"
              :class="{
                'active-overlay__item--active': String(item.id) === String(currentTournamentIndex),
                'active-overlay__item--finished': item.tournamentIsFinished,
              }"
              @click="chooseTournamentFromOverlay(item.id)"
            >
              <div class="active-overlay__item-top">
                <Pin v-if="String(pinnedId) === String(item.id)" :size="14" class="active-overlay__item-pin" />
                <span class="active-overlay__item-name">{{ item.name }}</span>
                <span class="active-overlay__item-badge">{{ item.system || 'swiss' }}</span>
              </div>
              <div class="active-overlay__item-meta">
                <span v-if="item.teams">{{ item.teams.length }} {{ $t('common.teamsCount') }}</span>
                <span v-if="getTeamFormat(item)" class="active-overlay__item-format">{{ getTeamFormat(item) }}</span>
                <span v-if="item.tournamentIsFinished" class="active-overlay__item-finished">{{
                  $t('common.finished')
                }}</span>
                <span v-else-if="item.playOff">{{ $t('games.playOff') }}</span>
                <span v-else-if="item.games && item.system !== 'tir'">{{ getRoundLabel(item) }}</span>
              </div>
            </div>
          </div>
          <div v-else class="active-overlay__empty">
            {{ $t('training.noSessions') }}
          </div>
        </div>
      </div>
    </Teleport>

    <div class="navbar-menu">
      <div class="navbar-end">
        <div class="navbar-item" v-if="user">
          <div class="user-dropdown" @click="userDropdownOpen = !userDropdownOpen" v-click-outside="closeDropdown">
            <button class="btn-user">
              <svg class="btn-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
              <span class="btn-user__email">{{ user.email }}</span>
              <svg
                class="btn-icon btn-icon--chevron"
                :class="{ 'btn-icon--open': userDropdownOpen }"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            <div class="user-dropdown__menu" v-if="userDropdownOpen">
              <a href="#" class="user-dropdown__item" @click.prevent="addNewTournament">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                </svg>
                {{ $t('common.addTournament') }}
              </a>
              <router-link class="user-dropdown__item" to="/archived" @click="userDropdownOpen = false">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"
                  />
                </svg>
                {{ $t('common.archivedTournaments') }}
              </router-link>
              <router-link class="user-dropdown__item" to="/docs" @click="userDropdownOpen = false">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                  />
                </svg>
                {{ $t('common.documentation') }}
              </router-link>
              <a
                class="user-dropdown__item"
                href="http://portal.petanque.org.ua/"
                target="_blank"
                @click="userDropdownOpen = false"
              >
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"
                  />
                </svg>
                {{ $t('common.portal') }}
              </a>
              <div class="user-dropdown__theme-row">
                <span class="user-dropdown__theme-label">{{ $t('common.theme') }}</span>
                <ThemeSwitcher />
              </div>
              <a href="#" class="user-dropdown__item" @click.prevent="signOutUser">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                  />
                </svg>
                {{ $t('common.logoutUser') }}
              </a>
            </div>
          </div>
        </div>
        <LanguageSwitcher class="navbar-item" />
      </div>
    </div>
  </nav>
</template>

<script>
import { mapState, mapActions } from 'pinia';
import { useMainStore } from '@/stores/main';
import { signOut } from 'firebase/auth';
import { auth } from '@/firebase';
import LanguageSwitcher from '@/components/partials/LanguageSwitcher.vue';
import ThemeSwitcher from '@/components/partials/ThemeSwitcher.vue';
import { Pin, Flame, Shuffle, BarChart3, Target, X } from 'lucide-vue-next';

export default {
  name: 'Navbar',
  components: { LanguageSwitcher, ThemeSwitcher, Pin, Flame, Shuffle, BarChart3, Target, X },
  data() {
    return {
      userDropdownOpen: false,
      activeOverlayOpen: false,
      pinnedIdLocal: localStorage.getItem('petanqueDrawPinned'),
    };
  },
  watch: {
    currentTournamentIndex() {
      this.refreshPinned();
    },
    activeOverlayOpen(val) {
      if (val) this.refreshPinned();
    },
  },
  directives: {
    'click-outside': {
      mounted(el, binding) {
        el._clickOutside = (e) => {
          if (!el.contains(e.target)) binding.value();
        };
        document.addEventListener('click', el._clickOutside);
      },
      unmounted(el) {
        document.removeEventListener('click', el._clickOutside);
      },
    },
  },
  computed: {
    ...mapState(useMainStore, ['tournaments', 'currentTournamentIndex', 'isAdmin', 'user', 'currentTournament']),
    tournament() {
      return this.currentTournament;
    },
    pinnedId() {
      return this.pinnedIdLocal;
    },
    sortedTournaments() {
      return Object.values(this.tournaments).sort((a, b) => (b.id || 0) - (a.id || 0));
    },
  },
  methods: {
    ...mapActions(useMainStore, ['setActiveTournament', 'loginUser', 'addTournament']),
    refreshPinned() {
      this.pinnedIdLocal = localStorage.getItem('petanqueDrawPinned');
    },
    closeDropdown() {
      this.userDropdownOpen = false;
    },
    chooseTournament(id) {
      this.setActiveTournament(id);
      if (this.$route.path !== '/') {
        this.$router.push('/');
      }
    },
    chooseTournamentFromOverlay(id) {
      this.setActiveTournament(id);
      this.activeOverlayOpen = false;
      if (this.$route.path !== '/') {
        this.$router.push('/');
      }
    },
    getTeamFormat(item) {
      if (!item.teams?.length) return '';
      const players = item.teams[0].players;
      if (!players?.length) return '';
      if (players.length === 1) return this.$t('common.formatTete');
      if (players.length === 2) return this.$t('common.formatDoublette');
      if (players.length >= 3) return this.$t('common.formatTriplette');
      return '';
    },
    getRoundLabel(item) {
      const current = item.games.length;
      if (item.system === 'swiss') {
        const total = item.preferences?.swissRoundsCount || Math.ceil(Math.log2(item.teams?.length || 2));
        return `${current}/${total} ${this.$t('common.round')}`;
      }
      return `${current} ${this.$t('common.round')}`;
    },
    addNewTournament() {
      this.addTournament();
      this.userDropdownOpen = false;
      if (this.$route.path !== '/') {
        this.$router.push('/');
      }
    },
    signOutUser() {
      signOut(auth)
        .then(() => {
          this.loginUser(false);
          this.userDropdownOpen = false;
          this.$router.push('/');
        })
        .catch((error) => {
          console.error('Error during sign out:', error);
        });
    },
  },
};
</script>

<style scoped>
.navbar {
  position: relative;
  display: flex;
  align-items: center;
}

.navbar-center {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  margin: 0 auto;
}

.navbar-nav-link {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 1rem;
  font-weight: 500;
  color: var(--color-text-muted);
  text-decoration: none;
  padding: 0.4rem 0.75rem;
  border-radius: 8px;
  border: none;
  background: transparent;
  cursor: pointer;
  transition: all 0.15s;
}

.navbar-center .navbar-nav-link--orange {
  color: #e67e22;
}

.navbar-center .navbar-nav-link--purple {
  color: #8e44ad;
}

.navbar-center .navbar-nav-link--blue {
  color: #2980b9;
}

.navbar-center .navbar-nav-link--green {
  color: #27ae60;
}

.navbar-center .navbar-nav-link--purple.router-link-exact-active {
  background: rgb(142 68 173 / 12%);
}

.navbar-center .navbar-nav-link--blue.router-link-exact-active {
  background: rgb(41 128 185 / 12%);
}

.navbar-center .navbar-nav-link--green.router-link-exact-active {
  background: rgb(39 174 96 / 12%);
}

.navbar-icon-link {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.45rem;
  border-radius: 8px;
  text-decoration: none;
  border: none;
  background: transparent;
  cursor: pointer;
  transition: all 0.15s;
}

.navbar-icon-link.navbar-icon-link--orange {
  color: #e67e22;
}

.navbar-icon-link.navbar-icon-link--purple {
  color: #8e44ad;
}

.navbar-icon-link.navbar-icon-link--purple.router-link-exact-active {
  background: rgb(142 68 173 / 12%);
}

.navbar-icon-link.navbar-icon-link--blue {
  color: #2980b9;
}

.navbar-icon-link.navbar-icon-link--blue.router-link-exact-active {
  background: rgb(41 128 185 / 12%);
}

.navbar-icon-link.navbar-icon-link--green {
  color: #27ae60;
}

.navbar-icon-link.navbar-icon-link--green.router-link-exact-active {
  background: rgb(39 174 96 / 12%);
}

/* Active overlay */

.active-overlay {
  position: fixed;
  inset: 0;
  z-index: 99999;
  background: rgb(0 0 0 / 40%);
  animation: overlay-fade-in 0.2s ease;
}

@keyframes overlay-fade-in {
  from {
    opacity: 0;
  }

  to {
    opacity: 1;
  }
}

.active-overlay__panel {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  max-height: 80vh;
  background: var(--color-white);
  border-radius: 0 0 1rem 1rem;
  box-shadow: 0 12px 40px rgb(0 0 0 / 15%);
  padding: 1.5rem;
  overflow-y: auto;
  animation: panel-slide-down 0.25s ease;
}

@keyframes panel-slide-down {
  from {
    transform: translateY(-100%);
  }

  to {
    transform: translateY(0);
  }
}

.active-overlay__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
}

.active-overlay__title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1.2rem;
  font-weight: 700;
  color: var(--color-text);
  margin: 0;
}

.active-overlay__title-icon {
  color: #e67e22;
}

.active-overlay__close {
  padding: 0.4rem;
  border: none;
  background: var(--color-surface);
  border-radius: 8px;
  cursor: pointer;
  color: var(--color-text-muted);
  transition: all 0.15s;
}

.active-overlay__close:hover {
  background: var(--color-border);
  color: var(--color-text);
}

.active-overlay__list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.active-overlay__item {
  padding: 0.75rem 1rem;
  border: 1.5px solid var(--color-border);
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.15s;
}

.active-overlay__item:hover {
  border-color: #e67e22;
  background: rgb(230 126 34 / 4%);
}

.active-overlay__item--active {
  border-color: #e67e22;
  background: rgb(230 126 34 / 8%);
}

.active-overlay__item-top {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.active-overlay__item-pin {
  color: #e67e22;
  flex-shrink: 0;
}

.active-overlay__item-name {
  font-size: 1rem;
  font-weight: 600;
  color: var(--color-text);
  flex: 1;
}

.active-overlay__item-badge {
  font-size: 0.7rem;
  font-weight: 500;
  padding: 0.15rem 0.5rem;
  border-radius: 12px;
  background: var(--color-primary-bg, rgb(124 58 237 / 10%));
  color: var(--color-primary);
  text-transform: capitalize;
}

.active-overlay__item-meta {
  display: flex;
  gap: 0.75rem;
  margin-top: 0.35rem;
  font-size: 0.8rem;
  color: var(--color-text-muted);
}

.active-overlay__item-format {
  color: var(--color-primary);
}

.active-overlay__item--finished {
  opacity: 0.7;
}

.active-overlay__item-finished {
  color: var(--tir-carreau, #4caf50);
  font-weight: 600;
}

.active-overlay__empty {
  text-align: center;
  padding: 2rem;
  color: var(--color-text-muted);
}

.menu-burger {
  display: none;
  align-items: center;
  align-self: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border: none;
  border-radius: 0.375rem;
  background: transparent;
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: color 0.2s;
  margin-left: auto;
}

.menu-burger:hover {
  color: var(--color-primary);
}

.menu-burger:active {
  opacity: 0.7;
}

.navbar-center-mobile {
  display: none;
}

@media (max-width: 1199px) {
  .navbar-brand {
    width: 100%;
    display: flex;
    align-items: center;
    padding: 0 1rem;
  }

  .navbar-brand .navbar-item {
    flex: 1;
  }

  .menu-burger {
    display: flex;
    flex: 1;
    justify-content: flex-end;
  }

  .navbar-center {
    display: none;
  }

  .navbar-center-mobile {
    display: flex;
    align-items: center;
    gap: 0.6rem;
  }

  .navbar-icon-link {
    padding: 0.5rem;
  }

  .navbar-icon-link svg {
    width: 20px;
    height: 20px;
  }

  .navbar-menu {
    display: none !important;
  }
}

.navbar-menu {
  display: flex;
  align-items: center;
}

.navbar-end {
  display: flex;
  align-items: center;
}

.user-dropdown {
  position: relative;
}

.user-dropdown__menu {
  position: absolute;
  top: calc(100% + 6px);
  right: 0;
  background: var(--color-white);
  border-radius: 0.5rem;
  box-shadow:
    0 8px 24px var(--color-dropdown-shadow),
    0 2px 4px rgb(0 0 0 / 4%);
  min-width: 160px;
  padding: 0.35rem;
  z-index: 9999;
  animation: dropdown-in 0.15s ease;
}

@keyframes dropdown-in {
  from {
    opacity: 0;
    transform: translateY(-4px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.user-dropdown__item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.55rem 0.75rem;
  font-size: 1rem;
  font-weight: 500;
  color: var(--color-text-secondary);
  border-radius: 0.35rem;
  text-decoration: none;
  transition: background 0.15s;
}

.user-dropdown__item:hover,
.user-dropdown__item.router-link-exact-active {
  background: var(--color-primary-bg);
  color: var(--color-primary);
}

.user-dropdown__item svg {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
}

.btn-icon--chevron {
  width: 14px;
  height: 14px;
  transition: transform 0.2s;
}

.btn-icon--open {
  transform: rotate(180deg);
}

.btn-user__email {
  max-width: 160px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.user-dropdown__theme-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.55rem 0.75rem;
  border-top: 1px solid var(--color-border-light);
  margin-top: 0.2rem;
}

.user-dropdown__theme-label {
  font-size: 1rem;
  font-weight: 500;
  color: var(--color-text-secondary);
}
</style>
