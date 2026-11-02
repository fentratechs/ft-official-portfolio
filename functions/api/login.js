import { pbkdf2 } from 'node:crypto';
import {
  signToken,
  cookieHeader,
  jsonError,
  checkOrigin,
  readJson
} from './_auth.js';

const enc = new TextEncoder();

function hashPassword(password, salt, setStage = () => {}) {
  setStage('password_derive');

  return new Promise((resolve, reject) => {
    pbkdf2(password, salt, 210000, 32, 'sha256', (error, derivedKey) => {
      if (error) return reject(error);
      resolve(derivedKey.toString('hex'));
    });
  });
}

async function hashIP(ip, secret) {
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const result = await crypto.subtle.sign(
    'HMAC',
    key,
    enc.encode(ip)
  );

  return [...new Uint8Array(result)]
    .map(x => x.toString(16).padStart(2, '0'))
    .join('');
}

export async function onRequestPost({ request, env }) {
  if (!checkOrigin(request)) {
    return jsonError('Invalid request origin.', 403);
  }

  let stage = 'configuration';

  try {
    const required = [
      'DB',
      'ADMIN_EMAIL',
      'ADMIN_PASSWORD_HASH',
      'ADMIN_PASSWORD_SALT',
      'SESSION_SECRET'
    ];

    const missing = required.filter(key => {
      if (key === 'DB') return !env.DB;
      return typeof env[key] !== 'string' || !env[key].length;
    });

    if (missing.length) {
      return jsonError('Admin configuration is incomplete.', 503);
    }

    stage = 'ip_hash';
    const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
    const ipHash = await hashIP(ip, env.SESSION_SECRET);
    const now = Math.floor(Date.now() / 1000);

    stage = 'cleanup';
    await env.DB.prepare(
      'DELETE FROM login_attempts WHERE attempted_at < ?'
    ).bind(now - 3600).run();

    stage = 'rate_check';
    const attempts = await env.DB.prepare(
      'SELECT COUNT(*) AS n FROM login_attempts WHERE ip_hash=? AND attempted_at>?'
    ).bind(ipHash, now - 900).first();

    if ((attempts?.n || 0) >= 8) {
      return jsonError('Too many attempts. Try again in 15 minutes.', 429);
    }

    stage = 'request_body';
    let body;

    try {
      body = await readJson(request);
    } catch {
      return jsonError('Invalid request.', 400);
    }

    stage = 'record_attempt';
    await env.DB.prepare(
      'INSERT INTO login_attempts(ip_hash,attempted_at) VALUES(?,?)'
    ).bind(ipHash, now).run();

    stage = 'password_hash';
    const email = String(body.email || '').toLowerCase().trim();
    const pass = String(body.password || '');
    const actual = await hashPassword(pass, env.ADMIN_PASSWORD_SALT, value => { stage = value; });

    if (
      email !== env.ADMIN_EMAIL.toLowerCase().trim() ||
      actual !== env.ADMIN_PASSWORD_HASH.trim()
    ) {
      return jsonError('Email or password is incorrect.', 401);
    }

    stage = 'create_session';
    const token = await signToken(env, {
      sub: email,
      exp: Date.now() + 8 * 60 * 60 * 1000
    });

    return new Response(JSON.stringify({ ok: true }), {
      headers: {
        'Content-Type': 'application/json',
        'Set-Cookie': cookieHeader(token, 8 * 60 * 60)
      }
    });

  } catch (error) {
    console.error('FT_LOGIN_FAILURE:', stage, error?.name || 'UnknownError');

    return Response.json({
      error: 'Login service error.',
      diagnostic: stage,
      errorType: error?.name || 'UnknownError',
      errorMessage: String(error?.message || 'No message'),
    }, { status: 500 });
  }
}
