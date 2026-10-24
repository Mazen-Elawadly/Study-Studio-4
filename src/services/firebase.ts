import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  signInWithRedirect,
  signOut as fbSignOut,
  GoogleAuthProvider,
  onAuthStateChanged,
  User,
  Auth,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  collection,
  query,
  orderBy,
  limit,
  onSnapshot,
  runTransaction,
  Firestore,
  Unsubscribe,
} from 'firebase/firestore';
import { AppState, PlayerDoc } from '../types';
import { dKey, weekKey } from '../constants/data';

export interface FirebaseUser {
  id: string;
  name: string;
  email: string;
  avatarUrl: string;
}

export type SyncState = 'local' | 'syncing' | 'saved' | 'denied' | 'error';

class FirebaseService {
  app: FirebaseApp | null = null;
  auth: Auth | null = null;
  fs: Firestore | null = null;
  isConfigured: boolean = false;
  state: SyncState = 'local';
  errorMessage: string = '';
  currentUser: FirebaseUser | null = null;
  players: PlayerDoc[] = [];

  private unsubUserDoc: Unsubscribe | null = null;
  private unsubPlayers: Unsubscribe | null = null;
  private syncTimer: ReturnType<typeof setTimeout> | null = null;
  private isFlushing: boolean = false;
  private hasPendingDirty: boolean = false;
  private lastPushTs: number = 0;

  init(
    onUserChange: (user: FirebaseUser | null) => void,
    onRemoteUpdate: (state: AppState) => void,
    onPlayersChange: (players: PlayerDoc[]) => void,
    onStateChange: (state: SyncState, err: string) => void
  ) {
    try {
      const cfg = (window as unknown as { STUDY_FIREBASE?: Record<string, string> }).STUDY_FIREBASE;
      if (!cfg || !cfg.apiKey || !cfg.projectId || /^(YOUR|PASTE|REPLACE)/i.test(cfg.apiKey)) {
        this.isConfigured = false;
        this.state = 'local';
        onStateChange(this.state, '');
        return;
      }

      if (!getApps().length) {
        this.app = initializeApp(cfg);
      } else {
        this.app = getApps()[0];
      }

      this.auth = getAuth(this.app);
      this.fs = getFirestore(this.app);
      this.isConfigured = true;

      onAuthStateChanged(this.auth, async (u) => {
        if (!u) {
          if (this.unsubUserDoc) {
            this.unsubUserDoc();
            this.unsubUserDoc = null;
          }
          if (this.unsubPlayers) {
            this.unsubPlayers();
            this.unsubPlayers = null;
          }
          this.currentUser = null;
          this.players = [];
          this.state = 'local';
          onUserChange(null);
          onPlayersChange([]);
          onStateChange(this.state, '');
          return;
        }

        this.currentUser = {
          id: u.uid,
          name: u.displayName || '',
          email: u.email || '',
          avatarUrl: u.photoURL || '',
        };
        this.state = 'syncing';
        onUserChange(this.currentUser);
        onStateChange(this.state, '');

        try {
          if (this.fs) {
            const userRef = doc(this.fs, 'users', u.uid);
            const snap = await getDoc(userRef);
            if (snap.exists()) {
              const data = snap.data();
              if (data && data.blob) {
                try {
                  const remote = JSON.parse(data.blob);
                  onRemoteUpdate({ ...remote, ts: data.ts });
                } catch {
                  // ignore
                }
              }
            }
          }
        } catch (err: unknown) {
          const e = err as { code?: string; message?: string };
          this.state = e.code === 'permission-denied' ? 'denied' : 'error';
          this.errorMessage =
            this.state === 'denied'
              ? 'Firebase refused access. Check that the Firestore rules are published.'
              : 'Could not reach your saved progress.';
          onStateChange(this.state, this.errorMessage);
        }

        // Subscribe to user doc for multi-tab/device syncing
        if (this.fs) {
          this.unsubUserDoc = onSnapshot(
            doc(this.fs, 'users', u.uid),
            (snapshot) => {
              if (!snapshot.exists() || snapshot.metadata.hasPendingWrites) return;
              const d = snapshot.data();
              if (!d || !d.blob || d.ts === this.lastPushTs) return;
              try {
                const remote = JSON.parse(d.blob);
                onRemoteUpdate({ ...remote, ts: d.ts });
              } catch {
                // ignore
              }
            },
            () => {}
          );

          // Subscribe to players
          const q = query(collection(this.fs, 'players'), orderBy('pts', 'desc'), limit(500));
          this.unsubPlayers = onSnapshot(
            q,
            (snap) => {
              this.players = snap.docs.map((d) => ({
                id: d.id,
                ...(d.data() as Omit<PlayerDoc, 'id'>),
              }));
              onPlayersChange(this.players);
            },
            () => {
              this.players = [];
              onPlayersChange([]);
            }
          );
        }

        this.state = 'saved';
        onStateChange(this.state, '');
      });
    } catch (err: unknown) {
      const e = err as Error;
      this.isConfigured = false;
      this.state = 'error';
      this.errorMessage = 'Firebase could not start: ' + (e.message || String(e));
      onStateChange(this.state, this.errorMessage);
    }
  }

