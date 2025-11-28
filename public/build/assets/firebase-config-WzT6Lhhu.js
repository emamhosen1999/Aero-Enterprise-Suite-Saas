const ft=()=>{};var ue={};/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const ke=function(e){const t=[];let n=0;for(let r=0;r<e.length;r++){let o=e.charCodeAt(r);o<128?t[n++]=o:o<2048?(t[n++]=o>>6|192,t[n++]=o&63|128):(o&64512)===55296&&r+1<e.length&&(e.charCodeAt(r+1)&64512)===56320?(o=65536+((o&1023)<<10)+(e.charCodeAt(++r)&1023),t[n++]=o>>18|240,t[n++]=o>>12&63|128,t[n++]=o>>6&63|128,t[n++]=o&63|128):(t[n++]=o>>12|224,t[n++]=o>>6&63|128,t[n++]=o&63|128)}return t},ht=function(e){const t=[];let n=0,r=0;for(;n<e.length;){const o=e[n++];if(o<128)t[r++]=String.fromCharCode(o);else if(o>191&&o<224){const i=e[n++];t[r++]=String.fromCharCode((o&31)<<6|i&63)}else if(o>239&&o<365){const i=e[n++],a=e[n++],s=e[n++],c=((o&7)<<18|(i&63)<<12|(a&63)<<6|s&63)-65536;t[r++]=String.fromCharCode(55296+(c>>10)),t[r++]=String.fromCharCode(56320+(c&1023))}else{const i=e[n++],a=e[n++];t[r++]=String.fromCharCode((o&15)<<12|(i&63)<<6|a&63)}}return t.join("")},Oe={byteToCharMap_:null,charToByteMap_:null,byteToCharMapWebSafe_:null,charToByteMapWebSafe_:null,ENCODED_VALS_BASE:"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789",get ENCODED_VALS(){return this.ENCODED_VALS_BASE+"+/="},get ENCODED_VALS_WEBSAFE(){return this.ENCODED_VALS_BASE+"-_."},HAS_NATIVE_SUPPORT:typeof atob=="function",encodeByteArray(e,t){if(!Array.isArray(e))throw Error("encodeByteArray takes an array as a parameter");this.init_();const n=t?this.byteToCharMapWebSafe_:this.byteToCharMap_,r=[];for(let o=0;o<e.length;o+=3){const i=e[o],a=o+1<e.length,s=a?e[o+1]:0,c=o+2<e.length,u=c?e[o+2]:0,d=i>>2,T=(i&3)<<4|s>>4;let k=(s&15)<<2|u>>6,O=u&63;c||(O=64,a||(k=64)),r.push(n[d],n[T],n[k],n[O])}return r.join("")},encodeString(e,t){return this.HAS_NATIVE_SUPPORT&&!t?btoa(e):this.encodeByteArray(ke(e),t)},decodeString(e,t){return this.HAS_NATIVE_SUPPORT&&!t?atob(e):ht(this.decodeStringToByteArray(e,t))},decodeStringToByteArray(e,t){this.init_();const n=t?this.charToByteMapWebSafe_:this.charToByteMap_,r=[];for(let o=0;o<e.length;){const i=n[e.charAt(o++)],s=o<e.length?n[e.charAt(o)]:0;++o;const u=o<e.length?n[e.charAt(o)]:64;++o;const T=o<e.length?n[e.charAt(o)]:64;if(++o,i==null||s==null||u==null||T==null)throw new pt;const k=i<<2|s>>4;if(r.push(k),u!==64){const O=s<<4&240|u>>2;if(r.push(O),T!==64){const lt=u<<6&192|T;r.push(lt)}}}return r},init_(){if(!this.byteToCharMap_){this.byteToCharMap_={},this.charToByteMap_={},this.byteToCharMapWebSafe_={},this.charToByteMapWebSafe_={};for(let e=0;e<this.ENCODED_VALS.length;e++)this.byteToCharMap_[e]=this.ENCODED_VALS.charAt(e),this.charToByteMap_[this.byteToCharMap_[e]]=e,this.byteToCharMapWebSafe_[e]=this.ENCODED_VALS_WEBSAFE.charAt(e),this.charToByteMapWebSafe_[this.byteToCharMapWebSafe_[e]]=e,e>=this.ENCODED_VALS_BASE.length&&(this.charToByteMap_[this.ENCODED_VALS_WEBSAFE.charAt(e)]=e,this.charToByteMapWebSafe_[this.ENCODED_VALS.charAt(e)]=e)}}};class pt extends Error{constructor(){super(...arguments),this.name="DecodeBase64StringError"}}const gt=function(e){const t=ke(e);return Oe.encodeByteArray(t,!0)},Ne=function(e){return gt(e).replace(/\./g,"")},mt=function(e){try{return Oe.decodeString(e,!0)}catch(t){console.error("base64Decode failed: ",t)}return null};/**
 * @license
 * Copyright 2022 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function bt(){if(typeof self<"u")return self;if(typeof window<"u")return window;if(typeof global<"u")return global;throw new Error("Unable to locate global object.")}/**
 * @license
 * Copyright 2022 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const wt=()=>bt().__FIREBASE_DEFAULTS__,yt=()=>{if(typeof process>"u"||typeof ue>"u")return;const e=ue.__FIREBASE_DEFAULTS__;if(e)return JSON.parse(e)},It=()=>{if(typeof document>"u")return;let e;try{e=document.cookie.match(/__FIREBASE_DEFAULTS__=([^;]+)/)}catch{return}const t=e&&mt(e[1]);return t&&JSON.parse(t)},Et=()=>{try{return ft()||wt()||yt()||It()}catch(e){console.info(`Unable to get __FIREBASE_DEFAULTS__ due to: ${e}`);return}},Be=()=>{var e;return(e=Et())===null||e===void 0?void 0:e.config};/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class _t{constructor(){this.reject=()=>{},this.resolve=()=>{},this.promise=new Promise((t,n)=>{this.resolve=t,this.reject=n})}wrapCallback(t){return(n,r)=>{n?this.reject(n):this.resolve(r),typeof t=="function"&&(this.promise.catch(()=>{}),t.length===1?t(n):t(n,r))}}}function Me(){try{return typeof indexedDB=="object"}catch{return!1}}function Re(){return new Promise((e,t)=>{try{let n=!0;const r="validate-browser-context-for-indexeddb-analytics-module",o=self.indexedDB.open(r);o.onsuccess=()=>{o.result.close(),n||self.indexedDB.deleteDatabase(r),e(!0)},o.onupgradeneeded=()=>{n=!1},o.onerror=()=>{var i;t(((i=o.error)===null||i===void 0?void 0:i.message)||"")}}catch(n){t(n)}})}function vt(){return!(typeof navigator>"u"||!navigator.cookieEnabled)}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const St="FirebaseError";class S extends Error{constructor(t,n,r){super(n),this.code=t,this.customData=r,this.name=St,Object.setPrototypeOf(this,S.prototype),Error.captureStackTrace&&Error.captureStackTrace(this,M.prototype.create)}}class M{constructor(t,n,r){this.service=t,this.serviceName=n,this.errors=r}create(t,...n){const r=n[0]||{},o=`${this.service}/${t}`,i=this.errors[t],a=i?Tt(i,r):"Error",s=`${this.serviceName}: ${a} (${o}).`;return new S(o,s,r)}}function Tt(e,t){return e.replace(At,(n,r)=>{const o=t[r];return o!=null?String(o):`<${r}?>`})}const At=/\{\$([^}]+)}/g;function z(e,t){if(e===t)return!0;const n=Object.keys(e),r=Object.keys(t);for(const o of n){if(!r.includes(o))return!1;const i=e[o],a=t[o];if(le(i)&&le(a)){if(!z(i,a))return!1}else if(i!==a)return!1}for(const o of r)if(!n.includes(o))return!1;return!0}function le(e){return e!==null&&typeof e=="object"}/**
 * @license
 * Copyright 2021 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function ee(e){return e&&e._delegate?e._delegate:e}class w{constructor(t,n,r){this.name=t,this.instanceFactory=n,this.type=r,this.multipleInstances=!1,this.serviceProps={},this.instantiationMode="LAZY",this.onInstanceCreated=null}setInstantiationMode(t){return this.instantiationMode=t,this}setMultipleInstances(t){return this.multipleInstances=t,this}setServiceProps(t){return this.serviceProps=t,this}setInstanceCreatedCallback(t){return this.onInstanceCreated=t,this}}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const y="[DEFAULT]";/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Dt{constructor(t,n){this.name=t,this.container=n,this.component=null,this.instances=new Map,this.instancesDeferred=new Map,this.instancesOptions=new Map,this.onInitCallbacks=new Map}get(t){const n=this.normalizeInstanceIdentifier(t);if(!this.instancesDeferred.has(n)){const r=new _t;if(this.instancesDeferred.set(n,r),this.isInitialized(n)||this.shouldAutoInitialize())try{const o=this.getOrInitializeService({instanceIdentifier:n});o&&r.resolve(o)}catch{}}return this.instancesDeferred.get(n).promise}getImmediate(t){var n;const r=this.normalizeInstanceIdentifier(t==null?void 0:t.identifier),o=(n=t==null?void 0:t.optional)!==null&&n!==void 0?n:!1;if(this.isInitialized(r)||this.shouldAutoInitialize())try{return this.getOrInitializeService({instanceIdentifier:r})}catch(i){if(o)return null;throw i}else{if(o)return null;throw Error(`Service ${this.name} is not available`)}}getComponent(){return this.component}setComponent(t){if(t.name!==this.name)throw Error(`Mismatching Component ${t.name} for Provider ${this.name}.`);if(this.component)throw Error(`Component for ${this.name} has already been provided`);if(this.component=t,!!this.shouldAutoInitialize()){if(kt(t))try{this.getOrInitializeService({instanceIdentifier:y})}catch{}for(const[n,r]of this.instancesDeferred.entries()){const o=this.normalizeInstanceIdentifier(n);try{const i=this.getOrInitializeService({instanceIdentifier:o});r.resolve(i)}catch{}}}}clearInstance(t=y){this.instancesDeferred.delete(t),this.instancesOptions.delete(t),this.instances.delete(t)}async delete(){const t=Array.from(this.instances.values());await Promise.all([...t.filter(n=>"INTERNAL"in n).map(n=>n.INTERNAL.delete()),...t.filter(n=>"_delete"in n).map(n=>n._delete())])}isComponentSet(){return this.component!=null}isInitialized(t=y){return this.instances.has(t)}getOptions(t=y){return this.instancesOptions.get(t)||{}}initialize(t={}){const{options:n={}}=t,r=this.normalizeInstanceIdentifier(t.instanceIdentifier);if(this.isInitialized(r))throw Error(`${this.name}(${r}) has already been initialized`);if(!this.isComponentSet())throw Error(`Component ${this.name} has not been registered yet`);const o=this.getOrInitializeService({instanceIdentifier:r,options:n});for(const[i,a]of this.instancesDeferred.entries()){const s=this.normalizeInstanceIdentifier(i);r===s&&a.resolve(o)}return o}onInit(t,n){var r;const o=this.normalizeInstanceIdentifier(n),i=(r=this.onInitCallbacks.get(o))!==null&&r!==void 0?r:new Set;i.add(t),this.onInitCallbacks.set(o,i);const a=this.instances.get(o);return a&&t(a,o),()=>{i.delete(t)}}invokeOnInitCallbacks(t,n){const r=this.onInitCallbacks.get(n);if(r)for(const o of r)try{o(t,n)}catch{}}getOrInitializeService({instanceIdentifier:t,options:n={}}){let r=this.instances.get(t);if(!r&&this.component&&(r=this.component.instanceFactory(this.container,{instanceIdentifier:Ct(t),options:n}),this.instances.set(t,r),this.instancesOptions.set(t,n),this.invokeOnInitCallbacks(r,t),this.component.onInstanceCreated))try{this.component.onInstanceCreated(this.container,t,r)}catch{}return r||null}normalizeInstanceIdentifier(t=y){return this.component?this.component.multipleInstances?t:y:t}shouldAutoInitialize(){return!!this.component&&this.component.instantiationMode!=="EXPLICIT"}}function Ct(e){return e===y?void 0:e}function kt(e){return e.instantiationMode==="EAGER"}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Ot{constructor(t){this.name=t,this.providers=new Map}addComponent(t){const n=this.getProvider(t.name);if(n.isComponentSet())throw new Error(`Component ${t.name} has already been registered with ${this.name}`);n.setComponent(t)}addOrOverwriteComponent(t){this.getProvider(t.name).isComponentSet()&&this.providers.delete(t.name),this.addComponent(t)}getProvider(t){if(this.providers.has(t))return this.providers.get(t);const n=new Dt(t,this);return this.providers.set(t,n),n}getProviders(){return Array.from(this.providers.values())}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */var l;(function(e){e[e.DEBUG=0]="DEBUG",e[e.VERBOSE=1]="VERBOSE",e[e.INFO=2]="INFO",e[e.WARN=3]="WARN",e[e.ERROR=4]="ERROR",e[e.SILENT=5]="SILENT"})(l||(l={}));const Nt={debug:l.DEBUG,verbose:l.VERBOSE,info:l.INFO,warn:l.WARN,error:l.ERROR,silent:l.SILENT},Bt=l.INFO,Mt={[l.DEBUG]:"log",[l.VERBOSE]:"log",[l.INFO]:"info",[l.WARN]:"warn",[l.ERROR]:"error"},Rt=(e,t,...n)=>{if(t<e.logLevel)return;const r=new Date().toISOString(),o=Mt[t];if(o)console[o](`[${r}]  ${e.name}:`,...n);else throw new Error(`Attempted to log a message with an invalid logType (value: ${t})`)};class Pt{constructor(t){this.name=t,this._logLevel=Bt,this._logHandler=Rt,this._userLogHandler=null}get logLevel(){return this._logLevel}set logLevel(t){if(!(t in l))throw new TypeError(`Invalid value "${t}" assigned to \`logLevel\``);this._logLevel=t}setLogLevel(t){this._logLevel=typeof t=="string"?Nt[t]:t}get logHandler(){return this._logHandler}set logHandler(t){if(typeof t!="function")throw new TypeError("Value assigned to `logHandler` must be a function");this._logHandler=t}get userLogHandler(){return this._userLogHandler}set userLogHandler(t){this._userLogHandler=t}debug(...t){this._userLogHandler&&this._userLogHandler(this,l.DEBUG,...t),this._logHandler(this,l.DEBUG,...t)}log(...t){this._userLogHandler&&this._userLogHandler(this,l.VERBOSE,...t),this._logHandler(this,l.VERBOSE,...t)}info(...t){this._userLogHandler&&this._userLogHandler(this,l.INFO,...t),this._logHandler(this,l.INFO,...t)}warn(...t){this._userLogHandler&&this._userLogHandler(this,l.WARN,...t),this._logHandler(this,l.WARN,...t)}error(...t){this._userLogHandler&&this._userLogHandler(this,l.ERROR,...t),this._logHandler(this,l.ERROR,...t)}}const $t=(e,t)=>t.some(n=>e instanceof n);let fe,he;function Lt(){return fe||(fe=[IDBDatabase,IDBObjectStore,IDBIndex,IDBCursor,IDBTransaction])}function Ft(){return he||(he=[IDBCursor.prototype.advance,IDBCursor.prototype.continue,IDBCursor.prototype.continuePrimaryKey])}const Pe=new WeakMap,G=new WeakMap,$e=new WeakMap,L=new WeakMap,te=new WeakMap;function Ht(e){const t=new Promise((n,r)=>{const o=()=>{e.removeEventListener("success",i),e.removeEventListener("error",a)},i=()=>{n(p(e.result)),o()},a=()=>{r(e.error),o()};e.addEventListener("success",i),e.addEventListener("error",a)});return t.then(n=>{n instanceof IDBCursor&&Pe.set(n,e)}).catch(()=>{}),te.set(t,e),t}function jt(e){if(G.has(e))return;const t=new Promise((n,r)=>{const o=()=>{e.removeEventListener("complete",i),e.removeEventListener("error",a),e.removeEventListener("abort",a)},i=()=>{n(),o()},a=()=>{r(e.error||new DOMException("AbortError","AbortError")),o()};e.addEventListener("complete",i),e.addEventListener("error",a),e.addEventListener("abort",a)});G.set(e,t)}let J={get(e,t,n){if(e instanceof IDBTransaction){if(t==="done")return G.get(e);if(t==="objectStoreNames")return e.objectStoreNames||$e.get(e);if(t==="store")return n.objectStoreNames[1]?void 0:n.objectStore(n.objectStoreNames[0])}return p(e[t])},set(e,t,n){return e[t]=n,!0},has(e,t){return e instanceof IDBTransaction&&(t==="done"||t==="store")?!0:t in e}};function xt(e){J=e(J)}function Vt(e){return e===IDBDatabase.prototype.transaction&&!("objectStoreNames"in IDBTransaction.prototype)?function(t,...n){const r=e.call(F(this),t,...n);return $e.set(r,t.sort?t.sort():[t]),p(r)}:Ft().includes(e)?function(...t){return e.apply(F(this),t),p(Pe.get(this))}:function(...t){return p(e.apply(F(this),t))}}function Ut(e){return typeof e=="function"?Vt(e):(e instanceof IDBTransaction&&jt(e),$t(e,Lt())?new Proxy(e,J):e)}function p(e){if(e instanceof IDBRequest)return Ht(e);if(L.has(e))return L.get(e);const t=Ut(e);return t!==e&&(L.set(e,t),te.set(t,e)),t}const F=e=>te.get(e);function R(e,t,{blocked:n,upgrade:r,blocking:o,terminated:i}={}){const a=indexedDB.open(e,t),s=p(a);return r&&a.addEventListener("upgradeneeded",c=>{r(p(a.result),c.oldVersion,c.newVersion,p(a.transaction),c)}),n&&a.addEventListener("blocked",c=>n(c.oldVersion,c.newVersion,c)),s.then(c=>{i&&c.addEventListener("close",()=>i()),o&&c.addEventListener("versionchange",u=>o(u.oldVersion,u.newVersion,u))}).catch(()=>{}),s}function H(e,{blocked:t}={}){const n=indexedDB.deleteDatabase(e);return t&&n.addEventListener("blocked",r=>t(r.oldVersion,r)),p(n).then(()=>{})}const Kt=["get","getKey","getAll","getAllKeys","count"],Wt=["put","add","delete","clear"],j=new Map;function pe(e,t){if(!(e instanceof IDBDatabase&&!(t in e)&&typeof t=="string"))return;if(j.get(t))return j.get(t);const n=t.replace(/FromIndex$/,""),r=t!==n,o=Wt.includes(n);if(!(n in(r?IDBIndex:IDBObjectStore).prototype)||!(o||Kt.includes(n)))return;const i=async function(a,...s){const c=this.transaction(a,o?"readwrite":"readonly");let u=c.store;return r&&(u=u.index(s.shift())),(await Promise.all([u[n](...s),o&&c.done]))[0]};return j.set(t,i),i}xt(e=>({...e,get:(t,n,r)=>pe(t,n)||e.get(t,n,r),has:(t,n)=>!!pe(t,n)||e.has(t,n)}));/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class qt{constructor(t){this.container=t}getPlatformInfoString(){return this.container.getProviders().map(n=>{if(zt(n)){const r=n.getImmediate();return`${r.library}/${r.version}`}else return null}).filter(n=>n).join(" ")}}function zt(e){const t=e.getComponent();return(t==null?void 0:t.type)==="VERSION"}const Y="@firebase/app",ge="0.13.2";/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const g=new Pt("@firebase/app"),Gt="@firebase/app-compat",Jt="@firebase/analytics-compat",Yt="@firebase/analytics",Xt="@firebase/app-check-compat",Qt="@firebase/app-check",Zt="@firebase/auth",en="@firebase/auth-compat",tn="@firebase/database",nn="@firebase/data-connect",rn="@firebase/database-compat",on="@firebase/functions",an="@firebase/functions-compat",sn="@firebase/installations",cn="@firebase/installations-compat",dn="@firebase/messaging",un="@firebase/messaging-compat",ln="@firebase/performance",fn="@firebase/performance-compat",hn="@firebase/remote-config",pn="@firebase/remote-config-compat",gn="@firebase/storage",mn="@firebase/storage-compat",bn="@firebase/firestore",wn="@firebase/ai",yn="@firebase/firestore-compat",In="firebase";/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const X="[DEFAULT]",En={[Y]:"fire-core",[Gt]:"fire-core-compat",[Yt]:"fire-analytics",[Jt]:"fire-analytics-compat",[Qt]:"fire-app-check",[Xt]:"fire-app-check-compat",[Zt]:"fire-auth",[en]:"fire-auth-compat",[tn]:"fire-rtdb",[nn]:"fire-data-connect",[rn]:"fire-rtdb-compat",[on]:"fire-fn",[an]:"fire-fn-compat",[sn]:"fire-iid",[cn]:"fire-iid-compat",[dn]:"fire-fcm",[un]:"fire-fcm-compat",[ln]:"fire-perf",[fn]:"fire-perf-compat",[hn]:"fire-rc",[pn]:"fire-rc-compat",[gn]:"fire-gcs",[mn]:"fire-gcs-compat",[bn]:"fire-fst",[yn]:"fire-fst-compat",[wn]:"fire-vertex","fire-js":"fire-js",[In]:"fire-js-all"};/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const N=new Map,_n=new Map,Q=new Map;function me(e,t){try{e.container.addComponent(t)}catch(n){g.debug(`Component ${t.name} failed to register with FirebaseApp ${e.name}`,n)}}function E(e){const t=e.name;if(Q.has(t))return g.debug(`There were multiple attempts to register component ${t}.`),!1;Q.set(t,e);for(const n of N.values())me(n,e);for(const n of _n.values())me(n,e);return!0}function ne(e,t){const n=e.container.getProvider("heartbeat").getImmediate({optional:!0});return n&&n.triggerHeartbeat(),e.container.getProvider(t)}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const vn={"no-app":"No Firebase App '{$appName}' has been created - call initializeApp() first","bad-app-name":"Illegal App name: '{$appName}'","duplicate-app":"Firebase App named '{$appName}' already exists with different options or config","app-deleted":"Firebase App named '{$appName}' already deleted","server-app-deleted":"Firebase Server App has been deleted","no-options":"Need to provide options, when not being deployed to hosting via source.","invalid-app-argument":"firebase.{$appName}() takes either no argument or a Firebase App instance.","invalid-log-argument":"First argument to `onLog` must be null or a function.","idb-open":"Error thrown when opening IndexedDB. Original error: {$originalErrorMessage}.","idb-get":"Error thrown when reading from IndexedDB. Original error: {$originalErrorMessage}.","idb-set":"Error thrown when writing to IndexedDB. Original error: {$originalErrorMessage}.","idb-delete":"Error thrown when deleting from IndexedDB. Original error: {$originalErrorMessage}.","finalization-registry-not-supported":"FirebaseServerApp deleteOnDeref field defined but the JS runtime does not support FinalizationRegistry.","invalid-server-app-environment":"FirebaseServerApp is not for use in browser environments."},m=new M("app","Firebase",vn);/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Sn{constructor(t,n,r){this._isDeleted=!1,this._options=Object.assign({},t),this._config=Object.assign({},n),this._name=n.name,this._automaticDataCollectionEnabled=n.automaticDataCollectionEnabled,this._container=r,this.container.addComponent(new w("app",()=>this,"PUBLIC"))}get automaticDataCollectionEnabled(){return this.checkDestroyed(),this._automaticDataCollectionEnabled}set automaticDataCollectionEnabled(t){this.checkDestroyed(),this._automaticDataCollectionEnabled=t}get name(){return this.checkDestroyed(),this._name}get options(){return this.checkDestroyed(),this._options}get config(){return this.checkDestroyed(),this._config}get container(){return this._container}get isDeleted(){return this._isDeleted}set isDeleted(t){this._isDeleted=t}checkDestroyed(){if(this.isDeleted)throw m.create("app-deleted",{appName:this._name})}}function Le(e,t={}){let n=e;typeof t!="object"&&(t={name:t});const r=Object.assign({name:X,automaticDataCollectionEnabled:!0},t),o=r.name;if(typeof o!="string"||!o)throw m.create("bad-app-name",{appName:String(o)});if(n||(n=Be()),!n)throw m.create("no-options");const i=N.get(o);if(i){if(z(n,i.options)&&z(r,i.config))return i;throw m.create("duplicate-app",{appName:o})}const a=new Ot(o);for(const c of Q.values())a.addComponent(c);const s=new Sn(n,r,a);return N.set(o,s),s}function Tn(e=X){const t=N.get(e);if(!t&&e===X&&Be())return Le();if(!t)throw m.create("no-app",{appName:e});return t}function b(e,t,n){var r;let o=(r=En[e])!==null&&r!==void 0?r:e;n&&(o+=`-${n}`);const i=o.match(/\s|\//),a=t.match(/\s|\//);if(i||a){const s=[`Unable to register library "${o}" with version "${t}":`];i&&s.push(`library name "${o}" contains illegal characters (whitespace or "/")`),i&&a&&s.push("and"),a&&s.push(`version name "${t}" contains illegal characters (whitespace or "/")`),g.warn(s.join(" "));return}E(new w(`${o}-version`,()=>({library:o,version:t}),"VERSION"))}/**
 * @license
 * Copyright 2021 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const An="firebase-heartbeat-database",Dn=1,A="firebase-heartbeat-store";let x=null;function Fe(){return x||(x=R(An,Dn,{upgrade:(e,t)=>{switch(t){case 0:try{e.createObjectStore(A)}catch(n){console.warn(n)}}}}).catch(e=>{throw m.create("idb-open",{originalErrorMessage:e.message})})),x}async function Cn(e){try{const n=(await Fe()).transaction(A),r=await n.objectStore(A).get(He(e));return await n.done,r}catch(t){if(t instanceof S)g.warn(t.message);else{const n=m.create("idb-get",{originalErrorMessage:t==null?void 0:t.message});g.warn(n.message)}}}async function be(e,t){try{const r=(await Fe()).transaction(A,"readwrite");await r.objectStore(A).put(t,He(e)),await r.done}catch(n){if(n instanceof S)g.warn(n.message);else{const r=m.create("idb-set",{originalErrorMessage:n==null?void 0:n.message});g.warn(r.message)}}}function He(e){return`${e.name}!${e.options.appId}`}/**
 * @license
 * Copyright 2021 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const kn=1024,On=30;class Nn{constructor(t){this.container=t,this._heartbeatsCache=null;const n=this.container.getProvider("app").getImmediate();this._storage=new Mn(n),this._heartbeatsCachePromise=this._storage.read().then(r=>(this._heartbeatsCache=r,r))}async triggerHeartbeat(){var t,n;try{const o=this.container.getProvider("platform-logger").getImmediate().getPlatformInfoString(),i=we();if(((t=this._heartbeatsCache)===null||t===void 0?void 0:t.heartbeats)==null&&(this._heartbeatsCache=await this._heartbeatsCachePromise,((n=this._heartbeatsCache)===null||n===void 0?void 0:n.heartbeats)==null)||this._heartbeatsCache.lastSentHeartbeatDate===i||this._heartbeatsCache.heartbeats.some(a=>a.date===i))return;if(this._heartbeatsCache.heartbeats.push({date:i,agent:o}),this._heartbeatsCache.heartbeats.length>On){const a=Rn(this._heartbeatsCache.heartbeats);this._heartbeatsCache.heartbeats.splice(a,1)}return this._storage.overwrite(this._heartbeatsCache)}catch(r){g.warn(r)}}async getHeartbeatsHeader(){var t;try{if(this._heartbeatsCache===null&&await this._heartbeatsCachePromise,((t=this._heartbeatsCache)===null||t===void 0?void 0:t.heartbeats)==null||this._heartbeatsCache.heartbeats.length===0)return"";const n=we(),{heartbeatsToSend:r,unsentEntries:o}=Bn(this._heartbeatsCache.heartbeats),i=Ne(JSON.stringify({version:2,heartbeats:r}));return this._heartbeatsCache.lastSentHeartbeatDate=n,o.length>0?(this._heartbeatsCache.heartbeats=o,await this._storage.overwrite(this._heartbeatsCache)):(this._heartbeatsCache.heartbeats=[],this._storage.overwrite(this._heartbeatsCache)),i}catch(n){return g.warn(n),""}}}function we(){return new Date().toISOString().substring(0,10)}function Bn(e,t=kn){const n=[];let r=e.slice();for(const o of e){const i=n.find(a=>a.agent===o.agent);if(i){if(i.dates.push(o.date),ye(n)>t){i.dates.pop();break}}else if(n.push({agent:o.agent,dates:[o.date]}),ye(n)>t){n.pop();break}r=r.slice(1)}return{heartbeatsToSend:n,unsentEntries:r}}class Mn{constructor(t){this.app=t,this._canUseIndexedDBPromise=this.runIndexedDBEnvironmentCheck()}async runIndexedDBEnvironmentCheck(){return Me()?Re().then(()=>!0).catch(()=>!1):!1}async read(){if(await this._canUseIndexedDBPromise){const n=await Cn(this.app);return n!=null&&n.heartbeats?n:{heartbeats:[]}}else return{heartbeats:[]}}async overwrite(t){var n;if(await this._canUseIndexedDBPromise){const o=await this.read();return be(this.app,{lastSentHeartbeatDate:(n=t.lastSentHeartbeatDate)!==null&&n!==void 0?n:o.lastSentHeartbeatDate,heartbeats:t.heartbeats})}else return}async add(t){var n;if(await this._canUseIndexedDBPromise){const o=await this.read();return be(this.app,{lastSentHeartbeatDate:(n=t.lastSentHeartbeatDate)!==null&&n!==void 0?n:o.lastSentHeartbeatDate,heartbeats:[...o.heartbeats,...t.heartbeats]})}else return}}function ye(e){return Ne(JSON.stringify({version:2,heartbeats:e})).length}function Rn(e){if(e.length===0)return-1;let t=0,n=e[0].date;for(let r=1;r<e.length;r++)e[r].date<n&&(n=e[r].date,t=r);return t}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function Pn(e){E(new w("platform-logger",t=>new qt(t),"PRIVATE")),E(new w("heartbeat",t=>new Nn(t),"PRIVATE")),b(Y,ge,e),b(Y,ge,"esm2017"),b("fire-js","")}Pn("");var $n="firebase",Ln="11.10.0";/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */b($n,Ln,"app");const je="@firebase/installations",re="0.6.18";/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const xe=1e4,Ve=`w:${re}`,Ue="FIS_v2",Fn="https://firebaseinstallations.googleapis.com/v1",Hn=3600*1e3,jn="installations",xn="Installations";/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Vn={"missing-app-config-values":'Missing App configuration value: "{$valueName}"',"not-registered":"Firebase Installation is not registered.","installation-not-found":"Firebase Installation not found.","request-failed":'{$requestName} request failed with error "{$serverCode} {$serverStatus}: {$serverMessage}"',"app-offline":"Could not process request. Application offline.","delete-pending-registration":"Can't delete installation while there is a pending registration request."},_=new M(jn,xn,Vn);function Ke(e){return e instanceof S&&e.code.includes("request-failed")}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function We({projectId:e}){return`${Fn}/projects/${e}/installations`}function qe(e){return{token:e.token,requestStatus:2,expiresIn:Kn(e.expiresIn),creationTime:Date.now()}}async function ze(e,t){const r=(await t.json()).error;return _.create("request-failed",{requestName:e,serverCode:r.code,serverMessage:r.message,serverStatus:r.status})}function Ge({apiKey:e}){return new Headers({"Content-Type":"application/json",Accept:"application/json","x-goog-api-key":e})}function Un(e,{refreshToken:t}){const n=Ge(e);return n.append("Authorization",Wn(t)),n}async function Je(e){const t=await e();return t.status>=500&&t.status<600?e():t}function Kn(e){return Number(e.replace("s","000"))}function Wn(e){return`${Ue} ${e}`}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function qn({appConfig:e,heartbeatServiceProvider:t},{fid:n}){const r=We(e),o=Ge(e),i=t.getImmediate({optional:!0});if(i){const u=await i.getHeartbeatsHeader();u&&o.append("x-firebase-client",u)}const a={fid:n,authVersion:Ue,appId:e.appId,sdkVersion:Ve},s={method:"POST",headers:o,body:JSON.stringify(a)},c=await Je(()=>fetch(r,s));if(c.ok){const u=await c.json();return{fid:u.fid||n,registrationStatus:2,refreshToken:u.refreshToken,authToken:qe(u.authToken)}}else throw await ze("Create Installation",c)}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function Ye(e){return new Promise(t=>{setTimeout(t,e)})}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function zn(e){return btoa(String.fromCharCode(...e)).replace(/\+/g,"-").replace(/\//g,"_")}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Gn=/^[cdef][\w-]{21}$/,Z="";function Jn(){try{const e=new Uint8Array(17);(self.crypto||self.msCrypto).getRandomValues(e),e[0]=112+e[0]%16;const n=Yn(e);return Gn.test(n)?n:Z}catch{return Z}}function Yn(e){return zn(e).substr(0,22)}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function P(e){return`${e.appName}!${e.appId}`}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Xe=new Map;function Qe(e,t){const n=P(e);Ze(n,t),Xn(n,t)}function Ze(e,t){const n=Xe.get(e);if(n)for(const r of n)r(t)}function Xn(e,t){const n=Qn();n&&n.postMessage({key:e,fid:t}),Zn()}let I=null;function Qn(){return!I&&"BroadcastChannel"in self&&(I=new BroadcastChannel("[Firebase] FID Change"),I.onmessage=e=>{Ze(e.data.key,e.data.fid)}),I}function Zn(){Xe.size===0&&I&&(I.close(),I=null)}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const er="firebase-installations-database",tr=1,v="firebase-installations-store";let V=null;function oe(){return V||(V=R(er,tr,{upgrade:(e,t)=>{switch(t){case 0:e.createObjectStore(v)}}})),V}async function B(e,t){const n=P(e),o=(await oe()).transaction(v,"readwrite"),i=o.objectStore(v),a=await i.get(n);return await i.put(t,n),await o.done,(!a||a.fid!==t.fid)&&Qe(e,t.fid),t}async function et(e){const t=P(e),r=(await oe()).transaction(v,"readwrite");await r.objectStore(v).delete(t),await r.done}async function $(e,t){const n=P(e),o=(await oe()).transaction(v,"readwrite"),i=o.objectStore(v),a=await i.get(n),s=t(a);return s===void 0?await i.delete(n):await i.put(s,n),await o.done,s&&(!a||a.fid!==s.fid)&&Qe(e,s.fid),s}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function ie(e){let t;const n=await $(e.appConfig,r=>{const o=nr(r),i=rr(e,o);return t=i.registrationPromise,i.installationEntry});return n.fid===Z?{installationEntry:await t}:{installationEntry:n,registrationPromise:t}}function nr(e){const t=e||{fid:Jn(),registrationStatus:0};return tt(t)}function rr(e,t){if(t.registrationStatus===0){if(!navigator.onLine){const o=Promise.reject(_.create("app-offline"));return{installationEntry:t,registrationPromise:o}}const n={fid:t.fid,registrationStatus:1,registrationTime:Date.now()},r=or(e,n);return{installationEntry:n,registrationPromise:r}}else return t.registrationStatus===1?{installationEntry:t,registrationPromise:ir(e)}:{installationEntry:t}}async function or(e,t){try{const n=await qn(e,t);return B(e.appConfig,n)}catch(n){throw Ke(n)&&n.customData.serverCode===409?await et(e.appConfig):await B(e.appConfig,{fid:t.fid,registrationStatus:0}),n}}async function ir(e){let t=await Ie(e.appConfig);for(;t.registrationStatus===1;)await Ye(100),t=await Ie(e.appConfig);if(t.registrationStatus===0){const{installationEntry:n,registrationPromise:r}=await ie(e);return r||n}return t}function Ie(e){return $(e,t=>{if(!t)throw _.create("installation-not-found");return tt(t)})}function tt(e){return ar(e)?{fid:e.fid,registrationStatus:0}:e}function ar(e){return e.registrationStatus===1&&e.registrationTime+xe<Date.now()}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function sr({appConfig:e,heartbeatServiceProvider:t},n){const r=cr(e,n),o=Un(e,n),i=t.getImmediate({optional:!0});if(i){const u=await i.getHeartbeatsHeader();u&&o.append("x-firebase-client",u)}const a={installation:{sdkVersion:Ve,appId:e.appId}},s={method:"POST",headers:o,body:JSON.stringify(a)},c=await Je(()=>fetch(r,s));if(c.ok){const u=await c.json();return qe(u)}else throw await ze("Generate Auth Token",c)}function cr(e,{fid:t}){return`${We(e)}/${t}/authTokens:generate`}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function ae(e,t=!1){let n;const r=await $(e.appConfig,i=>{if(!nt(i))throw _.create("not-registered");const a=i.authToken;if(!t&&lr(a))return i;if(a.requestStatus===1)return n=dr(e,t),i;{if(!navigator.onLine)throw _.create("app-offline");const s=hr(i);return n=ur(e,s),s}});return n?await n:r.authToken}async function dr(e,t){let n=await Ee(e.appConfig);for(;n.authToken.requestStatus===1;)await Ye(100),n=await Ee(e.appConfig);const r=n.authToken;return r.requestStatus===0?ae(e,t):r}function Ee(e){return $(e,t=>{if(!nt(t))throw _.create("not-registered");const n=t.authToken;return pr(n)?Object.assign(Object.assign({},t),{authToken:{requestStatus:0}}):t})}async function ur(e,t){try{const n=await sr(e,t),r=Object.assign(Object.assign({},t),{authToken:n});return await B(e.appConfig,r),n}catch(n){if(Ke(n)&&(n.customData.serverCode===401||n.customData.serverCode===404))await et(e.appConfig);else{const r=Object.assign(Object.assign({},t),{authToken:{requestStatus:0}});await B(e.appConfig,r)}throw n}}function nt(e){return e!==void 0&&e.registrationStatus===2}function lr(e){return e.requestStatus===2&&!fr(e)}function fr(e){const t=Date.now();return t<e.creationTime||e.creationTime+e.expiresIn<t+Hn}function hr(e){const t={requestStatus:1,requestTime:Date.now()};return Object.assign(Object.assign({},e),{authToken:t})}function pr(e){return e.requestStatus===1&&e.requestTime+xe<Date.now()}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function gr(e){const t=e,{installationEntry:n,registrationPromise:r}=await ie(t);return r?r.catch(console.error):ae(t).catch(console.error),n.fid}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function mr(e,t=!1){const n=e;return await br(n),(await ae(n,t)).token}async function br(e){const{registrationPromise:t}=await ie(e);t&&await t}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function wr(e){if(!e||!e.options)throw U("App Configuration");if(!e.name)throw U("App Name");const t=["projectId","apiKey","appId"];for(const n of t)if(!e.options[n])throw U(n);return{appName:e.name,projectId:e.options.projectId,apiKey:e.options.apiKey,appId:e.options.appId}}function U(e){return _.create("missing-app-config-values",{valueName:e})}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const rt="installations",yr="installations-internal",Ir=e=>{const t=e.getProvider("app").getImmediate(),n=wr(t),r=ne(t,"heartbeat");return{app:t,appConfig:n,heartbeatServiceProvider:r,_delete:()=>Promise.resolve()}},Er=e=>{const t=e.getProvider("app").getImmediate(),n=ne(t,rt).getImmediate();return{getId:()=>gr(n),getToken:o=>mr(n,o)}};function _r(){E(new w(rt,Ir,"PUBLIC")),E(new w(yr,Er,"PRIVATE"))}_r();b(je,re);b(je,re,"esm2017");/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const vr="/firebase-messaging-sw.js",Sr="/firebase-cloud-messaging-push-scope",ot="BDOU99-h67HcA6JeFXHbSNMu7e2yNNu3RzoMj8TM4W88jITfq7ZmPvIM1Iv-4_l2LxQcYwhqby2xGpWwzjfAnG4",Tr="https://fcmregistrations.googleapis.com/v1",it="google.c.a.c_id",Ar="google.c.a.c_l",Dr="google.c.a.ts",Cr="google.c.a.e",_e=1e4;var ve;(function(e){e[e.DATA_MESSAGE=1]="DATA_MESSAGE",e[e.DISPLAY_NOTIFICATION=3]="DISPLAY_NOTIFICATION"})(ve||(ve={}));/**
 * @license
 * Copyright 2018 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except
 * in compliance with the License. You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under the License
 * is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express
 * or implied. See the License for the specific language governing permissions and limitations under
 * the License.
 */var D;(function(e){e.PUSH_RECEIVED="push-received",e.NOTIFICATION_CLICKED="notification-clicked"})(D||(D={}));/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function h(e){const t=new Uint8Array(e);return btoa(String.fromCharCode(...t)).replace(/=/g,"").replace(/\+/g,"-").replace(/\//g,"_")}function kr(e){const t="=".repeat((4-e.length%4)%4),n=(e+t).replace(/\-/g,"+").replace(/_/g,"/"),r=atob(n),o=new Uint8Array(r.length);for(let i=0;i<r.length;++i)o[i]=r.charCodeAt(i);return o}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const K="fcm_token_details_db",Or=5,Se="fcm_token_object_Store";async function Nr(e){if("databases"in indexedDB&&!(await indexedDB.databases()).map(i=>i.name).includes(K))return null;let t=null;return(await R(K,Or,{upgrade:async(r,o,i,a)=>{var s;if(o<2||!r.objectStoreNames.contains(Se))return;const c=a.objectStore(Se),u=await c.index("fcmSenderId").get(e);if(await c.clear(),!!u){if(o===2){const d=u;if(!d.auth||!d.p256dh||!d.endpoint)return;t={token:d.fcmToken,createTime:(s=d.createTime)!==null&&s!==void 0?s:Date.now(),subscriptionOptions:{auth:d.auth,p256dh:d.p256dh,endpoint:d.endpoint,swScope:d.swScope,vapidKey:typeof d.vapidKey=="string"?d.vapidKey:h(d.vapidKey)}}}else if(o===3){const d=u;t={token:d.fcmToken,createTime:d.createTime,subscriptionOptions:{auth:h(d.auth),p256dh:h(d.p256dh),endpoint:d.endpoint,swScope:d.swScope,vapidKey:h(d.vapidKey)}}}else if(o===4){const d=u;t={token:d.fcmToken,createTime:d.createTime,subscriptionOptions:{auth:h(d.auth),p256dh:h(d.p256dh),endpoint:d.endpoint,swScope:d.swScope,vapidKey:h(d.vapidKey)}}}}}})).close(),await H(K),await H("fcm_vapid_details_db"),await H("undefined"),Br(t)?t:null}function Br(e){if(!e||!e.subscriptionOptions)return!1;const{subscriptionOptions:t}=e;return typeof e.createTime=="number"&&e.createTime>0&&typeof e.token=="string"&&e.token.length>0&&typeof t.auth=="string"&&t.auth.length>0&&typeof t.p256dh=="string"&&t.p256dh.length>0&&typeof t.endpoint=="string"&&t.endpoint.length>0&&typeof t.swScope=="string"&&t.swScope.length>0&&typeof t.vapidKey=="string"&&t.vapidKey.length>0}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Mr="firebase-messaging-database",Rr=1,C="firebase-messaging-store";let W=null;function at(){return W||(W=R(Mr,Rr,{upgrade:(e,t)=>{switch(t){case 0:e.createObjectStore(C)}}})),W}async function Pr(e){const t=st(e),r=await(await at()).transaction(C).objectStore(C).get(t);if(r)return r;{const o=await Nr(e.appConfig.senderId);if(o)return await se(e,o),o}}async function se(e,t){const n=st(e),o=(await at()).transaction(C,"readwrite");return await o.objectStore(C).put(t,n),await o.done,t}function st({appConfig:e}){return e.appId}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const $r={"missing-app-config-values":'Missing App configuration value: "{$valueName}"',"only-available-in-window":"This method is available in a Window context.","only-available-in-sw":"This method is available in a service worker context.","permission-default":"The notification permission was not granted and dismissed instead.","permission-blocked":"The notification permission was not granted and blocked instead.","unsupported-browser":"This browser doesn't support the API's required to use the Firebase SDK.","indexed-db-unsupported":"This browser doesn't support indexedDb.open() (ex. Safari iFrame, Firefox Private Browsing, etc)","failed-service-worker-registration":"We are unable to register the default service worker. {$browserErrorMessage}","token-subscribe-failed":"A problem occurred while subscribing the user to FCM: {$errorInfo}","token-subscribe-no-token":"FCM returned no token when subscribing the user to push.","token-unsubscribe-failed":"A problem occurred while unsubscribing the user from FCM: {$errorInfo}","token-update-failed":"A problem occurred while updating the user from FCM: {$errorInfo}","token-update-no-token":"FCM returned no token when updating the user to push.","use-sw-after-get-token":"The useServiceWorker() method may only be called once and must be called before calling getToken() to ensure your service worker is used.","invalid-sw-registration":"The input to useServiceWorker() must be a ServiceWorkerRegistration.","invalid-bg-handler":"The input to setBackgroundMessageHandler() must be a function.","invalid-vapid-key":"The public VAPID key must be a string.","use-vapid-key-after-get-token":"The usePublicVapidKey() method may only be called once and must be called before calling getToken() to ensure your VAPID key is used."},f=new M("messaging","Messaging",$r);/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function Lr(e,t){const n=await de(e),r=ct(t),o={method:"POST",headers:n,body:JSON.stringify(r)};let i;try{i=await(await fetch(ce(e.appConfig),o)).json()}catch(a){throw f.create("token-subscribe-failed",{errorInfo:a==null?void 0:a.toString()})}if(i.error){const a=i.error.message;throw f.create("token-subscribe-failed",{errorInfo:a})}if(!i.token)throw f.create("token-subscribe-no-token");return i.token}async function Fr(e,t){const n=await de(e),r=ct(t.subscriptionOptions),o={method:"PATCH",headers:n,body:JSON.stringify(r)};let i;try{i=await(await fetch(`${ce(e.appConfig)}/${t.token}`,o)).json()}catch(a){throw f.create("token-update-failed",{errorInfo:a==null?void 0:a.toString()})}if(i.error){const a=i.error.message;throw f.create("token-update-failed",{errorInfo:a})}if(!i.token)throw f.create("token-update-no-token");return i.token}async function Hr(e,t){const r={method:"DELETE",headers:await de(e)};try{const i=await(await fetch(`${ce(e.appConfig)}/${t}`,r)).json();if(i.error){const a=i.error.message;throw f.create("token-unsubscribe-failed",{errorInfo:a})}}catch(o){throw f.create("token-unsubscribe-failed",{errorInfo:o==null?void 0:o.toString()})}}function ce({projectId:e}){return`${Tr}/projects/${e}/registrations`}async function de({appConfig:e,installations:t}){const n=await t.getToken();return new Headers({"Content-Type":"application/json",Accept:"application/json","x-goog-api-key":e.apiKey,"x-goog-firebase-installations-auth":`FIS ${n}`})}function ct({p256dh:e,auth:t,endpoint:n,vapidKey:r}){const o={web:{endpoint:n,auth:t,p256dh:e}};return r!==ot&&(o.web.applicationPubKey=r),o}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const jr=10080*60*1e3;async function xr(e){const t=await Ur(e.swRegistration,e.vapidKey),n={vapidKey:e.vapidKey,swScope:e.swRegistration.scope,endpoint:t.endpoint,auth:h(t.getKey("auth")),p256dh:h(t.getKey("p256dh"))},r=await Pr(e.firebaseDependencies);if(r){if(Kr(r.subscriptionOptions,n))return Date.now()>=r.createTime+jr?Vr(e,{token:r.token,createTime:Date.now(),subscriptionOptions:n}):r.token;try{await Hr(e.firebaseDependencies,r.token)}catch(o){console.warn(o)}return Te(e.firebaseDependencies,n)}else return Te(e.firebaseDependencies,n)}async function Vr(e,t){try{const n=await Fr(e.firebaseDependencies,t),r=Object.assign(Object.assign({},t),{token:n,createTime:Date.now()});return await se(e.firebaseDependencies,r),n}catch(n){throw n}}async function Te(e,t){const r={token:await Lr(e,t),createTime:Date.now(),subscriptionOptions:t};return await se(e,r),r.token}async function Ur(e,t){const n=await e.pushManager.getSubscription();return n||e.pushManager.subscribe({userVisibleOnly:!0,applicationServerKey:kr(t)})}function Kr(e,t){const n=t.vapidKey===e.vapidKey,r=t.endpoint===e.endpoint,o=t.auth===e.auth,i=t.p256dh===e.p256dh;return n&&r&&o&&i}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function Ae(e){const t={from:e.from,collapseKey:e.collapse_key,messageId:e.fcmMessageId};return Wr(t,e),qr(t,e),zr(t,e),t}function Wr(e,t){if(!t.notification)return;e.notification={};const n=t.notification.title;n&&(e.notification.title=n);const r=t.notification.body;r&&(e.notification.body=r);const o=t.notification.image;o&&(e.notification.image=o);const i=t.notification.icon;i&&(e.notification.icon=i)}function qr(e,t){t.data&&(e.data=t.data)}function zr(e,t){var n,r,o,i,a;if(!t.fcmOptions&&!(!((n=t.notification)===null||n===void 0)&&n.click_action))return;e.fcmOptions={};const s=(o=(r=t.fcmOptions)===null||r===void 0?void 0:r.link)!==null&&o!==void 0?o:(i=t.notification)===null||i===void 0?void 0:i.click_action;s&&(e.fcmOptions.link=s);const c=(a=t.fcmOptions)===null||a===void 0?void 0:a.analytics_label;c&&(e.fcmOptions.analyticsLabel=c)}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function Gr(e){return typeof e=="object"&&!!e&&it in e}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function Jr(e){if(!e||!e.options)throw q("App Configuration Object");if(!e.name)throw q("App Name");const t=["projectId","apiKey","appId","messagingSenderId"],{options:n}=e;for(const r of t)if(!n[r])throw q(r);return{appName:e.name,projectId:n.projectId,apiKey:n.apiKey,appId:n.appId,senderId:n.messagingSenderId}}function q(e){return f.create("missing-app-config-values",{valueName:e})}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Yr{constructor(t,n,r){this.deliveryMetricsExportedToBigQueryEnabled=!1,this.onBackgroundMessageHandler=null,this.onMessageHandler=null,this.logEvents=[],this.isLogServiceStarted=!1;const o=Jr(t);this.firebaseDependencies={app:t,appConfig:o,installations:n,analyticsProvider:r}}_delete(){return Promise.resolve()}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function Xr(e){try{e.swRegistration=await navigator.serviceWorker.register(vr,{scope:Sr}),e.swRegistration.update().catch(()=>{}),await Qr(e.swRegistration)}catch(t){throw f.create("failed-service-worker-registration",{browserErrorMessage:t==null?void 0:t.message})}}async function Qr(e){return new Promise((t,n)=>{const r=setTimeout(()=>n(new Error(`Service worker not registered after ${_e} ms`)),_e),o=e.installing||e.waiting;e.active?(clearTimeout(r),t()):o?o.onstatechange=i=>{var a;((a=i.target)===null||a===void 0?void 0:a.state)==="activated"&&(o.onstatechange=null,clearTimeout(r),t())}:(clearTimeout(r),n(new Error("No incoming service worker found.")))})}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function Zr(e,t){if(!t&&!e.swRegistration&&await Xr(e),!(!t&&e.swRegistration)){if(!(t instanceof ServiceWorkerRegistration))throw f.create("invalid-sw-registration");e.swRegistration=t}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function eo(e,t){t?e.vapidKey=t:e.vapidKey||(e.vapidKey=ot)}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function dt(e,t){if(!navigator)throw f.create("only-available-in-window");if(Notification.permission==="default"&&await Notification.requestPermission(),Notification.permission!=="granted")throw f.create("permission-blocked");return await eo(e,t==null?void 0:t.vapidKey),await Zr(e,t==null?void 0:t.serviceWorkerRegistration),xr(e)}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function to(e,t,n){const r=no(t);(await e.firebaseDependencies.analyticsProvider.get()).logEvent(r,{message_id:n[it],message_name:n[Ar],message_time:n[Dr],message_device_time:Math.floor(Date.now()/1e3)})}function no(e){switch(e){case D.NOTIFICATION_CLICKED:return"notification_open";case D.PUSH_RECEIVED:return"notification_foreground";default:throw new Error}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function ro(e,t){const n=t.data;if(!n.isFirebaseMessaging)return;e.onMessageHandler&&n.messageType===D.PUSH_RECEIVED&&(typeof e.onMessageHandler=="function"?e.onMessageHandler(Ae(n)):e.onMessageHandler.next(Ae(n)));const r=n.data;Gr(r)&&r[Cr]==="1"&&await to(e,n.messageType,r)}const De="@firebase/messaging",Ce="0.12.22";/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const oo=e=>{const t=new Yr(e.getProvider("app").getImmediate(),e.getProvider("installations-internal").getImmediate(),e.getProvider("analytics-internal"));return navigator.serviceWorker.addEventListener("message",n=>ro(t,n)),t},io=e=>{const t=e.getProvider("messaging").getImmediate();return{getToken:r=>dt(t,r)}};function ao(){E(new w("messaging",oo,"PUBLIC")),E(new w("messaging-internal",io,"PRIVATE")),b(De,Ce),b(De,Ce,"esm2017")}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function so(){try{await Re()}catch{return!1}return typeof window<"u"&&Me()&&vt()&&"serviceWorker"in navigator&&"PushManager"in window&&"Notification"in window&&"fetch"in window&&ServiceWorkerRegistration.prototype.hasOwnProperty("showNotification")&&PushSubscription.prototype.hasOwnProperty("getKey")}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function co(e,t){if(!navigator)throw f.create("only-available-in-window");return e.onMessageHandler=t,()=>{e.onMessageHandler=null}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function uo(e=Tn()){return so().then(t=>{if(!t)throw f.create("unsupported-browser")},t=>{throw f.create("indexed-db-unsupported")}),ne(ee(e),"messaging").getImmediate()}async function lo(e,t){return e=ee(e),dt(e,t)}function fo(e,t){return e=ee(e),co(e,t)}ao();const ho={apiKey:"AIzaSyCwfSbrgNYCrhdmFIlU7pS7bVVT__lwOgo",authDomain:"dbedc-erp.firebaseapp.com",projectId:"dbedc-erp",storageBucket:"dbedc-erp.firebasestorage.app",messagingSenderId:"551140686722",appId:"1:551140686722:web:d99b8829aad35e60232d9b",measurementId:"G-GRR20JHLW3"},po=Le(ho),ut=uo(po),go=async()=>{try{const t=await lo(ut,{vapidKey:"BIB_ue-OutyDEoIxodVhJkdkmUif0C_4pOjd6CCK5U1FxicXrzSh1m8oHjm5su8jCELdd0osPgEdd_7DeYk2JxI"});if(t)return t;console.error("No registration token available")}catch(e){console.error("An error occurred while retrieving token:",e)}},mo=()=>new Promise(e=>{fo(ut,t=>{e(t)})});export{mo as onMessageListener,go as requestNotificationPermission};
