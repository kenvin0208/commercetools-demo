import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import ts from 'typescript';
import { createRequire } from 'node:module';
const requireDependency = createRequire(import.meta.url);

// Compile the real TypeScript modules and replace only framework/network edges.
// This suite never talks to the configured commercetools project or sends mail.
function load(file, mocks = {}) {
  const filename = path.resolve(file);
  const source = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
  }).outputText;
  const compiledModule = { exports: {} };
  const localRequire = name => {
    if (Object.hasOwn(mocks, name)) return mocks[name];
    if (name === 'server-only') return {};
    if (name.startsWith('.')) return load(path.resolve(path.dirname(filename), `${name}.ts`), mocks);
    return requireDependency(name);
  };
  const context = vm.createContext({ module: compiledModule, exports: compiledModule.exports, require: localRequire,
    console: { ...console, error() {} }, process, Buffer, URL, URLSearchParams, FormData, Request, Response,
    AbortSignal, fetch: mocks.fetch ?? fetch, setTimeout, clearTimeout,
  });
  new vm.Script(source, { filename }).runInContext(context);
  return compiledModule.exports;
}
const validation = load('src/lib/account/validation.ts');
const form = values => { const data = new FormData(); for (const [key, value] of Object.entries(values)) data.set(key, String(value)); return data; };
const address = { firstName: 'Lan', lastName: 'Nguyen', streetName: '123 Main Street', city: 'Ho Chi Minh City', country: 'VN', phone: '+84 901234567' };
const customer = { id: 'customer-a', version: 4, email: 'lan@example.com', firstName: 'Lan', lastName: 'Nguyen', addresses: [{ id: 'address-a', ...address, company: 'Keep this company' }], defaultShippingAddressId: 'address-a' };
const list = { id: 'list-a', version: 2, lineItems: [] };
function harness(options = {}) {
  const calls = [];
  const identity = options.customer === undefined ? customer : options.customer;
  function api(scope, segments = []) {
    return new Proxy({}, { get(_, method) {
      if (method === 'then') return undefined;
      if (method === 'execute') return async () => {
        const request = { scope, segments };
        calls.push(request);
        if (options.respond) return { body: await options.respond(request) };
        const route = segments.map(([name]) => name).join('/');
        if (route.includes('shoppingLists/get')) return { body: { results: [list] } };
        if (route.includes('passwordToken')) return { body: { value: 'one-use-token' } };
        if (scope === 'me' && route === 'get') return { body: identity };
        return { body: identity };
      };
      return (...args) => api(scope, [...segments, [method, ...args]]);
    } });
  }
  const redirect = url => { throw Object.assign(new Error('REDIRECT'), { url }); };
  const mocks = {
    'next/cache': { revalidatePath: route => calls.push({ revalidate: route }) },
    'next/navigation': { redirect },
    '@/src/lib/commercetools/client': { apiRoot: api('admin') },
    './session': {
      currentCustomer: async () => identity,
      customerApi: async () => { if (!identity) throw Object.assign(new Error('Unauthenticated'), { statusCode: 401 }); return api('me'); },
      startCustomerSession: async (...args) => calls.push({ login: args }),
      clearCustomerSession: async () => calls.push({ logout: true }),
    },
    './email': { resetEmailConfiguration() {}, sendPasswordResetEmail: async (...args) => calls.push({ email: args }) },
    './rate-limit': { limitAccountAttempts() {} },
  };
  const actions = load('src/lib/account/actions.ts', mocks);
  return { actions, calls };
}
function bodyOf(call) { return call.segments.find(([name]) => name === 'post')[1].body; }