  async signIn(): Promise<string | null> {
    if (!this.auth) return 'Firebase Auth not initialized.';
    this.errorMessage = '';
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(this.auth, provider);
      return null;
    } catch (err: unknown) {
      const e = err as { code?: string; message?: string };
      const code = e.code || '';
      if (code === 'auth/popup-blocked' || code === 'auth/operation-not-supported-in-this-environment') {
        try {
          await signInWithRedirect(this.auth, provider);
          return null;
        } catch (e2: unknown) {
          const err2 = e2 as { code?: string };
          return this.formatAuthError(err2.code);
        }
      }
      if (code !== 'auth/popup-closed-by-user' && code !== 'auth/cancelled-popup-request') {
        return this.formatAuthError(code);
      }
      return null;
    }
  }

  async signOut(): Promise<void> {
    if (this.auth) {
      await fbSignOut(this.auth);
    }
  }

  formatAuthError(code?: string): string {
    if (code === 'auth/unauthorized-domain') return 'This website address is not authorized in Firebase yet.';
    if (code === 'auth/operation-not-allowed') return 'Google sign-in is not enabled in Firebase Authentication.';
    if (code === 'auth/network-request-failed') return 'No connection. Check your internet and try again.';
    if (code === 'auth/invalid-api-key' || code === 'auth/api-key-not-valid') return 'The apiKey in firebase-config.js is invalid.';
    return `Sign-in failed${code ? ' (' + code + ')' : ''}. Try again.`;
  }

  createPublicDoc(state: AppState) {
    let tot = 0;
    for (const k in state.log) tot += state.log[k] || 0;
    let avg: number | null = null;
    if (state.papers.length) {
      let sm = 0;
      state.papers.forEach((p) => {
        sm += p.total > 0 ? (p.mark / p.total) * 100 : 0;
      });
      avg = Math.round((sm / state.papers.length) * 10) / 10;
    }

    return {
      username: state.me.username,
      uname: state.me.username.toLowerCase(),
      pts: state.pts || 0,
      wk: { k: state.wk?.k || weekKey(), p: state.wk?.p || 0 },
      streak: 0, // will be updated by caller
      best: 0,
      focus: tot,
      papers: state.papers.length,
      avg,
      day: dKey(),
      ts: Date.now(),
    };
  }

  queueSync(state: AppState, streak: { cur: number; best: number }, immediate: boolean = false) {
    if (!this.fs || !this.currentUser || this.state === 'denied') return;
    if (this.syncTimer) clearTimeout(this.syncTimer);
    this.syncTimer = setTimeout(() => {
      this.flush(state, streak);
    }, immediate ? 200 : 1800);
  }

  private async flush(state: AppState, streak: { cur: number; best: number }) {
    if (!this.fs || !this.currentUser) return;
    if (this.isFlushing) {
      this.hasPendingDirty = true;
      return;
    }
    this.isFlushing = true;

    try {
      do {
        this.hasPendingDirty = false;
        const ts = state.ts || Date.now();
        this.lastPushTs = ts;
        const userRef = doc(this.fs, 'users', this.currentUser.id);
        await setDoc(userRef, { ts, blob: JSON.stringify(state) });

        if (state.me.claimed && state.me.username) {
          const pub = this.createPublicDoc(state);
          pub.streak = streak.cur;
          pub.best = streak.best;
          const playerRef = doc(this.fs, 'players', this.currentUser.id);
          await setDoc(playerRef, pub);
        }
      } while (this.hasPendingDirty);
      this.state = 'saved';
      this.errorMessage = '';
    } catch (err: unknown) {
      const e = err as { code?: string };
      this.state = e.code === 'permission-denied' ? 'denied' : 'error';
      this.errorMessage =
        this.state === 'denied'
          ? 'Firebase refused the save. Check that the Firestore rules are published.'
          : '';
    }
    this.isFlushing = false;
  }

  async claimUsername(name: string, currentClaimed: boolean): Promise<{ success: boolean; msg: string }> {
    const low = name.toLowerCase();
    if (!/^[a-z0-9_]{3,16}$/.test(low)) {
      return { success: false, msg: 'Use 3 to 16 letters, numbers or underscores.' };
    }
    if (!this.fs || !this.currentUser) {
      return {
        success: true,
        msg: this.isConfigured
          ? 'Saved on this device. Sign in with Google to join the leaderboard.'
          : 'Saved on this device.',
      };
    }

    try {
      const uid = this.currentUser.id;
      const fs = this.fs;
      await runTransaction(fs, async (tx) => {
        const ref = doc(fs, 'usernames', low);
        const snap = await tx.get(ref);
        if (snap.exists() && snap.data()?.owner !== uid) {
          throw new Error('taken');
        }
        tx.set(ref, { owner: uid, at: Date.now() });
        if (currentClaimed && name.toLowerCase() !== low) {
          tx.delete(doc(fs, 'usernames', name.toLowerCase()));
        }
      });
      return { success: true, msg: 'Username saved.' };
    } catch (err: unknown) {
      const e = err as { message?: string; code?: string };
      if (e.message === 'taken') {
        return { success: false, msg: 'That username is taken.' };
      }
      if (e.code === 'permission-denied') {
        return { success: false, msg: 'Firebase refused that. Check that Firestore rules are published.' };
      }
      return { success: false, msg: 'Could not save the username. Try again.' };
    }
  }

  async lookupFriend(username: string): Promise<{ id: string; name: string } | null> {
    if (!this.fs || !this.currentUser) return null;
    const low = username.toLowerCase();
    const ref = doc(this.fs, 'usernames', low);
    const snap = await getDoc(ref);
    if (!snap.exists()) return null;
    const ownerId = snap.data()?.owner;
    if (!ownerId) return null;

    const playerRef = doc(this.fs, 'players', ownerId);
    const playerSnap = await getDoc(playerRef);
    const nm = playerSnap.exists() && playerSnap.data()?.username ? playerSnap.data()?.username : low;
    return { id: ownerId, name: nm };
  }
}

export const firebaseService = new FirebaseService();
