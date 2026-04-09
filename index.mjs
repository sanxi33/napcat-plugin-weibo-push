import fs from 'fs';
import path from 'path';
import { execFile } from 'child_process';
import { fileURLToPath } from 'url';

var EventType = ((EventType2) => {
  EventType2.MESSAGE = 'message';
  return EventType2;
})(EventType || {});

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DEFAULT_CONFIG = {
  enabled: true,
  commandPrefix: '球鳖',
  userId: '',
  requestTimeoutMs: 10000,
  pollMinutes: 240,
  adminQqList: [],
  pushStatePath: 'data/weibo-push-state.json',
  weiboCookie: '',
  weiboCookieFile: '',
  weiboReaderScript: './scripts/weibo_reader.py'
};

export let plugin_config_ui = [];
let currentConfig = { ...DEFAULT_CONFIG };
let logger = null;
let ctxRef = null;
let timer = null;
let state = { enabledGroups: {}, lastBlogIdByUser: {} };

function sanitizeConfig(raw) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return { ...DEFAULT_CONFIG };
  const out = { ...DEFAULT_CONFIG, ...raw };
  out.enabled = Boolean(out.enabled);
  out.commandPrefix = String(out.commandPrefix || '').trim();
  out.userId = String(out.userId || '').trim();
  out.requestTimeoutMs = Math.max(1000, Math.min(30000, Number(out.requestTimeoutMs) || 10000));
  out.pollMinutes = Math.max(1, Math.min(720, Number(out.pollMinutes) || 240));
  out.adminQqList = Array.isArray(out.adminQqList) ? out.adminQqList.map((item) => String(item)) : [];
  out.pushStatePath = String(out.pushStatePath || 'data/weibo-push-state.json');
  out.weiboCookie = String(out.weiboCookie || '');
  out.weiboCookieFile = String(out.weiboCookieFile || '');
  out.weiboReaderScript = String(out.weiboReaderScript || DEFAULT_CONFIG.weiboReaderScript).trim();
  return out;
}