test('rejects open redirects and accepts local return paths', () => {
  for (const value of ['https://evil.test', '//evil.test', '/\\evil.test', '/\nevil.test', '/account/login', null]) assert.equal(validation.safeReturnTo(value), '/account/profile');
  assert.equal(validation.safeReturnTo('/products/abc?color=blue'), '/products/abc?color=blue');
});
test('validates dates, email, password confirmation and quantities on server', () => {
  for (const date of ['2025-02-30', '2100-01-01', 'not-a-date']) assert.throws(() => validation.dateOfBirthField(form({ dateOfBirth: date })));
  assert.equal(validation.dateOfBirthField(form({ dateOfBirth: '2000-02-29' })), '2000-02-29');
  assert.equal(validation.dateOfBirthField(form({ dateOfBirth: '' })), undefined);
  assert.throws(() => validation.emailField(form({ email: 'bad' })));
  assert.throws(() => validation.passwordField(form({ password: 'abc' })));
  assert.throws(() => validation.passwordField(form({ password: 'password123', confirmPassword: 'different' }), 'password', true));
  assert.equal(validation.passwordField(form({ password: '  password  ' })), '  password  ');
  for (const quantity of [0, -1, 1.5, 'NaN', 1000]) assert.throws(() => validation.positiveInteger(form({ quantity }), 'quantity'));
});
test('validates registration address and phone', () => {
  const parsed = validation.addressFields(form(address));
  assert.equal(parsed.country, 'VN');
  assert.throws(() => validation.addressFields(form({ ...address, country: 'XX' })));
  assert.throws(() => validation.addressFields(form({ ...address, phone: 'not-a-number' })));
});
test('registration sends complete customer data and redirects to sign in', async () => {
  const { actions, calls } = harness();
  await assert.rejects(actions.registerAction({}, form({ ...address, email: 'LAN@example.com', password: 'password123', confirmPassword: 'password123' })), error => error.url === '/account/login?registered=1');
  const body = bodyOf(calls.find(call => call.scope === 'admin'));
  assert.equal(body.email, 'lan@example.com');
  assert.equal(body.addresses[0].phone, address.phone);
  assert.equal(body.defaultShippingAddress, 0);
  assert.equal(body.defaultBillingAddress, 0);
});
test('invalid signup makes no API request', async () => {
  const { actions, calls } = harness();
  const result = await actions.registerAction({}, form({ ...address, email: 'not-an-email', password: 'password123' }));
  assert.ok(result.error); assert.equal(calls.length, 0);
});
test('sign in keeps legacy passwords intact and sanitizes return URLs', async () => {
  const { actions, calls } = harness();
  await assert.rejects(actions.signInAction({}, form({ email: 'lan@example.com', password: ' abc ', returnTo: '//evil.test' })), error => error.url === '/account/profile');
  assert.equal(calls[0].login[1], ' abc ');
});
test('profile updates use customer-scoped API and supplied version', async () => {
  const { actions, calls } = harness();
  const result = await actions.updateProfileAction({}, form({ firstName: 'New', lastName: 'Name', dateOfBirth: '1990-01-01', version: 4, customerId: 'victim' }));
  assert.ok(result.success);
  const request = calls.find(call => call.scope);
  assert.equal(request.scope, 'me');
  assert.equal(bodyOf(request).version, 4);
  assert.equal(bodyOf(request).actions[2].dateOfBirth, '1990-01-01');
});
test('unauthenticated writes fail without privileged access', async () => {
  const { actions, calls } = harness({ customer: null });
  const result = await actions.updateProfileAction({}, form({ firstName: 'New', lastName: 'Name', version: 4 }));
  assert.match(result.error, /session/);
  assert.equal(calls.length, 0);
});
test('editing addresses preserves other integration fields and checks ownership', async () => {
  const { actions, calls } = harness();
  const result = await actions.saveAddressAction({}, form({ ...address, streetName: 'New Street', addressId: 'address-a', version: 4 }));
  assert.ok(result.success);
  const body = bodyOf(calls.find(call => call.segments?.some(([method]) => method === 'post')));
  assert.equal(body.actions[0].address.company, 'Keep this company');
  assert.equal(body.actions[0].address.streetName, 'New Street');
  const bad = await actions.saveAddressAction({}, form({ ...address, addressId: 'victim-address', version: 4 }));
  assert.equal(bad.error, 'Address not found.');
});
test('address operations are allowlisted and cannot target another customer', async () => {
  const { actions, calls } = harness();
  assert.ok((await actions.addressAction({}, form({ addressId: 'address-a', operation: 'deleteCustomer', version: 4 }))).error);
  assert.equal(calls.length, 0);
  assert.ok((await actions.addressAction({}, form({ addressId: 'victim-address', operation: 'removeAddress', version: 4 }))).error);
  assert.ok(!calls.some(call => call.segments?.some(([name]) => name === 'post')));
});
test('password change uses current password and clears session only on success', async () => {
  const { actions, calls } = harness();
  await assert.rejects(actions.changePasswordAction({}, form({ currentPassword: 'old12345', newPassword: 'new12345', confirmPassword: 'new12345', version: 4 })), error => error.url === '/account/login?changed=1');
  assert.equal(bodyOf(calls.find(call => call.scope)).currentPassword, 'old12345');
  assert.ok(calls.some(call => call.logout));
});
test('forgot password sends token only by email and uses short lifetime', async () => {
  const { actions, calls } = harness();
  const result = await actions.forgotPasswordAction({}, form({ email: 'lan@example.com' }));
  assert.ok(result.success);
  assert.ok(!JSON.stringify(result).includes('one-use-token'));
  assert.equal(bodyOf(calls.find(call => call.scope)).ttlMinutes, 30);
  assert.equal(calls.find(call => call.email).email[1], 'one-use-token');
});
test('unknown email has the same reset response', async () => {
  const existing = await harness().actions.forgotPasswordAction({}, form({ email: 'lan@example.com' }));
  const absent = await harness({ respond: () => { throw { statusCode: 404 }; } }).actions.forgotPasswordAction({}, form({ email: 'absent@example.com' }));
  assert.equal(existing.success, absent.success);
});
test('reset handles expired tokens and never logs in with a reset token', async () => {
  const { actions, calls } = harness({ respond: () => { throw { statusCode: 400 }; } });
  const result = await actions.resetPasswordAction({}, form({ token: 'expired', newPassword: 'new12345', confirmPassword: 'new12345' }));
  assert.match(result.error, /invalid or expired/);
  assert.ok(!calls.some(call => call.login || call.logout));
});
test('wishlist add is customer-scoped and repeated favorites do not increment quantity', async () => {
  const productId = '12345678-1234-1234-8123-123456789abc';
  const { actions, calls } = harness({ respond: request => {
    if (request.segments.some(([name]) => name === 'get')) return { results: [{ ...list, lineItems: [{ productId, variantId: 1 }] }] };
    throw new Error('Duplicate favorite must not be written');
  } });
  const result = await actions.addToWishlistAction({}, form({ productId, variantId: 1 }));
  assert.equal(result.success, 'Already in your wishlist.');
  assert.ok(calls.every(call => call.scope === 'me'));
});
test('wishlist update cannot switch to privileged API when IDs are tampered with', async () => {
  const { actions, calls } = harness({ respond: () => { throw { statusCode: 404 }; } });
  const result = await actions.updateWishlistAction({}, form({ listId: 'victim-list', lineItemId: 'victim-item', version: 1, operation: 'quantity', quantity: 2 }));
  assert.ok(result.error);
  assert.equal(calls[0].scope, 'me');
});
test('concurrent updates show a refresh instruction', async () => {
  const { actions } = harness({ respond: () => { throw { statusCode: 409 }; } });
  const result = await actions.updateProfileAction({}, form({ firstName: 'New', lastName: 'Name', version: 1 }));
  assert.match(result.error, /Refresh/);
});
test('checkout binds customer ID, email and saved addresses to the real session', () => {
  const { customerCartFields } = load('src/lib/account/checkout.ts');
  const fields = customerCartFields(customer, 'US');
  assert.equal(fields.customerId, customer.id);
  assert.equal(fields.country, 'VN');
  assert.equal(fields.shippingAddress.id, undefined);
  assert.equal(fields.shippingAddress.email, customer.email);
  const empty = customerCartFields({ ...customer, addresses: [] }, 'DE');
  assert.equal(empty.country, 'DE');
  assert.equal(empty.shippingAddress.firstName, customer.firstName);
  assert.equal(empty.customerEmail, customer.email);
});

