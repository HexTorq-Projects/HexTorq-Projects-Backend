// API for the frontend.  Command: node server.js
const express = require("express");
const cors = require("cors");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const app = express();
app.use(cors());
app.use(express.json());

// GET /categories -> categories with their sub-categories + counts
app.get("/categories", async (req, res) => {
  const cats = await prisma.category.findMany({
    include: {
      _count: { select: { projects: true } },
      subCategories: {
        include: { _count: { select: { projects: true } } },
        orderBy: { subCategoryName: "asc" },
      },
    },
    orderBy: { categoryName: "asc" },
  });
  res.json(cats.map((c) => ({
    id: c.id, name: c.categoryName, count: c._count.projects,
    subCategories: c.subCategories.map((s) => ({
      id: s.id, name: s.subCategoryName, count: s._count.projects,
    })),
  })));
});

// GET /projects?category=..&subCategory=..&search=..&page=1
app.get("/projects", async (req, res) => {
  const { category, subCategory, search } = req.query;
  const page = Math.max(1, Number(req.query.page ?? 1));
  const perPage = 20;
  const where = {};
  if (category) where.category = { categoryName: String(category) };
  if (subCategory) where.subCategory = { subCategoryName: String(subCategory) };
  if (search) where.projectTitle = { contains: String(search), mode: "insensitive" };

  const [items, total] = await Promise.all([
    prisma.project.findMany({
      where,
      include: { category: true, subCategory: true, applicationArea: true },
      take: perPage, skip: (page - 1) * perPage,
      orderBy: { importanceScore: "desc" },
    }),
    prisma.project.count({ where }),
  ]);
  res.json({ items, total, page, perPage, pages: Math.ceil(total / perPage) });
});

// GET /projects/:id
app.get("/projects/:id", async (req, res) => {
  const project = await prisma.project.findUnique({
    where: { id: String(req.params.id) },
    include: { category: true, subCategory: true, applicationArea: true },
  });
  if (!project) return res.status(404).json({ error: "Project not found" });
  res.json(project);
});

app.listen(4001, () => console.log("API running on http://localhost:4001"));
