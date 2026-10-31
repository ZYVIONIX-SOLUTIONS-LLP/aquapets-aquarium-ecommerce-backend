"""
Aqua Pets - Bulk Product Import Script
Reads Aqua_Pets_Product_List.xlsx and inserts all products into MongoDB.
Run: py -3 bulk_import_products.py
"""

import sys
import re
import json
from datetime import datetime

# ---- Dependencies check ----
try:
    import openpyxl
except ImportError:
    print("Installing openpyxl...")
    import subprocess
    subprocess.check_call([sys.executable, "-m", "pip", "install", "openpyxl"])
    import openpyxl

try:
    from pymongo import MongoClient, UpdateOne
except ImportError:
    print("Installing pymongo...")
    import subprocess
    subprocess.check_call([sys.executable, "-m", "pip", "install", "pymongo"])
    from pymongo import MongoClient, UpdateOne

MONGO_URI = "mongodb://127.0.0.1:27017/aqua_pets_aquarium"
EXCEL_PATH = r"d:\zyvionix projects\aqua-pets-aquarium\aqua-pets-frontend\public\excel\Aqua_Pets_Product_List.xlsx"

# ---- Category Metadata ----
CATEGORY_META = {
    "Aquariums & Tanks": {"slug": "aquariums-tanks", "description": "Premium glass aquariums, nano tanks, planted aquariums and rimless tanks.", "image": "/categories/aquariums-tanks.jpg", "iconName": "Fish", "tags": ["aquarium", "tank", "glass tank", "fish tank"]},
    "Aquarium Filters": {"slug": "aquarium-filters", "description": "High-performance filters for crystal-clear, healthy water.", "image": "/categories/aquarium-filters.jpg", "iconName": "Droplets", "tags": ["filter", "filtration", "canister", "sponge filter"]},
    "Filter Media": {"slug": "filter-media", "description": "Biological, chemical and mechanical filter media.", "image": "/categories/filter-media.jpg", "iconName": "Layers", "tags": ["filter media", "bio media", "ceramic rings", "activated carbon"]},
    "Air Pumps": {"slug": "air-pumps-accessories", "description": "Reliable aquarium air pumps for oxygenation.", "image": "/categories/air-pumps-accessories.jpg", "iconName": "Wind", "tags": ["air pump", "oxygen", "aeration", "air stone"]},
    "Air Pumps & Accessories": {"slug": "air-pumps-accessories", "description": "Air pump accessories including air pipes, air stones, valves.", "image": "/categories/air-pumps-accessories.jpg", "iconName": "Wind", "tags": ["air pump", "air stone", "air pipe", "valve"]},
    "Water Pumps & Circulation": {"slug": "water-pumps-circulation", "description": "Submersible water pumps, circulation pumps and wave makers.", "image": "/categories/water-pumps-circulation.jpg", "iconName": "Waves", "tags": ["water pump", "circulation", "wave maker", "power head"]},
    "Aquarium Lights": {"slug": "aquarium-lights", "description": "LED, RGB, WRGB, plant and marine aquarium lights.", "image": "/categories/aquarium-lights.jpg", "iconName": "Lightbulb", "tags": ["aquarium light", "LED light", "plant light", "marine light"]},
    "Heaters & Temperature": {"slug": "heaters-temperature", "description": "Aquarium heaters and thermometers for temperature control.", "image": "/categories/heaters-temperature.jpg", "iconName": "Thermometer", "tags": ["heater", "thermometer", "temperature", "aquarium heater"]},
    "Fish Food": {"slug": "fish-food", "description": "Premium flake, pellet and granule food for all fish types.", "image": "/categories/fish-food.jpg", "iconName": "UtensilsCrossed", "tags": ["fish food", "flake", "pellet", "granule"]},
    "Fish Medicines": {"slug": "fish-medicines", "description": "Aquarium medicines and water conditioners for fish health.", "image": "/categories/fish-medicines.jpg", "iconName": "Pill", "tags": ["fish medicine", "treatment", "water conditioner", "antibacterial"]},
    "Water Care": {"slug": "water-care", "description": "Water conditioners, pH buffers, test kits and water quality products.", "image": "/categories/water-care.jpg", "iconName": "TestTube", "tags": ["water care", "water conditioner", "pH", "test kit"]},
    "Aquarium Plants": {"slug": "aquarium-plants", "description": "Live aquatic plants for planted aquariums.", "image": "/categories/aquarium-plants.jpg", "iconName": "Leaf", "tags": ["aquatic plant", "live plant", "moss", "carpet plant", "stem plant"]},
    "Artificial Plants": {"slug": "artificial-plants", "description": "High-quality artificial aquarium plants, zero maintenance.", "image": "/categories/artificial-plants.jpg", "iconName": "Sprout", "tags": ["artificial plant", "fake plant", "plastic plant", "decoration"]},
    "Gravel & Sand": {"slug": "gravel-sand", "description": "Natural gravel, black sand, coloured gravel, aquasoil and substrate.", "image": "/categories/gravel-sand.jpg", "iconName": "Layers", "tags": ["gravel", "sand", "substrate", "aquasoil"]},
    "Aquarium Decorations": {"slug": "aquarium-decorations", "description": "Aquarium decorations including caves, castles and ornaments.", "image": "/categories/aquarium-decorations.jpg", "iconName": "Compass", "tags": ["decoration", "ornament", "cave", "castle", "background"]},
    "Driftwood & Rocks": {"slug": "driftwood-rocks", "description": "Natural driftwood, lava rock, seiryu stone and hardscape materials.", "image": "/categories/driftwood-rocks.jpg", "iconName": "Mountain", "tags": ["driftwood", "rock", "hardscape", "stone", "lava rock"]},
    "Aquascaping Tools": {"slug": "aquascaping-tools", "description": "Professional aquascaping tools including tweezers, scissors and spatulas.", "image": "/categories/aquascaping-tools.jpg", "iconName": "Scissors", "tags": ["aquascaping tool", "tweezers", "scissors", "scraper"]},
    "CO2 & Planted Tank": {"slug": "co2-planted-tank", "description": "CO2 systems, regulators, diffusers and accessories for planted tanks.", "image": "/categories/co2-planted-tank.jpg", "iconName": "Gauge", "tags": ["CO2", "planted tank", "CO2 diffuser", "CO2 regulator"]},
    "Cleaning & Maintenance": {"slug": "cleaning-maintenance", "description": "Aquarium cleaning tools, siphons, algae scrapers and nets.", "image": "/categories/cleaning-maintenance.jpg", "iconName": "Wrench", "tags": ["cleaning", "maintenance", "siphon", "algae scraper", "gravel cleaner"]},
    "Feeding & Breeding Accessories": {"slug": "feeding-breeding-accessories", "description": "Feeding rings, breeding boxes, nets and automatic feeders.", "image": "/categories/feeding-breeding-accessories.jpg", "iconName": "Heart", "tags": ["feeding", "breeding", "breeding box", "auto feeder"]},
    "Spare Accessories": {"slug": "spare-accessories", "description": "Suction cups, replacement impellers, hose adapters, pipe clips, and seals.", "image": "/categories/spare-accessories.jpg", "iconName": "Zap", "tags": ["spare", "accessories", "suction cups", "connector"]},
    "Electrical & Spare Accessories": {"slug": "spare-accessories", "description": "Digital timers, power strips, spare parts and connectors.", "image": "/categories/spare-accessories.jpg", "iconName": "Zap", "tags": ["electrical", "timer", "power strip", "spare parts", "connector"]},
}