test('order details verify ownership before privileged expansions', async () => {
  let privilegedReads = 0;
  const orderId = '12345678-1234-1234-8123-123456789abc';
  const denied = () => { throw Object.assign(new Error('Not found'), { statusCode: 404 }); };
  const adminApi = { orders: () => ({ withId: () => ({ get: () => ({ execute: async () => { privilegedReads++; return { body: { id: orderId, customerId: customer.id } }; } }) }) }) };
  for (const returnedOwner of ['other-customer', customer.id]) {
    const queries = load('src/lib/account/queries.ts', {
      '@/src/lib/commercetools/client': { apiRoot: adminApi },
      'next/navigation': { notFound: denied },
      './session': { requireCustomer: async () => customer, customerApi: async () => ({ orders: () => ({ withId: () => ({ get: () => ({ execute: async () => ({ body: { id: orderId, customerId: returnedOwner } }) }) }) }) }) },
    });
    if (returnedOwner === customer.id) assert.equal((await queries.customerOrder(orderId)).id, orderId);
    else { await assert.rejects(queries.customerOrder(orderId)); assert.equal(privilegedReads, 0); }
  }
  assert.equal(privilegedReads, 1);
});

test('customer sessions use restricted tokens, HttpOnly cookies and logout revocation', async () => {
  const original = { ...process.env };
  Object.assign(process.env, { CT_PROJECT_KEY: 'test-project', CT_AUTH_URL: 'https://auth.example.test', CT_API_URL: 'https://api.example.test', CT_CUSTOMER_CLIENT_ID: 'customer-client', CT_CUSTOMER_CLIENT_SECRET: 'test-secret', NODE_ENV: 'production' });
  try {
    let saved; let deleted = false; let revoke = false;
    const cookieStore = { set: (...args) => { saved = args; }, get: () => saved && ({ value: saved[1] }), delete: () => { deleted = true; }, has: () => !!saved };
    let tokenScope = 'manage_my_profile:test-project manage_my_orders:test-project manage_my_shopping_lists:test-project view_published_products:test-project customer_id:customer-a';
    const session = load('src/lib/account/session.ts', {
      'next/headers': { cookies: async () => cookieStore },
      'next/navigation': { redirect() {} },
      react: { cache: fn => fn },
      fetch: async (url, options) => {
        assert.equal(options.cache, 'no-store');
        if (url.endsWith('/revoke')) { revoke = true; assert.equal(options.body.get('token'), 'secret-token'); return { ok: true }; }
        assert.equal(options.body.get('grant_type'), 'password');
        assert.ok(!options.body.get('scope').includes('manage_project'));
        return { ok: true, json: async () => ({ access_token: 'secret-token', expires_in: 7200, scope: tokenScope }) };
      },
    });
    await session.startCustomerSession(customer.email, 'password123');
    assert.equal(saved[0], '__Host-customer-session');
    assert.equal(saved[2].httpOnly, true);
    assert.equal(saved[2].secure, true);
    assert.equal(saved[2].sameSite, 'lax');
    assert.equal(saved[2].maxAge, 3600);
    tokenScope = 'manage_project:test-project customer_id:customer-a';
    await assert.rejects(session.startCustomerSession(customer.email, 'password123'), /customer scopes/);
    await session.clearCustomerSession();
    assert.ok(deleted && revoke);
  } finally { for (const key of Object.keys(process.env)) if (!(key in original)) delete process.env[key]; Object.assign(process.env, original); }
});

