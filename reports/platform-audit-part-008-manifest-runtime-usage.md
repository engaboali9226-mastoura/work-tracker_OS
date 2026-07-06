# Platform Audit Part 008 - Manifest Runtime Usage

========================================
SEARCH: component.yaml
========================================
packages/architecture/src/parser/component-discovery.ts:44:                        join(root, "component.yaml"),
apps/forge/dist/generators/component.generator.js:26:    ["component.yaml", "component.yaml"]
apps/forge/src/generators/component.generator.ts:40:    ["component.yaml","component.yaml"]
./packages/architecture/src/parser/component-discovery.ts:44:                        join(root, "component.yaml"),
./apps/forge/dist/generators/component.generator.js:26:    ["component.yaml", "component.yaml"]
./apps/forge/src/generators/component.generator.ts:40:    ["component.yaml","component.yaml"]
./node_modules/@worktracker/forge/dist/generators/component.generator.js:26:    ["component.yaml", "component.yaml"]
./node_modules/@worktracker/forge/src/generators/component.generator.ts:40:    ["component.yaml","component.yaml"]

========================================
SEARCH: yaml
========================================
packages/architecture/src/parser/component-discovery.ts:44:                        join(root, "component.yaml"),
packages/architecture/src/parser/yaml-loader.ts:5:export class YamlLoader {
packages/architecture/src/parser/default-architecture-parser.ts:15:    YamlLoader,
packages/architecture/src/parser/default-architecture-parser.ts:16:} from "./yaml-loader.js";
packages/architecture/src/parser/default-architecture-parser.ts:30:        const yaml =
packages/architecture/src/parser/default-architecture-parser.ts:31:            new YamlLoader();
packages/architecture/src/parser/default-architecture-parser.ts:40:            yaml.load(source.manifestPath);
packages/architecture/src/parser/index.ts:4:export * from "./yaml-loader.js";
apps/forge/dist/generators/component.generator.js:26:    ["component.yaml", "component.yaml"]
apps/forge/src/generators/component.generator.ts:40:    ["component.yaml","component.yaml"]
./packages/architecture/src/parser/component-discovery.ts:44:                        join(root, "component.yaml"),
./packages/architecture/src/parser/yaml-loader.ts:5:export class YamlLoader {
./packages/architecture/src/parser/default-architecture-parser.ts:15:    YamlLoader,
./packages/architecture/src/parser/default-architecture-parser.ts:16:} from "./yaml-loader.js";
./packages/architecture/src/parser/default-architecture-parser.ts:30:        const yaml =
./packages/architecture/src/parser/default-architecture-parser.ts:31:            new YamlLoader();
./packages/architecture/src/parser/default-architecture-parser.ts:40:            yaml.load(source.manifestPath);
./packages/architecture/src/parser/index.ts:4:export * from "./yaml-loader.js";
./apps/forge/dist/generators/component.generator.js:26:    ["component.yaml", "component.yaml"]
./apps/forge/src/generators/component.generator.ts:40:    ["component.yaml","component.yaml"]
./node_modules/@worktracker/forge/dist/generators/component.generator.js:26:    ["component.yaml", "component.yaml"]
./node_modules/@worktracker/forge/src/generators/component.generator.ts:40:    ["component.yaml","component.yaml"]
./node_modules/rollup/dist/es/shared/node-entry.js:21368:async function resolveId(source, importer, preserveSymlinks, pluginDriver, moduleLoaderResolveId, skip, customOptions, isEntry, attributes, importerAttributes, fs) {
./node_modules/rollup/dist/es/shared/node-entry.js:21394:    return addJsExtensionIfNecessary(importer ? resolve$1(dirname(importer), source) : resolve$1(source), preserveSymlinks, fs);
./node_modules/rollup/dist/es/shared/node-entry.js:21396:async function addJsExtensionIfNecessary(file, preserveSymlinks, fs) {
./node_modules/rollup/dist/es/shared/node-entry.js:21397:    return ((await findFile(file, preserveSymlinks, fs)) ??
./node_modules/rollup/dist/es/shared/node-entry.js:21398:        (await findFile(file + '.mjs', preserveSymlinks, fs)) ??
./node_modules/rollup/dist/es/shared/node-entry.js:21399:        (await findFile(file + '.js', preserveSymlinks, fs)));
./node_modules/rollup/dist/es/shared/node-entry.js:21401:async function findFile(file, preserveSymlinks, fs) {
./node_modules/rollup/dist/es/shared/node-entry.js:21404:        if (!preserveSymlinks && stats.isSymbolicLink())
./node_modules/rollup/dist/es/shared/node-entry.js:21405:            return await findFile(await fs.realpath(file), preserveSymlinks, fs);
./node_modules/rollup/dist/es/shared/node-entry.js:21406:        if ((preserveSymlinks && stats.isSymbolicLink()) || stats.isFile()) {
./node_modules/rollup/dist/es/shared/node-entry.js:21814:            : await resolveId(source, importer, this.options.preserveSymlinks, this.pluginDriver, this.resolveId, skip, customOptions, typeof isEntry === 'boolean' ? isEntry : !importer, attributes, importerAttributes, this.options.fs), importer, source), attributes);
./node_modules/rollup/dist/es/shared/node-entry.js:22186:        const resolveIdResult = await resolveId(unresolvedId, importer, this.options.preserveSymlinks, this.pluginDriver, this.resolveId, null, EMPTY_OBJECT, true, EMPTY_OBJECT, importerAttributes, this.options.fs);
./node_modules/rollup/dist/es/shared/node-entry.js:23460:        preserveSymlinks: config.preserveSymlinks || false,
./node_modules/rollup/dist/es/shared/node-entry.js:24309:        preserveSymlinks: getOption('preserveSymlinks'),
./node_modules/rollup/dist/es/shared/watch.js:2672:	              `Circular symlink detected: "${full}" points to "${entryRealPath}"`
./node_modules/rollup/dist/es/shared/watch.js:7405:		exports.FSEVENT_TYPE_SYMLINK = 'symlink';
./node_modules/rollup/dist/es/shared/watch.js:7847:	 * Handle symlinks encountered while reading a dir.
./node_modules/rollup/dist/es/shared/watch.js:7854:	async _handleSymlink(entry, directory, path, item) {
./node_modules/rollup/dist/es/shared/watch.js:7861:	  if (!this.fsw.options.followSymlinks) {
./node_modules/rollup/dist/es/shared/watch.js:7862:	    // watch symlink directly (don't follow) and detect changes
./node_modules/rollup/dist/es/shared/watch.js:7875:	      if (this.fsw._symlinkPaths.get(full) !== linkPath) {
./node_modules/rollup/dist/es/shared/watch.js:7876:	        this.fsw._symlinkPaths.set(full, linkPath);
./node_modules/rollup/dist/es/shared/watch.js:7881:	      this.fsw._symlinkPaths.set(full, linkPath);
./node_modules/rollup/dist/es/shared/watch.js:7888:	  // don't follow the same symlink more than once
./node_modules/rollup/dist/es/shared/watch.js:7889:	  if (this.fsw._symlinkPaths.has(full)) {
./node_modules/rollup/dist/es/shared/watch.js:7893:	  this.fsw._symlinkPaths.set(full, true);
./node_modules/rollup/dist/es/shared/watch.js:7921:	    if (entry.stats.isSymbolicLink() && await this._handleSymlink(entry, directory, path, item)) {
./node_modules/rollup/dist/es/shared/watch.js:8001:	  if ((oDepth == null || depth <= oDepth) && !this.fsw._symlinkPaths.has(realpath)) {
./node_modules/rollup/dist/es/shared/watch.js:8051:	    const follow = this.fsw.options.followSymlinks && !path.includes(STAR) && !path.includes(BRACE_START);
./node_modules/rollup/dist/es/shared/watch.js:8059:	      // preserve this symlink's target path
./node_modules/rollup/dist/es/shared/watch.js:8061:	        this.fsw._symlinkPaths.set(absPath, targetPath);
./node_modules/rollup/dist/es/shared/watch.js:8072:	      // preserve this symlink's target path
./node_modules/rollup/dist/es/shared/watch.js:8074:	        this.fsw._symlinkPaths.set(sysPath.resolve(path), targetPath);
./node_modules/rollup/dist/es/shared/watch.js:8148:	  FSEVENT_TYPE_SYMLINK,
./node_modules/rollup/dist/es/shared/watch.js:8207:	 * @param {Path} realPath       - real path for symlinks
./node_modules/rollup/dist/es/shared/watch.js:8227:	  const hasSymlink = resolvedPath !== realPath;
./node_modules/rollup/dist/es/shared/watch.js:8230:	    if (hasSymlink) fullPath = fullPath.replace(realPath, resolvedPath);
./node_modules/rollup/dist/es/shared/watch.js:8315:	  info.type === FSEVENT_TYPE_SYMLINK && stats.isSymbolicLink() ||
./node_modules/rollup/dist/es/shared/watch.js:8381:	      if (info.type === FSEVENT_TYPE_SYMLINK && opts.followSymlinks) {
./node_modules/rollup/dist/es/shared/watch.js:8382:	        // push symlinks back to the top of the stack to get handled
./node_modules/rollup/dist/es/shared/watch.js:8389:	      // (other than symlinks being followed, which will be tracked soon)
./node_modules/rollup/dist/es/shared/watch.js:8402:	 * Handle symlinks encountered during directory scan
./node_modules/rollup/dist/es/shared/watch.js:8404:	 * @param {String} realPath   - real path (in case of symlinks)
./node_modules/rollup/dist/es/shared/watch.js:8470:	 * Handle symlinks encountered during directory scan
./node_modules/rollup/dist/es/shared/watch.js:8471:	 * @param {String} linkPath path to symlink
./node_modules/rollup/dist/es/shared/watch.js:8472:	 * @param {String} fullPath absolute path to the symlink
./node_modules/rollup/dist/es/shared/watch.js:8474:	 * @param {Number} curDepth level of subdirectories traversed to where symlink is
./node_modules/rollup/dist/es/shared/watch.js:8477:	async _handleFsEventsSymlink(linkPath, fullPath, transform, curDepth) {
./node_modules/rollup/dist/es/shared/watch.js:8478:	  // don't follow the same symlink more than once
./node_modules/rollup/dist/es/shared/watch.js:8479:	  if (this.fsw.closed || this.fsw._symlinkPaths.has(fullPath)) return;
./node_modules/rollup/dist/es/shared/watch.js:8481:	  this.fsw._symlinkPaths.set(fullPath, true);
./node_modules/rollup/dist/es/shared/watch.js:8589:	        if (wh.followSymlinks && entry.stats.isSymbolicLink()) {
./node_modules/rollup/dist/es/shared/watch.js:8591:	          // real paths past the symlink
./node_modules/rollup/dist/es/shared/watch.js:8595:	          this._handleFsEventsSymlink(joinedPath, fullPath, processPath, curDepth);
./node_modules/rollup/dist/es/shared/watch.js:8705:	 * @property {Boolean} followSymlinks
./node_modules/rollup/dist/es/shared/watch.js:8851:	    this.globSymlink = this.hasGlob && follow ? undefined : false;
./node_modules/rollup/dist/es/shared/watch.js:8857:	    this.followSymlinks = follow;
./node_modules/rollup/dist/es/shared/watch.js:8861:	  checkGlobSymlink(entry) {
./node_modules/rollup/dist/es/shared/watch.js:8864:	    if (this.globSymlink === undefined) {
./node_modules/rollup/dist/es/shared/watch.js:8865:	      this.globSymlink = entry.fullParentDir === this.fullWatchPath ?
./node_modules/rollup/dist/es/shared/watch.js:8869:	    if (this.globSymlink) {
./node_modules/rollup/dist/es/shared/watch.js:8870:	      return entry.fullPath.replace(this.globSymlink.realPath, this.globSymlink.linkPath);
./node_modules/rollup/dist/es/shared/watch.js:8878:	      sysPath.relative(this.watchPath, this.checkGlobSymlink(entry))
./node_modules/rollup/dist/es/shared/watch.js:8905:	      const entryParts = this.getDirParts(this.checkGlobSymlink(entry));
./node_modules/rollup/dist/es/shared/watch.js:8945:	  this._symlinkPaths = new Map();
./node_modules/rollup/dist/es/shared/watch.js:9000:	  if (undef(opts, 'followSymlinks')) opts.followSymlinks = true;
./node_modules/rollup/dist/es/shared/watch.js:9156:	  ['closers', 'watched', 'streams', 'symlinkPaths', 'throttled'].forEach(key => {
./node_modules/rollup/dist/es/shared/watch.js:9425:	 * Provides a set of common helpers and properties relating to symlink and glob handling.
./node_modules/rollup/dist/es/shared/watch.js:9432:	  const follow = this.options.followSymlinks;
./node_modules/rollup/dist/es/shared/watch.js:9511:	  // Fixes issue #1042 -> Relative paths were detected and added as symlinks
./node_modules/rollup/dist/es/shared/watch.js:9516:	  if (this._symlinkPaths.has(fullPath)) {
./node_modules/rollup/dist/es/shared/watch.js:9517:	    this._symlinkPaths.delete(fullPath);
./node_modules/rollup/dist/rollup.d.ts:727:	preserveSymlinks?: boolean | undefined;
./node_modules/rollup/dist/rollup.d.ts:755:	preserveSymlinks: boolean;
./node_modules/rollup/dist/rollup.d.ts:1046:	followSymlinks?: boolean | undefined;
./node_modules/rollup/dist/shared/index.js:2668:	              `Circular symlink detected: "${full}" points to "${entryRealPath}"`
./node_modules/rollup/dist/shared/index.js:7401:		exports.FSEVENT_TYPE_SYMLINK = 'symlink';
./node_modules/rollup/dist/shared/index.js:7843:	 * Handle symlinks encountered while reading a dir.
./node_modules/rollup/dist/shared/index.js:7850:	async _handleSymlink(entry, directory, path, item) {
./node_modules/rollup/dist/shared/index.js:7857:	  if (!this.fsw.options.followSymlinks) {
./node_modules/rollup/dist/shared/index.js:7858:	    // watch symlink directly (don't follow) and detect changes
./node_modules/rollup/dist/shared/index.js:7871:	      if (this.fsw._symlinkPaths.get(full) !== linkPath) {
./node_modules/rollup/dist/shared/index.js:7872:	        this.fsw._symlinkPaths.set(full, linkPath);
./node_modules/rollup/dist/shared/index.js:7877:	      this.fsw._symlinkPaths.set(full, linkPath);
./node_modules/rollup/dist/shared/index.js:7884:	  // don't follow the same symlink more than once
./node_modules/rollup/dist/shared/index.js:7885:	  if (this.fsw._symlinkPaths.has(full)) {
./node_modules/rollup/dist/shared/index.js:7889:	  this.fsw._symlinkPaths.set(full, true);
./node_modules/rollup/dist/shared/index.js:7917:	    if (entry.stats.isSymbolicLink() && await this._handleSymlink(entry, directory, path, item)) {
./node_modules/rollup/dist/shared/index.js:7997:	  if ((oDepth == null || depth <= oDepth) && !this.fsw._symlinkPaths.has(realpath)) {
./node_modules/rollup/dist/shared/index.js:8047:	    const follow = this.fsw.options.followSymlinks && !path.includes(STAR) && !path.includes(BRACE_START);
./node_modules/rollup/dist/shared/index.js:8055:	      // preserve this symlink's target path
./node_modules/rollup/dist/shared/index.js:8057:	        this.fsw._symlinkPaths.set(absPath, targetPath);
./node_modules/rollup/dist/shared/index.js:8068:	      // preserve this symlink's target path
./node_modules/rollup/dist/shared/index.js:8070:	        this.fsw._symlinkPaths.set(sysPath.resolve(path), targetPath);
./node_modules/rollup/dist/shared/index.js:8144:	  FSEVENT_TYPE_SYMLINK,
./node_modules/rollup/dist/shared/index.js:8203:	 * @param {Path} realPath       - real path for symlinks
./node_modules/rollup/dist/shared/index.js:8223:	  const hasSymlink = resolvedPath !== realPath;
./node_modules/rollup/dist/shared/index.js:8226:	    if (hasSymlink) fullPath = fullPath.replace(realPath, resolvedPath);
./node_modules/rollup/dist/shared/index.js:8311:	  info.type === FSEVENT_TYPE_SYMLINK && stats.isSymbolicLink() ||
./node_modules/rollup/dist/shared/index.js:8377:	      if (info.type === FSEVENT_TYPE_SYMLINK && opts.followSymlinks) {
./node_modules/rollup/dist/shared/index.js:8378:	        // push symlinks back to the top of the stack to get handled
./node_modules/rollup/dist/shared/index.js:8385:	      // (other than symlinks being followed, which will be tracked soon)
./node_modules/rollup/dist/shared/index.js:8398:	 * Handle symlinks encountered during directory scan
./node_modules/rollup/dist/shared/index.js:8400:	 * @param {String} realPath   - real path (in case of symlinks)
./node_modules/rollup/dist/shared/index.js:8466:	 * Handle symlinks encountered during directory scan
./node_modules/rollup/dist/shared/index.js:8467:	 * @param {String} linkPath path to symlink
./node_modules/rollup/dist/shared/index.js:8468:	 * @param {String} fullPath absolute path to the symlink
./node_modules/rollup/dist/shared/index.js:8470:	 * @param {Number} curDepth level of subdirectories traversed to where symlink is
./node_modules/rollup/dist/shared/index.js:8473:	async _handleFsEventsSymlink(linkPath, fullPath, transform, curDepth) {
./node_modules/rollup/dist/shared/index.js:8474:	  // don't follow the same symlink more than once
./node_modules/rollup/dist/shared/index.js:8475:	  if (this.fsw.closed || this.fsw._symlinkPaths.has(fullPath)) return;
./node_modules/rollup/dist/shared/index.js:8477:	  this.fsw._symlinkPaths.set(fullPath, true);
./node_modules/rollup/dist/shared/index.js:8585:	        if (wh.followSymlinks && entry.stats.isSymbolicLink()) {
./node_modules/rollup/dist/shared/index.js:8587:	          // real paths past the symlink
./node_modules/rollup/dist/shared/index.js:8591:	          this._handleFsEventsSymlink(joinedPath, fullPath, processPath, curDepth);
./node_modules/rollup/dist/shared/index.js:8701:	 * @property {Boolean} followSymlinks
./node_modules/rollup/dist/shared/index.js:8847:	    this.globSymlink = this.hasGlob && follow ? undefined : false;
./node_modules/rollup/dist/shared/index.js:8853:	    this.followSymlinks = follow;
./node_modules/rollup/dist/shared/index.js:8857:	  checkGlobSymlink(entry) {
./node_modules/rollup/dist/shared/index.js:8860:	    if (this.globSymlink === undefined) {
./node_modules/rollup/dist/shared/index.js:8861:	      this.globSymlink = entry.fullParentDir === this.fullWatchPath ?
./node_modules/rollup/dist/shared/index.js:8865:	    if (this.globSymlink) {
./node_modules/rollup/dist/shared/index.js:8866:	      return entry.fullPath.replace(this.globSymlink.realPath, this.globSymlink.linkPath);
./node_modules/rollup/dist/shared/index.js:8874:	      sysPath.relative(this.watchPath, this.checkGlobSymlink(entry))
./node_modules/rollup/dist/shared/index.js:8901:	      const entryParts = this.getDirParts(this.checkGlobSymlink(entry));
./node_modules/rollup/dist/shared/index.js:8941:	  this._symlinkPaths = new Map();
./node_modules/rollup/dist/shared/index.js:8996:	  if (undef(opts, 'followSymlinks')) opts.followSymlinks = true;
./node_modules/rollup/dist/shared/index.js:9152:	  ['closers', 'watched', 'streams', 'symlinkPaths', 'throttled'].forEach(key => {
./node_modules/rollup/dist/shared/index.js:9421:	 * Provides a set of common helpers and properties relating to symlink and glob handling.
./node_modules/rollup/dist/shared/index.js:9428:	  const follow = this.options.followSymlinks;
./node_modules/rollup/dist/shared/index.js:9507:	  // Fixes issue #1042 -> Relative paths were detected and added as symlinks
./node_modules/rollup/dist/shared/index.js:9512:	  if (this._symlinkPaths.has(fullPath)) {
./node_modules/rollup/dist/shared/index.js:9513:	    this._symlinkPaths.delete(fullPath);
./node_modules/rollup/dist/shared/rollup.js:3928:        preserveSymlinks: getOption('preserveSymlinks'),
./node_modules/rollup/dist/shared/rollup.js:22844:async function resolveId(source, importer, preserveSymlinks, pluginDriver, moduleLoaderResolveId, skip, customOptions, isEntry, attributes, importerAttributes, fs) {
./node_modules/rollup/dist/shared/rollup.js:22870:    return addJsExtensionIfNecessary(importer ? path.resolve(path.dirname(importer), source) : path.resolve(source), preserveSymlinks, fs);
./node_modules/rollup/dist/shared/rollup.js:22872:async function addJsExtensionIfNecessary(file, preserveSymlinks, fs) {
./node_modules/rollup/dist/shared/rollup.js:22873:    return ((await findFile(file, preserveSymlinks, fs)) ??
./node_modules/rollup/dist/shared/rollup.js:22874:        (await findFile(file + '.mjs', preserveSymlinks, fs)) ??
./node_modules/rollup/dist/shared/rollup.js:22875:        (await findFile(file + '.js', preserveSymlinks, fs)));
./node_modules/rollup/dist/shared/rollup.js:22877:async function findFile(file, preserveSymlinks, fs) {
./node_modules/rollup/dist/shared/rollup.js:22880:        if (!preserveSymlinks && stats.isSymbolicLink())
./node_modules/rollup/dist/shared/rollup.js:22881:            return await findFile(await fs.realpath(file), preserveSymlinks, fs);
./node_modules/rollup/dist/shared/rollup.js:22882:        if ((preserveSymlinks && stats.isSymbolicLink()) || stats.isFile()) {
./node_modules/rollup/dist/shared/rollup.js:23045:            : await resolveId(source, importer, this.options.preserveSymlinks, this.pluginDriver, this.resolveId, skip, customOptions, typeof isEntry === 'boolean' ? isEntry : !importer, attributes, importerAttributes, this.options.fs), importer, source), attributes);
./node_modules/rollup/dist/shared/rollup.js:23417:        const resolveIdResult = await resolveId(unresolvedId, importer, this.options.preserveSymlinks, this.pluginDriver, this.resolveId, null, parseAst_js.EMPTY_OBJECT, true, parseAst_js.EMPTY_OBJECT, importerAttributes, this.options.fs);
./node_modules/rollup/dist/shared/rollup.js:23797:        preserveSymlinks: config.preserveSymlinks || false,
./node_modules/@types/node/module.d.ts:587:             * symlinks resolved.
./node_modules/@types/node/module.d.ts:807:         * path with symlinks resolved.
./node_modules/@types/node/fs/promises.d.ts:791:    function symlink(target: PathLike, path: PathLike, type?: string | null): Promise<void>;
./node_modules/@types/node/fs.d.ts:1474:     * See the POSIX [`symlink(2)`](http://man7.org/linux/man-pages/man2/symlink.2.html) documentation for more details.
./node_modules/@types/node/fs.d.ts:1486:     * import { symlink } from 'node:fs';
./node_modules/@types/node/fs.d.ts:1488:     * symlink('./mew', './mewtwo', callback);
./node_modules/@types/node/fs.d.ts:1503:    export function symlink(
./node_modules/@types/node/fs.d.ts:1506:        type: symlink.Type | undefined | null,
./node_modules/@types/node/fs.d.ts:1510:     * Asynchronous symlink(2) - Create a new symbolic link to an existing file.
./node_modules/@types/node/fs.d.ts:1512:     * @param path A path to the new symlink. If a URL is provided, it must use the `file:` protocol.
./node_modules/@types/node/fs.d.ts:1514:    export function symlink(target: PathLike, path: PathLike, callback: NoParamCallback): void;
./node_modules/@types/node/fs.d.ts:1515:    export namespace symlink {
./node_modules/@types/node/fs.d.ts:1517:         * Asynchronous symlink(2) - Create a new symbolic link to an existing file.
./node_modules/@types/node/fs.d.ts:1519:         * @param path A path to the new symlink. If a URL is provided, it must use the `file:` protocol.
./node_modules/@types/node/fs.d.ts:1530:     * this API: {@link symlink}.
./node_modules/@types/node/fs.d.ts:1534:    export function symlinkSync(target: PathLike, path: PathLike, type?: symlink.Type | null): void;
./node_modules/@types/node/fs.d.ts:3864:        const O_SYMLINK: number;
./node_modules/@types/node/fs.d.ts:4529:         * Dereference symlinks
./node_modules/@types/node/fs.d.ts:4562:         * When true, path resolution for symlinks will be skipped
./node_modules/@types/node/fs.d.ts:4565:        verbatimSymlinks?: boolean | undefined;
./node_modules/esbuild/lib/main.js:683:  let preserveSymlinks = getFlag(options, keys, "preserveSymlinks", mustBeBoolean);
./node_modules/esbuild/lib/main.js:717:  if (preserveSymlinks) flags.push("--preserve-symlinks");
./node_modules/esbuild/lib/main.js:2004:other platform in your ".yarnrc.yml" file using the "supportedArchitectures"
./node_modules/esbuild/lib/main.js:2024:in your ".yarnrc.yml" file using the "supportedArchitectures" feature:
./node_modules/esbuild/lib/main.d.ts:118:  /** Documentation: https://esbuild.github.io/api/#preserve-symlinks */
./node_modules/esbuild/lib/main.d.ts:119:  preserveSymlinks?: boolean
./node_modules/vite/dist/node/chunks/config.js:1642:function resolvePackageData(pkgName, basedir, preserveSymlinks = false, packageCache) {
./node_modules/vite/dist/node/chunks/config.js:1644:		const cacheKey = getRpdCacheKey(pkgName, basedir, preserveSymlinks);
./node_modules/vite/dist/node/chunks/config.js:1659:			const cached = getRpdCache(packageCache, pkgName, basedir, originalBasedir, preserveSymlinks);
./node_modules/vite/dist/node/chunks/config.js:1665:				const pkgData = loadPackageData(preserveSymlinks ? pkg : safeRealpathSync(pkg));
./node_modules/vite/dist/node/chunks/config.js:1666:				if (packageCache) setRpdCache(packageCache, pkgData, pkgName, basedir, originalBasedir, preserveSymlinks);
./node_modules/vite/dist/node/chunks/config.js:1780:function getRpdCache(packageCache, pkgName, basedir, originalBasedir, preserveSymlinks) {
./node_modules/vite/dist/node/chunks/config.js:1781:	const cacheKey = getRpdCacheKey(pkgName, basedir, preserveSymlinks);
./node_modules/vite/dist/node/chunks/config.js:1785:			packageCache.set(getRpdCacheKey(pkgName, dir, preserveSymlinks), pkgData);
./node_modules/vite/dist/node/chunks/config.js:1790:function setRpdCache(packageCache, pkgData, pkgName, basedir, originalBasedir, preserveSymlinks) {
./node_modules/vite/dist/node/chunks/config.js:1791:	packageCache.set(getRpdCacheKey(pkgName, basedir, preserveSymlinks), pkgData);
./node_modules/vite/dist/node/chunks/config.js:1793:		packageCache.set(getRpdCacheKey(pkgName, dir, preserveSymlinks), pkgData);
./node_modules/vite/dist/node/chunks/config.js:1796:function getRpdCacheKey(pkgName, basedir, preserveSymlinks) {
./node_modules/vite/dist/node/chunks/config.js:1797:	return `rpd_${pkgName}_${basedir}_${preserveSymlinks}`;
./node_modules/vite/dist/node/chunks/config.js:2183:const ERR_SYMLINK_IN_RECURSIVE_READDIR = "ERR_SYMLINK_IN_RECURSIVE_READDIR";
./node_modules/vite/dist/node/chunks/config.js:2195:		err$2.code = ERR_SYMLINK_IN_RECURSIVE_READDIR;
./node_modules/vite/dist/node/chunks/config.js:2601:* symlinks.
./node_modules/vite/dist/node/chunks/config.js:7579://#region ../../node_modules/.pnpm/postcss-load-config@6.0.1_jiti@2.6.1_postcss@8.5.6_tsx@4.21.0_yaml@2.8.1/node_modules/postcss-load-config/src/req.js
./node_modules/vite/dist/node/chunks/config.js:7622://#region ../../node_modules/.pnpm/postcss-load-config@6.0.1_jiti@2.6.1_postcss@8.5.6_tsx@4.21.0_yaml@2.8.1/node_modules/postcss-load-config/src/options.js
./node_modules/vite/dist/node/chunks/config.js:7657://#region ../../node_modules/.pnpm/postcss-load-config@6.0.1_jiti@2.6.1_postcss@8.5.6_tsx@4.21.0_yaml@2.8.1/node_modules/postcss-load-config/src/plugins.js
./node_modules/vite/dist/node/chunks/config.js:7712://#region ../../node_modules/.pnpm/postcss-load-config@6.0.1_jiti@2.6.1_postcss@8.5.6_tsx@4.21.0_yaml@2.8.1/node_modules/postcss-load-config/src/index.js
./node_modules/vite/dist/node/chunks/config.js:7766:	let yaml;
./node_modules/vite/dist/node/chunks/config.js:7767:	async function yamlLoader(_, content) {
./node_modules/vite/dist/node/chunks/config.js:7768:		if (!yaml) try {
./node_modules/vite/dist/node/chunks/config.js:7769:			yaml = await import("yaml");
./node_modules/vite/dist/node/chunks/config.js:7772:			throw new Error(`'yaml' is required for the YAML configuration files. Make sure it is installed\nError: ${e$1.message}`);
./node_modules/vite/dist/node/chunks/config.js:7774:		return yaml.parse(content);
./node_modules/vite/dist/node/chunks/config.js:7789:				".yaml": yamlLoader,
./node_modules/vite/dist/node/chunks/config.js:7790:				".yml": yamlLoader
./node_modules/vite/dist/node/chunks/config.js:7797:				`.${moduleName}rc.yaml`,
./node_modules/vite/dist/node/chunks/config.js:7798:				`.${moduleName}rc.yml`,
./node_modules/vite/dist/node/chunks/config.js:8086:		if (e$1.code === ERR_SYMLINK_IN_RECURSIVE_READDIR) return;
./node_modules/vite/dist/node/chunks/config.js:8457:	"raml": "application/raml+yaml",
./node_modules/vite/dist/node/chunks/config.js:8607:	"yaml": "text/yaml",
./node_modules/vite/dist/node/chunks/config.js:8610:	"yml": "text/yaml",
./node_modules/vite/dist/node/chunks/config.js:11162:							const recursiveError = /* @__PURE__ */ new Error(`Circular symlink detected: "${full}" points to "${entryRealPath}"`);
./node_modules/vite/dist/node/chunks/config.js:12851:	exports.FSEVENT_TYPE_SYMLINK = "symlink";
./node_modules/vite/dist/node/chunks/config.js:13166:		* Handle symlinks encountered while reading a dir.
./node_modules/vite/dist/node/chunks/config.js:13173:		async _handleSymlink(entry, directory, path$13, item) {
./node_modules/vite/dist/node/chunks/config.js:13177:			if (!this.fsw.options.followSymlinks) {
./node_modules/vite/dist/node/chunks/config.js:13188:					if (this.fsw._symlinkPaths.get(full) !== linkPath) {
./node_modules/vite/dist/node/chunks/config.js:13189:						this.fsw._symlinkPaths.set(full, linkPath);
./node_modules/vite/dist/node/chunks/config.js:13194:					this.fsw._symlinkPaths.set(full, linkPath);
./node_modules/vite/dist/node/chunks/config.js:13200:			if (this.fsw._symlinkPaths.has(full)) return true;
./node_modules/vite/dist/node/chunks/config.js:13201:			this.fsw._symlinkPaths.set(full, true);
./node_modules/vite/dist/node/chunks/config.js:13223:				if (entry.stats.isSymbolicLink() && await this._handleSymlink(entry, directory, path$13, item)) return;
./node_modules/vite/dist/node/chunks/config.js:13272:			if ((oDepth == null || depth <= oDepth) && !this.fsw._symlinkPaths.has(realpath$2)) {
./node_modules/vite/dist/node/chunks/config.js:13314:				const follow = this.fsw.options.followSymlinks && !path$13.includes(STAR) && !path$13.includes(BRACE_START$1);
./node_modules/vite/dist/node/chunks/config.js:13322:					if (absPath !== targetPath && targetPath !== void 0) this.fsw._symlinkPaths.set(absPath, targetPath);
./node_modules/vite/dist/node/chunks/config.js:13331:					if (targetPath !== void 0) this.fsw._symlinkPaths.set(sysPath$2.resolve(path$13), targetPath);
./node_modules/vite/dist/node/chunks/config.js:13365:	const { EV_ADD: EV_ADD$1, EV_CHANGE: EV_CHANGE$1, EV_ADD_DIR: EV_ADD_DIR$1, EV_UNLINK: EV_UNLINK$1, EV_ERROR: EV_ERROR$1, STR_DATA, STR_END: STR_END$1, FSEVENT_CREATED, FSEVENT_MODIFIED, FSEVENT_DELETED, FSEVENT_MOVED, FSEVENT_UNKNOWN, FSEVENT_FLAG_MUST_SCAN_SUBDIRS, FSEVENT_TYPE_FILE, FSEVENT_TYPE_DIRECTORY, FSEVENT_TYPE_SYMLINK, ROOT_GLOBSTAR, DIR_SUFFIX, DOT_SLASH, FUNCTION_TYPE: FUNCTION_TYPE$1, EMPTY_FN: EMPTY_FN$1, IDENTITY_FN } = require_constants$1();
./node_modules/vite/dist/node/chunks/config.js:13412:	* @param {Path} realPath       - real path for symlinks
./node_modules/vite/dist/node/chunks/config.js:13423:		const hasSymlink = resolvedPath !== realPath;
./node_modules/vite/dist/node/chunks/config.js:13425:			if (hasSymlink) fullPath = fullPath.replace(realPath, resolvedPath);
./node_modules/vite/dist/node/chunks/config.js:13478:	const sameTypes = (info, stats) => info.type === FSEVENT_TYPE_DIRECTORY && stats.isDirectory() || info.type === FSEVENT_TYPE_SYMLINK && stats.isSymbolicLink() || info.type === FSEVENT_TYPE_FILE && stats.isFile();
./node_modules/vite/dist/node/chunks/config.js:13522:					if (info.type === FSEVENT_TYPE_SYMLINK && opts.followSymlinks) {
./node_modules/vite/dist/node/chunks/config.js:13537:		* Handle symlinks encountered during directory scan
./node_modules/vite/dist/node/chunks/config.js:13539:		* @param {String} realPath   - real path (in case of symlinks)
./node_modules/vite/dist/node/chunks/config.js:13577:		* Handle symlinks encountered during directory scan
./node_modules/vite/dist/node/chunks/config.js:13578:		* @param {String} linkPath path to symlink
./node_modules/vite/dist/node/chunks/config.js:13579:		* @param {String} fullPath absolute path to the symlink
./node_modules/vite/dist/node/chunks/config.js:13581:		* @param {Number} curDepth level of subdirectories traversed to where symlink is
./node_modules/vite/dist/node/chunks/config.js:13584:		async _handleFsEventsSymlink(linkPath, fullPath, transform$2, curDepth) {
./node_modules/vite/dist/node/chunks/config.js:13585:			if (this.fsw.closed || this.fsw._symlinkPaths.has(fullPath)) return;
./node_modules/vite/dist/node/chunks/config.js:13586:			this.fsw._symlinkPaths.set(fullPath, true);
./node_modules/vite/dist/node/chunks/config.js:13652:						if (wh.followSymlinks && entry.stats.isSymbolicLink()) {
./node_modules/vite/dist/node/chunks/config.js:13654:							this._handleFsEventsSymlink(joinedPath, fullPath, processPath, curDepth);
./node_modules/vite/dist/node/chunks/config.js:13709:	* @property {Boolean} followSymlinks
./node_modules/vite/dist/node/chunks/config.js:13819:			this.globSymlink = this.hasGlob && follow ? void 0 : false;
./node_modules/vite/dist/node/chunks/config.js:13825:			this.followSymlinks = follow;
./node_modules/vite/dist/node/chunks/config.js:13828:		checkGlobSymlink(entry) {
./node_modules/vite/dist/node/chunks/config.js:13829:			if (this.globSymlink === void 0) this.globSymlink = entry.fullParentDir === this.fullWatchPath ? false : {
./node_modules/vite/dist/node/chunks/config.js:13833:			if (this.globSymlink) return entry.fullPath.replace(this.globSymlink.realPath, this.globSymlink.linkPath);
./node_modules/vite/dist/node/chunks/config.js:13837:			return sysPath.join(this.watchPath, sysPath.relative(this.watchPath, this.checkGlobSymlink(entry)));
./node_modules/vite/dist/node/chunks/config.js:13855:				const entryParts = this.getDirParts(this.checkGlobSymlink(entry));
./node_modules/vite/dist/node/chunks/config.js:13889:			this._symlinkPaths = /* @__PURE__ */ new Map();
./node_modules/vite/dist/node/chunks/config.js:13914:			if (undef(opts, "followSymlinks")) opts.followSymlinks = true;
./node_modules/vite/dist/node/chunks/config.js:14029:				"symlinkPaths",
./node_modules/vite/dist/node/chunks/config.js:14237:		* Provides a set of common helpers and properties relating to symlink and glob handling.
./node_modules/vite/dist/node/chunks/config.js:14244:			const follow = this.options.followSymlinks;
./node_modules/vite/dist/node/chunks/config.js:14288:			if (this._symlinkPaths.has(fullPath)) this._symlinkPaths.delete(fullPath);
./node_modules/vite/dist/node/chunks/config.js:25356:const ROOT_FILES = ["pnpm-workspace.yaml", "lerna.json"];
./node_modules/vite/dist/node/chunks/config.js:27003:					const optimizedId = await tryOptimizedResolve(depsOptimizer, id, importer, config$2.resolve.preserveSymlinks, config$2.packageCache);
./node_modules/vite/dist/node/chunks/config.js:31814:		const basedir = nestedResolveBasedir(nestedRoot, topLevelConfig.root, topLevelConfig.resolve.preserveSymlinks);
./node_modules/vite/dist/node/chunks/config.js:31824:	const pkgData = resolvePackageData(pkgName, config$2.root, config$2.resolve.preserveSymlinks, config$2.packageCache);
./node_modules/vite/dist/node/chunks/config.js:31879:function nestedResolveBasedir(id, basedir, preserveSymlinks = false) {
./node_modules/vite/dist/node/chunks/config.js:31881:	for (const pkg of pkgs) basedir = resolvePackageData(pkg, basedir, preserveSymlinks)?.dir || basedir;
./node_modules/vite/dist/node/chunks/config.js:32386:		path: "node_modules/.yarn-state.yml",
./node_modules/vite/dist/node/chunks/config.js:32406:		path: "node_modules/.pnpm/lock.yaml",
./node_modules/vite/dist/node/chunks/config.js:32633:					if (!external && asSrc && depsOptimizer && !options$1.scan && (res = await tryOptimizedResolve(depsOptimizer, id, importer, options$1.preserveSymlinks, options$1.packageCache))) return res;
./node_modules/vite/dist/node/chunks/config.js:32730:	const { tryPrefix, extensions: extensions$1, preserveSymlinks } = options$1;
./node_modules/vite/dist/node/chunks/config.js:32731:	const fileResult = tryResolveRealFileOrType(file, options$1.preserveSymlinks);
./node_modules/vite/dist/node/chunks/config.js:32741:				if (res = tryResolveRealFile(fileName + fileExt.replace("js", "ts"), preserveSymlinks)) return res;
./node_modules/vite/dist/node/chunks/config.js:32742:				if (fileExt === ".js" && (res = tryResolveRealFile(fileName + ".tsx", preserveSymlinks))) return res;
./node_modules/vite/dist/node/chunks/config.js:32744:			if (res = tryResolveRealFileWithExtensions(file, extensions$1, preserveSymlinks)) return res;
./node_modules/vite/dist/node/chunks/config.js:32747:				if (res = tryResolveRealFile(prefixed, preserveSymlinks)) return res;
./node_modules/vite/dist/node/chunks/config.js:32748:				if (res = tryResolveRealFileWithExtensions(prefixed, extensions$1, preserveSymlinks)) return res;
./node_modules/vite/dist/node/chunks/config.js:32758:					if (!options$1.preserveSymlinks) pkgPath = safeRealpathSync(pkgPath);
./node_modules/vite/dist/node/chunks/config.js:32765:		if (res = tryResolveRealFileWithExtensions(`${dirPath}/index`, extensions$1, preserveSymlinks)) return res;
./node_modules/vite/dist/node/chunks/config.js:32767:			if (res = tryResolveRealFileWithExtensions(`${dirPath}/${options$1.tryPrefix}index`, extensions$1, preserveSymlinks)) return res;
./node_modules/vite/dist/node/chunks/config.js:32772:	const { root, dedupe, isBuild, preserveSymlinks, packageCache } = options$1;
./node_modules/vite/dist/node/chunks/config.js:32785:	const pkg = selfPkg || resolvePackageData(pkgId, basedir, preserveSymlinks, packageCache);
./node_modules/vite/dist/node/chunks/config.js:32831:async function tryOptimizedResolve(depsOptimizer, id, importer, preserveSymlinks, packageCache) {
./node_modules/vite/dist/node/chunks/config.js:32845:			idPkgDir = resolvePackageData(pkgName, importer, preserveSymlinks, packageCache)?.dir;
./node_modules/vite/dist/node/chunks/config.js:32995:function tryResolveRealFile(file, preserveSymlinks) {
./node_modules/vite/dist/node/chunks/config.js:32996:	if (tryStatSync(file)?.isFile()) return getRealPath(file, preserveSymlinks);
./node_modules/vite/dist/node/chunks/config.js:32998:function tryResolveRealFileWithExtensions(filePath, extensions$1, preserveSymlinks) {
./node_modules/vite/dist/node/chunks/config.js:33000:		const res = tryResolveRealFile(filePath + ext, preserveSymlinks);
./node_modules/vite/dist/node/chunks/config.js:33004:function tryResolveRealFileOrType(file, preserveSymlinks) {
./node_modules/vite/dist/node/chunks/config.js:33007:		path: getRealPath(file, preserveSymlinks),
./node_modules/vite/dist/node/chunks/config.js:33012:function getRealPath(resolved, preserveSymlinks) {
./node_modules/vite/dist/node/chunks/config.js:33013:	if (!preserveSymlinks) resolved = safeRealpathSync(resolved);
./node_modules/vite/dist/node/chunks/config.js:33039:		preserveSymlinks: false,
./node_modules/vite/dist/node/chunks/config.js:34039:		const { externalConditions, dedupe, preserveSymlinks } = environment.config.resolve;
./node_modules/vite/dist/node/chunks/config.js:34052:			preserveSymlinks,
./node_modules/vite/dist/node/chunks/config.js:35251:function resolveSSROptions(ssr, preserveSymlinks) {
./node_modules/vite/dist/node/chunks/config.js:35252:	return mergeWithDefaults(mergeWithDefaults(_ssrConfigDefaults, { optimizeDeps: { esbuildOptions: { preserveSymlinks } } }), ssr ?? {});
./node_modules/vite/dist/node/chunks/config.js:35328:		preserveSymlinks: false,
./node_modules/vite/dist/node/chunks/config.js:35396:function resolveEnvironmentOptions(options$1, alias$2, preserveSymlinks, forceOptimizeDeps, logger, environmentName, isSsrTargetWebworkerSet, preTransformRequests) {
./node_modules/vite/dist/node/chunks/config.js:35406:	const resolve$4 = resolveEnvironmentResolveOptions(options$1.resolve, alias$2, preserveSymlinks, logger, consumer, isSsrTargetWebworkerEnvironment);
./node_modules/vite/dist/node/chunks/config.js:35412:		optimizeDeps: resolveDepOptimizationOptions(options$1.optimizeDeps, resolve$4.preserveSymlinks, forceOptimizeDeps, consumer),
./node_modules/vite/dist/node/chunks/config.js:35452:* alias and preserveSymlinks are not per-environment options, but they are
./node_modules/vite/dist/node/chunks/config.js:35455:function resolveEnvironmentResolveOptions(resolve$4, alias$2, preserveSymlinks, logger, consumer, isSsrTargetWebworkerEnvironment) {
./node_modules/vite/dist/node/chunks/config.js:35462:	resolvedResolve.preserveSymlinks = preserveSymlinks;
./node_modules/vite/dist/node/chunks/config.js:35469:	const preserveSymlinks = resolve$4?.preserveSymlinks ?? configDefaults.resolve.preserveSymlinks;
./node_modules/vite/dist/node/chunks/config.js:35471:	return resolveEnvironmentResolveOptions(resolve$4, alias$2, preserveSymlinks, logger, void 0);
./node_modules/vite/dist/node/chunks/config.js:35473:function resolveDepOptimizationOptions(optimizeDeps$1, preserveSymlinks, forceOptimizeDeps, consumer) {
./node_modules/vite/dist/node/chunks/config.js:35478:		esbuildOptions: { preserveSymlinks },
./node_modules/vite/dist/node/chunks/config.js:35593:	for (const environmentName of Object.keys(config$2.environments)) resolvedEnvironments[environmentName] = resolveEnvironmentOptions(config$2.environments[environmentName], resolvedDefaultResolve.alias, resolvedDefaultResolve.preserveSymlinks, inlineConfig.forceOptimizeDeps, logger, environmentName, config$2.ssr?.target === "webworker", config$2.server?.preTransformRequests);
./node_modules/vite/dist/node/chunks/config.js:35607:	}, resolvedDefaultResolve.preserveSymlinks);
./node_modules/vite/dist/node/index.d.ts:158:   * When `false`, only the symlinks themselves will be watched for changes instead of following
./node_modules/vite/dist/node/index.d.ts:161:  followSymlinks?: boolean;
./node_modules/vite/dist/node/index.d.ts:1867:  preserveSymlinks?: boolean;
./node_modules/typescript/lib/typescript.js:460:  createSymlinkCache: () => createSymlinkCache,
./node_modules/typescript/lib/typescript.js:10410:  Do_not_resolve_the_real_path_of_symlinks: diag(6013, 3 /* Message */, "Do_not_resolve_the_real_path_of_symlinks_6013", "Do not resolve the real path of symlinks."),
./node_modules/typescript/lib/typescript.js:10878:  Disable_resolving_symlinks_to_their_realpath_This_correlates_to_the_same_flag_in_node: diag(6683, 3 /* Message */, "Disable_resolving_symlinks_to_their_realpath_This_correlates_to_the_same_flag_in_node_6683", "Disable resolving symlinks to their realpath. This correlates to the same flag in node."),
./node_modules/typescript/lib/typescript.js:22227:function createSymlinkCache(cwd, getCanonicalFileName) {
./node_modules/typescript/lib/typescript.js:22228:  let symlinkedDirectories;
./node_modules/typescript/lib/typescript.js:22229:  let symlinkedDirectoriesByRealpath;
./node_modules/typescript/lib/typescript.js:22230:  let symlinkedFiles;
./node_modules/typescript/lib/typescript.js:22233:    getSymlinkedFiles: () => symlinkedFiles,
./node_modules/typescript/lib/typescript.js:22234:    getSymlinkedDirectories: () => symlinkedDirectories,
./node_modules/typescript/lib/typescript.js:22235:    getSymlinkedDirectoriesByRealpath: () => symlinkedDirectoriesByRealpath,
./node_modules/typescript/lib/typescript.js:22236:    setSymlinkedFile: (path, real) => (symlinkedFiles || (symlinkedFiles = /* @__PURE__ */ new Map())).set(path, real),
./node_modules/typescript/lib/typescript.js:22237:    setSymlinkedDirectory: (symlink, real) => {
./node_modules/typescript/lib/typescript.js:22238:      let symlinkPath = toPath(symlink, cwd, getCanonicalFileName);
./node_modules/typescript/lib/typescript.js:22239:      if (!containsIgnoredPath(symlinkPath)) {
./node_modules/typescript/lib/typescript.js:22240:        symlinkPath = ensureTrailingDirectorySeparator(symlinkPath);
./node_modules/typescript/lib/typescript.js:22241:        if (real !== false && !(symlinkedDirectories == null ? void 0 : symlinkedDirectories.has(symlinkPath))) {
./node_modules/typescript/lib/typescript.js:22242:          (symlinkedDirectoriesByRealpath || (symlinkedDirectoriesByRealpath = createMultiMap())).add(real.realPath, symlink);
./node_modules/typescript/lib/typescript.js:22244:        (symlinkedDirectories || (symlinkedDirectories = /* @__PURE__ */ new Map())).set(symlinkPath, real);
./node_modules/typescript/lib/typescript.js:22247:    setSymlinksFromResolutions(forEachResolvedModule, forEachResolvedTypeReferenceDirective, typeReferenceDirectives) {
./node_modules/typescript/lib/typescript.js:22255:    setSymlinksFromResolution(resolution) {
./node_modules/typescript/lib/typescript.js:22258:    hasAnySymlinks
./node_modules/typescript/lib/typescript.js:22260:  function hasAnySymlinks() {
./node_modules/typescript/lib/typescript.js:22261:    return !!(symlinkedFiles == null ? void 0 : symlinkedFiles.size) || !!symlinkedDirectories && !!forEachEntry(symlinkedDirectories, (value) => !!value);
./node_modules/typescript/lib/typescript.js:22266:    cache.setSymlinkedFile(toPath(originalPath, cwd, getCanonicalFileName), resolvedFileName);
./node_modules/typescript/lib/typescript.js:22267:    const [commonResolved, commonOriginal] = guessDirectorySymlink(resolvedFileName, originalPath, cwd, getCanonicalFileName) || emptyArray;
./node_modules/typescript/lib/typescript.js:22269:      cache.setSymlinkedDirectory(
./node_modules/typescript/lib/typescript.js:22279:function guessDirectorySymlink(a, b, cwd, getCanonicalFileName) {
./node_modules/typescript/lib/typescript.js:41588:    name: "preserveSymlinks",
./node_modules/typescript/lib/typescript.js:41591:    description: Diagnostics.Disable_resolving_symlinks_to_their_realpath_This_correlates_to_the_same_flag_in_node,
./node_modules/typescript/lib/typescript.js:44097:function createResolvedModuleWithFailedLookupLocationsHandlingSymlink(moduleName, resolved, isExternalLibraryImport, failedLookupLocations, affectingLocations, diagnostics, state, cache, alternateResult) {
./node_modules/typescript/lib/typescript.js:44098:  if (!state.resultFromCache && !state.compilerOptions.preserveSymlinks && resolved && isExternalLibraryImport && !resolved.originalPath && !isExternalModuleNameRelative(moduleName)) {
./node_modules/typescript/lib/typescript.js:44364:    if (!options.preserveSymlinks) ({ resolvedFileName, originalPath } = getOriginalAndResolvedFileName(fileName, host, traceEnabled));
./node_modules/typescript/lib/typescript.js:45276:  return createResolvedModuleWithFailedLookupLocationsHandlingSymlink(
./node_modules/typescript/lib/typescript.js:46513:  return createResolvedModuleWithFailedLookupLocationsHandlingSymlink(
./node_modules/typescript/lib/typescript.js:50207:function forEachFileNameOfModule(importingFileName, importedFileName, host, preferSymlinks, cb) {
./node_modules/typescript/lib/typescript.js:50217:  if (!preferSymlinks) {
./node_modules/typescript/lib/typescript.js:50221:  const symlinkedDirectories = (_b = host.getSymlinkCache) == null ? void 0 : _b.call(host).getSymlinkedDirectoriesByRealpath();
./node_modules/typescript/lib/typescript.js:50223:  const result = symlinkedDirectories && forEachAncestorDirectoryStoppingAtGlobalCache(
./node_modules/typescript/lib/typescript.js:50227:      const symlinkDirectories = symlinkedDirectories.get(ensureTrailingDirectorySeparator(toPath(realPathDirectory, cwd, getCanonicalFileName)));
./node_modules/typescript/lib/typescript.js:50228:      if (!symlinkDirectories) return void 0;
./node_modules/typescript/lib/typescript.js:50237:        for (const symlinkDirectory of symlinkDirectories) {
./node_modules/typescript/lib/typescript.js:50238:          const option = resolvePath(symlinkDirectory, relative);
./node_modules/typescript/lib/typescript.js:50246:  return result || (preferSymlinks ? forEach(targets, (p) => shouldFilterIgnoredPaths && containsIgnoredPath(p) ? void 0 : cb(p, p === referenceRedirect)) : void 0);
./node_modules/typescript/lib/typescript.js:50277:  const links = (_b = host.getSymlinkCache) == null ? void 0 : _b.call(host);
./node_modules/typescript/lib/typescript.js:50295:        links.setSymlinksFromResolution(resolved.resolvedModule);
./node_modules/typescript/lib/typescript.js:50305:    /*preferSymlinks*/
./node_modules/typescript/lib/typescript.js:94961:    getSymlinkCache: maybeBind(host, host.getSymlinkCache),
./node_modules/typescript/lib/typescript.js:125792:    let rootSymLinkResult;
./node_modules/typescript/lib/typescript.js:125806:      if (rootSymLinkResult && path === rootDirPath) return rootSymLinkResult;
./node_modules/typescript/lib/typescript.js:125819:      if (path === rootDirPath) rootSymLinkResult = result;
./node_modules/typescript/lib/typescript.js:126947:  let symlinks;
./node_modules/typescript/lib/typescript.js:127074:    getSymlinkCache,
./node_modules/typescript/lib/typescript.js:127302:    getSymlinkCache,
./node_modules/typescript/lib/typescript.js:127426:    if (!host.realpath || !options.preserveSymlinks || !file.originalFileName.includes(nodeModulesPathPart)) return void 0;
./node_modules/typescript/lib/typescript.js:127802:      getSymlinkCache,
./node_modules/typescript/lib/typescript.js:128607:      if (!source && host.realpath && options.preserveSymlinks && isDeclarationFileName(fileName) && fileName.includes(nodeModulesPathPart)) {
./node_modules/typescript/lib/typescript.js:129674:  function getSymlinkCache() {
./node_modules/typescript/lib/typescript.js:129675:    if (host.getSymlinkCache) {
./node_modules/typescript/lib/typescript.js:129676:      return host.getSymlinkCache();
./node_modules/typescript/lib/typescript.js:129678:    if (!symlinks) {
./node_modules/typescript/lib/typescript.js:129679:      symlinks = createSymlinkCache(currentDirectory, getCanonicalFileName);
./node_modules/typescript/lib/typescript.js:129681:    if (files && !symlinks.hasProcessedResolutions()) {
./node_modules/typescript/lib/typescript.js:129682:      symlinks.setSymlinksFromResolutions(forEachResolvedModule, forEachResolvedTypeReferenceDirective, automaticTypeDirectiveResolutions);
./node_modules/typescript/lib/typescript.js:129684:    return symlinks;
./node_modules/typescript/lib/typescript.js:129750:        handleDirectoryCouldBeSymlink(path);
./node_modules/typescript/lib/typescript.js:129781:      return ((_a = host.getSymlinkCache().getSymlinkedFiles()) == null ? void 0 : _a.get(host.toPath(s))) || originalRealpath.call(host.compilerHost, s);
./node_modules/typescript/lib/typescript.js:129814:  function handleDirectoryCouldBeSymlink(directory) {
./node_modules/typescript/lib/typescript.js:129818:    const symlinkCache = host.getSymlinkCache();
./node_modules/typescript/lib/typescript.js:129820:    if ((_a = symlinkCache.getSymlinkedDirectories()) == null ? void 0 : _a.has(directoryPath)) return;
./node_modules/typescript/lib/typescript.js:129824:      symlinkCache.setSymlinkedDirectory(directoryPath, false);
./node_modules/typescript/lib/typescript.js:129827:    symlinkCache.setSymlinkedDirectory(directory, {
./node_modules/typescript/lib/typescript.js:129837:    const symlinkCache = host.getSymlinkCache();
./node_modules/typescript/lib/typescript.js:129838:    const symlinkedDirectories = symlinkCache.getSymlinkedDirectories();
./node_modules/typescript/lib/typescript.js:129839:    if (!symlinkedDirectories) return false;
./node_modules/typescript/lib/typescript.js:129842:    if (isFile && ((_a = symlinkCache.getSymlinkedFiles()) == null ? void 0 : _a.has(fileOrDirectoryPath))) return true;
./node_modules/typescript/lib/typescript.js:129844:      symlinkedDirectories.entries(),
./node_modules/typescript/lib/typescript.js:129845:      ([directoryPath, symlinkedDirectory]) => {
./node_modules/typescript/lib/typescript.js:129846:        if (!symlinkedDirectory || !startsWith(fileOrDirectoryPath, directoryPath)) return void 0;
./node_modules/typescript/lib/typescript.js:129847:        const result2 = fileOrDirectoryExistsUsingSource2(fileOrDirectoryPath.replace(directoryPath, symlinkedDirectory.realPath));
./node_modules/typescript/lib/typescript.js:129850:          symlinkCache.setSymlinkedFile(
./node_modules/typescript/lib/typescript.js:129852:            `${symlinkedDirectory.real}${absolutePath.replace(new RegExp(directoryPath, "i"), "")}`
./node_modules/typescript/lib/typescript.js:132466:  const isSymlinkCache = /* @__PURE__ */ new Map();
./node_modules/typescript/lib/typescript.js:132468:  const dirPathToSymlinkPackageRefCount = /* @__PURE__ */ new Map();
./node_modules/typescript/lib/typescript.js:132481:    dirPathToSymlinkPackageRefCount,
./node_modules/typescript/lib/typescript.js:132510:    isSymlinkCache.clear();
./node_modules/typescript/lib/typescript.js:132512:    dirPathToSymlinkPackageRefCount.clear();
./node_modules/typescript/lib/typescript.js:132578:    isSymlinkCache.clear();
./node_modules/typescript/lib/typescript.js:132634:    isSymlinkCache.clear();
./node_modules/typescript/lib/typescript.js:132649:    if (watcher.files === 0 && watcher.resolutions === 0 && !((_a = watcher.symlinks) == null ? void 0 : _a.size)) {
./node_modules/typescript/lib/typescript.js:132685:        if (resolutionHost.onDiscoveredSymlink && resolutionIsSymlink(resolution)) {
./node_modules/typescript/lib/typescript.js:132686:          resolutionHost.onDiscoveredSymlink();
./node_modules/typescript/lib/typescript.js:132943:    let isSymlink = false;
./node_modules/typescript/lib/typescript.js:132944:    let symlinkWatcher;
./node_modules/typescript/lib/typescript.js:132948:        isSymlink = true;
./node_modules/typescript/lib/typescript.js:132949:        symlinkWatcher = fileWatchesOfAffectingLocations.get(locationToWatch);
./node_modules/typescript/lib/typescript.js:132954:    if (!isSymlink || !symlinkWatcher) {
./node_modules/typescript/lib/typescript.js:132961:        resolutions: isSymlink ? 0 : resolutions,
./node_modules/typescript/lib/typescript.js:132962:        files: isSymlink ? 0 : files,
./node_modules/typescript/lib/typescript.js:132963:        symlinks: void 0
./node_modules/typescript/lib/typescript.js:132966:      if (isSymlink) symlinkWatcher = watcher;
./node_modules/typescript/lib/typescript.js:132968:    if (isSymlink) {
./node_modules/typescript/lib/typescript.js:132969:      Debug.assert(!!symlinkWatcher);
./node_modules/typescript/lib/typescript.js:132974:            const symlinkWatcher2 = fileWatchesOfAffectingLocations.get(locationToWatch);
./node_modules/typescript/lib/typescript.js:132975:            if (((_a = symlinkWatcher2 == null ? void 0 : symlinkWatcher2.symlinks) == null ? void 0 : _a.delete(affectingLocation)) && !symlinkWatcher2.symlinks.size && !symlinkWatcher2.resolutions && !symlinkWatcher2.files) {
./node_modules/typescript/lib/typescript.js:132977:              symlinkWatcher2.watcher.close();
./node_modules/typescript/lib/typescript.js:132983:        symlinks: void 0
./node_modules/typescript/lib/typescript.js:132986:      (symlinkWatcher.symlinks ?? (symlinkWatcher.symlinks = /* @__PURE__ */ new Set())).add(affectingLocation);
./node_modules/typescript/lib/typescript.js:132994:    (_a = watcher == null ? void 0 : watcher.symlinks) == null ? void 0 : _a.forEach((path2) => invalidateAffectingFileWatcher(path2, packageJsonMap));
./node_modules/typescript/lib/typescript.js:133003:    let isSymlink = isSymlinkCache.get(packageDirPath);
./node_modules/typescript/lib/typescript.js:133005:    if (isSymlink === void 0) {
./node_modules/typescript/lib/typescript.js:133007:      isSymlink = realPath2 !== packageDir && resolutionHost.toPath(realPath2) !== packageDirPath;
./node_modules/typescript/lib/typescript.js:133008:      isSymlinkCache.set(packageDirPath, isSymlink);
./node_modules/typescript/lib/typescript.js:133014:            isSymlink
./node_modules/typescript/lib/typescript.js:133017:      } else if (packageDirWatcher.isSymlink !== isSymlink) {
./node_modules/typescript/lib/typescript.js:133019:          removeDirectoryWatcher(packageDirWatcher.isSymlink ? packageDirPath : dirPath);
./node_modules/typescript/lib/typescript.js:133022:        packageDirWatcher.isSymlink = isSymlink;
./node_modules/typescript/lib/typescript.js:133026:      Debug.assert(isSymlink === packageDirWatcher.isSymlink);
./node_modules/typescript/lib/typescript.js:133036:      if (isSymlink) dirPathToSymlinkPackageRefCount.set(dirPath, (dirPathToSymlinkPackageRefCount.get(dirPath) ?? 0) + 1);
./node_modules/typescript/lib/typescript.js:133039:      return isSymlink ? createOrAddRefToDirectoryWatchOfFailedLookups(packageDir, packageDirPath, nonRecursive) : createOrAddRefToDirectoryWatchOfFailedLookups(dir, dirPath, nonRecursive);
./node_modules/typescript/lib/typescript.js:133080:          removeDirectoryWatcher(packageDirWatcher.isSymlink ? packageDirPath : dirPath);
./node_modules/typescript/lib/typescript.js:133082:          if (packageDirWatcher.isSymlink) {
./node_modules/typescript/lib/typescript.js:133083:            const refCount = dirPathToSymlinkPackageRefCount.get(dirPath) - 1;
./node_modules/typescript/lib/typescript.js:133085:              dirPathToSymlinkPackageRefCount.delete(dirPath);
./node_modules/typescript/lib/typescript.js:133087:              dirPathToSymlinkPackageRefCount.set(dirPath, refCount);
./node_modules/typescript/lib/typescript.js:133296:        (dirPath2) => directoryWatchesOfFailedLookups.has(dirPath2) || dirPathToSymlinkPackageRefCount.has(dirPath2)
./node_modules/typescript/lib/typescript.js:133328:function resolutionIsSymlink(resolution) {
./node_modules/typescript/lib/typescript.js:140816:    getSymlinkCache: maybeBind(host, host.getSymlinkCache) || program.getSymlinkCache,
./node_modules/typescript/lib/typescript.js:142338:    /*preferSymlinks*/
./node_modules/typescript/lib/typescript.js:142432:  const realpathsWithSymlinks = (_a = host.getSymlinkCache) == null ? void 0 : _a.call(host).getSymlinkedDirectoriesByRealpath();
./node_modules/typescript/lib/typescript.js:142435:    if ((realpathsWithSymlinks == null ? void 0 : realpathsWithSymlinks.size) && pathContainsNodeModules(fileName)) {
./node_modules/typescript/lib/typescript.js:142441:          const symlinks = realpathsWithSymlinks.get(ensureTrailingDirectorySeparator(dirPath));
./node_modules/typescript/lib/typescript.js:142442:          if (symlinks) {
./node_modules/typescript/lib/typescript.js:142443:            return symlinks.some((s) => excludePatterns.some((p) => p.test(fileName.replace(dir, s))));
./node_modules/typescript/lib/typescript.js:152799:      getSymlinkCache: maybeBind(host, host.getSymlinkCache),
./node_modules/typescript/lib/typescript.js:169390:    return ((_a = program.getSymlinkCache) == null ? void 0 : _a.call(program).hasAnySymlinks()) || !!program.getCompilerOptions().paths || programContainsModules(program);
./node_modules/typescript/lib/typescript.js:183690:  createSymlinkCache: () => createSymlinkCache,
./node_modules/typescript/lib/typescript.js:186793:  isSymlink() {
./node_modules/typescript/lib/typescript.js:186806:      if (!project.getCompilerOptions().preserveSymlinks) {
./node_modules/typescript/lib/typescript.js:186809:      project.onFileAddedOrRemoved(this.isSymlink());
./node_modules/typescript/lib/typescript.js:186831:          project.onFileAddedOrRemoved(this.isSymlink());
./node_modules/typescript/lib/typescript.js:186837:          project.onFileAddedOrRemoved(this.isSymlink());
./node_modules/typescript/lib/typescript.js:186840:          project.onFileAddedOrRemoved(this.isSymlink());
./node_modules/typescript/lib/typescript.js:186846:          project.onFileAddedOrRemoved(this.isSymlink());
./node_modules/typescript/lib/typescript.js:186864:      p.onFileAddedOrRemoved(this.isSymlink());
./node_modules/typescript/lib/typescript.js:187139:    this.hasAddedOrRemovedSymlinks = false;
./node_modules/typescript/lib/typescript.js:187298:  getSymlinkCache() {
./node_modules/typescript/lib/typescript.js:187299:    if (!this.symlinks) {
./node_modules/typescript/lib/typescript.js:187300:      this.symlinks = createSymlinkCache(this.getCurrentDirectory(), this.getCanonicalFileName);
./node_modules/typescript/lib/typescript.js:187302:    if (this.program && !this.symlinks.hasProcessedResolutions()) {
./node_modules/typescript/lib/typescript.js:187303:      this.symlinks.setSymlinksFromResolutions(
./node_modules/typescript/lib/typescript.js:187309:    return this.symlinks;
./node_modules/typescript/lib/typescript.js:187920:  onFileAddedOrRemoved(isSymlink) {
./node_modules/typescript/lib/typescript.js:187922:    if (isSymlink) {
./node_modules/typescript/lib/typescript.js:187923:      this.hasAddedOrRemovedSymlinks = true;
./node_modules/typescript/lib/typescript.js:187927:  onDiscoveredSymlink() {
./node_modules/typescript/lib/typescript.js:187928:    this.hasAddedOrRemovedSymlinks = true;
./node_modules/typescript/lib/typescript.js:187951:    this.hasAddedOrRemovedSymlinks = false;
./node_modules/typescript/lib/typescript.js:188187:    if (this.hasAddedOrRemovedSymlinks || this.program && !this.program.structureIsReused && this.getCompilerOptions().preserveSymlinks) {
./node_modules/typescript/lib/typescript.js:188188:      this.symlinks = void 0;
./node_modules/typescript/lib/typescript.js:188932:      const symlinkCache = hostProject.getSymlinkCache();
./node_modules/typescript/lib/typescript.js:188946:          const entrypoints = getRootNamesFromPackageJson(packageJson, program, symlinkCache);
./node_modules/typescript/lib/typescript.js:188962:              const entrypoints = getRootNamesFromPackageJson(typesPackageJson, program, symlinkCache);
./node_modules/typescript/lib/typescript.js:188973:            symlinkCache,
./node_modules/typescript/lib/typescript.js:189023:    function getRootNamesFromPackageJson(packageJson, program2, symlinkCache, resolveJs) {
./node_modules/typescript/lib/typescript.js:189035:        const isSymlink = realPath2 && realPath2 !== hostProject.toPath(packageJson.packageDirectory);
./node_modules/typescript/lib/typescript.js:189036:        if (isSymlink) {
./node_modules/typescript/lib/typescript.js:189037:          symlinkCache.setSymlinkedDirectory(packageJson.packageDirectory, {
./node_modules/typescript/lib/typescript.js:189042:        return filterEntrypoints(entrypoints, isSymlink ? (entrypoint) => entrypoint.replace(packageJson.packageDirectory, real) : void 0);
./node_modules/typescript/lib/typescript.js:189045:    function filterEntrypoints(entrypoints, symlinkName) {
./node_modules/typescript/lib/typescript.js:189047:        const resolvedFileName = symlinkName ? symlinkName(entrypoint) : entrypoint;
./node_modules/typescript/lib/typescript.js:189048:        if (!program.getSourceFile(resolvedFileName) && !(symlinkName && program.getSourceFile(entrypoint))) {
./node_modules/typescript/lib/typescript.js:189134:  getSymlinkCache() {
./node_modules/typescript/lib/typescript.js:189135:    return this.hostProject.getSymlinkCache();
./node_modules/typescript/lib/typescript.js:191648:   * Returns the projects that contain script info through SymLink
./node_modules/typescript/lib/typescript.js:191653:  getSymlinkedProjects(info) {
./node_modules/typescript/lib/typescript.js:191666:          if (project.languageServiceEnabled && !project.isOrphan() && !project.getCompilerOptions().preserveSymlinks && !info.isAttached(project)) {
./node_modules/typescript/lib/typescript.js:193707:  if (!isArray(projects) && projects.symLinkedProjects) {
./node_modules/typescript/lib/typescript.js:193708:    projects.symLinkedProjects.forEach((projects2, path) => {
./node_modules/typescript/lib/typescript.js:193859:  if (!isArray(projects) && projects.symLinkedProjects) {
./node_modules/typescript/lib/typescript.js:193860:    projects.symLinkedProjects.forEach((symlinkedProjects, symlinkedPath) => {
./node_modules/typescript/lib/typescript.js:193861:      for (const project of symlinkedProjects) {
./node_modules/typescript/lib/typescript.js:193862:        cb(project, symlinkedPath);
./node_modules/typescript/lib/typescript.js:193928:        const symlinkedProjectsMap = projectService.getSymlinkedProjects(originalScriptInfo);
./node_modules/typescript/lib/typescript.js:193929:        if (symlinkedProjectsMap) {
./node_modules/typescript/lib/typescript.js:193930:          symlinkedProjectsMap.forEach((symlinkedProjects, symlinkedPath) => {
./node_modules/typescript/lib/typescript.js:193931:            for (const symlinkedProject of symlinkedProjects) {
./node_modules/typescript/lib/typescript.js:193932:              if (!symlinkedProject.isOrphan() && !resultsMap.has(symlinkedProject)) {
./node_modules/typescript/lib/typescript.js:193933:                queue.enqueue({ project: symlinkedProject, location: { fileName: symlinkedPath, pos: originalLocation.pos } });
./node_modules/typescript/lib/typescript.js:195711:    let symLinkedProjects;
./node_modules/typescript/lib/typescript.js:195727:      symLinkedProjects = this.projectService.getSymlinkedProjects(scriptInfo);
./node_modules/typescript/lib/typescript.js:195730:    if (!ignoreNoProjectError && (!projects || !projects.length) && !symLinkedProjects) {
./node_modules/typescript/lib/typescript.js:195734:    return symLinkedProjects ? { projects, symLinkedProjects } : projects;
./node_modules/typescript/lib/typescript.js:198451:  createSymlinkCache,
./node_modules/typescript/lib/typescript.d.ts:2867:            private hasAddedOrRemovedSymlinks;
./node_modules/typescript/lib/typescript.d.ts:2886:            private symlinks;
./node_modules/typescript/lib/typescript.d.ts:7089:        preserveSymlinks?: boolean;
./node_modules/typescript/lib/_tsc.js:7024:  Do_not_resolve_the_real_path_of_symlinks: diag(6013, 3 /* Message */, "Do_not_resolve_the_real_path_of_symlinks_6013", "Do not resolve the real path of symlinks."),
./node_modules/typescript/lib/_tsc.js:7492:  Disable_resolving_symlinks_to_their_realpath_This_correlates_to_the_same_flag_in_node: diag(6683, 3 /* Message */, "Disable_resolving_symlinks_to_their_realpath_This_correlates_to_the_same_flag_in_node_6683", "Disable resolving symlinks to their realpath. This correlates to the same flag in node."),
./node_modules/typescript/lib/_tsc.js:18269:function createSymlinkCache(cwd, getCanonicalFileName) {
./node_modules/typescript/lib/_tsc.js:18270:  let symlinkedDirectories;
./node_modules/typescript/lib/_tsc.js:18271:  let symlinkedDirectoriesByRealpath;
./node_modules/typescript/lib/_tsc.js:18272:  let symlinkedFiles;
./node_modules/typescript/lib/_tsc.js:18275:    getSymlinkedFiles: () => symlinkedFiles,
./node_modules/typescript/lib/_tsc.js:18276:    getSymlinkedDirectories: () => symlinkedDirectories,
./node_modules/typescript/lib/_tsc.js:18277:    getSymlinkedDirectoriesByRealpath: () => symlinkedDirectoriesByRealpath,
./node_modules/typescript/lib/_tsc.js:18278:    setSymlinkedFile: (path, real) => (symlinkedFiles || (symlinkedFiles = /* @__PURE__ */ new Map())).set(path, real),
./node_modules/typescript/lib/_tsc.js:18279:    setSymlinkedDirectory: (symlink, real) => {
./node_modules/typescript/lib/_tsc.js:18280:      let symlinkPath = toPath(symlink, cwd, getCanonicalFileName);
./node_modules/typescript/lib/_tsc.js:18281:      if (!containsIgnoredPath(symlinkPath)) {
./node_modules/typescript/lib/_tsc.js:18282:        symlinkPath = ensureTrailingDirectorySeparator(symlinkPath);
./node_modules/typescript/lib/_tsc.js:18283:        if (real !== false && !(symlinkedDirectories == null ? void 0 : symlinkedDirectories.has(symlinkPath))) {
./node_modules/typescript/lib/_tsc.js:18284:          (symlinkedDirectoriesByRealpath || (symlinkedDirectoriesByRealpath = createMultiMap())).add(real.realPath, symlink);
./node_modules/typescript/lib/_tsc.js:18286:        (symlinkedDirectories || (symlinkedDirectories = /* @__PURE__ */ new Map())).set(symlinkPath, real);
./node_modules/typescript/lib/_tsc.js:18289:    setSymlinksFromResolutions(forEachResolvedModule, forEachResolvedTypeReferenceDirective, typeReferenceDirectives) {
./node_modules/typescript/lib/_tsc.js:18297:    setSymlinksFromResolution(resolution) {
./node_modules/typescript/lib/_tsc.js:18300:    hasAnySymlinks
./node_modules/typescript/lib/_tsc.js:18302:  function hasAnySymlinks() {
./node_modules/typescript/lib/_tsc.js:18303:    return !!(symlinkedFiles == null ? void 0 : symlinkedFiles.size) || !!symlinkedDirectories && !!forEachEntry(symlinkedDirectories, (value) => !!value);
./node_modules/typescript/lib/_tsc.js:18308:    cache.setSymlinkedFile(toPath(originalPath, cwd, getCanonicalFileName), resolvedFileName);
./node_modules/typescript/lib/_tsc.js:18309:    const [commonResolved, commonOriginal] = guessDirectorySymlink(resolvedFileName, originalPath, cwd, getCanonicalFileName) || emptyArray;
./node_modules/typescript/lib/_tsc.js:18311:      cache.setSymlinkedDirectory(
./node_modules/typescript/lib/_tsc.js:18321:function guessDirectorySymlink(a, b, cwd, getCanonicalFileName) {
./node_modules/typescript/lib/_tsc.js:37327:    name: "preserveSymlinks",
./node_modules/typescript/lib/_tsc.js:37330:    description: Diagnostics.Disable_resolving_symlinks_to_their_realpath_This_correlates_to_the_same_flag_in_node,
./node_modules/typescript/lib/_tsc.js:39756:function createResolvedModuleWithFailedLookupLocationsHandlingSymlink(moduleName, resolved, isExternalLibraryImport, failedLookupLocations, affectingLocations, diagnostics, state, cache, alternateResult) {
./node_modules/typescript/lib/_tsc.js:39757:  if (!state.resultFromCache && !state.compilerOptions.preserveSymlinks && resolved && isExternalLibraryImport && !resolved.originalPath && !isExternalModuleNameRelative(moduleName)) {
./node_modules/typescript/lib/_tsc.js:40023:    if (!options.preserveSymlinks) ({ resolvedFileName, originalPath } = getOriginalAndResolvedFileName(fileName, host, traceEnabled));
./node_modules/typescript/lib/_tsc.js:40897:  return createResolvedModuleWithFailedLookupLocationsHandlingSymlink(
./node_modules/typescript/lib/_tsc.js:42020:  return createResolvedModuleWithFailedLookupLocationsHandlingSymlink(
./node_modules/typescript/lib/_tsc.js:45611:function forEachFileNameOfModule(importingFileName, importedFileName, host, preferSymlinks, cb) {
./node_modules/typescript/lib/_tsc.js:45621:  if (!preferSymlinks) {
./node_modules/typescript/lib/_tsc.js:45625:  const symlinkedDirectories = (_b = host.getSymlinkCache) == null ? void 0 : _b.call(host).getSymlinkedDirectoriesByRealpath();
./node_modules/typescript/lib/_tsc.js:45627:  const result = symlinkedDirectories && forEachAncestorDirectoryStoppingAtGlobalCache(
./node_modules/typescript/lib/_tsc.js:45631:      const symlinkDirectories = symlinkedDirectories.get(ensureTrailingDirectorySeparator(toPath(realPathDirectory, cwd, getCanonicalFileName)));
./node_modules/typescript/lib/_tsc.js:45632:      if (!symlinkDirectories) return void 0;
./node_modules/typescript/lib/_tsc.js:45641:        for (const symlinkDirectory of symlinkDirectories) {
./node_modules/typescript/lib/_tsc.js:45642:          const option = resolvePath(symlinkDirectory, relative);
./node_modules/typescript/lib/_tsc.js:45650:  return result || (preferSymlinks ? forEach(targets, (p) => shouldFilterIgnoredPaths && containsIgnoredPath(p) ? void 0 : cb(p, p === referenceRedirect)) : void 0);
./node_modules/typescript/lib/_tsc.js:45666:  const links = (_b = host.getSymlinkCache) == null ? void 0 : _b.call(host);
./node_modules/typescript/lib/_tsc.js:45684:        links.setSymlinksFromResolution(resolved.resolvedModule);
./node_modules/typescript/lib/_tsc.js:45694:    /*preferSymlinks*/
./node_modules/typescript/lib/_tsc.js:90350:    getSymlinkCache: maybeBind(host, host.getSymlinkCache),
./node_modules/typescript/lib/_tsc.js:120988:    let rootSymLinkResult;
./node_modules/typescript/lib/_tsc.js:121002:      if (rootSymLinkResult && path === rootDirPath) return rootSymLinkResult;
./node_modules/typescript/lib/_tsc.js:121015:      if (path === rootDirPath) rootSymLinkResult = result;
./node_modules/typescript/lib/_tsc.js:122097:  let symlinks;
./node_modules/typescript/lib/_tsc.js:122224:    getSymlinkCache,
./node_modules/typescript/lib/_tsc.js:122452:    getSymlinkCache,
./node_modules/typescript/lib/_tsc.js:122576:    if (!host.realpath || !options.preserveSymlinks || !file.originalFileName.includes(nodeModulesPathPart)) return void 0;
./node_modules/typescript/lib/_tsc.js:122952:      getSymlinkCache,
./node_modules/typescript/lib/_tsc.js:123757:      if (!source && host.realpath && options.preserveSymlinks && isDeclarationFileName(fileName) && fileName.includes(nodeModulesPathPart)) {
./node_modules/typescript/lib/_tsc.js:124824:  function getSymlinkCache() {
./node_modules/typescript/lib/_tsc.js:124825:    if (host.getSymlinkCache) {
./node_modules/typescript/lib/_tsc.js:124826:      return host.getSymlinkCache();
./node_modules/typescript/lib/_tsc.js:124828:    if (!symlinks) {
./node_modules/typescript/lib/_tsc.js:124829:      symlinks = createSymlinkCache(currentDirectory, getCanonicalFileName);
./node_modules/typescript/lib/_tsc.js:124831:    if (files && !symlinks.hasProcessedResolutions()) {
./node_modules/typescript/lib/_tsc.js:124832:      symlinks.setSymlinksFromResolutions(forEachResolvedModule, forEachResolvedTypeReferenceDirective, automaticTypeDirectiveResolutions);
./node_modules/typescript/lib/_tsc.js:124834:    return symlinks;
./node_modules/typescript/lib/_tsc.js:124900:        handleDirectoryCouldBeSymlink(path);
./node_modules/typescript/lib/_tsc.js:124931:      return ((_a = host.getSymlinkCache().getSymlinkedFiles()) == null ? void 0 : _a.get(host.toPath(s))) || originalRealpath.call(host.compilerHost, s);
./node_modules/typescript/lib/_tsc.js:124964:  function handleDirectoryCouldBeSymlink(directory) {
./node_modules/typescript/lib/_tsc.js:124968:    const symlinkCache = host.getSymlinkCache();
./node_modules/typescript/lib/_tsc.js:124970:    if ((_a = symlinkCache.getSymlinkedDirectories()) == null ? void 0 : _a.has(directoryPath)) return;
./node_modules/typescript/lib/_tsc.js:124974:      symlinkCache.setSymlinkedDirectory(directoryPath, false);
./node_modules/typescript/lib/_tsc.js:124977:    symlinkCache.setSymlinkedDirectory(directory, {
./node_modules/typescript/lib/_tsc.js:124987:    const symlinkCache = host.getSymlinkCache();
./node_modules/typescript/lib/_tsc.js:124988:    const symlinkedDirectories = symlinkCache.getSymlinkedDirectories();
./node_modules/typescript/lib/_tsc.js:124989:    if (!symlinkedDirectories) return false;
./node_modules/typescript/lib/_tsc.js:124992:    if (isFile && ((_a = symlinkCache.getSymlinkedFiles()) == null ? void 0 : _a.has(fileOrDirectoryPath))) return true;
./node_modules/typescript/lib/_tsc.js:124994:      symlinkedDirectories.entries(),
./node_modules/typescript/lib/_tsc.js:124995:      ([directoryPath, symlinkedDirectory]) => {
./node_modules/typescript/lib/_tsc.js:124996:        if (!symlinkedDirectory || !startsWith(fileOrDirectoryPath, directoryPath)) return void 0;
./node_modules/typescript/lib/_tsc.js:124997:        const result2 = fileOrDirectoryExistsUsingSource2(fileOrDirectoryPath.replace(directoryPath, symlinkedDirectory.realPath));
./node_modules/typescript/lib/_tsc.js:125000:          symlinkCache.setSymlinkedFile(
./node_modules/typescript/lib/_tsc.js:125002:            `${symlinkedDirectory.real}${absolutePath.replace(new RegExp(directoryPath, "i"), "")}`
./node_modules/typescript/lib/_tsc.js:127555:  const isSymlinkCache = /* @__PURE__ */ new Map();
./node_modules/typescript/lib/_tsc.js:127557:  const dirPathToSymlinkPackageRefCount = /* @__PURE__ */ new Map();
./node_modules/typescript/lib/_tsc.js:127570:    dirPathToSymlinkPackageRefCount,
./node_modules/typescript/lib/_tsc.js:127599:    isSymlinkCache.clear();
./node_modules/typescript/lib/_tsc.js:127601:    dirPathToSymlinkPackageRefCount.clear();
./node_modules/typescript/lib/_tsc.js:127667:    isSymlinkCache.clear();
./node_modules/typescript/lib/_tsc.js:127723:    isSymlinkCache.clear();
./node_modules/typescript/lib/_tsc.js:127738:    if (watcher.files === 0 && watcher.resolutions === 0 && !((_a = watcher.symlinks) == null ? void 0 : _a.size)) {
./node_modules/typescript/lib/_tsc.js:127774:        if (resolutionHost.onDiscoveredSymlink && resolutionIsSymlink(resolution)) {
./node_modules/typescript/lib/_tsc.js:127775:          resolutionHost.onDiscoveredSymlink();
./node_modules/typescript/lib/_tsc.js:128032:    let isSymlink = false;
./node_modules/typescript/lib/_tsc.js:128033:    let symlinkWatcher;
./node_modules/typescript/lib/_tsc.js:128037:        isSymlink = true;
./node_modules/typescript/lib/_tsc.js:128038:        symlinkWatcher = fileWatchesOfAffectingLocations.get(locationToWatch);
./node_modules/typescript/lib/_tsc.js:128043:    if (!isSymlink || !symlinkWatcher) {
./node_modules/typescript/lib/_tsc.js:128050:        resolutions: isSymlink ? 0 : resolutions,
./node_modules/typescript/lib/_tsc.js:128051:        files: isSymlink ? 0 : files,
./node_modules/typescript/lib/_tsc.js:128052:        symlinks: void 0
./node_modules/typescript/lib/_tsc.js:128055:      if (isSymlink) symlinkWatcher = watcher;
./node_modules/typescript/lib/_tsc.js:128057:    if (isSymlink) {
./node_modules/typescript/lib/_tsc.js:128058:      Debug.assert(!!symlinkWatcher);
./node_modules/typescript/lib/_tsc.js:128063:            const symlinkWatcher2 = fileWatchesOfAffectingLocations.get(locationToWatch);
./node_modules/typescript/lib/_tsc.js:128064:            if (((_a = symlinkWatcher2 == null ? void 0 : symlinkWatcher2.symlinks) == null ? void 0 : _a.delete(affectingLocation)) && !symlinkWatcher2.symlinks.size && !symlinkWatcher2.resolutions && !symlinkWatcher2.files) {
./node_modules/typescript/lib/_tsc.js:128066:              symlinkWatcher2.watcher.close();
./node_modules/typescript/lib/_tsc.js:128072:        symlinks: void 0
./node_modules/typescript/lib/_tsc.js:128075:      (symlinkWatcher.symlinks ?? (symlinkWatcher.symlinks = /* @__PURE__ */ new Set())).add(affectingLocation);
./node_modules/typescript/lib/_tsc.js:128083:    (_a = watcher == null ? void 0 : watcher.symlinks) == null ? void 0 : _a.forEach((path2) => invalidateAffectingFileWatcher(path2, packageJsonMap));
./node_modules/typescript/lib/_tsc.js:128092:    let isSymlink = isSymlinkCache.get(packageDirPath);
./node_modules/typescript/lib/_tsc.js:128094:    if (isSymlink === void 0) {
./node_modules/typescript/lib/_tsc.js:128096:      isSymlink = realPath2 !== packageDir && resolutionHost.toPath(realPath2) !== packageDirPath;
./node_modules/typescript/lib/_tsc.js:128097:      isSymlinkCache.set(packageDirPath, isSymlink);
./node_modules/typescript/lib/_tsc.js:128103:            isSymlink
./node_modules/typescript/lib/_tsc.js:128106:      } else if (packageDirWatcher.isSymlink !== isSymlink) {
./node_modules/typescript/lib/_tsc.js:128108:          removeDirectoryWatcher(packageDirWatcher.isSymlink ? packageDirPath : dirPath);
./node_modules/typescript/lib/_tsc.js:128111:        packageDirWatcher.isSymlink = isSymlink;
./node_modules/typescript/lib/_tsc.js:128115:      Debug.assert(isSymlink === packageDirWatcher.isSymlink);
./node_modules/typescript/lib/_tsc.js:128125:      if (isSymlink) dirPathToSymlinkPackageRefCount.set(dirPath, (dirPathToSymlinkPackageRefCount.get(dirPath) ?? 0) + 1);
./node_modules/typescript/lib/_tsc.js:128128:      return isSymlink ? createOrAddRefToDirectoryWatchOfFailedLookups(packageDir, packageDirPath, nonRecursive) : createOrAddRefToDirectoryWatchOfFailedLookups(dir, dirPath, nonRecursive);
./node_modules/typescript/lib/_tsc.js:128169:          removeDirectoryWatcher(packageDirWatcher.isSymlink ? packageDirPath : dirPath);
./node_modules/typescript/lib/_tsc.js:128171:          if (packageDirWatcher.isSymlink) {
./node_modules/typescript/lib/_tsc.js:128172:            const refCount = dirPathToSymlinkPackageRefCount.get(dirPath) - 1;
./node_modules/typescript/lib/_tsc.js:128174:              dirPathToSymlinkPackageRefCount.delete(dirPath);
./node_modules/typescript/lib/_tsc.js:128176:              dirPathToSymlinkPackageRefCount.set(dirPath, refCount);
./node_modules/typescript/lib/_tsc.js:128385:        (dirPath2) => directoryWatchesOfFailedLookups.has(dirPath2) || dirPathToSymlinkPackageRefCount.has(dirPath2)
./node_modules/typescript/lib/_tsc.js:128417:function resolutionIsSymlink(resolution) {
./node_modules/update-browserslist-db/index.js:44:  let lockfilePnpm = join(packageDir, 'pnpm-lock.yaml')
./node_modules/@babel/core/lib/config/files/module-types.js:190:If you are using Yarn Plug'n'Play, you may also need to add the following configuration to your .yarnrc.yml file:
./node_modules/@babel/core/lib/vendor/import-meta-resolve.js:541:function finalizeResolution(resolved, base, preserveSymlinks) {
./node_modules/@babel/core/lib/vendor/import-meta-resolve.js:569:  if (!preserveSymlinks) {
./node_modules/@babel/core/lib/vendor/import-meta-resolve.js:914:function moduleResolve(specifier, base, conditions, preserveSymlinks) {
./node_modules/@babel/core/lib/vendor/import-meta-resolve.js:945:  return finalizeResolution(resolved, base, preserveSymlinks);

========================================
SEARCH: js-yaml
========================================
package-lock.json:1874:        "yaml": "^2.4.2"
package-lock.json:1907:        "yaml": {
apps/forge/dist/generators/component.generator.js:26:    ["component.yaml", "component.yaml"]
apps/forge/src/generators/component.generator.ts:40:    ["component.yaml","component.yaml"]
packages/architecture/src/parser/component-discovery.ts:44:                        join(root, "component.yaml"),
packages/architecture/src/parser/yaml-loader.ts:5:export class YamlLoader {
packages/architecture/src/parser/default-architecture-parser.ts:15:    YamlLoader,
packages/architecture/src/parser/default-architecture-parser.ts:16:} from "./yaml-loader.js";
packages/architecture/src/parser/default-architecture-parser.ts:30:        const yaml =
packages/architecture/src/parser/default-architecture-parser.ts:31:            new YamlLoader();
packages/architecture/src/parser/default-architecture-parser.ts:40:            yaml.load(source.manifestPath);
packages/architecture/src/parser/index.ts:4:export * from "./yaml-loader.js";

========================================
SEARCH: components/
========================================
packages/architecture/src/documentation/default-architecture-documentation-generator.ts:51:                `docs/architecture/components/${component.identity.name}.md`,
./packages/architecture/src/documentation/default-architecture-documentation-generator.ts:51:                `docs/architecture/components/${component.identity.name}.md`,
./node_modules/@types/react/ts5.0/index.d.ts:168:     * @see {@link https://react.dev/reference/react-dom/components/common#ref-callback React Docs}
./node_modules/@types/react/index.d.ts:168:     * @see {@link https://react.dev/reference/react-dom/components/common#ref-callback React Docs}

[PASS] Manifest Runtime Usage Completed.