CATEGORY_DESC_TEMPLATES = {
    "Aquariums & Tanks": "Premium quality glass aquarium for freshwater and marine setups.",
    "Aquarium Filters": "High-performance aquarium filter for crystal-clear, healthy water.",
    "Filter Media": "Quality filter media for biological and mechanical filtration.",
    "Air Pumps": "Reliable air pump for efficient oxygenation and aeration.",
    "Air Pumps & Accessories": "Essential air pump accessory for aquarium aeration systems.",
    "Water Pumps & Circulation": "Powerful submersible pump for aquarium water circulation.",
    "Aquarium Lights": "Energy-efficient LED light for vibrant plant growth and fish display.",
    "Heaters & Temperature": "Precise aquarium heater for tropical fish and plants.",
    "Fish Food": "Nutritionally balanced fish food for healthy growth and coloration.",
    "Fish Medicines": "Effective aquarium medicine for fish disease treatment.",
    "Water Care": "Premium water care product for ideal water chemistry.",
    "Aquarium Plants": "Live aquatic plant for natural aquarium biotopes.",
    "Artificial Plants": "Lifelike artificial aquarium plant, zero maintenance.",
    "Gravel & Sand": "Natural aquarium substrate for planted tanks and aquascaping.",
    "Aquarium Decorations": "Beautiful aquarium decoration for a stunning underwater environment.",
    "Driftwood & Rocks": "Natural hardscape material adding texture and beauty to aquascapes.",
    "Aquascaping Tools": "Professional tool for precise planting and aquarium maintenance.",
    "CO2 & Planted Tank": "Essential CO2 component for planted tank growth.",
    "Cleaning & Maintenance": "Aquarium cleaning tool for a healthy, debris-free tank.",
    "Feeding & Breeding Accessories": "Quality feeding and breeding accessory for fish.",
    "Electrical & Spare Accessories": "Reliable electrical accessory for aquarium equipment.",
}