function normalize(value) {
  return String(value || '').trim().toLowerCase().replace(/[！!。,.，？?；;：:“”"'`~·]/g, '').replace(/\s+/g, '');
}

function isAdmin(userId) {
  return currentConfig.adminQqList.includes(String(userId || ''));
}

function getStatePath() {
  const p = currentConfig.pushStatePath;
  if (path.isAbsolute(p)) return p;
  return path.join(ctxRef.dataPath, p.replace(/^data[\\/]/, ''));
}

function loadState() {
  try {
    const sp = getStatePath();
    if (fs.existsSync(sp)) state = JSON.parse(fs.readFileSync(sp, 'utf-8'));
  } catch {
    state = { enabledGroups: {}, lastBlogIdByUser: {} };
  }
}

function saveState() {
  try {
    const sp = getStatePath();
    const dir = path.dirname(sp);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(sp, JSON.stringify(state, null, 2), 'utf-8');
  } catch {}
}

function resolveCookie() {
  if (currentConfig.weiboCookie) return currentConfig.weiboCookie;
  try {
    if (currentConfig.weiboCookieFile && fs.existsSync(currentConfig.weiboCookieFile)) {
      return fs.readFileSync(currentConfig.weiboCookieFile, 'utf-8').trim();
    }
  } catch {}
  return '';
}

function resolveWeiboReaderScript() {
  if (path.isAbsolute(currentConfig.weiboReaderScript)) return currentConfig.weiboReaderScript;
  return path.resolve(__dirname, currentConfig.weiboReaderScript);
}

async function runWeiboReader(limit = 10) {
  return await new Promise((resolve, reject) => {
    const cookie = resolveCookie();
    const args = [resolveWeiboReaderScript(), '--uid', currentConfig.userId, '--limit', String(limit)];
    if (cookie) args.push('--cookie', cookie);
    const pyArgs = ['-3', ...args];
    execFile('py', pyArgs, { timeout: currentConfig.requestTimeoutMs + 5000, windowsHide: true, maxBuffer: 1024 * 1024 * 5 }, (err, stdout, stderr) => {
      if (err) return reject(new Error(stderr || err.message || 'weibo_reader_failed'));
      try {
        resolve(JSON.parse(stdout));
      } catch (error) {
        reject(new Error(`weibo_reader_parse_failed:${String(error)}|${String(stdout).slice(0, 120)}`));
      }
    });
  });
}

function toPlainText(html) {
  return String(html || '').replace(/<br\s*\/?\s*>/gi, '\n').replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').trim();
}

function formatTs(ts) {
  const date = ts ? new Date(ts) : null;
  if (!date || Number.isNaN(date.getTime())) return '';
  const p = (n) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${p(date.getMonth() + 1)}-${p(date.getDate())} ${p(date.getHours())}:${p(date.getMinutes())}:${p(date.getSeconds())}`;
}

function splitWeiboForwardText(text) {
  const raw = String(text || '').trim();
  const idx = raw.indexOf('//@');
  if (idx < 0) return { comment: raw, source: '' };
  return {
    comment: raw.slice(0, idx).trim(),
    source: raw.slice(idx + 3).trim(),
  };
}

function formatWeiboBody(text) {
  const parts = splitWeiboForwardText(text);
  if (!parts.source) return parts.comment;
  return `${parts.comment ? `${parts.comment}\n\n` : ''}↪ 转发自\n${parts.source}`;
}

function formatWeiboBodyFromStatus(status) {
  const main = toPlainText(status?.text_raw || status?.text || '');
  if (!status?.retweeted_status) return main;

  let out = main;
  let cur = status.retweeted_status;
  let hop = 0;
  while (cur && hop < 5) {
    const name = String(cur?.user?.screen_name || '原作者').trim();
    const text = toPlainText(cur?.text_raw || cur?.text || '');
    out += `//@${name}:${text}`;
    cur = cur?.retweeted_status;
    hop++;
  }
  return out;
}

function cqEscape(text) {
  return String(text || '')
    .replace(/&/g, '&amp;')
    .replace(/\[/g, '&#91;')
    .replace(/\]/g, '&#93;')
    .replace(/,/g, '&#44;');
}

function extractWeiboImageUrls(post) {
  const urls = [];
  const add = (url) => {
    const s = String(url || '').trim();
    if (!s) return;
    if (!/^https?:\/\//i.test(s)) return;
    if (urls.includes(s)) return;
    urls.push(s);
  };

  for (const pic of (post?.pics || [])) {
    add(pic?.largest?.url || pic?.mw2000?.url || pic?.original?.url || pic?.large?.url || pic?.large?.url_ori || pic?.url || pic?.pic_big?.url);
  }

  const retweeted = post?.retweeted_status;
  for (const pic of (retweeted?.pics || [])) {
    add(pic?.largest?.url || pic?.mw2000?.url || pic?.original?.url || pic?.large?.url || pic?.large?.url_ori || pic?.url || pic?.pic_big?.url);
  }

  return urls.slice(0, 9);
}

async function fetchWeiboStatusById(id) {
  try {
    const sid = String(id || '').trim();
    if (!sid) return null;

    const cookie = resolveCookie();
    const headers = {
      'User-Agent': 'Mozilla/5.0',
      Referer: 'https://weibo.com/',
      Accept: 'application/json, text/plain, */*',
      ...(cookie ? { Cookie: cookie } : {}),
    };

    const response = await fetch(`https://weibo.com/ajax/statuses/show?id=${encodeURIComponent(sid)}`, { headers });
    if (!response.ok) return null;
    return await response.json();
  } catch {
    return null;
  }
}

async function fetchWeiboImageUrlsById(id) {
  try {
    const data = await fetchWeiboStatusById(id);
    if (!data) return [];

    const urls = [];
    const add = (url) => {
      const s = String(url || '').trim();
      if (!s) return;
      if (!/^https?:\/\//i.test(s)) return;
      if (urls.includes(s)) return;
      urls.push(s);
    };

    const collectPicInfos = (picInfos) => {
      if (!picInfos || typeof picInfos !== 'object') return;
      for (const value of Object.values(picInfos)) {
        add(value?.largest?.url || value?.mw2000?.url || value?.original?.url || value?.large?.url || value?.bmiddle?.url || value?.thumbnail?.url);
      }
    };

    const walk = (status, depth = 0) => {
      if (!status || depth > 3) return;
      collectPicInfos(status?.pic_infos);
      walk(status?.retweeted_status, depth + 1);
    };

    walk(data, 0);
    return urls.slice(0, 9);
  } catch {
    return [];
  }
}

async function getWeiboList(uid, limit = 10) {
  const result = await runWeiboReader(limit);
  return (result?.posts || [])
    .filter((post) => !post.isTop)
    .map((post) => ({
      id: post.id,
      bid: post.bid,
      text: post.text_raw,
      createdAt: post.created_at,
      shortUrl: post.url || '',
      isTop: post.isTop,
      pics: post.pics || [],
      retweeted_status: post.retweeted_status || null,
      user: { screen_name: result?.user?.screen_name || '微博用户' }
    }));
}

async function sendMsg(ctx, event, message) {
  const params = {
    message,
    message_type: event.message_type,
    ...(event.message_type === 'group' && event.group_id ? { group_id: String(event.group_id) } : {}),
    ...(event.message_type === 'private' && event.user_id ? { user_id: String(event.user_id) } : {})
  };
  await ctx.actions.call('send_msg', params, ctx.adapterName, ctx.pluginManager.config);
}

async function sendGroup(groupId, message) {
  await ctxRef.actions.call('send_msg', { message, message_type: 'group', group_id: String(groupId) }, ctxRef.adapterName, ctxRef.pluginManager.config);
}

function stripPrefix(text) {
  const trimmed = String(text || '').trim();
  if (!currentConfig.commandPrefix) return trimmed;
  if (trimmed.startsWith(currentConfig.commandPrefix)) return trimmed.slice(currentConfig.commandPrefix.length).trim();
  return trimmed;
}

async function handleList(ctx, event, uid) {
  if (!uid) return sendMsg(ctx, event, '请先在配置里设置 userId');
  const list = await getWeiboList(uid);
  if (!list.length) return sendMsg(ctx, event, '暂无微博数据');
  const top = list.slice(0, 8).map((item, index) => `${index + 1}. ${toPlainText(item.text).slice(0, 40)}...`).join('\n');
  return sendMsg(ctx, event, `微博列表：\n${top}\n\n可发：球鳖 第N条微博`);
}

async function handleDetail(ctx, event, uid, idx) {
  if (!uid) return sendMsg(ctx, event, '请先在配置里设置 userId');
  const list = await getWeiboList(uid);
  const item = list[idx - 1];
  if (!item) return sendMsg(ctx, event, '序号超出范围');
  const detail = await fetchWeiboStatusById(item.id || item.bid);
  const text = detail ? formatWeiboBodyFromStatus(detail) : formatWeiboBody(toPlainText(item.text));
  const ts = formatTs(item.createdAt);
  const url = String(item.shortUrl || '').trim();
  const base = `${ts ? `${ts}\n\n` : ''}${text}${url ? `\n${url}` : ''}`;
  let imageUrls = extractWeiboImageUrls(item);
  if (!imageUrls.length) imageUrls = await fetchWeiboImageUrlsById(item.id || item.bid);
  const isForward = Boolean(detail?.retweeted_status || String(item.text || '').includes('//@'));
  if (isForward) imageUrls = imageUrls.slice(0, 1);
  const images = imageUrls.map((img) => `[CQ:image,file=${cqEscape(img)}]`);
  return sendMsg(ctx, event, images.length ? `${base}\n${images.join('\n')}` : base);
}

function startPoller() {
  if (timer) clearInterval(timer);
  timer = setInterval(async () => {
    if (!ctxRef || !currentConfig.enabled || !currentConfig.userId) return;
    try {
      const list = await getWeiboList(currentConfig.userId);
      if (!list.length) return;
      const latest = list.find((post) => !post.isTop) || list[0];
      const latestId = String(latest.id || latest.mid || '');
      if (!latestId) return;
      const key = currentConfig.userId;
      const oldId = String(state.lastBlogIdByUser[key] || '');
      if (oldId === latestId) return;
      state.lastBlogIdByUser[key] = latestId;
      saveState();
      if (!oldId) return;

      const detail = await fetchWeiboStatusById(latest.id || latest.bid);
      const text = detail ? formatWeiboBodyFromStatus(detail) : formatWeiboBody(toPlainText(latest.text));
      const ts = formatTs(latest.createdAt);
      const url = String(latest.shortUrl || '').trim();
      const base = `${ts ? `${ts}\n\n` : ''}${text}${url ? `\n${url}` : ''}`;
      let imageUrls = extractWeiboImageUrls(latest);
      if (!imageUrls.length) imageUrls = await fetchWeiboImageUrlsById(latest.id || latest.bid);
      const isForward = Boolean(detail?.retweeted_status || String(latest.text || '').includes('//@'));
      if (isForward) imageUrls = imageUrls.slice(0, 1);
      const images = imageUrls.map((img) => `[CQ:image,file=${cqEscape(img)}]`);
      const msg = images.length ? `${base}\n${images.join('\n')}` : base;

      for (const [gid, enabled] of Object.entries(state.enabledGroups || {})) {
        if (!enabled) continue;
        await sendGroup(gid, msg);
      }
    } catch (error) {
      logger?.warn('weibo poll failed', error);
    }
  }, currentConfig.pollMinutes * 60 * 1000);
}

export const plugin_init = async (ctx) => {
  ctxRef = ctx;
  logger = ctx.logger;
  plugin_config_ui = ctx.NapCatConfig.combine(
    ctx.NapCatConfig.boolean('enabled', '启用插件', true, '总开关'),
    ctx.NapCatConfig.text('commandPrefix', '命令前缀', '球鳖', ''),
    ctx.NapCatConfig.text('userId', '微博UID', '', '例如 1195242865'),
    ctx.NapCatConfig.number('pollMinutes', '轮询间隔(分钟)', 240, '1-720（240=4小时）'),
    ctx.NapCatConfig.number('requestTimeoutMs', '请求超时(ms)', 10000, '1000-30000'),
    ctx.NapCatConfig.text('pushStatePath', '状态文件路径', 'data/weibo-push-state.json', ''),
    ctx.NapCatConfig.text('weiboCookieFile', '微博Cookie文件', '', '可选，优先读取文件 cookie'),
    ctx.NapCatConfig.text('weiboCookie', '微博Cookie字符串', '', '可直接粘贴 cookie'),
    ctx.NapCatConfig.text('weiboReaderScript', 'weibo_reader.py路径', './scripts/weibo_reader.py', '默认使用仓库内置脚本'),
    ctx.NapCatConfig.text('adminQqList', '管理员QQ(逗号分隔)', '', '可控制开启/关闭推送')
  );
  try {
    if (ctx.configPath && fs.existsSync(ctx.configPath)) {
      const cfg = JSON.parse(fs.readFileSync(ctx.configPath, 'utf-8'));
      if (typeof cfg.adminQqList === 'string') cfg.adminQqList = cfg.adminQqList.split(',').map((item) => item.trim()).filter(Boolean);
      currentConfig = sanitizeConfig(cfg);
    }
  } catch {}
  loadState();
  startPoller();
};

export const plugin_onmessage = async (ctx, event) => {
  if (!currentConfig.enabled) return;
  if (event.post_type !== EventType.MESSAGE) return;
  const raw = String(event.raw_message || '').replace(/\[CQ:[^\]]+\]/g, '').trim();
  if (!raw) return;

  const text = stripPrefix(raw);
  const norm = normalize(text);

  if (norm.includes('开启微博推送')) {
    if (event.message_type !== 'group') return sendMsg(ctx, event, '该命令仅群聊可用');
    if (!isAdmin(event.user_id)) return sendMsg(ctx, event, '仅管理员可操作');
    state.enabledGroups[String(event.group_id)] = true;
    saveState();
    return sendMsg(ctx, event, '已开启本群微博推送');
  }
  if (norm.includes('关闭微博推送')) {
    if (event.message_type !== 'group') return sendMsg(ctx, event, '该命令仅群聊可用');
    if (!isAdmin(event.user_id)) return sendMsg(ctx, event, '仅管理员可操作');
    state.enabledGroups[String(event.group_id)] = false;
    saveState();
    return sendMsg(ctx, event, '已关闭本群微博推送');
  }

  try {
    const detailMatch = text.match(/第\s*(\d+)\s*条微博/i);
    if (detailMatch) return await handleDetail(ctx, event, currentConfig.userId, Number(detailMatch[1]));

    const weiboTriggers = ['微博', '微博列表', '最新微博'];
    if (weiboTriggers.includes(norm)) {
      return await handleList(ctx, event, currentConfig.userId);
    }
  } catch (error) {
    logger?.warn('weibo command failed', error);
    const reason = String(error?.message || '').slice(0, 120);
    return await sendMsg(ctx, event, `微博查询失败：${reason || '未知错误'}`);
  }
};

export const plugin_get_config = async () => currentConfig;
export const plugin_set_config = async (ctx, cfg) => {
  if (typeof cfg.adminQqList === 'string') cfg.adminQqList = cfg.adminQqList.split(',').map((item) => item.trim()).filter(Boolean);
  currentConfig = sanitizeConfig(cfg);
  try {
    const dir = path.dirname(ctx.configPath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(ctx.configPath, JSON.stringify(currentConfig, null, 2), 'utf-8');
  } catch {}
  startPoller();
};
export const plugin_on_config_change = async (ctx, ui, key, value, cur) => {
  if (typeof cur.adminQqList === 'string') cur.adminQqList = cur.adminQqList.split(',').map((item) => item.trim()).filter(Boolean);
  currentConfig = sanitizeConfig(cur);
  startPoller();
};
export const plugin_onevent = async () => {};
export const plugin_cleanup = async () => {
  if (timer) clearInterval(timer);
  timer = null;
};
