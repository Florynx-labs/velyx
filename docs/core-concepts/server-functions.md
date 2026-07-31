# Server Functions

Server functions allow you to write server-only code directly inside your `.vx` component files. They are **never shipped to the browser**.

## Declaring server functions

Use the `<script server>` block:

```vx
<script server>
  export async function saveContact(data: { name: string; email: string }) {
    // This runs on the server only.
    // You can access: databases, env vars, secrets, file system, etc.
    const id = crypto.randomUUID();
    await db.contacts.insert({ id, ...data });
    return { ok: true, id };
  }
</script>
```

## Calling server functions from setup

```vx
<setup>
  state status  = "";
  state loading = false;

  async function handleSubmit() {
    loading = true;
    const result = await saveContact({ name: "Alice", email: "alice@example.com" });
    status  = result.ok ? "Saved!" : "Error";
    loading = false;
  }
</setup>

<template>
  <button vx-click="handleSubmit" class="btn">Save Contact</button>
  <p>{{ status }}</p>
</template>
```

## Complete page example

```vx
<config>
definePage({ title: "Contact Form" })
</config>

<setup>
  state name    = "";
  state email   = "";
  state message = "";
  state loading = false;

  async function submit() {
    loading = true;
    const res = await submitForm({ name, email });
    message = res.ok ? "✅ Sent!" : "❌ Failed";
    loading = false;
  }
</setup>

<template>
  <form vx-submit.prevent="submit" class="form">
    <input vx-model="name"  placeholder="Name"  />
    <input vx-model="email" placeholder="Email" type="email" />
    <button type="submit" class="btn">{{ loading ? "Sending…" : "Send" }}</button>
    <p vx-if="message">{{ message }}</p>
  </form>
</template>

<script server>
  export async function submitForm(data: { name: string; email: string }) {
    // Server-side logic: validate, save, send email, etc.
    console.log("[server] Form received:", data);
    return { ok: true };
  }
</script>
```

## What server functions can access

- **Database clients** (Prisma, Drizzle, Supabase, etc.)
- **Environment variables** (`process.env.SECRET_KEY`)
- **Node.js built-ins** (`fs`, `crypto`, `path`, etc.)
- **Authentication sessions** and JWT verification
- **Third-party APIs** with private keys

## What server functions cannot do

- Access browser globals (`window`, `document`, `localStorage`)
- Import browser-only packages
- Return non-serializable objects (functions, class instances, etc.)

## Security model

The VELYX compiler guarantees that `<script server>` code is:

1. **Removed** from the browser bundle during compilation.
2. **Only invoked** via the server function RPC layer.
3. **Never exposed** as client-side JavaScript.
