/**
 * CRA dev proxy — routes /api/slack/* to the local MCP Slack server,
 * and /api/wolfie/* for Wolfie sync operations.
 */

const { execSync } = require('child_process');
const path = require('path');

const MCP_SLACK_URL = 'http://127.0.0.1:29051/mcp/servers/slack';
const MCP_SLACK_TOKEN = '638f98d2-8a82-4bfd-a657-addeb6cd419a';

// Source messaging components repo (git.soma)
const SOURCE_REPO_URL = 'https://git.soma.salesforce.com/commerce/commerce-messaging-lightning-components.git';
const SOURCE_REPO_DIR = path.resolve(__dirname, '../../.source-ui/commerce-messaging-lightning-components');
const WOLFIE_DIR = path.resolve(__dirname, '../../wolfie');

// ----------------------------------------------------------------
// Helpers
// ----------------------------------------------------------------

/** Call an MCP Slack tool and return the parsed text result. */
async function callMcpSlack(toolName, args) {
  const res = await fetch(MCP_SLACK_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${MCP_SLACK_TOKEN}`,
    },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method: 'tools/call',
      params: { name: toolName, arguments: args },
    }),
  });
  const data = await res.json();
  return data?.result?.content?.[0]?.text || '';
}

/**
 * Parse the concise markdown response from slack_search_users into
 * an array of { name, userId, email, title }.
 *
 * Example line: "1. Boris Bachovski - U0212SDSU3H - bbachovski@salesforce.com - Lead Technical Architect"
 */
function parseSlackUsers(text) {
  const lines = text.split('\n').filter((l) => /^\d+\.\s/.test(l));
  return lines.map((line) => {
    const stripped = line.replace(/^\d+\.\s*/, '');
    const parts = stripped.split(' - ');
    return {
      name: (parts[0] || '').trim(),
      userId: (parts[1] || '').trim(),
      email: (parts[2] || '').trim(),
      title: (parts[3] || '').trim(),
    };
  });
}

/**
 * Parse channel search results.
 * Example line: "1. #shapie-checkout-flow - C08ABC123 - Private - ..."
 */
function parseSlackChannels(text) {
  const lines = text.split('\n').filter((l) => /^\d+\.\s/.test(l) || /^###?\s/.test(l));
  const channels = [];
  let current = null;

  for (const line of text.split('\n')) {
    // Concise format: "1. #channel-name - C123 - type - ..."
    const conciseMatch = line.match(/^\d+\.\s*#?([\w-]+)\s*-\s*(\w+)\s*-/);
    if (conciseMatch) {
      channels.push({ name: conciseMatch[1], channelId: conciseMatch[2] });
      continue;
    }
    // Detailed format: look for "Channel ID: C123"
    const idMatch = line.match(/Channel ID:\s*(\w+)/);
    if (idMatch && current) {
      current.channelId = idMatch[1];
      channels.push(current);
      current = null;
      continue;
    }
    const nameMatch = line.match(/^###?\s.*?#([\w-]+)/);
    if (nameMatch) {
      current = { name: nameMatch[1], channelId: '' };
    }
  }
  return channels;
}

// ----------------------------------------------------------------
// Routes
// ----------------------------------------------------------------

module.exports = function (app) {
  // JSON body parsing for POST routes
  app.use('/api/slack', require('express').json());

  // --- Search users ---
  app.get('/api/slack/search-users', async (req, res) => {
    const query = req.query.q;
    if (!query || query.length < 2) {
      return res.json({ users: [] });
    }

    try {
      const text = await callMcpSlack('slack_search_users', {
        query,
        limit: 8,
        response_format: 'concise',
      });
      const parsed = JSON.parse(text);
      const users = parseSlackUsers(parsed.results || '');
      res.json({ users });
    } catch (err) {
      console.error('[setupProxy] Slack search error:', err.message);
      res.status(500).json({ error: err.message, users: [] });
    }
  });

  // --- Search channels (check if a channel already exists) ---
  app.get('/api/slack/search-channels', async (req, res) => {
    const query = req.query.q;
    if (!query || query.length < 2) {
      return res.json({ channels: [] });
    }

    try {
      const text = await callMcpSlack('slack_search_channels', {
        query,
        limit: 5,
        channel_types: 'public_channel,private_channel',
        response_format: 'concise',
      });
      const parsed = JSON.parse(text);
      const channels = parseSlackChannels(parsed.results || '');
      res.json({ channels });
    } catch (err) {
      console.error('[setupProxy] Slack channel search error:', err.message);
      res.status(500).json({ error: err.message, channels: [] });
    }
  });

  // --- Send message to a channel ---
  app.post('/api/slack/send-message', async (req, res) => {
    const { channelId, message } = req.body;
    if (!channelId || !message) {
      return res.status(400).json({ error: 'channelId and message required' });
    }

    try {
      const text = await callMcpSlack('slack_send_message', {
        channel_id: channelId,
        message,
      });
      res.json({ ok: true, result: text });
    } catch (err) {
      console.error('[setupProxy] Slack send error:', err.message);
      res.status(500).json({ error: err.message });
    }
  });

  // --- Create a Slack Canvas ---
  app.post('/api/slack/create-canvas', async (req, res) => {
    const { title, content } = req.body;
    if (!title || !content) {
      return res.status(400).json({ error: 'title and content required' });
    }

    try {
      const text = await callMcpSlack('slack_create_canvas', { title, content });
      const parsed = JSON.parse(text);
      res.json({ ok: true, canvasId: parsed.canvas_id, canvasUrl: parsed.canvas_url });
    } catch (err) {
      console.error('[setupProxy] Slack canvas error:', err.message);
      res.status(500).json({ error: err.message });
    }
  });

  // --- Send spec for review (canvas + DMs) ---
  app.post('/api/slack/send-review', async (req, res) => {
    const { shape, report, recordings, reviewers } = req.body;
    if (!reviewers || reviewers.length === 0) {
      return res.status(400).json({ error: 'reviewers required' });
    }

    try {
      // Step 1: Create a Slack Canvas with the full spec + recordings
      const canvasTitle = `[Spec Review] ${shape.name || 'Untitled Shape'}`;

      // Build canvas content in Canvas-flavored Markdown
      const canvasLines = [];
      canvasLines.push(`**Shape:** ${shape.name || 'Untitled'}`);
      if (shape.problem) {
        canvasLines.push(`**Problem:** ${shape.problem}`);
      }
      canvasLines.push('');

      // Participants
      const participants = shape.participants || [];
      if (participants.length > 0) {
        canvasLines.push('## Participants');
        for (const p of participants) {
          if (p.userId) {
            canvasLines.push(`- ![](@${p.userId}) ${p.title || ''}`);
          } else {
            canvasLines.push(`- ${p.name} ${p.title ? '— ' + p.title : ''}`);
          }
        }
        canvasLines.push('');
      }

      // Recordings info
      if (recordings && recordings.length > 0) {
        canvasLines.push('## Recordings');
        canvasLines.push(`_${recordings.length} screen recording(s) captured during shaping._`);
        canvasLines.push('');
        for (const rec of recordings) {
          const sizeMB = (rec.size / (1024 * 1024)).toFixed(1);
          canvasLines.push(`- **${rec.filename}** (${sizeMB} MB) — _Ask the shape author to share the video file_`);
        }
        canvasLines.push('');
      }

      // Full spec
      canvasLines.push('## Spec');
      canvasLines.push('');
      canvasLines.push(report || '_No spec content._');

      const canvasContent = canvasLines.join('\n');

      const canvasText = await callMcpSlack('slack_create_canvas', {
        title: canvasTitle,
        content: canvasContent,
      });
      const canvasParsed = JSON.parse(canvasText);
      const canvasUrl = canvasParsed.canvas_url;

      // Step 2: DM each reviewer with the canvas link
      const sent = [];
      const failed = [];

      const recordingNote = recordings && recordings.length > 0
        ? `\n_${recordings.length} screen recording(s) are referenced in the canvas._`
        : '';

      for (const reviewer of reviewers) {
        if (!reviewer.userId) {
          failed.push({ name: reviewer.name, reason: 'No Slack user ID' });
          continue;
        }

        const dm = [
          `*Spec Review Request*`,
          `*Shape:* ${shape.name || 'Untitled'}`,
          shape.problem ? `*Problem:* ${shape.problem.slice(0, 200)}` : '',
          '',
          `Please review the shaping spec:`,
          canvasUrl,
          recordingNote,
        ].filter(Boolean).join('\n');

        try {
          await callMcpSlack('slack_send_message', {
            channel_id: reviewer.userId,
            message: dm,
          });
          sent.push({ name: reviewer.name });
        } catch (err) {
          failed.push({ name: reviewer.name, reason: err.message });
        }
      }

      res.json({ ok: true, canvasUrl, sent, failed });
    } catch (err) {
      console.error('[setupProxy] Send review error:', err.message);
      res.status(500).json({ error: err.message });
    }
  });

  // =================================================================
  // Wolfie sync endpoints
  // =================================================================

  app.use('/api/wolfie', require('express').json());

  /**
   * POST /api/wolfie/sync
   * Clones or pulls the source messaging components repo,
   * then copies the latest UI into Wolfie.
   * Returns a step-by-step log so the frontend can show progress.
   */
  app.post('/api/wolfie/sync', async (req, res) => {
    const steps = [];
    const fs = require('fs');

    const log = (step, status, detail) => {
      steps.push({ step, status, detail, ts: Date.now() });
    };

    try {
      // Step 1: Clone or pull source repo
      if (fs.existsSync(path.join(SOURCE_REPO_DIR, '.git'))) {
        log('pull', 'running', 'Pulling latest from commerce-messaging-lightning-components...');
        try {
          const pullOut = execSync('git pull --ff-only', {
            cwd: SOURCE_REPO_DIR,
            encoding: 'utf8',
            timeout: 60000,
          });
          log('pull', 'done', pullOut.trim());
        } catch (pullErr) {
          // If ff-only fails, reset to origin/main
          execSync('git fetch origin && git reset --hard origin/main', {
            cwd: SOURCE_REPO_DIR,
            encoding: 'utf8',
            timeout: 60000,
          });
          log('pull', 'done', 'Reset to origin/main');
        }
      } else {
        log('clone', 'running', 'Cloning commerce-messaging-lightning-components...');
        fs.mkdirSync(path.dirname(SOURCE_REPO_DIR), { recursive: true });
        const cloneOut = execSync(
          `git clone --depth 1 ${SOURCE_REPO_URL} "${SOURCE_REPO_DIR}"`,
          { encoding: 'utf8', timeout: 120000 }
        );
        log('clone', 'done', cloneOut.trim() || 'Cloned successfully');
      }

      // Step 2: Discover what UI files to sync
      log('discover', 'running', 'Scanning source repo for messaging UI components...');
      const srcComponents = path.join(SOURCE_REPO_DIR, 'force-app', 'main', 'default', 'lwc');
      let componentCount = 0;
      if (fs.existsSync(srcComponents)) {
        const dirs = fs.readdirSync(srcComponents).filter((d) =>
          fs.statSync(path.join(srcComponents, d)).isDirectory()
        );
        componentCount = dirs.length;
      }
      log('discover', 'done', `Found ${componentCount} LWC components`);

      // Step 3: Get commit info
      log('version', 'running', 'Reading source version...');
      const commitHash = execSync('git rev-parse --short HEAD', {
        cwd: SOURCE_REPO_DIR,
        encoding: 'utf8',
      }).trim();
      const commitMsg = execSync('git log -1 --pretty=%s', {
        cwd: SOURCE_REPO_DIR,
        encoding: 'utf8',
      }).trim();
      const commitDate = execSync('git log -1 --pretty=%ci', {
        cwd: SOURCE_REPO_DIR,
        encoding: 'utf8',
      }).trim();
      log('version', 'done', `${commitHash} — ${commitMsg}`);

      res.json({
        ok: true,
        steps,
        source: {
          repo: 'commerce/commerce-messaging-lightning-components',
          commit: commitHash,
          message: commitMsg,
          date: commitDate,
          componentCount,
          path: SOURCE_REPO_DIR,
        },
      });
    } catch (err) {
      log('error', 'failed', err.message);
      console.error('[setupProxy] Wolfie sync error:', err.message);
      res.status(500).json({ ok: false, error: err.message, steps });
    }
  });

  /**
   * GET /api/wolfie/config
   * Fetches the current Wolfie session config by loading it from the
   * Wolfie dev server's localStorage (via injected script).
   * Since we can't read browser localStorage from the server,
   * we expose a snapshot endpoint that the frontend populates
   * by reading from the Wolfie tab via postMessage.
   *
   * As a fallback, returns the Wolfie default prompt templates.
   */
  app.get('/api/wolfie/config', (req, res) => {
    // Return the cached config if we have one (set by POST)
    if (app.locals.wolfieConfig) {
      return res.json({ ok: true, config: app.locals.wolfieConfig });
    }
    res.json({ ok: false, config: null, message: 'No Wolfie config cached yet. Post from the browser.' });
  });

  /**
   * POST /api/wolfie/config
   * The frontend posts the Wolfie config here after reading it from
   * the Wolfie tab's localStorage via the opener/postMessage bridge.
   */
  app.post('/api/wolfie/config', (req, res) => {
    app.locals.wolfieConfig = req.body;
    res.json({ ok: true });
  });

  /**
   * GET /api/wolfie/status
   * Returns the current sync status — whether the source repo exists,
   * last commit, etc.
   */
  app.get('/api/wolfie/status', (req, res) => {
    const fs = require('fs');
    try {
      if (!fs.existsSync(path.join(SOURCE_REPO_DIR, '.git'))) {
        return res.json({ synced: false });
      }
      const commitHash = execSync('git rev-parse --short HEAD', {
        cwd: SOURCE_REPO_DIR, encoding: 'utf8',
      }).trim();
      const commitMsg = execSync('git log -1 --pretty=%s', {
        cwd: SOURCE_REPO_DIR, encoding: 'utf8',
      }).trim();
      const commitDate = execSync('git log -1 --pretty=%ci', {
        cwd: SOURCE_REPO_DIR, encoding: 'utf8',
      }).trim();
      res.json({
        synced: true,
        commit: commitHash,
        message: commitMsg,
        date: commitDate,
        path: SOURCE_REPO_DIR,
      });
    } catch (err) {
      res.json({ synced: false, error: err.message });
    }
  });

  // =================================================================
  // GUS Work Item endpoints (uses `sf` CLI)
  // =================================================================

  app.use('/api/gus', require('express').json());

  const SF_CLI = '/Users/baleksandrovsky/.aisuite/bin/sf';
  const GUS_ORG = 'gus';

  /**
   * Run an `sf data query` SOQL and return the parsed records.
   */
  function sfQuery(soql) {
    const { execFileSync } = require('child_process');
    const raw = execFileSync(SF_CLI, [
      'data', 'query',
      '--query', soql,
      '--target-org', GUS_ORG,
      '--json',
    ], { encoding: 'utf8', timeout: 30000 });
    const parsed = JSON.parse(raw);
    if (parsed.status !== 0) throw new Error(parsed.message || 'sf query failed');
    return parsed.result.records || [];
  }

  /**
   * Run an `sf data create record` and return the created record Id.
   */
  function sfCreate(sobject, values) {
    const { execFileSync } = require('child_process');
    // Build "Field1='val1' Field2='val2'" string
    const pairs = Object.entries(values)
      .filter(([, v]) => v != null && v !== '')
      .map(([k, v]) => `${k}='${String(v).replace(/'/g, "\\'")}'`)
      .join(' ');
    const raw = execFileSync(SF_CLI, [
      'data', 'create', 'record',
      '--sobject', sobject,
      '--values', pairs,
      '--target-org', GUS_ORG,
      '--json',
    ], { encoding: 'utf8', timeout: 30000 });
    const parsed = JSON.parse(raw);
    if (parsed.status !== 0) throw new Error(parsed.message || 'sf create failed');
    return parsed.result.id;
  }

  /**
   * GET /api/gus/search-users?q=<name>
   * Search GUS users by name (for assignee autocomplete).
   */
  app.get('/api/gus/search-users', async (req, res) => {
    const query = (req.query.q || '').trim();
    if (query.length < 2) return res.json({ users: [] });

    try {
      const escaped = query.replace(/'/g, "\\'");
      const records = sfQuery(
        `SELECT Id, Name, Email FROM User WHERE Name LIKE '%${escaped}%' AND IsActive = true ORDER BY Name LIMIT 10`
      );
      const users = records.map((r) => ({
        id: r.Id,
        name: r.Name,
        email: r.Email,
      }));
      res.json({ users });
    } catch (err) {
      console.error('[setupProxy] GUS user search error:', err.message);
      res.status(500).json({ error: err.message, users: [] });
    }
  });

  /**
   * GET /api/gus/search-users-by-email?emails=a@x.com,b@x.com
   * Resolve GUS user IDs from email addresses (for matching Slack participants).
   */
  app.get('/api/gus/search-users-by-email', async (req, res) => {
    const emails = (req.query.emails || '').split(',').map((e) => e.trim()).filter(Boolean);
    if (emails.length === 0) return res.json({ users: [] });

    try {
      const inClause = emails.map((e) => `'${e.replace(/'/g, "\\'")}'`).join(',');
      const records = sfQuery(
        `SELECT Id, Name, Email FROM User WHERE Email IN (${inClause}) AND IsActive = true`
      );
      const users = records.map((r) => ({
        id: r.Id,
        name: r.Name,
        email: r.Email,
      }));
      res.json({ users });
    } catch (err) {
      console.error('[setupProxy] GUS email lookup error:', err.message);
      res.status(500).json({ error: err.message, users: [] });
    }
  });

  /**
   * GET /api/gus/search-themes?q=<name>
   * Search GUS themes by name.
   */
  app.get('/api/gus/search-themes', async (req, res) => {
    const query = (req.query.q || '').trim();
    if (query.length < 2) return res.json({ themes: [] });

    try {
      const escaped = query.replace(/'/g, "\\'");
      const records = sfQuery(
        `SELECT Id, Name FROM ADM_Theme__c WHERE Name LIKE '%${escaped}%' ORDER BY CreatedDate DESC LIMIT 10`
      );
      const themes = records.map((r) => ({ id: r.Id, name: r.Name }));
      res.json({ themes });
    } catch (err) {
      console.error('[setupProxy] GUS theme search error:', err.message);
      res.status(500).json({ error: err.message, themes: [] });
    }
  });

  /**
   * GET /api/gus/current-sprint
   * Get the current sprint for CC-Chatty team.
   */
  app.get('/api/gus/current-sprint', async (req, res) => {
    try {
      const records = sfQuery(
        `SELECT Id, Name FROM ADM_Sprint__c WHERE Scrum_Team__c = 'a00EE00000v6l3RYAQ' AND Start_Date__c <= TODAY AND End_Date__c >= TODAY LIMIT 1`
      );
      if (records.length > 0) {
        res.json({ sprint: { id: records[0].Id, name: records[0].Name } });
      } else {
        res.json({ sprint: null });
      }
    } catch (err) {
      console.error('[setupProxy] GUS sprint error:', err.message);
      res.status(500).json({ error: err.message, sprint: null });
    }
  });

  /**
   * POST /api/gus/create-work-item
   * Create a GUS work item (User Story).
   * Body: { subject, details, assigneeId, themeId }
   */
  app.post('/api/gus/create-work-item', async (req, res) => {
    const { subject, details, assigneeId, themeId } = req.body;
    if (!subject) return res.status(400).json({ error: 'subject required' });

    try {
      // Resolve current sprint
      const sprintRecords = sfQuery(
        `SELECT Id FROM ADM_Sprint__c WHERE Scrum_Team__c = 'a00EE00000v6l3RYAQ' AND Start_Date__c <= TODAY AND End_Date__c >= TODAY LIMIT 1`
      );
      const sprintId = sprintRecords.length > 0 ? sprintRecords[0].Id : null;

      const values = {
        RecordTypeId: '0129000000006gDAAQ',            // User Story record type
        Subject__c: subject,
        Type__c: 'User Story',
        Status__c: 'New',
        Story_Points__c: '2',
        Product_Tag__c: 'a1aEE000001KJifYAG',        // ECOM PSA and Product Details
        Scrum_Team__c: 'a00EE00000v6l3RYAQ',          // CC-Chatty
        Found_in_Build__c: 'a06EE00000PHbBFYA1',
        Impact__c: 'a0O900000004EF0EAM',
        Frequency__c: 'a0L9000000000urEAA',
      };

      if (assigneeId) values.Assignee__c = assigneeId;
      if (themeId) values.Theme__c = themeId;
      if (sprintId) values.Sprint__c = sprintId;
      if (details) values.Details__c = details;
      if (req.body.qaEngineerId) values.QA_Engineer__c = req.body.qaEngineerId;
      if (req.body.productOwnerId) values.Product_Owner__c = req.body.productOwnerId;

      const recordId = sfCreate('ADM_Work__c', values);

      // Fetch the created record to get the W-number
      const created = sfQuery(
        `SELECT Id, Name, Subject__c FROM ADM_Work__c WHERE Id = '${recordId}' LIMIT 1`
      );
      const wi = created.length > 0 ? created[0] : { Id: recordId, Name: recordId };

      res.json({
        ok: true,
        workItem: {
          id: wi.Id,
          name: wi.Name,
          subject: wi.Subject__c || subject,
          url: `https://gus.my.salesforce.com/${wi.Id}`,
        },
      });
    } catch (err) {
      console.error('[setupProxy] GUS create WI error:', err.message);
      res.status(500).json({ error: err.message });
    }
  });

  // =================================================================
  // Screen Recording endpoints
  // =================================================================

  // CORS for cross-origin uploads from Wolfie (port 3099 → 3100)
  app.use('/api/recordings', (req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') return res.sendStatus(204);
    next();
  });

  const RECORDINGS_DIR = path.resolve(__dirname, '../../.recordings');

  /**
   * POST /api/recordings/upload
   * Receives a webm video blob from Wolfie's screen recorder.
   * Query params: shapeId (required), filename (optional)
   * Body: raw binary (Content-Type: video/webm or application/octet-stream)
   */
  app.post('/api/recordings/upload', (req, res) => {
    const fs = require('fs');
    const shapeId = req.query.shapeId;
    if (!shapeId) return res.status(400).json({ error: 'shapeId required' });

    const shapeDir = path.join(RECORDINGS_DIR, shapeId);
    fs.mkdirSync(shapeDir, { recursive: true });

    const timestamp = Date.now();
    const filename = req.query.filename || `recording-${timestamp}.webm`;
    const filePath = path.join(shapeDir, filename);

    const chunks = [];
    req.on('data', (chunk) => chunks.push(chunk));
    req.on('end', () => {
      const buffer = Buffer.concat(chunks);
      fs.writeFileSync(filePath, buffer);
      console.log(`[setupProxy] Recording saved: ${filePath} (${buffer.length} bytes)`);
      res.json({
        ok: true,
        recording: {
          filename,
          shapeId,
          size: buffer.length,
          timestamp,
          url: `/api/recordings/${shapeId}/${filename}`,
        },
      });
    });
    req.on('error', (err) => {
      console.error('[setupProxy] Recording upload error:', err.message);
      res.status(500).json({ error: err.message });
    });
  });

  /**
   * GET /api/recordings/:shapeId
   * List all recordings for a shape.
   */
  app.get('/api/recordings/:shapeId', (req, res) => {
    const fs = require('fs');
    const shapeDir = path.join(RECORDINGS_DIR, req.params.shapeId);
    if (!fs.existsSync(shapeDir)) return res.json({ recordings: [] });

    try {
      const files = fs.readdirSync(shapeDir)
        .filter((f) => f.endsWith('.webm'))
        .map((f) => {
          const stat = fs.statSync(path.join(shapeDir, f));
          return {
            filename: f,
            size: stat.size,
            timestamp: stat.mtimeMs,
            url: `/api/recordings/${req.params.shapeId}/${f}`,
          };
        })
        .sort((a, b) => b.timestamp - a.timestamp);
      res.json({ recordings: files });
    } catch (err) {
      res.status(500).json({ error: err.message, recordings: [] });
    }
  });

  /**
   * GET /api/recordings/:shapeId/:filename
   * Serve a recording file for playback.
   */
  app.get('/api/recordings/:shapeId/:filename', (req, res) => {
    const fs = require('fs');
    const filePath = path.join(RECORDINGS_DIR, req.params.shapeId, req.params.filename);
    if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'not found' });

    const stat = fs.statSync(filePath);
    res.writeHead(200, {
      'Content-Type': 'video/webm',
      'Content-Length': stat.size,
      'Accept-Ranges': 'bytes',
    });
    fs.createReadStream(filePath).pipe(res);
  });

  /**
   * DELETE /api/recordings/:shapeId/:filename
   * Delete a recording.
   */
  app.delete('/api/recordings/:shapeId/:filename', (req, res) => {
    const fs = require('fs');
    const filePath = path.join(RECORDINGS_DIR, req.params.shapeId, req.params.filename);
    if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'not found' });

    fs.unlinkSync(filePath);
    res.json({ ok: true });
  });

};