def make_slug(name, variant=""):
    base = f"{name} {variant}".strip() if variant else name
    slug = re.sub(r"[^a-z0-9\s-]", " ", base.lower())
    slug = re.sub(r"\s+", "-", slug.strip())
    return re.sub(r"-+", "-", slug)


def make_cat_slug(name):
    slug = re.sub(r"[^a-z0-9\s-]", " ", name.lower())
    slug = re.sub(r"\s+", "-", slug.strip())
    return re.sub(r"-+", "-", slug)


def get_specs(variant, watts, notes):
    specs = []
    if variant and variant.strip():
        specs.append({"label": "Model / Variant", "value": variant.strip()})
    if watts and watts.strip():
        specs.append({"label": "Power", "value": watts.strip()})
    if notes and notes.strip():
        specs.append({"label": "Notes", "value": notes.strip()})
    return specs


def get_tags(category, name, variant):
    tags = list(CATEGORY_META.get(category, {}).get("tags", []))
    words = [w for w in re.findall(r"[A-Za-z]+", name.lower()) if len(w) > 3]
    tags.extend(words)
    if variant:
        tags.append(variant.lower().strip())
    seen, result = set(), []
    for t in tags:
        if t not in seen:
            seen.add(t)
            result.append(t)
    return result[:12]