test('Resend receives only the intended address and a reset link on the configured origin', async () => {
  const original = { ...process.env };
  Object.assign(process.env, { RESEND_API_KEY: 'test-resend-key', RESEND_FROM_EMAIL: 'NamNX <no-reply@example.com>', APP_URL: 'https://shop.example.com', NODE_ENV: 'production' });
  try {
    let sent;
    const email = load('src/lib/account/email.ts', { fetch: async (url, request) => { sent = { url, ...request }; return { ok: true }; } });
    await email.sendPasswordResetEmail('lan@example.com', 'token-with+symbols');
    assert.equal(sent.url, 'https://api.resend.com/emails');
    const payload = JSON.parse(sent.body);
    assert.deepEqual(payload.to, ['lan@example.com']);
    assert.match(payload.text, /https:\/\/shop.example.com\/account\/reset-password\?token=token-with%2Bsymbols/);
    assert.ok(sent.headers['Idempotency-Key']);
    process.env.APP_URL = 'http://insecure.example.com';
    assert.throws(() => email.resetEmailConfiguration(), /Invalid application URL/);
  } finally { for (const key of Object.keys(process.env)) if (!(key in original)) delete process.env[key]; Object.assign(process.env, original); }
});

test('registration identifies SDK OAuth configuration errors without exposing credentials', async () => {
  for (const code of ['invalid_scope', 'invalid_client']) {
    const { actions } = harness({ respond: () => {
      // Match sdk-client-v2: OAuth errors have body.error, without statusCode.
      throw { body: { error: code, error_description: 'sensitive server detail' }, originalRequest: { Authorization: 'secret-token' } };
    } });
    const result = await actions.registerAction({}, form({ ...address, email: 'lan@example.com', password: 'password123', confirmPassword: 'password123' }));
    assert.match(result.error, /not configured correctly/);
    assert.ok(!JSON.stringify(result).includes('sensitive'));
    assert.ok(!JSON.stringify(result).includes('secret-token'));
  }
});

