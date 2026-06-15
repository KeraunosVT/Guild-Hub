// backend/auth.js — Discord OAuth2 login, role-gated to a single guild.
// No bot required: membership and roles are read via the user's own
// `guilds.members.read` scope at GET /users/@me/guilds/{guild}/member.
const express = require('express');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const axios = require('axios');

const router = express.Router();

const {
  DISCORD_CLIENT_ID,
  DISCORD_CLIENT_SECRET,
  DISCORD_REDIRECT_URI,
  DISCORD_GUILD_ID,
  DISCORD_ALLOWED_ROLE_IDS = '',
  JWT_SECRET,
  APP_URL = '/',
} = process.env;

// Comma-separated role IDs that are allowed in. Empty list = any member of the
// guild is allowed (membership alone gates access).
const ALLOWED_ROLES = DISCORD_ALLOWED_ROLE_IDS.split(',').map(s => s.trim()).filter(Boolean);

// Admin role IDs — a tighter check for the admin area. Empty list = nobody is an
// admin until configured (fails closed).
const ADMIN_ROLES = (process.env.DISCORD_ADMIN_ROLE_IDS || '').split(',').map(s => s.trim()).filter(Boolean);

const COOKIE_NAME = 'gh_session';
const STATE_COOKIE = 'gh_oauth_state';
const SESSION_DAYS = 7;

// Auth is "configured" only when every required secret is present. If not, the
// app fails closed — data routes return 401 and nothing leaks.
const authConfigured = Boolean(
  DISCORD_CLIENT_ID && DISCORD_CLIENT_SECRET && DISCORD_REDIRECT_URI && DISCORD_GUILD_ID && JWT_SECRET
);
if (!authConfigured) {
  console.warn('⚠️  Discord login is not fully configured — all data routes will be locked.');
}

const isProd = process.env.NODE_ENV === 'production';
const baseCookie = { httpOnly: true, secure: isProd, sameSite: 'lax', path: '/' };

// ── Begin login: redirect to Discord with a CSRF state ──────────────────────
router.get('/login', (req, res) => {
  if (!authConfigured) return res.status(503).send('Discord login is not configured.');

  const state = crypto.randomBytes(16).toString('hex');
  res.cookie(STATE_COOKIE, state, { ...baseCookie, maxAge: 10 * 60 * 1000 });

  const params = new URLSearchParams({
    client_id: DISCORD_CLIENT_ID,
    redirect_uri: DISCORD_REDIRECT_URI,
    response_type: 'code',
    scope: 'identify guilds.members.read',
    state,
    prompt: 'consent',
  });
  res.redirect(`https://discord.com/oauth2/authorize?${params.toString()}`);
});

// ── OAuth callback: verify, check role, issue session ───────────────────────
// Full path: /api/auth/discord/callback — must match DISCORD_REDIRECT_URI and
// the redirect registered in the Discord developer portal.
router.get('/discord/callback', async (req, res) => {
  if (!authConfigured) return res.status(503).send('Discord login is not configured.');

  const { code, state } = req.query;
  const savedState = req.cookies?.[STATE_COOKIE];
  res.clearCookie(STATE_COOKIE, baseCookie);

  if (!code || !state || state !== savedState) {
    return res.redirect(`${APP_URL}?auth=error`);
  }

  try {
    // 1. Exchange the code for an access token
    const tokenRes = await axios.post(
      'https://discord.com/api/oauth2/token',
      new URLSearchParams({
        client_id: DISCORD_CLIENT_ID,
        client_secret: DISCORD_CLIENT_SECRET,
        grant_type: 'authorization_code',
        code: String(code),
        redirect_uri: DISCORD_REDIRECT_URI,
      }).toString(),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    );
    const accessToken = tokenRes.data.access_token;

    // 2. Read the user's member object in our guild (404 => not a member)
    const memberRes = await axios.get(
      `https://discord.com/api/users/@me/guilds/${DISCORD_GUILD_ID}/member`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
        validateStatus: (s) => s < 500,
      }
    );

    if (memberRes.status === 404) {
      return res.redirect(`${APP_URL}?auth=not_member`);
    }
    if (memberRes.status !== 200) {
      throw new Error(`member fetch failed: ${memberRes.status}`);
    }

    const member = memberRes.data;
    const roles = member.roles || [];

    // 3. Role check (empty allow-list = any member passes)
    const allowed = ALLOWED_ROLES.length === 0 || roles.some((r) => ALLOWED_ROLES.includes(r));
    if (!allowed) {
      return res.redirect(`${APP_URL}?auth=forbidden`);
    }

    // 4. Issue a signed session cookie
    const u = member.user || {};
    const isAdmin = ADMIN_ROLES.length > 0 && roles.some((r) => ADMIN_ROLES.includes(r));
    const sessionUser = {
      id: u.id,
      username: u.global_name || u.username || 'Member',
      avatar: u.avatar ? `https://cdn.discordapp.com/avatars/${u.id}/${u.avatar}.png` : null,
      isAdmin,
    };
    const sessionToken = jwt.sign(sessionUser, JWT_SECRET, { expiresIn: `${SESSION_DAYS}d` });
    res.cookie(COOKIE_NAME, sessionToken, { ...baseCookie, maxAge: SESSION_DAYS * 86400 * 1000 });

    res.redirect(APP_URL);
  } catch (err) {
    console.error('Auth callback error:', err.message);
    res.redirect(`${APP_URL}?auth=error`);
  }
});

// ── Who am I? ───────────────────────────────────────────────────────────────
router.get('/me', (req, res) => {
  const token = req.cookies?.[COOKIE_NAME];
  if (!authConfigured || !token) return res.status(401).json({ authenticated: false });
  try {
    const user = jwt.verify(token, JWT_SECRET);
    res.json({ authenticated: true, user: { id: user.id, username: user.username, avatar: user.avatar, isAdmin: !!user.isAdmin } });
  } catch {
    res.status(401).json({ authenticated: false });
  }
});

// ── Logout ──────────────────────────────────────────────────────────────────
router.post('/logout', (req, res) => {
  res.clearCookie(COOKIE_NAME, baseCookie);
  res.json({ ok: true });
});

// ── Gate for protected routes ───────────────────────────────────────────────
function requireAuth(req, res, next) {
  const token = req.cookies?.[COOKIE_NAME];
  if (!authConfigured || !token) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Session expired' });
  }
}

// Stricter gate for the admin area: a valid session AND the admin flag.
function requireAdmin(req, res, next) {
  requireAuth(req, res, () => {
    if (req.user?.isAdmin) return next();
    return res.status(403).json({ error: 'Admin access required' });
  });
}

module.exports = { router, requireAuth, requireAdmin };