def get_weight_and_dimensions(name, category):
    n = (name or "").lower()
    cat = (category or "").lower()

    weight_kg = 0.5
    dims = {"length": 15, "breadth": 10, "height": 8}

    if "tank" in cat or "aquarium" in cat:
        if '48"' in n or "48 inch" in n or "large" in n:
            weight_kg, dims = 32.0, {"length": 122, "breadth": 30, "height": 45}
        elif '36"' in n and '18"' in n:
            weight_kg, dims = 22.0, {"length": 91, "breadth": 30, "height": 45}
        elif '36"' in n:
            weight_kg, dims = 16.0, {"length": 91, "breadth": 30, "height": 30}
        elif "rimless" in n or "planted" in n or "marine" in n:
            weight_kg, dims = 10.5, {"length": 60, "breadth": 30, "height": 36}
        elif "nano" in n:
            weight_kg, dims = 4.2, {"length": 30, "breadth": 30, "height": 30}
        elif "bowl" in n:
            weight_kg, dims = 1.8, {"length": 18, "breadth": 18, "height": 18}
        else:
            weight_kg, dims = 8.0, {"length": 45, "breadth": 28, "height": 30}
    elif "gravel" in cat or "sand" in cat:
        weight_kg, dims = 3.5, {"length": 30, "breadth": 20, "height": 10}
    elif "driftwood" in cat or "rock" in cat:
        weight_kg, dims = 2.5, {"length": 30, "breadth": 20, "height": 15}
    elif "filter" in cat:
        if "canister" in n:
            weight_kg, dims = 4.8, {"length": 35, "breadth": 28, "height": 42}
        elif "sponge" in n:
            weight_kg, dims = 0.25, {"length": 12, "breadth": 12, "height": 18}
        else:
            weight_kg, dims = 0.85, {"length": 18, "breadth": 12, "height": 22}
    elif "pump" in cat or "circulation" in cat:
        weight_kg, dims = 0.95, {"length": 18, "breadth": 12, "height": 14}
    elif "light" in cat:
        weight_kg, dims = 0.75, {"length": 40, "breadth": 10, "height": 6}
    elif "heater" in cat or "temperature" in cat:
        weight_kg, dims = 0.35, {"length": 28, "breadth": 5, "height": 5}
    elif "food" in cat:
        weight_kg, dims = 0.35, {"length": 12, "breadth": 12, "height": 15}
    elif "water-care" in cat or "medicine" in cat:
        weight_kg, dims = 0.35, {"length": 8, "breadth": 8, "height": 18}
    elif "co2" in cat:
        weight_kg, dims = 3.5 if "cylinder" in n else 0.5, {"length": 35, "breadth": 12, "height": 12}
    elif "plant" in cat:
        weight_kg, dims = 0.15, {"length": 15, "breadth": 10, "height": 8}
    elif "cleaning" in cat:
        weight_kg, dims = 0.35, {"length": 30, "breadth": 10, "height": 6}
    elif "feeding" in cat or "breeding" in cat:
        weight_kg, dims = 0.35 if "feeder" in n else 0.2, {"length": 16, "breadth": 12, "height": 10}
    elif "tool" in cat:
        weight_kg, dims = 0.22, {"length": 28, "breadth": 6, "height": 3}
    elif "decoration" in cat:
        weight_kg, dims = 0.75, {"length": 18, "breadth": 14, "height": 14}
    elif "media" in cat:
        weight_kg, dims = 0.85, {"length": 20, "breadth": 15, "height": 10}
    elif "spare" in cat:
        weight_kg, dims = 0.35 if "timer" in n or "extension" in n else 0.15, {"length": 15, "breadth": 8, "height": 6}

    return round(weight_kg, 2), dims


def build_product(row, slug_registry):
    cat = row["category"]
    name = row["name"]
    variant = row["variant"]
    watts = row["watts"]
    shop_price = row["shop_price"]
    markup = row["markup"]
    stock = row["stock"]
    notes = row["notes"]

    if shop_price:
        sell_price = round(shop_price * (1 + markup), 2)
        original_price = round(sell_price * 1.15, 2)
        discount = 15
    else:
        sell_price = 0
        original_price = None
        discount = 0

    base_slug = make_slug(name, variant)
    slug = base_slug
    counter = 1
    while slug in slug_registry:
        slug = f"{base_slug}-{counter}"
        counter += 1
    slug_registry.add(slug)

    cat_meta = CATEGORY_META.get(cat, {})
    cat_slug = cat_meta.get("slug", make_cat_slug(cat))
    full_name = f"{name} {variant}".strip() if variant else name
    desc_tmpl = CATEGORY_DESC_TEMPLATES.get(cat, f"Quality {name} for your aquarium.")
    description = f"{full_name} - {desc_tmpl}"

    cat_image = cat_meta.get("image", "")
    weight_kg, dims = get_weight_and_dimensions(full_name, cat)

    return {
        "slug": slug,
        "name": full_name,
        "brand": "Aqua Pets",
        "category": cat_slug,
        "description": description,
        "fullDescription": description,
        "price": sell_price,
        "originalPrice": original_price,
        "discount": discount,
        "rating": 5.0,
        "reviewCount": 0,
        "images": [],
        "stock": stock,
        "badge": None,
        "specifications": get_specs(variant, watts, notes),
        "tags": get_tags(cat, name, variant),
        "isFeatured": False,
        "isStarterKit": False,
        "isOffer": False,
        "offerType": None,
        "tankType": None,
        "weightKg": weight_kg,
        "dimensions": dims,
        "createdAt": datetime.utcnow(),
        "updatedAt": datetime.utcnow(),
    }


