import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

const SUPABASE_URL = 'https://zqmqxhmbakukcgptfrsv.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpxbXF4aG1iYWt1a2NncHRmcnN2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMyOTEyNjcsImV4cCI6MjA4ODg2NzI2N30.DHYIP0uXynql_NH3r9shPx_01etmzfbNPf-a9yedpSs';

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

interface Comment {
  id: string;
  userId: string;
  username: string;
  text: string;
  createdAt: string;
}

interface Post {
  id: string;
  userId: string;
  username: string;
  avatar: string;
  name: string;
  description: string;
  address: string;
  lat: number;
  lng: number;
  images: string[];
  likedBy: string[];
  comments: Comment[];
  views: number;
  createdAt: string;
}

const posts: Post[] = [
  {
    id: '1',
    userId: 'demo_lara',
    username: 'WanderlustLara',
    avatar: 'https://i.pravatar.cc/150?u=lara',
    name: 'Nasi Lemak Beruntung',
    description: 'ade jual nasi lemak dekat sini',
    address: 'Bukit Beruntung, Selangor',
    lat: 3.4100, lng: 101.5580,
    images: [],
    likedBy: ['demo_foodie', 'demo_local', 'demo_explore'],
    comments: [
      { id: 'c1', userId: 'demo_foodie', username: 'FoodieKing', text: 'Sedap gila!', createdAt: new Date().toISOString() },
      { id: 'c2', userId: 'demo_local', username: 'LocalGuide', text: 'Memang best, pergi pagi-pagi!', createdAt: new Date().toISOString() }
    ],
    views: 158,
    createdAt: new Date().toISOString()
  },
  {
    id: '2',
    userId: 'demo_foodie',
    username: 'FoodieKing',
    avatar: 'https://i.pravatar.cc/150?u=foodie',
    name: 'Bukit Beruntung Food Fest',
    description: 'dekat sini ade event food festival, jom join!',
    address: 'Bukit Beruntung, Selangor',
    lat: 3.4050, lng: 101.5520,
    images: [],
    likedBy: Array.from({ length: 12 }, (_, i) => `demo_user_${i}`),
    comments: [
      { id: 'c3', userId: 'demo_lara', username: 'WanderlustLara', text: 'Wajib pergi!', createdAt: new Date().toISOString() }
    ],
    views: 892,
    createdAt: new Date().toISOString()
  },
  {
    id: '3',
    userId: 'demo_news',
    username: 'NewsAlert',
    avatar: 'https://i.pravatar.cc/150?u=news',
    name: 'Incident Zone',
    description: 'dekat sini ade kejadian, berhati-hati',
    address: 'Bukit Beruntung, Selangor',
    lat: 3.4150, lng: 101.5600,
    images: [],
    likedBy: ['demo_lara', 'demo_foodie'],
    comments: [],
    views: 45,
    createdAt: new Date().toISOString()
  }
];

// Seed extra demo posts
const demoTypes = ['Cafe', 'Park', 'Market', 'Stall', 'Shop', 'Restoran', 'Bengkel', 'Klinik'];
const demoUsernames = ['TravelerJoe', 'MakanMana', 'SiniBest', 'User123', 'LocalGuide', 'ExploreMY', 'FoodLover', 'NatureSeeker'];
for (let i = 4; i <= 10; i++) {
  const type = demoTypes[(i - 4) % demoTypes.length];
  const uname = demoUsernames[(i - 4) % demoUsernames.length];
  posts.push({
    id: i.toString(),
    userId: `demo_${uname.toLowerCase()}`,
    username: uname,
    avatar: `https://i.pravatar.cc/150?u=${uname}`,
    name: `${type} ${i}`,
    description: `Lokasi menarik di sekitar Bukit Beruntung #${i}. Sesuai untuk santai bersama keluarga.`,
    address: `Jalan Beruntung ${i}, Bukit Beruntung, Selangor`,
    lat: 3.4083 + Math.sin(i) * 0.018,
    lng: 101.5556 + Math.cos(i) * 0.018,
    images: [],
    likedBy: Array.from({ length: Math.floor(Math.abs(Math.sin(i * 7)) * 80) }, (_, j) => `like_${i}_${j}`),
    comments: [],
    views: Math.floor(Math.abs(Math.cos(i * 3)) * 400) + 30,
    createdAt: new Date().toISOString()
  });
}

// Auth helper — extracts and verifies the Supabase token from the request
async function getAuthUser(req: any): Promise<{ id: string; email: string; username: string } | null> {
  const authHeader = req.headers.authorization;
  if (!authHeader) return null;
  const token = authHeader.split(' ')[1];
  return getSupabaseUser(token);
}

// ── Auth routes ───────────────────────────────────────────────────────────────

app.get("/api/me", async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ message: "No token" });
  const token = authHeader.split(" ")[1];
  const user = await getSupabaseUser(token);
  if (!user) return res.status(401).json({ message: "Invalid token" });
  res.json({ user });
});

// ── Posts routes ──────────────────────────────────────────────────────────────

// GET all posts
app.get("/api/posts", (_req, res) => {
  res.json(posts);
});

// POST create post
app.post("/api/posts", async (req, res) => {
  const user = await getAuthUser(req);
  if (!user) return res.status(401).json({ message: "Unauthorized" });

  const { name, description, address, lat, lng, images } = req.body;
  const newPost: Post = {
    id: Date.now().toString(),
    userId: user.id,
    username: user.username,
    avatar: `https://i.pravatar.cc/150?u=${user.username}`,
    name: name || address || 'Untitled',
    description: description || '',
    address: address || '',
    lat: lat ?? 0,
    lng: lng ?? 0,
    images: images || [],
    likedBy: [],
    comments: [],
    views: 0,
    createdAt: new Date().toISOString()
  };
  posts.unshift(newPost);
  res.json(newPost);
});

// POST toggle like
app.post("/api/posts/:id/like", async (req, res) => {
  const user = await getAuthUser(req);
  if (!user) return res.status(401).json({ message: "Unauthorized" });
  const post = posts.find(p => p.id === req.params.id);
  if (!post) return res.status(404).json({ message: "Post not found" });

  const idx = post.likedBy.indexOf(user.id);
  if (idx === -1) {
    post.likedBy.push(user.id);
  } else {
    post.likedBy.splice(idx, 1);
  }
  res.json({ likedBy: post.likedBy, liked: idx === -1 });
});

// GET comments
app.get("/api/posts/:id/comments", (req, res) => {
  const post = posts.find(p => p.id === req.params.id);
  if (!post) return res.status(404).json({ message: "Post not found" });
  res.json(post.comments);
});

// POST add comment
app.post("/api/posts/:id/comments", async (req, res) => {
  const user = await getAuthUser(req);
  if (!user) return res.status(401).json({ message: "Unauthorized" });
  const post = posts.find(p => p.id === req.params.id);
  if (!post) return res.status(404).json({ message: "Post not found" });

  const { text } = req.body;
  if (!text?.trim()) return res.status(400).json({ message: "Text required" });

  const newComment: Comment = {
    id: Date.now().toString(),
    userId: user.id,
    username: user.username,
    text: text.trim(),
    createdAt: new Date().toISOString()
  };
  post.comments.push(newComment);
  res.json(newComment);
});

// POST increment view count
app.post("/api/posts/:id/view", (req, res) => {
  const post = posts.find(p => p.id === req.params.id);
  if (!post) return res.status(404).json({ message: "Post not found" });
  post.views++;
  res.json({ views: post.views });
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