test('checkout classifies tax, price and shipping failures without exposing provider details', async () => {
  const errors = load('src/lib/checkout/errors.ts');
  for (const code of ['MissingTaxRateForCountry', 'MatchingPriceNotFound', 'InvalidOperation']) {
    const response = Response.json({ errors: [{ code, message: 'shipping failure containing private@example.com and secret-token' }] }, { status: 400 });
    await assert.rejects(errors.checkoutResponse(response, 'cart'), error => {
      assert.equal(error.status, 422);
      assert.equal(error.recovery, 'address');
      assert.ok(!error.message.includes('private@example.com'));
      assert.ok(!error.message.includes('secret-token'));
      return true;
    });
  }
  await assert.rejects(errors.checkoutResponse(Response.json({ error: 'invalid_scope' }, { status: 400 }), 'authentication'), error => error.code === 'AUTH_CONFIGURATION');
});

test('checkout validates the saved shipping country before creating a cart and preserves customer ownership', async () => {
  const original = { ...process.env };
  Object.assign(process.env, { CT_PROJECT_KEY: 'test-project', CT_CLIENT_ID: 'admin', CT_CLIENT_SECRET: 'test-secret', CT_AUTH_URL: 'https://auth.test', CT_API_URL: 'https://api.test', CT_APPLICATION_KEY: 'checkout-test', NEXT_PUBLIC_CT_REGION: 'australia-southeast1.gcp' });
  delete process.env.CT_ACCESS_TOKEN;
  const errors = load('src/lib/checkout/errors.ts');
  const cartFields = load('src/lib/account/checkout.ts');
  try {
    for (const country of ['VN', 'US', 'AU']) {
      const writes = [];
      const route = load('src/app/api/checkout/session/route.ts', {
        'next/server': { NextResponse: { json: (...args) => Response.json(...args) } },
        '@/src/lib/market': {
          getMarket: code => code === 'US'
            ? { currency: 'USD', country: 'US', storeKey: '' }
            : { currency: 'AUD', country: 'AU', storeKey: '' },
        },
        '@/src/lib/account/session': { currentCustomer: async () => ({ ...customer, addresses: [{ ...customer.addresses[0], country }] }), hasCustomerSession: async () => true },
        '@/src/lib/account/checkout': cartFields,
        '@/src/lib/checkout/errors': errors,
        fetch: async (url, request) => {
          if (url === 'https://auth.test/oauth/token') return Response.json({ access_token: 'test-token' });
          if (url === 'https://api.test/test-project') return Response.json({ countries: ['US', 'DE', 'GB', 'AU'], currencies: ['USD', 'AUD'] });
          if (url.endsWith('/custom-objects/storefront-order-numbers/sequence')) return Response.json({}, { status: 404 });
          if (url.endsWith('/custom-objects')) return Response.json({ version: 1 }, { status: 201 });
          if (url.endsWith('/carts')) { writes.push(JSON.parse(request.body)); return Response.json({ id: 'cart-1' }, { status: 201 }); }
          if (url.includes('/sessions')) return Response.json({ id: 'session-1' }, { status: 201 });
          throw new Error('Unexpected request');
        },
      });
      const response = await route.POST(new Request('https://store.test/api/checkout/session', {
        method: 'POST', headers: { origin: 'https://store.test', 'Content-Type': 'application/json' },
        body: JSON.stringify({ market: country === 'AU' ? 'AU' : 'US', currency: 'USD', country: 'US', customerId: 'victim', items: [{ productId: '12345678-1234-1234-8123-123456789abc', quantity: 1 }] }),
      }));
      const result = await response.json();
      if (country === 'VN') {
        assert.equal(response.status, 422);
        assert.equal(result.code, 'DELIVERY_COUNTRY_UNSUPPORTED');
        assert.equal(result.recovery, 'address');
        assert.equal(writes.length, 0);
      } else {
        assert.equal(response.status, 200);
        assert.equal(result.sessionId, 'session-1');
        assert.equal(writes.length, 1);
        assert.equal(writes[0].customerId, customer.id);
        assert.equal(writes[0].currency, country === 'AU' ? 'AUD' : 'USD');
        assert.equal(writes[0].shippingAddress.country, country);
      }
    }
  } finally { for (const key of Object.keys(process.env)) if (!(key in original)) delete process.env[key]; Object.assign(process.env, original); }
});
