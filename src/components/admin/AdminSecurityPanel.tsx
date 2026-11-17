import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import {
  Activity,
  Database,
  Download,
  HardDrive,
  KeyRound,
  ShieldCheck,
  UserPlus,
  Users,
} from 'lucide-react';
import type {
  AdminRole,
  AdminSessionView,
  AuditLogItem,
  PublicAdminUser,
} from '../../types.ts';

interface AdminSecurityPanelProps {
  currentUser: PublicAdminUser;
  systemInfo: {
    dbDriver: string;
    storageDriver: 'r2' | 'local' | 'unconfigured';
    fileStorageAvailable?: boolean;
    r2Configured: boolean;
    r2ConfigError?: string | null;
    publicBucketName?: string;
    privateBucketName?: string;
    productionMode?: boolean;
    sessionSecretConfigured?: boolean;
  };
  users: PublicAdminUser[];
  auditLogs: AuditLogItem[];
  onRefreshData: () => Promise<void>;
  onNotify: (type: 'ok' | 'err', text: string) => void;
}

export function AdminSecurityPanel({
  currentUser,
  systemInfo,
  users,
  auditLogs,
  onRefreshData,
  onNotify,
}: AdminSecurityPanelProps) {
  const isSuperAdmin = currentUser.role === 'SUPER_ADMIN';

  // Password change
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [changingPwd, setChangingPwd] = useState(false);

  // Active sessions
  const [sessions, setSessions] = useState<AdminSessionView[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(false);

  // Cloudflare real test
  const [testingCf, setTestingCf] = useState(false);
  const [cfTestResult, setCfTestResult] = useState<{
    db: { ok: boolean; driver: string; latencyMs: number; message: string };
    r2: {
      configured: boolean;
      ok: boolean;
      skipped?: boolean;
      driver: string;
      latencyMs: number;
      message: string;
      publicBucket?: { ok: boolean; bucket: string; latencyMs: number; message: string };
      privateBucket?: { ok: boolean; bucket: string; latencyMs: number; message: string };
    };
  } | null>(null);

  // Collaborator creation
  const [collabEmail, setCollabEmail] = useState('');
  const [collabName, setCollabName] = useState('');
  const [collabRole, setCollabRole] = useState<AdminRole>('EDITOR');
  const [collabPassword, setCollabPassword] = useState('');
  const [creatingCollab, setCreatingCollab] = useState(false);

  // Audit filter
  const [auditFilter, setAuditFilter] = useState('');

  const loadSessions = async () => {
    setLoadingSessions(true);
    try {
      const res = await fetch('/api/admin/security/sessions');
      if (res.ok) {
        const json = (await res.json()) as { sessions: AdminSessionView[] };
        setSessions(json.sessions || []);
      }
    } finally {
      setLoadingSessions(false);
    }
  };

  useEffect(() => {
    loadSessions();
  }, []);

  const handleChangePassword = async (e: FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmNewPassword) {
      onNotify('err', 'Les nouveaux mots de passe ne correspondent pas.');
      return;
    }
    setChangingPwd(true);
    try {
      const res = await fetch('/api/admin/security/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const json = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !json.ok) {
        onNotify('err', json.error || 'Échec du changement de mot de passe.');
        return;
      }
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
      onNotify('ok', 'Mot de passe mis à jour et autres sessions révoquées.');
      await loadSessions();
      await onRefreshData();
    } finally {
      setChangingPwd(false);
    }
  };

  const handleRevokeSession = async (sessionId: string) => {
    const res = await fetch(`/api/admin/security/sessions/${sessionId}/revoke`, { method: 'POST' });
    if (res.ok) {
      onNotify('ok', 'Session révoquée.');
      await loadSessions();
    }
  };

  const handleRevokeOthers = async () => {
    const res = await fetch('/api/admin/security/sessions/revoke-all-others', { method: 'POST' });
    if (res.ok) {
      onNotify('ok', 'Toutes les autres sessions actives ont été révoquées.');
      await loadSessions();
    }
  };

  const handleTestCloudflare = async () => {
    setTestingCf(true);
    try {
      const res = await fetch('/api/admin/system/test-cloudflare', { method: 'POST' });
      const json = await res.json();
      if (!res.ok) {
        onNotify('err', json.error || 'Erreur lors du test système.');
        return;
      }
      setCfTestResult(json);
      await onRefreshData();
    } finally {
      setTestingCf(false);
    }
  };

  const handleCreateCollaborator = async (e: FormEvent) => {
    e.preventDefault();
    setCreatingCollab(true);
    try {
      const res = await fetch('/api/admin/security/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: collabEmail,
          name: collabName,
          role: collabRole,
          password: collabPassword,
        }),
      });
      const json = (await res.json()) as { error?: string };
      if (!res.ok) {
        onNotify('err', json.error || 'Impossible de créer le collaborateur.');
        return;
      }
      setCollabEmail('');
      setCollabName('');
      setCollabPassword('');
      onNotify('ok', 'Compte collaborateur créé.');
      await onRefreshData();
    } finally {
      setCreatingCollab(false);
    }
  };

  const handleToggleCollabActive = async (u: PublicAdminUser) => {
    const res = await fetch(`/api/admin/security/users/${u.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: !u.isActive }),
    });
    if (res.ok) {
      onNotify('ok', `Compte ${u.email} ${!u.isActive ? 'réactivé' : 'désactivé'}.`);
      await onRefreshData();
    }
  };

  const filteredLogs = auditLogs.filter((l) => {
    const q = auditFilter.trim().toLowerCase();
    if (!q) return true;
    return (
      l.action.toLowerCase().includes(q) ||
      l.actorEmail.toLowerCase().includes(q) ||
      l.summary.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-8">
      {/* CLOUDFLARE STATUS & BACKUP (SUPER ADMIN) */}
      {isSuperAdmin && (
        <div className="bg-white rounded-lg border border-[#073D37]/12 p-6 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="font-display font-bold text-lg text-[#073D37] flex items-center gap-2">
                <Database className="w-5 h-5 text-[#ED6F2C]" />
                <span>Infrastructure Cloudflare D1 &amp; R2 · Sauvegardes</span>
              </h2>
              <p className="text-xs text-[#172824]/70 mt-1">
                Vérifiez une vraie connexion lecture/écriture D1 et R2 une fois vos secrets configurés, ou exportez une sauvegarde JSON complète.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                disabled={testingCf}
                onClick={handleTestCloudflare}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-[#073D37] text-white text-xs font-semibold hover:bg-[#042824] disabled:opacity-60 cursor-pointer"
              >
                <Activity className="w-4 h-4 text-[#ED6F2C]" />
                <span>{testingCf ? 'Test en cours...' : 'Tester lecture/écriture D1 & R2'}</span>
              </button>
              <a
                href="/api/admin/backup/export"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-[#ED6F2C] text-white text-xs font-semibold hover:bg-[#d85f1f]"
              >
                <Download className="w-4 h-4" />
                <span>Exporter sauvegarde JSON</span>
              </a>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-md bg-[#FAF8F5] border border-[#073D37]/12 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[#073D37] flex items-center gap-1.5">
                  <Database className="w-4 h-4" /> Base de données active
                </span>
                <span className="px-2 py-0.5 rounded bg-white border border-[#073D37]/15 text-[11px] font-mono">
                  {systemInfo.dbDriver}
                </span>
              </div>
              <p className="text-xs text-[#172824]/75">
                {systemInfo.dbDriver === 'sqlite-local'
                  ? 'Mode SQLite local actif uniquement en développement (en attente de CLOUDFLARE_D1_*).'
                  : systemInfo.dbDriver === 'unconfigured'
                    ? 'Mode production : D1 non configuré (repli SQLite local bloqué).'
                    : `Connecté à Cloudflare D1 (${systemInfo.dbDriver}).`}
              </p>
            </div>

            <div className="p-4 rounded-md bg-[#FAF8F5] border border-[#073D37]/12 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[#073D37] flex items-center gap-1.5">
                  <HardDrive className="w-4 h-4" /> Stockage R2 (2 buckets séparés)
                </span>
                <span className="px-2 py-0.5 rounded bg-white border border-[#073D37]/15 text-[11px] font-mono">
                  {systemInfo.storageDriver}
                </span>
              </div>
              <p className="text-xs text-[#172824]/75">
                {systemInfo.r2Configured
                  ? 'Buckets public et privé configurés — cliquez sur « Tester » pour vérifier chaque bucket.'
                  : systemInfo.storageDriver === 'unconfigured'
                    ? 'Stockage Cloudflare R2 temporairement reporté : téléversements et pièces jointes désactivés en production sans bloquer D1.'
                    : 'Mode disque local actif en développement uniquement.'}
              </p>
              <div className="grid grid-cols-2 gap-2 pt-1 text-[11px] font-mono">
                <div className="px-2 py-1 rounded bg-white border border-[#073D37]/10 truncate">
                  Public : {systemInfo.publicBucketName || '4ever-public-media'}
                </div>
                <div className="px-2 py-1 rounded bg-white border border-[#073D37]/10 truncate">
                  Privé : {systemInfo.privateBucketName || '4ever-private-files'}
                </div>
              </div>
            </div>
          </div>

          {cfTestResult && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div
                className={`p-3.5 rounded border text-xs ${
                  cfTestResult.db.ok
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                    : 'bg-red-50 border-red-200 text-red-800'
                }`}
              >
                <p className="font-semibold">
                  Test Base ({cfTestResult.db.driver}) · {cfTestResult.db.latencyMs} ms
                </p>
                <p className="mt-1">{cfTestResult.db.message}</p>
              </div>
              <div
                className={`p-3.5 rounded border text-xs space-y-1.5 ${
                  cfTestResult.r2.ok
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                    : 'bg-amber-50 border-amber-200 text-amber-900'
                }`}
              >
                <p className="font-semibold">
                  Test Stockage R2 ({cfTestResult.r2.driver}) · {cfTestResult.r2.latencyMs} ms
                </p>
                <p>{cfTestResult.r2.message}</p>
                {cfTestResult.r2.publicBucket && (
                  <p className="text-[11px] font-mono">
                    {cfTestResult.r2.publicBucket.ok ? 'OK' : 'KO'} · Public ({cfTestResult.r2.publicBucket.bucket})
                  </p>
                )}
                {cfTestResult.r2.privateBucket && (
                  <p className="text-[11px] font-mono">
                    {cfTestResult.r2.privateBucket.ok ? 'OK' : 'KO'} · Privé ({cfTestResult.r2.privateBucket.bucket})
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* PASSWORD & SESSIONS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <form
          onSubmit={handleChangePassword}
          className="bg-white rounded-lg border border-[#073D37]/12 p-6 space-y-4 h-fit"
        >
          <h2 className="font-display font-bold text-lg text-[#073D37] flex items-center gap-2">
            <KeyRound className="w-5 h-5 text-[#ED6F2C]" />
            <span>Changer mon mot de passe</span>
          </h2>
          <div>
            <label className="block text-xs font-semibold text-[#073D37] mb-1">
              Mot de passe actuel
            </label>
            <input
              type="password"
              required
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full px-3 py-2 rounded border border-[#073D37]/20 bg-[#FAF8F5] text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#073D37] mb-1">
              Nouveau mot de passe (10 caractères min, lettres + chiffres)
            </label>
            <input
              type="password"
              required
              minLength={10}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-3 py-2 rounded border border-[#073D37]/20 bg-[#FAF8F5] text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#073D37] mb-1">
              Confirmer le nouveau mot de passe
            </label>
            <input
              type="password"
              required
              minLength={10}
              value={confirmNewPassword}
              onChange={(e) => setConfirmNewPassword(e.target.value)}
              className="w-full px-3 py-2 rounded border border-[#073D37]/20 bg-[#FAF8F5] text-sm"
            />
          </div>
          <button
            type="submit"
            disabled={changingPwd}
            className="px-5 py-2.5 rounded-md bg-[#073D37] text-white text-xs font-semibold hover:bg-[#042824] disabled:opacity-60 cursor-pointer"
          >
            {changingPwd ? 'Mise à jour...' : 'Mettre à jour le mot de passe'}
          </button>
        </form>

        {/* ACTIVE SESSIONS */}
        <div className="bg-white rounded-lg border border-[#073D37]/12 p-6 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-display font-bold text-lg text-[#073D37] flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-[#ED6F2C]" />
              <span>Sessions actives ({sessions.length})</span>
            </h2>
            {sessions.length > 1 && (
              <button
                type="button"
                onClick={handleRevokeOthers}
                className="text-xs font-semibold text-[#ED6F2C] hover:underline cursor-pointer"
              >
                Révoquer les autres sessions
              </button>
            )}
          </div>

          {loadingSessions ? (
            <p className="text-xs text-[#172824]/70">Chargement des sessions...</p>
          ) : (
            <div className="space-y-2.5 max-h-72 overflow-y-auto">
              {sessions.map((s) => (
                <div
                  key={s.id}
                  className="p-3 rounded border border-[#073D37]/12 bg-[#FAF8F5] flex items-center justify-between gap-3 text-xs"
                >
                  <div className="min-w-0">
                    <p className="font-semibold text-[#073D37]">
                      {s.current ? 'Session actuelle' : 'Autre appareil'} · IP {s.ipAddress}
                    </p>
                    <p className="text-[11px] text-[#172824]/65 truncate">{s.userAgent || 'Navigateur'}</p>
                    <p className="text-[11px] text-[#172824]/60">
                      Dernière activité : {new Date(s.lastSeenAt).toLocaleString('fr-FR')}
                    </p>
                  </div>
                  {!s.current && (
                    <button
                      type="button"
                      onClick={() => handleRevokeSession(s.id)}
                      className="px-2.5 py-1 rounded border border-red-200 bg-white text-red-700 text-[11px] font-semibold hover:bg-red-50 cursor-pointer shrink-0"
                    >
                      Révoquer
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* COLLABORATORS (SUPER ADMIN ONLY) */}
      {isSuperAdmin && (
        <div className="bg-white rounded-lg border border-[#073D37]/12 p-6 space-y-5">
          <div>
            <h2 className="font-display font-bold text-lg text-[#073D37] flex items-center gap-2">
              <Users className="w-5 h-5 text-[#ED6F2C]" />
              <span>Comptes &amp; Collaborateurs ({users.length})</span>
            </h2>
            <p className="text-xs text-[#172824]/70 mt-1">
              Un seul Super Admin propriétaire. Vous pouvez créer ici des comptes collaborateurs à droits limités (<code>EDITOR</code> : catalogue/médias/contenus, <code>SALES</code> : devis/messages).
            </p>
          </div>

          <form
            onSubmit={handleCreateCollaborator}
            className="grid grid-cols-1 md:grid-cols-5 gap-2.5 p-4 rounded-md bg-[#FAF8F5] border border-[#073D37]/10"
          >
            <input
              type="text"
              required
              value={collabName}
              onChange={(e) => setCollabName(e.target.value)}
              placeholder="Nom complet"
              className="px-3 py-2 rounded border border-[#073D37]/20 bg-white text-xs"
            />
            <input
              type="email"
              required
              value={collabEmail}
              onChange={(e) => setCollabEmail(e.target.value)}
              placeholder="E-mail collaborateur"
              className="px-3 py-2 rounded border border-[#073D37]/20 bg-white text-xs"
            />
            <select
              value={collabRole}
              onChange={(e) => setCollabRole(e.target.value as AdminRole)}
              className="px-3 py-2 rounded border border-[#073D37]/20 bg-white text-xs"
            >
              <option value="EDITOR">EDITOR (Catalogue &amp; Médias)</option>
              <option value="SALES">SALES (Devis &amp; Messages)</option>
            </select>
            <input
              type="password"
              required
              minLength={10}
              value={collabPassword}
              onChange={(e) => setCollabPassword(e.target.value)}
              placeholder="Mot de passe initial"
              className="px-3 py-2 rounded border border-[#073D37]/20 bg-white text-xs"
            />
            <button
              type="submit"
              disabled={creatingCollab}
              className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded bg-[#073D37] text-white text-xs font-semibold hover:bg-[#042824] cursor-pointer"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Créer</span>
            </button>
          </form>

          <div className="divide-y divide-[#073D37]/10">
            {users.map((u) => (
              <div key={u.id} className="py-3 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div>
                  <p className="font-semibold text-[#073D37]">
                    {u.name} · <span className="font-mono">{u.email}</span>
                  </p>
                  <p className="text-[11px] text-[#172824]/65">
                    Rôle : <strong>{u.role}</strong> · Dernière connexion :{' '}
                    {u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleString('fr-FR') : 'Jamais'}
                  </p>
                </div>
                {u.role !== 'SUPER_ADMIN' ? (
                  <button
                    type="button"
                    onClick={() => handleToggleCollabActive(u)}
                    className={`px-3 py-1 rounded text-xs font-semibold cursor-pointer ${
                      u.isActive
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                        : 'bg-red-50 text-red-700 border border-red-200'
                    }`}
                  >
                    {u.isActive ? 'Actif (Désactiver)' : 'Désactivé (Réactiver)'}
                  </button>
                ) : (
                  <span className="px-2.5 py-1 rounded bg-[#073D37] text-white text-[11px] font-semibold">
                    Propriétaire
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* AUDIT LOGS (SUPER ADMIN ONLY) */}
      {isSuperAdmin && (
        <div className="bg-white rounded-lg border border-[#073D37]/12 p-6 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-display font-bold text-lg text-[#073D37]">
              Journal d&apos;audit des actions ({filteredLogs.length})
            </h2>
            <input
              type="text"
              value={auditFilter}
              onChange={(e) => setAuditFilter(e.target.value)}
              placeholder="Filtrer (ex: PRODUCT, LOGIN, MEDIA...)"
              className="px-3 py-1.5 rounded border border-[#073D37]/20 bg-[#FAF8F5] text-xs w-64"
            />
          </div>

          <div className="max-h-96 overflow-y-auto divide-y divide-[#073D37]/10 text-xs">
            {filteredLogs.length === 0 ? (
              <p className="py-6 text-center text-[#172824]/70">Aucune entrée d&apos;audit trouvée.</p>
            ) : (
              filteredLogs.map((log) => (
                <div key={log.id} className="py-2.5 flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <span className="inline-block px-2 py-0.5 rounded bg-[#FAF8F5] border border-[#073D37]/15 font-mono text-[10px] font-semibold text-[#073D37] mr-2">
                      {log.action}
                    </span>
                    <span className="font-medium text-[#172824]">{log.summary}</span>
                    <p className="text-[11px] text-[#172824]/60 mt-0.5">
                      Par : {log.actorEmail || 'Système'} ({log.actorRole || 'ANON'}) · IP {log.ipAddress || '—'}
                    </p>
                  </div>
                  <span className="text-[11px] text-[#172824]/60 tabular-nums shrink-0">
                    {new Date(log.createdAt).toLocaleString('fr-FR')}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
