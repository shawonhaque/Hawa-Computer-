import type { PrismaClient, Prisma } from "@prisma/client";

type P = {
  sku: string;
  slug: string;
  category: string;
  nameBn: string;
  nameEn: string;
  descBn: string;
  descEn: string;
  price: number;
  comparePrice?: number;
  stock: number;
  brand?: string;
  featured?: boolean;
};

export async function seedContent(prisma: PrismaClient) {
  // ---------------------------------------------------------------- shop
  const productCategories = [
    { slug: "notebooks", nameBn: "খাতা", nameEn: "Notebooks", sortOrder: 1 },
    { slug: "pens", nameBn: "কলম", nameEn: "Pens", sortOrder: 2 },
    { slug: "pencils", nameBn: "পেন্সিল", nameEn: "Pencils", sortOrder: 3 },
    { slug: "erasers-sharpeners", nameBn: "রবার ও শার্পনার", nameEn: "Erasers & Sharpeners", sortOrder: 4 },
    { slug: "diaries", nameBn: "ডায়েরি", nameEn: "Diaries", sortOrder: 5 },
    { slug: "hardboards", nameBn: "হার্ডবোর্ড", nameEn: "Hardboards", sortOrder: 6 },
    { slug: "art-paper", nameBn: "আর্ট পেপার", nameEn: "Art Paper", sortOrder: 7 },
    { slug: "school-supplies", nameBn: "স্কুল সরবরাহ", nameEn: "School Supplies", sortOrder: 8 },
    { slug: "childrens-books", nameBn: "শিশুতোষ বই", nameEn: "Children's Books", sortOrder: 9 },
    { slug: "educational-books", nameBn: "শিক্ষামূলক বই", nameEn: "Educational Books", sortOrder: 10 },
    { slug: "office-supplies", nameBn: "অফিস সরবরাহ", nameEn: "Office Supplies", sortOrder: 11 },
  ];

  for (const category of productCategories) {
    await prisma.productCategory.upsert({ where: { slug: category.slug }, update: category, create: category });
  }
  const catIds = Object.fromEntries((await prisma.productCategory.findMany()).map((c) => [c.slug, c.id]));

  const products: P[] = [
    { sku: "NB-001", slug: "kagoj-200-page-notebook", category: "notebooks", nameBn: "কাগজ ২০০ পৃষ্ঠার খাতা", nameEn: "Kagoj 200 Page Notebook", descBn: "মোটা কভার, ২০০ পৃষ্ঠা, স্কুল ও কলেজের জন্য আদর্শ।", descEn: "Thick cover, 200 pages, ideal for school and college.", price: 90, comparePrice: 110, stock: 120, brand: "Kagoj", featured: true },
    { sku: "NB-002", slug: "khata-120-page-pack-of-3", category: "notebooks", nameBn: "খাতা ১২০ পৃষ্ঠা (৩টি প্যাক)", nameEn: "Khata 120 Page (Pack of 3)", descBn: "তিনটি খাতার সাশ্রয়ী প্যাক, মসৃণ কাগজ।", descEn: "Value pack of three notebooks with smooth paper.", price: 150, stock: 60, brand: "Deshi" },
    { sku: "NB-003", slug: "spiral-notebook-a5", category: "notebooks", nameBn: "স্পাইরাল নোটবুক A5", nameEn: "Spiral Notebook A5", descBn: "স্পাইরাল বাঁধাই, সহজে খোলা যায়, নোট নেওয়ার জন্য।", descEn: "Spiral bound, lays flat, great for note taking.", price: 120, stock: 45, brand: "OfficePro" },
    { sku: "PN-001", slug: "matador-ball-pen-blue", category: "pens", nameBn: "ম্যাটাডর বলপেন (নীল)", nameEn: "Matador Ball Pen (Blue)", descBn: "মসৃণ লেখা, দীর্ঘস্থায়ী কালি।", descEn: "Smooth writing with long lasting ink.", price: 10, stock: 300, brand: "Matador", featured: true },
    { sku: "PN-002", slug: "pilot-gel-pen-black", category: "pens", nameBn: "পাইলট জেল পেন (কালো)", nameEn: "Pilot Gel Pen (Black)", descBn: "দ্রুত শুকানো জেল কালি, পরিষ্কার লেখা।", descEn: "Quick drying gel ink for clean writing.", price: 45, stock: 80, brand: "Pilot" },
    { sku: "PN-003", slug: "marker-permanent-black", category: "pens", nameBn: "পার্মানেন্ট মার্কার (কালো)", nameEn: "Permanent Marker (Black)", descBn: "যেকোনো পৃষ্ঠে স্থায়ী লেখার জন্য।", descEn: "Permanent marking on almost any surface.", price: 35, stock: 70, brand: "Artline" },
    { sku: "PC-001", slug: "doms-pencil-hb-pack-10", category: "pencils", nameBn: "ডমস পেন্সিল HB (১০টি)", nameEn: "DOMS Pencil HB (Pack of 10)", descBn: "ভাঙা-প্রতিরোধী লেড, স্কুলের জন্য।", descEn: "Break resistant lead, great for school.", price: 60, stock: 95, brand: "DOMS" },
    { sku: "PC-002", slug: "mechanical-pencil-0-5", category: "pencils", nameBn: "মেকানিক্যাল পেন্সিল ০.৫", nameEn: "Mechanical Pencil 0.5", descBn: "রিফিলযোগ্য, ধারালো করার প্রয়োজন নেই।", descEn: "Refillable and never needs sharpening.", price: 50, stock: 55, brand: "Faber" },
    { sku: "ER-001", slug: "eraser-pack-of-5", category: "erasers-sharpeners", nameBn: "রবার (৫টি প্যাক)", nameEn: "Eraser (Pack of 5)", descBn: "কাগজ না ছিঁড়ে পরিষ্কার মোছে।", descEn: "Clean erasing without tearing paper.", price: 40, stock: 140, brand: "DOMS" },
    { sku: "ER-002", slug: "metal-sharpener", category: "erasers-sharpeners", nameBn: "মেটাল শার্পনার", nameEn: "Metal Sharpener", descBn: "টেকসই ধাতব বডি, ধারালো ব্লেড।", descEn: "Durable metal body with a sharp blade.", price: 25, stock: 110, brand: "Kangaro" },
    { sku: "DY-001", slug: "executive-diary-2026", category: "diaries", nameBn: "এক্সিকিউটিভ ডায়েরি ২০২৬", nameEn: "Executive Diary 2026", descBn: "দৈনিক পরিকল্পনার জন্য PU কভার ডায়েরি।", descEn: "PU covered diary for daily planning.", price: 350, comparePrice: 420, stock: 30, brand: "OfficePro", featured: true },
    { sku: "HB-001", slug: "hardboard-a4", category: "hardboards", nameBn: "হার্ডবোর্ড A4", nameEn: "Hardboard A4", descBn: "লেখার সময় কাগজ ধরে রাখার জন্য মজবুত বোর্ড।", descEn: "Sturdy board to hold paper while writing.", price: 45, stock: 75, brand: "Deshi" },
    { sku: "AP-001", slug: "color-paper-pack-20", category: "art-paper", nameBn: "কালার পেপার (২০ শিট)", nameEn: "Colour Paper (20 sheets)", descBn: "উজ্জ্বল রঙ, ক্রাফট ও স্কুল প্রজেক্টের জন্য।", descEn: "Bright colours for craft and school projects.", price: 70, stock: 85, brand: "ArtPro" },
    { sku: "AP-002", slug: "chart-paper-white", category: "art-paper", nameBn: "চার্ট পেপার (সাদা)", nameEn: "Chart Paper (White)", descBn: "বড় সাইজের সাদা চার্ট, পোস্টার ও ডায়াগ্রামের জন্য।", descEn: "Large white chart for posters and diagrams.", price: 30, stock: 100, brand: "ArtPro" },
    { sku: "SC-001", slug: "geometry-box-complete", category: "school-supplies", nameBn: "জ্যামিতি বক্স", nameEn: "Geometry Box", descBn: "স্কেল, কম্পাস, প্রোট্রাক্টরসহ সম্পূর্ণ সেট।", descEn: "Complete set with scale, compass and protractor.", price: 180, stock: 40, brand: "Camlin" },
    { sku: "SC-002", slug: "school-bag-medium", category: "school-supplies", nameBn: "স্কুল ব্যাগ (মিডিয়াম)", nameEn: "School Bag (Medium)", descBn: "জলরোধী ফেব্রিক, একাধিক কম্পার্টমেন্ট।", descEn: "Water resistant fabric with multiple compartments.", price: 850, comparePrice: 990, stock: 18, brand: "Tough" },
    { sku: "SC-003", slug: "water-bottle-750ml", category: "school-supplies", nameBn: "পানির বোতল ৭৫০ মিলি", nameEn: "Water Bottle 750ml", descBn: "BPA-মুক্ত, লিক-প্রুফ স্টিল বোতল।", descEn: "BPA free, leak proof steel bottle.", price: 420, stock: 25, brand: "Fresh" },
    { sku: "CB-001", slug: "thakurmar-jhuli", category: "childrens-books", nameBn: "ঠাকুরমার ঝুলি", nameEn: "Thakurmar Jhuli", descBn: "বাংলার চিরায়ত রূপকথার সংকলন।", descEn: "A classic collection of Bengali folk tales.", price: 320, stock: 22, brand: "Anupam" },
    { sku: "EB-001", slug: "hsc-physics-1st-paper", category: "educational-books", nameBn: "এইচএসসি পদার্থবিজ্ঞান ১ম পত্র", nameEn: "HSC Physics 1st Paper", descBn: "সিলেবাস অনুযায়ী বোর্ড প্রশ্নসহ সহায়িকা।", descEn: "Board questions and syllabus aligned guide.", price: 380, stock: 35, brand: "Panjeree" },
    { sku: "EB-002", slug: "ssc-general-math", category: "educational-books", nameBn: "এসএসসি সাধারণ গণিত", nameEn: "SSC General Mathematics", descBn: "অধ্যায়ভিত্তিক সমাধান ও অনুশীলনী।", descEn: "Chapter-wise solutions and practice sets.", price: 340, stock: 28, brand: "Lekhoni" },
    { sku: "OF-001", slug: "a4-copy-paper-500-sheets", category: "office-supplies", nameBn: "A4 কপি পেপার (৫০০ শিট)", nameEn: "A4 Copy Paper (500 sheets)", descBn: "৭০ জিএসএম, প্রিন্ট ও ফটোকপির জন্য।", descEn: "70 GSM, ideal for printing and photocopy.", price: 480, comparePrice: 520, stock: 50, brand: "PaperOne", featured: true },
    { sku: "OF-002", slug: "file-folder-set", category: "office-supplies", nameBn: "ফাইল ফোল্ডার সেট", nameEn: "File Folder Set", descBn: "মজবুত কার্ডবোর্ড ফোল্ডার, ৫টি সেট।", descEn: "Sturdy cardboard folders, set of 5.", price: 160, stock: 65, brand: "OfficePro" },
    { sku: "OF-003", slug: "stapler-with-pins", category: "office-supplies", nameBn: "স্ট্যাপলার ও পিন", nameEn: "Stapler with Pins", descBn: "মাঝারি সাইজ স্ট্যাপলার, পিন বক্সসহ।", descEn: "Medium stapler with a box of pins.", price: 220, stock: 38, brand: "Kangaro" },
    { sku: "OF-004", slug: "scissors-medium", category: "office-supplies", nameBn: "কাঁচি (মাঝারি)", nameEn: "Scissors (Medium)", descBn: "ধারালো স্টেইনলেস স্টিল ব্লেড।", descEn: "Sharp stainless steel blades.", price: 95, stock: 48, brand: "Kangaro" },
  ];

  for (const product of products) {
    const data = {
      categoryId: catIds[product.category],
      nameBn: product.nameBn,
      nameEn: product.nameEn,
      descriptionBn: product.descBn,
      descriptionEn: product.descEn,
      price: product.price,
      comparePrice: product.comparePrice ?? null,
      stock: product.stock,
      brand: product.brand ?? null,
      featured: product.featured ?? false,
      active: true,
      images: [] as Prisma.InputJsonValue,
    };
    await prisma.product.upsert({
      where: { sku: product.sku },
      update: data,
      create: { sku: product.sku, slug: product.slug, ...data },
    });
  }

  // ---------------------------------------------------------------- library
  const bookCategories = [
    { slug: "fiction", nameBn: "উপন্যাস", nameEn: "Fiction" },
    { slug: "academic", nameBn: "একাডেমিক", nameEn: "Academic" },
    { slug: "children", nameBn: "শিশুতোষ", nameEn: "Children" },
    { slug: "reference", nameBn: "রেফারেন্স", nameEn: "Reference" },
    { slug: "bangla-literature", nameBn: "বাংলা সাহিত্য", nameEn: "Bangla Literature" },
  ];

  for (const category of bookCategories) {
    await prisma.bookCategory.upsert({ where: { slug: category.slug }, update: category, create: category });
  }
  const bookCatIds = Object.fromEntries((await prisma.bookCategory.findMany()).map((c) => [c.slug, c.id]));

  const books = [
    { slug: "pather-panchali", cat: "fiction", titleBn: "পথের পাঁচালী", titleEn: "Pather Panchali", author: "বিভূতিভূষণ বন্দ্যোপাধ্যায়", isbn: "9789840412345", year: 1929, total: 3, descBn: "বাংলা সাহিত্যের অন্যতম শ্রেষ্ঠ উপন্যাস।", descEn: "One of the finest novels in Bengali literature." },
    { slug: "sesher-kabita", cat: "bangla-literature", titleBn: "শেষের কবিতা", titleEn: "Shesher Kabita", author: "রবীন্দ্রনাথ ঠাকুর", isbn: "9789840412346", year: 1929, total: 2, descBn: "রবীন্দ্রনাথের কালজয়ী উপন্যাস।", descEn: "A timeless novel by Rabindranath Tagore." },
    { slug: "debdas", cat: "fiction", titleBn: "দেবদাস", titleEn: "Devdas", author: "শরৎচন্দ্র চট্টোপাধ্যায়", isbn: "9789840412347", year: 1917, total: 2, descBn: "প্রেম ও সমাজের দ্বন্দ্বে লেখা ক্লাসিক উপন্যাস।", descEn: "A classic novel of love and social conflict." },
    { slug: "hsc-english-grammar", cat: "academic", titleBn: "এইচএসসি ইংরেজি গ্রামার", titleEn: "HSC English Grammar", author: "ড. মাহবুবুর রহমান", isbn: "9789840412348", year: 2023, total: 5, descBn: "বোর্ড পরীক্ষার জন্য গ্রামার ও কম্পোজিশন।", descEn: "Grammar and composition practice for board exams." },
    { slug: "ssc-physics-guide", cat: "academic", titleBn: "এসএসসি পদার্থবিজ্ঞান সহায়িকা", titleEn: "SSC Physics Guide", author: "মো. শফিকুল ইসলাম", isbn: "9789840412349", year: 2024, total: 4, descBn: "অধ্যায়ভিত্তিক ব্যাখ্যা ও বোর্ড প্রশ্ন।", descEn: "Chapter-wise explanations with board questions." },
    { slug: "chotoder-golpo", cat: "children", titleBn: "ছোটদের মজার গল্প", titleEn: "Fun Stories for Kids", author: "সেলিনা হোসেন", isbn: "9789840412350", year: 2021, total: 6, descBn: "শিশুদের জন্য মজার ও শিক্ষামূলক গল্প।", descEn: "Fun and educational stories for children." },
    { slug: "computer-basics", cat: "reference", titleBn: "কম্পিউটার বেসিক বাংলা", titleEn: "Computer Basics in Bangla", author: "হাওয়া কম্পিউটার টিম", isbn: "9789840412351", year: 2024, total: 3, descBn: "শুরুর পর্যায়ের কম্পিউটার শিক্ষার বাংলা বই।", descEn: "A Bangla book for beginners learning computers." },
    { slug: "bangla-grammar", cat: "reference", titleBn: "বাংলা ব্যাকরণ ও নির্মিতি", titleEn: "Bangla Grammar & Composition", author: "ড. সৌমিত্র শেখর", isbn: "9789840412352", year: 2022, total: 4, descBn: "স্কুল ও কলেজের বাংলা ব্যাকরণ সহায়িকা।", descEn: "Bangla grammar guide for school and college." },
    { slug: "aranyak", cat: "fiction", titleBn: "আরণ্যক", titleEn: "Aranyak", author: "বিভূতিভূষণ বন্দ্যোপাধ্যায়", isbn: "9789840412353", year: 1939, total: 2, descBn: "প্রকৃতি ও মানুষের সম্পর্কের অনন্য উপন্যাস।", descEn: "A remarkable novel of nature and human life." },
    { slug: "gora", cat: "bangla-literature", titleBn: "গোরা", titleEn: "Gora", author: "রবীন্দ্রনাথ ঠাকুর", isbn: "9789840412354", year: 1910, total: 2, descBn: "জাতি, ধর্ম ও পরিচয়ের প্রশ্নে লেখা উপন্যাস।", descEn: "A novel exploring nation, religion and identity." },
    { slug: "english-word-book", cat: "reference", titleBn: "ইংলিশ ওয়ার্ড বুক", titleEn: "English Word Book", author: "আবুল হাসান", isbn: "9789840412355", year: 2023, total: 5, descBn: "প্রতিদিনের ইংরেজি শব্দভাণ্ডার গড়ার বই।", descEn: "Build your everyday English vocabulary." },
    { slug: "biggan-mojar", cat: "children", titleBn: "বিজ্ঞান মজার", titleEn: "Science is Fun", author: "মুহম্মদ জাফর ইকবাল", isbn: "9789840412356", year: 2020, total: 4, descBn: "বিজ্ঞানকে মজারভাবে উপস্থাপন করা বই।", descEn: "A book that makes science fun for young readers." },
  ];

  for (const book of books) {
    const data = {
      categoryId: bookCatIds[book.cat],
      titleBn: book.titleBn,
      titleEn: book.titleEn,
      author: book.author,
      isbn: book.isbn,
      publishedYear: book.year,
      descriptionBn: book.descBn,
      descriptionEn: book.descEn,
      copiesTotal: book.total,
      copiesAvailable: book.total,
      shelf: `S-${book.cat.slice(0, 2).toUpperCase()}`,
    };
    await prisma.book.upsert({
      where: { slug: book.slug },
      update: data,
      create: { slug: book.slug, ...data },
    });
  }

  // ---------------------------------------------------------------- courses
  const courses = [
    {
      slug: "basic-computer-training", titleBn: "বেসিক কম্পিউটার প্রশিক্ষণ", titleEn: "Basic Computer Training",
      summaryBn: "একদম শূন্য থেকে কম্পিউটার চালানো শিখুন।", summaryEn: "Learn to use a computer from absolute zero.",
      descriptionBn: "উইন্ডোজ, ফাইল ম্যানেজমেন্ট, ইন্টারনেট, ইমেইল, টাইপিং ও অফিস অ্যাপ্লিকেশনের বেসিক — হাতে-কলমে প্রশিক্ষণ।",
      descriptionEn: "Windows, file management, internet, email, typing and office application basics — taught hands-on.",
      weeks: 8, fee: 3500, level: "BEGINNER", featured: true,
      syllabus: ["কম্পিউটার পরিচিতি ও হার্ডওয়্যার", "উইন্ডোজ অপারেটিং সিস্টেম", "ফাইল ও ফোল্ডার ব্যবস্থাপনা", "ইন্টারনেট ও ইমেইল", "টাইপিং অনুশীলন", "MS Word বেসিক", "MS Excel বেসিক", "প্রকল্প ও মূল্যায়ন"],
    },
    {
      slug: "microsoft-excel", titleBn: "মাইক্রোসফট এক্সেল", titleEn: "Microsoft Excel",
      summaryBn: "ডেটা, ফর্মুলা ও চার্টসহ এক্সেল দক্ষতা অর্জন করুন।", summaryEn: "Master data, formulas and charts in Excel.",
      descriptionBn: "স্প্রেডশিট বেসিক থেকে পিভট টেবিল, ফর্মুলা, চার্ট ও রিপোর্ট তৈরি পর্যন্ত।",
      descriptionEn: "From spreadsheet basics to pivot tables, formulas, charts and reporting.",
      weeks: 6, fee: 3000, level: "INTERMEDIATE", featured: true,
      syllabus: ["স্প্রেডশিট বেসিক", "সেল ফরম্যাটিং", "প্রয়োজনীয় ফর্মুলা", "ডেটা ভ্যালিডেশন", "চার্ট ও গ্রাফ", "পিভট টেবিল", "রিপোর্ট তৈরি"],
    },
    {
      slug: "graphic-design", titleBn: "গ্রাফিক ডিজাইন", titleEn: "Graphic Design",
      summaryBn: "ফটোশপ ও ইলাস্ট্রেটর দিয়ে ডিজাইন শিখুন।", summaryEn: "Learn design with Photoshop and Illustrator.",
      descriptionBn: "ব্যানার, পোস্টার, সোশ্যাল মিডিয়া কনটেন্ট ও প্রিন্ট ডিজাইনের প্র্যাকটিক্যাল কোর্স।",
      descriptionEn: "A practical course on banners, posters, social content and print design.",
      weeks: 12, fee: 6500, level: "INTERMEDIATE",
      syllabus: ["ডিজাইন প্রিন্সিপল", "ফটোশপ বেসিক", "ইলাস্ট্রেটর বেসিক", "টাইপোগ্রাফি", "ব্যানার ও পোস্টার", "প্রিন্ট ডিজাইন", "পোর্টফোলিও প্রজেক্ট"],
    },
    {
      slug: "bangla-english-typing", titleBn: "বাংলা ও ইংরেজি টাইপিং", titleEn: "Bangla & English Typing",
      summaryBn: "দ্রুত ও নির্ভুল টাইপিং দক্ষতা অর্জন করুন।", summaryEn: "Build fast and accurate typing skills.",
      descriptionBn: "অভ্র কিবোর্ড ও ইংরেজি টাইপিং অনুশীলন, গতি ও নির্ভুলতা মাপার পরীক্ষাসহ।",
      descriptionEn: "Avro keyboard and English typing practice with speed and accuracy tests.",
      weeks: 4, fee: 2000, level: "BEGINNER",
      syllabus: ["কিবোর্ড পরিচিতি", "অভ্র কিবোর্ড", "ইংরেজি টাচ টাইপিং", "গতি অনুশীলন", "নির্ভুলতা পরীক্ষা"],
    },
    {
      slug: "online-application-training", titleBn: "অনলাইন আবেদন প্রশিক্ষণ", titleEn: "Online Application Training",
      summaryBn: "পাসপোর্ট, এনআইডি ও ভর্তির আবেদন করা শিখুন।", summaryEn: "Learn passport, NID and admission applications.",
      descriptionBn: "সরকারি পোর্টাল ব্যবহার, ফরম পূরণ, পেমেন্ট ও ডকুমেন্ট আপলোডের ব্যবহারিক প্রশিক্ষণ।",
      descriptionEn: "Practical training on government portals, form filling, payments and document uploads.",
      weeks: 4, fee: 2500, level: "BEGINNER",
      syllabus: ["সরকারি পোর্টাল পরিচিতি", "পাসপোর্ট আবেদন", "এনআইডি সেবা", "শিক্ষা প্রতিষ্ঠানের আবেদন", "পেমেন্ট ও ভেরিফিকেশন"],
    },
    {
      slug: "internet-email-basics", titleBn: "ইন্টারনেট ও ইমেইল", titleEn: "Internet & Email",
      summaryBn: "নিরাপদে ইন্টারনেট ব্যবহার ও ইমেইল শিখুন।", summaryEn: "Learn safe internet use and email.",
      descriptionBn: "ব্রাউজিং, সার্চ, ইমেইল অ্যাকাউন্ট, ফাইল শেয়ারিং ও অনলাইন নিরাপত্তা।",
      descriptionEn: "Browsing, search, email accounts, file sharing and online safety.",
      weeks: 3, fee: 1500, level: "BEGINNER",
      syllabus: ["ব্রাউজার ও সার্চ", "ইমেইল অ্যাকাউন্ট", "ফাইল শেয়ারিং", "অনলাইন নিরাপত্তা"],
    },
  ];

  for (const course of courses) {
    const data = {
      titleBn: course.titleBn,
      titleEn: course.titleEn,
      summaryBn: course.summaryBn,
      summaryEn: course.summaryEn,
      descriptionBn: course.descriptionBn,
      descriptionEn: course.descriptionEn,
      durationWeeks: course.weeks,
      fee: course.fee,
      level: course.level,
      featured: course.featured ?? false,
      syllabus: course.syllabus as Prisma.InputJsonValue,
      active: true,
    };
    await prisma.course.upsert({
      where: { slug: course.slug },
      update: data,
      create: { slug: course.slug, ...data },
    });
  }

  const courseRows = await prisma.course.findMany({ where: { slug: { in: courses.map((c) => c.slug) } } });
  const trainer = await prisma.user.findUnique({ where: { email: "trainer@hawacomputer.com" } });
  for (const course of courseRows.slice(0, 4)) {
    const code = `B-${course.slug.slice(0, 3).toUpperCase()}-01`;
    const start = new Date();
    start.setDate(start.getDate() + 14);
    const end = new Date(start);
    end.setDate(end.getDate() + course.durationWeeks * 7);
    await prisma.batch.upsert({
      where: { code },
      update: {},
      create: {
        code,
        courseId: course.id,
        startDate: start,
        endDate: end,
        scheduleBn: "শনি – সোম, বিকাল ৫টা – রাত ৭টা",
        scheduleEn: "Sat – Mon, 5pm – 7pm",
        capacity: 20,
        instructorId: trainer?.id ?? null,
      },
    });
  }

  // ---------------------------------------------------------------- CMS
  const testimonials = [
    { name: "সাব্বির আহমেদ", roleBn: "শিক্ষার্থী", roleEn: "Student", messageBn: "পাসপোর্টের আবেদনটা খুব দ্রুত করে দিয়েছেন। প্রতিটি ধাপে ফোনে জানিয়েছেন।", messageEn: "They completed my passport application quickly and called me at every step." },
    { name: "নাজমুল হাসান", roleBn: "ব্যবসায়ী", roleEn: "Business owner", messageBn: "অফিসের স্টেশনারি নিয়মিত এখান থেকেই নিই। দাম ঠিক, ডেলিভারিও সময়মতো।", messageEn: "I buy office stationery here regularly. Fair prices and on-time delivery." },
    { name: "রুমানা আক্তার", roleBn: "শিক্ষিকা", roleEn: "Teacher", messageBn: "এক্সেল কোর্সটি খুব গোছানো ছিল। এখন সহজেই রেজাল্ট শিট বানাতে পারি।", messageEn: "The Excel course was well structured. I can now build result sheets easily." },
  ];

  for (const testimonial of testimonials) {
    const existing = await prisma.testimonial.findFirst({ where: { name: testimonial.name } });
    if (!existing) await prisma.testimonial.create({ data: { ...testimonial, rating: 5, approved: true } });
  }

  const faqs = [
    { questionBn: "আপনারা কি সরকারি অফিস?", questionEn: "Are you a government office?", answerBn: "না। আমরা একটি স্বাধীন সেবা সহায়তা কেন্দ্র। আবেদন সরকারি পোর্টালে জমা হয় এবং অনুমোদনের সিদ্ধান্ত সংশ্লিষ্ট কর্তৃপক্ষ নেয়।", answerEn: "No. We are an independent service assistance centre. Applications are submitted on official portals and approval is decided by the relevant authority." },
    { questionBn: "পেমেন্ট কীভাবে করব?", questionEn: "How do I pay?", answerBn: "বিকাশ, নগদ, রকেট, কার্ড, ব্যাংক বা দোকানে নগদ — যেকোনো মাধ্যমে। অনলাইন পেমেন্টের ক্ষেত্রে ট্রানজেকশন আইডি দিলে আমাদের টিম যাচাই করে নিশ্চিত করে।", answerEn: "bKash, Nagad, Rocket, card, bank or cash at the shop. For online payments, submit the transaction ID and our team verifies it." },
    { questionBn: "অর্ডার কত দিনে সম্পন্ন হয়?", questionEn: "How long does an order take?", answerBn: "প্রতিটি সেবার পেজে আনুমানিক সময় দেওয়া আছে। জরুরি প্রয়োজনে যোগাযোগ করুন।", answerEn: "Each service page shows the estimated time. Contact us for urgent requests." },
    { questionBn: "আমার ডকুমেন্ট কি নিরাপদ?", questionEn: "Are my documents safe?", answerBn: "আপলোড করা ফাইল প্রাইভেট স্টোরেজে রাখা হয় এবং শুধু অনুমোদিত কর্মী অ্যাক্সেস করতে পারেন।", answerEn: "Uploaded files are stored privately and only authorised staff can access them." },
    { questionBn: "ছবি কি অনলাইনে দেখা যাবে?", questionEn: "Will my photos be public?", answerBn: "না। গ্রাহকের ছবি কখনো পাবলিকভাবে দেখানো হয় না।", answerEn: "No. Customer photographs are never shown publicly." },
    { questionBn: "রিফান্ড পাওয়ার নিয়ম কী?", questionEn: "What is the refund policy?", answerBn: "কাজ শুরুর আগে বাতিল করলে সম্পূর্ণ রিফান্ড; কাজ শুরু হয়ে গেলে আংশিক। বিস্তারিত রিফান্ড নীতিতে।", answerEn: "Full refund before work starts, partial once work has begun. See the refund policy for details." },
    { questionBn: "লাইব্রেরির সদস্য হওয়ার উপায়?", questionEn: "How do I join the library?", answerBn: "অ্যাকাউন্ট খুলে লাইব্রেরি পেজ থেকে সদস্যপদের অনুরোধ করুন; লাইব্রেরি ম্যানেজার অনুমোদন করবেন।", answerEn: "Create an account and request membership from the library page; the library manager approves it." },
    { questionBn: "কোর্সের সার্টিফিকেট যাচাই করা যাবে?", questionEn: "Can certificates be verified?", answerBn: "হ্যাঁ, সার্টিফিকেট নম্বর দিয়ে আমাদের ভেরিফিকেশন পেজে যাচাই করা যায়।", answerEn: "Yes, verify any certificate by its number on our verification page." },
  ];

  for (const faq of faqs) {
    const existing = await prisma.faq.findFirst({ where: { questionEn: faq.questionEn } });
    if (!existing) await prisma.faq.create({ data: { ...faq, sortOrder: faqs.indexOf(faq) } });
  }

  const pages = [
    {
      slug: "privacy-policy", titleBn: "প্রাইভেসি পলিসি", titleEn: "Privacy Policy",
      contentBn: "<h2>আমরা কী তথ্য সংগ্রহ করি</h2><p>অর্ডার ও আবেদন সম্পন্ন করতে নাম, মোবাইল নম্বর, ইমেইল, ঠিকানা এবং প্রয়োজনীয় ডকুমেন্ট সংগ্রহ করা হয়।</p><h2>তথ্য কীভাবে ব্যবহার করি</h2><p>শুধুমাত্র আপনার অর্ডার বা আবেদন প্রক্রিয়াকরণ, যোগাযোগ এবং আইনি বাধ্যবাধকতা পূরণে তথ্য ব্যবহার করা হয়।</p><h2>ডকুমেন্ট সংরক্ষণ</h2><p>আপলোড করা ফাইল প্রাইভেট স্টোরেজে সংরক্ষিত হয় এবং শুধু অনুমোদিত কর্মীরা অ্যাক্সেস করতে পারেন। সরকারি পোর্টালের পাসওয়ার্ড বা ওটিপি আমরা সংরক্ষণ করি না।</p><h2>তৃতীয় পক্ষ</h2><p>আপনার সম্মতি ছাড়া আমরা কোনো তৃতীয় পক্ষের কাছে ব্যক্তিগত তথ্য বিক্রি বা শেয়ার করি না।</p><h2>আপনার অধিকার</h2><p>আপনি যেকোনো সময় আপনার তথ্য দেখতে, সংশোধন করতে বা অ্যাকাউন্ট মুছে ফেলার অনুরোধ করতে পারেন।</p>",
      contentEn: "<h2>What we collect</h2><p>To complete orders and applications we collect your name, mobile number, email, address and the documents required for the service.</p><h2>How we use it</h2><p>We use your information only to process your order or application, to contact you, and to meet legal obligations.</p><h2>Document storage</h2><p>Uploaded files are stored in private storage and only authorised staff can access them. We never store government portal passwords or OTPs.</p><h2>Third parties</h2><p>We do not sell or share your personal data with third parties without your consent.</p><h2>Your rights</h2><p>You may request access, correction or deletion of your data at any time.</p>",
    },
    {
      slug: "terms", titleBn: "শর্তাবলী", titleEn: "Terms & Conditions",
      contentBn: "<h2>সেবার প্রকৃতি</h2><p>হাওয়া কম্পিউটার একটি স্বাধীন সেবা সহায়তা কেন্দ্র। আমরা সরকারি পোর্টাল নই এবং কোনো সরকারি সেবার অনুমোদনের নিশ্চয়তা দিই না।</p><h2>গ্রাহকের দায়িত্ব</h2><p>সঠিক ও সত্য তথ্য দেওয়া এবং প্রয়োজনীয় কাগজপত্র প্রদান গ্রাহকের দায়িত্ব। ভুল তথ্যের কারণে সৃষ্ট সমস্যার দায় আমরা নিই না।</p><h2>মূল্য ও পেমেন্ট</h2><p>সেবার মূল্য প্রতিটি সেবা পেজে উল্লেখ থাকে। সরকারি ফি আলাদা।</p><h2>সময়সীমা</h2><p>উল্লেখিত সময় আনুমানিক; সরকারি অফিস বা তৃতীয় পক্ষের কারণে বিলম্ব হতে পারে।</p><h2>ডকুমেন্ট</h2><p>আইনি ডকুমেন্ট শুধুমাত্র টাইপিং ও ফরম্যাটিং সহায়তা হিসেবে প্রদান করা হয়, আইনি পরামর্শ হিসেবে নয়।</p>",
      contentEn: "<h2>Nature of service</h2><p>Hawa Computer is an independent service assistance centre. We are not a government portal and we never guarantee approval of any government service.</p><h2>Your responsibilities</h2><p>You are responsible for providing accurate information and the required documents. We are not liable for issues caused by incorrect information.</p><h2>Pricing and payment</h2><p>Service charges are listed on each service page. Government fees are separate.</p><h2>Timelines</h2><p>Stated timelines are estimates and may be affected by government offices or third parties.</p><h2>Documents</h2><p>Legal documents are provided as typing and formatting assistance only, not legal advice.</p>",
    },
    {
      slug: "refund-policy", titleBn: "রিফান্ড ও বাতিল নীতি", titleEn: "Refund & Cancellation Policy",
      contentBn: "<h2>কাজ শুরুর আগে</h2><p>কাজ শুরু হওয়ার আগে বাতিল করলে সম্পূর্ণ সেবা ফি ফেরত দেওয়া হয় (সরকারি ফি বাদে)।</p><h2>কাজ শুরু হলে</h2><p>কাজ শুরু হয়ে গেলে সম্পন্ন অংশের ভিত্তিতে আংশিক রিফান্ড বিবেচনা করা হয়।</p><h2>সম্পন্ন সেবা</h2><p>সম্পন্ন ও ডেলিভারি দেওয়া সেবার জন্য রিফান্ড প্রযোজ্য নয়, তবে ত্রুটি থাকলে বিনামূল্যে সংশোধন করা হয়।</p><h2>পণ্য ফেরত</h2><p>ক্ষতিগ্রস্ত বা ভুল পণ্য ২৪ ঘণ্টার মধ্যে জানালে পরিবর্তন বা রিফান্ড দেওয়া হয়।</p><h2>প্রক্রিয়া</h2><p>রিফান্ড অনুরোধ সাপোর্ট টিকেটে জানান; অনুমোদনের পর ৫–১০ কর্মদিবসে ফেরত দেওয়া হয়।</p>",
      contentEn: "<h2>Before work starts</h2><p>Cancel before work begins for a full refund of the service fee (government fees excluded).</p><h2>After work starts</h2><p>Once work has begun, a partial refund is considered based on the completed portion.</p><h2>Completed services</h2><p>Completed and delivered services are not refundable, but we fix any defect free of charge.</p><h2>Product returns</h2><p>Report damaged or wrong items within 24 hours for replacement or refund.</p><h2>Process</h2><p>Raise refund requests through a support ticket; approved refunds are returned within 5–10 working days.</p>",
    },
    {
      slug: "about", titleBn: "আমাদের সম্পর্কে", titleEn: "About Us",
      contentBn: "<h2>আমাদের পরিচয়</h2><p>হাওয়া কম্পিউটার স্থানীয় পর্যায়ে কম্পিউটার সেবা, অনলাইন আবেদন সহায়তা, ফটো স্টুডিও, ডকুমেন্ট প্রস্তুতি, স্টেশনারি ও কম্পিউটার প্রশিক্ষণ প্রদান করে।</p><h2>আমাদের লক্ষ্য</h2><p>সহজ, স্বচ্ছ ও নির্ভরযোগ্য ডিজিটাল সেবা সবার হাতের নাগালে পৌঁছে দেওয়া।</p><h2>আমাদের অঙ্গীকার</h2><p>স্বচ্ছ মূল্য, নিরাপদ ডকুমেন্ট হ্যান্ডলিং এবং সময়মতো কাজ সম্পন্ন করা।</p>",
      contentEn: "<h2>Who we are</h2><p>Hawa Computer provides local computer services, online application assistance, photo studio work, document preparation, stationery and computer training.</p><h2>Our goal</h2><p>Make simple, transparent and reliable digital services accessible to everyone.</p><h2>Our commitment</h2><p>Transparent pricing, secure document handling and on-time delivery.</p>",
    },
  ];

  for (const page of pages) {
    await prisma.page.upsert({ where: { slug: page.slug }, update: page, create: page });
  }

  const settings: Record<string, Prisma.InputJsonValue> = {
    businessNameBn: "হাওয়া কম্পিউটার",
    businessNameEn: "Hawa Computer",
    taglineBn: "ডিজিটাল সেবার নির্ভরযোগ্য ঠিকানা",
    taglineEn: "Your trusted digital service centre",
    phone: "+8801700000000",
    whatsapp: "8801700000000",
    email: "hello@hawacomputer.com",
    addressBn: "প্রধান সড়ক, বাজার মোড়, বাংলাদেশ",
    addressEn: "Main Road, Bazar Mor, Bangladesh",
    hoursBn: "শনিবার – বৃহস্পতিবার, সকাল ৯টা – রাত ৯টা",
    hoursEn: "Saturday – Thursday, 9am – 9pm",
    mapEmbedUrl: "https://www.google.com/maps?q=Dhaka,Bangladesh&output=embed",
    facebook: "",
    deliveryInside: 60,
    deliveryOutside: 120,
    freeDeliveryAbove: 3000,
    paymentNoteBn: "পেমেন্ট পাঠানোর পর ট্রানজেকশন আইডি দিন। আমাদের টিম যাচাই করে নিশ্চিত করবে।",
    paymentNoteEn: "Send money, then submit the transaction ID. Our team verifies it before confirming.",
    heroImageUrl: "",
  };

  for (const [key, value] of Object.entries(settings)) {
    await prisma.siteSetting.upsert({ where: { key }, update: { value }, create: { key, value } });
  }

  await prisma.coupon.upsert({
    where: { code: "WELCOME10" },
    update: {},
    create: { code: "WELCOME10", type: "PERCENT", value: 10, minOrder: 500, maxUses: 500, active: true },
  });

  const supplier = await prisma.supplier.findFirst({ where: { name: "Dhaka Stationery House" } });
  if (!supplier) {
    await prisma.supplier.create({
      data: {
        name: "Dhaka Stationery House",
        contactName: "Md. Alam",
        phone: "01811000000",
        address: "Nawabpur Road, Dhaka",
      },
    });
  }
}
