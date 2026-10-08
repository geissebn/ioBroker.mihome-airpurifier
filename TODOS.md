# TODOS — mihome-airpurifier (adapter fork)

Adapter topics only, ordered by priority: top = do first, bottom = only worth it if this ever
becomes a public/official adapter. This fork runs on a single ioBroker install; the goal is a
working install plus a green CI pipeline, not public polish.
Status: crash fix (adapter-core v3) installed as 0.1.9, tests on @iobroker/testing v6, CI green
(check Node 22/24 + integration Node 22), commits up to `886df59` pushed to origin.
The abandoned `miio` git tarball was then replaced by pinned `node-miio@0.3.0-beta.2` (sections 1–2).

## 1. Keep it working (do first — cheap, low CI risk)

- [x] **`miio` → `node-miio`**: replaced the master-tracking `https://github.com/JoJ123/miio/tarball/master` dependency with the pinned npm package `node-miio@0.3.0-beta.2`. Reproducible *and* no tarball-availability risk. API-compatible (CommonJS, same `abstract-things` device lineage: `device()`, `matches()`, `miioProperties()`, `powerChanged`/… events, `power`/`setMode`/`setFavoriteLevel`/`buzzer`/`led`). Full suite green (build/lint/test:ts/test:package/test:integration).
- [x] Alternative (publish the miio fork to npm) — superseded by the `node-miio` migration above.
- [ ] Re-check `node-miio` once it leaves beta (currently `0.3.0-beta.2`, low adoption). `xmihome` is only a candidate if a real need appears (ESM-only, no types, its own GitHub deps).
- [ ] **Config validation**: missing `ipaddress`/`token` → clear log.error + `info.connection=false` instead of "Connect to device: undefined" with a 60s retry loop. Must **not** block the `ready` event, or the device-less integration test hangs.
- [ ] Set `engines`/`node` in package.json (e.g. `>=18.0.0`), review `dependencies.js-controller` in io-package (currently `>=1.4.2`, raise depending on the adapter-core requirement).
- [ ] Confirm the GitHub Actions green run after push `886df59` (check + integration).

## 2. Dependency & supply-chain hygiene (low CI risk, do next)

Keep each change in its own commit so a red pipeline is easy to bisect.

- [x] Baseline before touching anything: `npm audit --omit=dev` (done). Production findings went **30 → 8** by dropping `miio`; most remaining findings are transitive, dev-only noise.
- [x] **Runtime vs dev**: only `@iobroker/adapter-core`, `es6-promise` and `node-miio` ship and run on the host; everything else is build/test-only.
- [x] **`overrides`** to clear `node-miio`'s old transitive pins: global `minimist ^1.2.8` (was `1.2.5` via `mkdirp@0.5.5`, critical) and scoped `abstract-things → color-string ^1.5.5`. Prod audit now **8** (0 critical/moderate); the rest are the ioBroker controller stack (`@iobroker/adapter-core`, `js-controller-common-db`, `node-forge`, `debug`).
- [ ] Delete dead deps (verified unused in `src/`/`test/`): `es6-promise`, `proxyquire`, `@types/proxyquire`.
- [ ] Remove the legacy gulp translate toolchain: `gulp`, `@types/gulp`, `axios`, `src/lib/tools.ts` (+ committed `build/lib/tools.js`). This deletes the `axios@0.19.2` CVE surface (dev-only via gulp translate, never executed by the adapter) and the "gulp needs `build/lib/tools` first" quirk.
- [ ] Keep `@iobroker/adapter-core` current via minor/patch bumps.
- [ ] Leave ESLint 6 / TypeScript 5.3 pinned until they block something; upgrading is the main way to redden CI (see section 6).
- [ ] Add `.github/dependabot.yml` (currently missing → no alerts): grouped, weekly, target `master`; each PR must pass CI to merge.
- [ ] Do **not** add an `npm audit` gate to CI (transitive dev-dep findings would fail it constantly); never `npm audit fix --force` (jumps majors, breaks build/lint/tests).
- [ ] Transitive copies (e.g. `es6-promise` under `diskusage` via `miio`/testing) can't be removed without the parent — accept them.

## 3. Connection reliability (do only if actually observed)

- [ ] Detect connection loss cleanly (miio events `error`/`close`) and maintain `info.connection`; reconnect that responds to a new IP.
- [ ] No crash/hang when the device is unreachable (retry abort, no data race on restart) — cover with an integration test. Preserve the device-less `test/integration.js` assertion.
- [ ] Clean `stop()`: terminate timers/reconnect callbacks (double-check the mocha-exit signal "terminating" appearing twice in logs).

## 4. Features you actually want

- [ ] Configurable poll/query interval (native option) instead of the fixed 60s retry.
- [ ] Consider additional control states (compatibility per model): LED switch, buzzer, child lock (child_lock), target humidity/mode — only the ones you use.
- [ ] Document a uniform device-type mapping (`zhimi.airpurifier.mc1`, etc.) as a table and a buffer against unknown models.
- [ ] Optional integration test against a real purifier (env `PURIFIER_IP`/`PURIFIER_TOKEN`) as a manually triggerable CI job (workflow_dispatch), not in the default pipeline.

## 5. Data quality (only where you consume the values)

- [ ] Check and define roles/units: temperature `unit:"°C"`/`role:"value.temperature"`, humidity `%`/`value.humidity`, PM2.5 `"µg/m³"`/`value.pm2.5`, filter time `h`/`value.duration` or similar, document AQI scaling.
- [ ] Map raw-value scaling (e.g. temperature \*100) cleanly via the `c` factor, no rounding in the wrong format.
- [ ] Interpret filter parameters (`filter_hours`/`filter_life`): remaining time + total runtime, possibly a replacement-recommendation state.

## 6. Toolchain modernization (optional — biggest CI risk; only when forced)

- [ ] Reintroduce coverage (`c8` instead of `nyc`) and run `npm run coverage` in CI for the source unit tests.
- [ ] Review `@iobroker/adapter-core` 3.4.3 vs `@iobroker/js-controller-adapter` (7.x); place the desired types as a devDependency.
- [ ] **ESLint** 6.8.0 + `@typescript-eslint` 2.24 → current ESLint 8/9 + TS-ESLint, tighten the rule list. Single isolated commit, only merge while CI is green.
- [ ] Raise TypeScript to a current version and apply `strict` (incl. `noUnusedLocals`, `noImplicitOverride`, etc.) across `src/`. Single isolated commit, only merge while CI is green.

## 7. Only for an official/public adapter release

None of this matters while the fork runs on one install; revisit only if it is published or shared.

- [ ] Meaningful state `name`/`desc` in EN+DE (currently partly empty/generic) and converting `admin/` to `adminUI`.
- [ ] Identify duplicate attributes (e.g. `temp`/`temperature`, `humidity` vs `relative_humidity`) and consolidate them (breaking change only with a major version + news entry).
- [ ] Repochecker/package compliance: README badges (CI, version, npm), LICENSE path.
- [ ] Next version: mark `0.2.0` (features); aim for `1.0.0` once no breaking-change items remain; keep news in EN+DE.
- [ ] Clarify npm publishing: publish as its own package (name taken by JoJ123) or as `iobroker.mihome-airpurifier` under geissebn — decide with the user.
- [ ] GitHub release workflow: tag → Actions release (automatic CHANGELOG/news) + optional auto-npm-publish after publishing.
- [ ] Rework README: remove template text, token acquisition (MiHome protocol/token log), brief device listing, troubleshooting (port 54321/UDP).
- [ ] Only aim for listing in the ioBroker stable repository once `1.0.0` and the core features are frozen.
