import express from "express";
import { createServer as createViteServer } from "vite";
import { createClient } from "@supabase/supabase-js";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

const SUPABASE_URL = 'https://zqmqxhmbakukcgptfrsv.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpxbXF4aG1iYWt1a2NncHRmcnN2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMyOTEyNjcsImV4cCI6MjA4ODg2NzI2N30.DHYIP0uXynql_NH3r9shPx_01etmzfbNPf-a9yedpSs';
// Service role key bypasses RLS — get it from Supabase Dashboard → Settings → API → service_role
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || SUPABASE_ANON_KEY;

// Uses service role key so server-side operations (likes, views, comments) bypass RLS
const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

app.use(express.json({ limit: '10mb' }));

// Verify a Supabase access token and return the user, or null
async function getSupabaseUser(token: string): Promise<{ id: string; email: string; username: string } | null> {
  try {
    const res = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'apikey': SUPABASE_ANON_KEY,
      },
    });
    if (!res.ok) return null;
    const user = await res.json();
    const username = user.user_metadata?.username || user.email?.split('@')[0] || 'User';
    return { id: user.id, email: user.email, username };
  } catch {
    return null;
  }
}

async function getAuthUser(req: any): Promise<{ id: string; email: string; username: string } | null> {
  const authHeader = req.headers.authorization;
  if (!authHeader) return null;
  return getSupabaseUser(authHeader.split(' ')[1]);
}

// Map a Supabase DB row to the shape the frontend expects
function formatPost(p: any): any {
  return {
    id: p.id,
    userId: p.user_id,
    username: p.username,
    avatar: p.avatar || `https://i.pravatar.cc/150?u=${p.username}`,
    name: p.name,
    description: p.description,
    address: p.address,
    lat: p.lat,
    lng: p.lng,
    images: p.images || [],
    likedBy: p.liked_by || [],
    comments: (p.comments || []).map((c: any) => ({
      id: c.id,
      userId: c.user_id,
      username: c.username,
      text: c.text,
      createdAt: c.created_at,
    })),
    views: p.views,
    createdAt: p.created_at,
  };
}

// ── Auth ──────────────────────────────────────────────────────────────────────

app.get("/api/me", async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ message: "No token" });
  const user = await getSupabaseUser(authHeader.split(" ")[1]);
  if (!user) return res.status(401).json({ message: "Invalid token" });
  res.json({ user });
});

// ── Posts ─────────────────────────────────────────────────────────────────────

// GET all posts (with embedded comments)
app.get("/api/posts", async (_req, res) => {
  const { data, error } = await db
    .from('posts')
    .select('*, comments(*)')
    .order('created_at', { ascending: false });

  if (error) return res.status(500).json({ message: error.message });
  res.json((data || []).map(formatPost));
});

// POST create post
app.post("/api/posts", async (req, res) => {
  const user = await getAuthUser(req);
  if (!user) return res.status(401).json({ message: "Unauthorized" });

  const { name, description, address, lat, lng, images } = req.body;
  const { data, error } = await db
    .from('posts')
    .insert({
      user_id: user.id,
      username: user.username,
      avatar: `https://i.pravatar.cc/150?u=${user.username}`,
      name: name || address || 'Untitled',
      description: description || '',
      address: address || '',
      lat: lat ?? 0,
      lng: lng ?? 0,
      images: images || [],
      liked_by: [],
      views: 0,
    })
    .select('*, comments(*)')
    .single();

  if (error) return res.status(500).json({ message: error.message });
  res.json(formatPost(data));
});

// POST toggle like
app.post("/api/posts/:id/like", async (req, res) => {
  const user = await getAuthUser(req);
  if (!user) return res.status(401).json({ message: "Unauthorized" });

  const { data: post, error: fetchError } = await db
    .from('posts')
    .select('liked_by')
    .eq('id', req.params.id)
    .single();

  if (fetchError || !post) return res.status(404).json({ message: "Post not found" });

  const likedBy: string[] = post.liked_by || [];
  const idx = likedBy.indexOf(user.id);
  const newLikedBy = idx === -1
    ? [...likedBy, user.id]
    : likedBy.filter((id: string) => id !== user.id);

  const { error } = await db
    .from('posts')
    .update({ liked_by: newLikedBy })
    .eq('id', req.params.id);

  if (error) return res.status(500).json({ message: error.message });
  res.json({ likedBy: newLikedBy, liked: idx === -1 });
});

// GET comments for a post
app.get("/api/posts/:id/comments", async (req, res) => {
  const { data, error } = await db
    .from('comments')
    .select('*')
    .eq('post_id', req.params.id)
    .order('created_at', { ascending: true });

  if (error) return res.status(500).json({ message: error.message });
  res.json((data || []).map((c: any) => ({
    id: c.id,
    userId: c.user_id,
    username: c.username,
    text: c.text,
    createdAt: c.created_at,
  })));
});

// POST add comment
app.post("/api/posts/:id/comments", async (req, res) => {
  const user = await getAuthUser(req);
  if (!user) return res.status(401).json({ message: "Unauthorized" });

  const { text } = req.body;
  if (!text?.trim()) return res.status(400).json({ message: "Text required" });

  const { data, error } = await db
    .from('comments')
    .insert({
      post_id: req.params.id,
      user_id: user.id,
      username: user.username,
      text: text.trim(),
    })
    .select()
    .single();

  if (error) return res.status(500).json({ message: error.message });
  res.json({
    id: data.id,
    userId: data.user_id,
    username: data.username,
    text: data.text,
    createdAt: data.created_at,
  });
});

// POST increment view count
app.post("/api/posts/:id/view", async (req, res) => {
  const { error } = await db.rpc('increment_views', { post_id: req.params.id });
  if (error) {
    // Fallback: manual read-increment-write if rpc not set up yet
    const { data } = await db.from('posts').select('views').eq('id', req.params.id).single();
    if (data) {
      await db.from('posts').update({ views: (data.views || 0) + 1 }).eq('id', req.params.id);
    }
  }
  res.json({ ok: true });
});

// ── Vite middleware ───────────────────────────────────────────────────────────

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
