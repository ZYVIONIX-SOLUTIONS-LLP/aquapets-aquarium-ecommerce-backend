import mongoose from 'mongoose';
import { Product } from '../models/Product.js';

async function run() {
  await mongoose.connect('mongodb://127.0.0.1:27017/aqua_pets_aquarium');

  const prods = await Product.find({
    $or: [
      { name: /breeding/i },
      { description: /breeding/i },
      { category: /breeding/i },
      { tags: /breeding/i }
    ]
  });

  console.log('Matching Products:', prods.map(p => ({
    id: p._id,
    name: p.name,
    slug: p.slug,
    category: p.category,
    tags: p.tags
  })));

  process.exit(0);
}

run();