def main():
    print("=" * 60)
    print("  Aqua Pets - Bulk Product Import")
    print("=" * 60)

    print("\nReading Excel file...")
    wb = openpyxl.load_workbook(EXCEL_PATH)
    ws = wb.active

    raw_rows = []
    for row in ws.iter_rows(min_row=2, max_row=ws.max_row, values_only=True):
        cat, name, variant, watts, shop_price, markup_val, _, stock, notes = row
        if cat and name:
            markup = float(markup_val) if isinstance(markup_val, (int, float)) else 0.30
            raw_rows.append({
                "category": str(cat).strip(),
                "name": str(name).strip(),
                "variant": str(variant).strip() if variant else "",
                "watts": str(watts).strip() if watts else "",
                "shop_price": float(shop_price) if isinstance(shop_price, (int, float)) else None,
                "markup": markup,
                "stock": int(float(stock)) if stock else 10,
                "notes": str(notes).strip() if notes else "",
            })

    print(f"Parsed {len(raw_rows)} product rows")
    priced = sum(1 for r in raw_rows if r["shop_price"])
    print(f"With price: {priced} | Without price: {len(raw_rows) - priced}")

    print("\nConnecting to MongoDB...")
    client = MongoClient(MONGO_URI, serverSelectionTimeoutMS=5000)
    db = client["aqua_pets_aquarium"]
    try:
        client.admin.command("ping")
        print("Connected to MongoDB!")
    except Exception as e:
        print(f"ERROR: {e}")
        sys.exit(1)

    products_col = db["products"]
    categories_col = db["categories"]

    # Upsert categories
    print("\nUpserting categories...")
    seen_cats = set()
    cat_ops = []
    for row in raw_rows:
        cat_name = row["category"]
        if cat_name not in seen_cats:
            seen_cats.add(cat_name)
            meta = CATEGORY_META.get(cat_name, {})
            cat_slug = meta.get("slug", make_cat_slug(cat_name))
            cat_ops.append(UpdateOne(
                {"slug": cat_slug},
                {"$set": {"slug": cat_slug, "name": cat_name,
                           "description": meta.get("description", f"{cat_name} products."),
                           "image": meta.get("image", "/images/categories/default.jpg"),
                           "iconName": meta.get("iconName", "Fish"),
                           "updatedAt": datetime.utcnow()},
                 "$setOnInsert": {"productCount": 0, "createdAt": datetime.utcnow()}},
                upsert=True
            ))
    if cat_ops:
        res = categories_col.bulk_write(cat_ops)
        print(f"Categories: {res.upserted_count} new, {res.modified_count} updated")

    # Build and insert products
    print("\nBuilding products...")
    slug_registry = {doc["slug"] for doc in products_col.find({}, {"slug": 1})}
    print(f"Existing products in DB: {len(slug_registry)}")

    products = [build_product(row, slug_registry) for row in raw_rows]
    print(f"Built {len(products)} product documents")

    print("\nInserting products...")
    ops = [UpdateOne({"slug": p["slug"]}, {"$setOnInsert": p}, upsert=True) for p in products]
    result = products_col.bulk_write(ops, ordered=False)
    print(f"Inserted: {result.upserted_count} new | Skipped: {len(ops) - result.upserted_count}")

    # Update category counts
    pipeline = [{"$group": {"_id": "$category", "count": {"$sum": 1}}}]
    for doc in products_col.aggregate(pipeline):
        categories_col.update_one({"slug": doc["_id"]}, {"$set": {"productCount": doc["count"]}})

    total = products_col.count_documents({})
    priced_db = products_col.count_documents({"price": {"$gt": 0}})
    print("\n" + "=" * 60)
    print("  IMPORT COMPLETE!")
    print("=" * 60)
    print(f"  Total products in DB : {total}")
    print(f"  With price           : {priced_db}")
    print(f"  Price=0 (drafts)     : {total - priced_db}")
    print(f"  Categories           : {categories_col.count_documents({})}")
    print("=" * 60)
    client.close()


if __name__ == "__main__":
    main()
