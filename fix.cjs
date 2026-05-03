const fs = require('fs');
let code = fs.readFileSync('server/index.ts', 'utf8');

// 1. Remove express-validator
code = code.replace(/import \{ body, validationResult \} from 'express-validator';\n/, '');

// 2. Use location
code = code.replace(/locations\/global/, 'locations/${location}');

// 3. Fix verifyHmac and sessionId
code = code.replace(/function verifyHmac\(req: express\.Request\): boolean \{[\s\S]*?return crypto\.timingSafeEqual\(Buffer\.from\(signature\), Buffer\.from\(expected\)\);\n\}\n/, 
`function verifyHmac(req: express.Request): boolean {
  const timestamp = req.headers['x-timestamp'] as string | undefined;
  const signature = req.headers['x-signature'] as string | undefined;
  if (!timestamp || !signature) return false;

  if (Math.abs(Date.now() - Number(timestamp)) > 5 * 60 * 1000) return false;

  const payload = \`\${timestamp}\${req.path}\${req.body ? JSON.stringify(req.body) : ''}\`;
  const expected = crypto.createHmac('sha256', process.env.HMAC_SECRET ?? 'votepath-client-v1').update(payload).digest('hex');
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
}

const hmacMiddleware = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (isDev) return next();
  if (!verifyHmac(req)) {
    return res.status(401).json({ error: 'Invalid HMAC signature' });
  }
  next();
};
`);

code = code.replace(/async function runAIPipeline\(prompt: string, sessionId\?: string\)/, 'async function runAIPipeline(prompt: string)');
code = code.replace(/const \{ text, source \} = await runAIPipeline\(prompt, sessionId\);/, 'const { text, source } = await runAIPipeline(prompt);');
code = code.replace(/app\.use\(\(err: any, _req: express\.Request, res: express\.Response, _next: express\.NextFunction\) => \{/, 'app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {');

// Fix any usage in catches
code = code.replace(/catch \(err: any\) \{/g, 'catch (err: unknown) {');
code = code.replace(/err\.message/g, '(err instanceof Error ? err.message : String(err))');

fs.writeFileSync('server/index.ts', code);
console.log('Fixed server/index.ts');

let vitestCode = fs.readFileSync('vitest.setup.ts', 'utf8');
vitestCode = vitestCode.replace(/div: \(\{ children, whileHover: _whileHover, initial: _initial, animate: _animate, exit: _exit, transition: _transition, \.\.\.props \}: Record<string, unknown>\) =>/g, 
  '// eslint-disable-next-line @typescript-eslint/no-unused-vars\\n    div: ({ children, whileHover: _whileHover, initial: _initial, animate: _animate, exit: _exit, transition: _transition, ...props }: Record<string, unknown>) =>');
vitestCode = vitestCode.replace(/span: \(\{ children, whileHover: _whileHover, initial: _initial, animate: _animate, exit: _exit, transition: _transition, \.\.\.props \}: Record<string, unknown>\) =>/g, 
  '// eslint-disable-next-line @typescript-eslint/no-unused-vars\\n    span: ({ children, whileHover: _whileHover, initial: _initial, animate: _animate, exit: _exit, transition: _transition, ...props }: Record<string, unknown>) =>');
vitestCode = vitestCode.replace(/p: \(\{ children, whileHover: _whileHover, initial: _initial, animate: _animate, exit: _exit, transition: _transition, \.\.\.props \}: Record<string, unknown>\) =>/g, 
  '// eslint-disable-next-line @typescript-eslint/no-unused-vars\\n    p: ({ children, whileHover: _whileHover, initial: _initial, animate: _animate, exit: _exit, transition: _transition, ...props }: Record<string, unknown>) =>');

fs.writeFileSync('vitest.setup.ts', vitestCode);
console.log('Fixed vitest.setup.ts');
