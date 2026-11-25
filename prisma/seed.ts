import { PrismaClient, Prisma } from "@prisma/client";
import bcrypt from "bcryptjs";
import { ALL_PERMISSIONS, PERMISSIONS } from "../src/lib/permissions";
import { seedContent } from "./seed-content";

const prisma = new PrismaClient();

const f = (name: string, labelBn: string, labelEn: string, type = "text", required = true, options?: string[]) => ({
  name,
  labelBn,
  labelEn,
  type,
  required,
  ...(options ? { options } : {}),
});

async function seedRoles() {
  const roles = [
    { slug: "super-admin", name: "Super Admin", isStaff: true, permissions: ALL_PERMISSIONS },
    { slug: "admin", name: "Admin", isStaff: true, permissions: ALL_PERMISSIONS.filter((p) => p !== PERMISSIONS.ROLE_MANAGE) },
    {
      slug: "computer-operator",
      name: "Computer Operator",
      isStaff: true,
      permissions: [
        PERMISSIONS.DASHBOARD_VIEW, PERMISSIONS.ORDER_VIEW_ALL, PERMISSIONS.ORDER_MANAGE,
        PERMISSIONS.APPLICATION_VIEW_ALL, PERMISSIONS.APPLICATION_MANAGE, PERMISSIONS.APPLICATION_DOCUMENTS,
        PERMISSIONS.CUSTOMER_VIEW, PERMISSIONS.SUPPORT_MANAGE,
      ],
    },
    {
      slug: "photo-editor",
      name: "Photo Editor",
      isStaff: true,
      permissions: [PERMISSIONS.DASHBOARD_VIEW, PERMISSIONS.ORDER_VIEW_ALL, PERMISSIONS.ORDER_MANAGE, PERMISSIONS.APPLICATION_DOCUMENTS],
    },
    {
      slug: "sales-manager",
      name: "Sales Manager",
      isStaff: true,
      permissions: [
        PERMISSIONS.DASHBOARD_VIEW, PERMISSIONS.ORDER_VIEW_ALL, PERMISSIONS.ORDER_MANAGE,
        PERMISSIONS.PRODUCT_MANAGE, PERMISSIONS.INVENTORY_MANAGE, PERMISSIONS.CUSTOMER_VIEW,
        PERMISSIONS.PAYMENT_VERIFY, PERMISSIONS.REPORT_VIEW,
      ],
    },
    {
      slug: "library-manager",
      name: "Library Manager",
      isStaff: true,
      permissions: [PERMISSIONS.DASHBOARD_VIEW, PERMISSIONS.LIBRARY_MANAGE, PERMISSIONS.CUSTOMER_VIEW],
    },
    {
      slug: "training-instructor",
      name: "Training Instructor",
      isStaff: true,
      permissions: [
        PERMISSIONS.DASHBOARD_VIEW, PERMISSIONS.COURSE_MANAGE, PERMISSIONS.ENROLLMENT_MANAGE,
        PERMISSIONS.ATTENDANCE_MANAGE, PERMISSIONS.CERTIFICATE_ISSUE, PERMISSIONS.CUSTOMER_VIEW,
      ],
    },
    {
      slug: "accountant",
      name: "Accountant",
      isStaff: true,
      permissions: [
        PERMISSIONS.DASHBOARD_VIEW, PERMISSIONS.FINANCE_VIEW, PERMISSIONS.FINANCE_MANAGE,
        PERMISSIONS.REPORT_VIEW, PERMISSIONS.PAYMENT_VERIFY, PERMISSIONS.REFUND_MANAGE,
        PERMISSIONS.ORDER_VIEW_ALL,
      ],
    },
    { slug: "customer", name: "Customer", isStaff: false, permissions: [] },
  ];

  for (const role of roles) {
    await prisma.role.upsert({
      where: { slug: role.slug },
      update: { name: role.name, permissions: role.permissions, isStaff: role.isStaff },
      create: { ...role, description: `${role.name} role` },
    });
  }
}

async function seedUsers() {
  const roleBySlug = Object.fromEntries((await prisma.role.findMany()).map((r) => [r.slug, r.id]));
  const staffPassword = await bcrypt.hash("Admin@12345", 12);
  const customerPassword = await bcrypt.hash("Customer@12345", 12);

  const staff = [
    { email: "owner@hawacomputer.com", name: "Hawa Owner", role: "super-admin", designation: "Proprietor" },
    { email: "admin@hawacomputer.com", name: "Site Admin", role: "admin", designation: "Manager" },
    { email: "operator@hawacomputer.com", name: "Rafiq Operator", role: "computer-operator", designation: "Computer Operator" },
    { email: "photo@hawacomputer.com", name: "Sumaiya Photo", role: "photo-editor", designation: "Photo Editor" },
    { email: "sales@hawacomputer.com", name: "Karim Sales", role: "sales-manager", designation: "Sales Manager" },
    { email: "library@hawacomputer.com", name: "Nusrat Library", role: "library-manager", designation: "Librarian" },
    { email: "trainer@hawacomputer.com", name: "Jahid Trainer", role: "training-instructor", designation: "Instructor" },
    { email: "accounts@hawacomputer.com", name: "Farhana Accounts", role: "accountant", designation: "Accountant" },
  ];

  for (const person of staff) {
    await prisma.user.upsert({
      where: { email: person.email },
      update: { roleId: roleBySlug[person.role], name: person.name },
      create: {
        email: person.email,
        name: person.name,
        passwordHash: staffPassword,
        roleId: roleBySlug[person.role],
        staff: { create: { designation: person.designation } },
      },
    });
  }

  const customers = [
    { email: "rahim@example.com", name: "Rahim Uddin", phone: "01711000001", city: "Dhaka" },
    { email: "fatema@example.com", name: "Fatema Akter", phone: "01711000002", city: "Chattogram" },
  ];

  for (const customer of customers) {
    await prisma.user.upsert({
      where: { email: customer.email },
      update: { roleId: roleBySlug.customer },
      create: {
        email: customer.email,
        name: customer.name,
        phone: customer.phone,
        passwordHash: customerPassword,
        roleId: roleBySlug.customer,
        profile: { create: { city: customer.city, district: customer.city } },
      },
    });
  }
}

type SeedService = {
  slug: string;
  nameBn: string;
  nameEn: string;
  summaryBn: string;
  summaryEn: string;
  descriptionBn: string;
  descriptionEn: string;
  kind: "APPLICATION" | "PHOTO" | "DOCUMENT" | "PRINTING" | "OTHER";
  price: number;
  timeBn: string;
  timeEn: string;
  icon: string;
  featured?: boolean;
  requirements?: string[];
  documents?: string[];
  fields?: ReturnType<typeof f>[];
};

async function seedServiceCategories() {
  const categories = [
    { slug: "online-applications", nameBn: "অনলাইন আবেদন", nameEn: "Online Applications", icon: "ClipboardList", sortOrder: 1 },
    { slug: "passport-nid", nameBn: "পাসপোর্ট ও এনআইডি", nameEn: "Passport & NID", icon: "IdCard", sortOrder: 2 },
    { slug: "education", nameBn: "শিক্ষা সংক্রান্ত", nameEn: "Education", icon: "GraduationCap", sortOrder: 3 },
    { slug: "job-career", nameBn: "চাকরি ও ক্যারিয়ার", nameEn: "Jobs & Career", icon: "Briefcase", sortOrder: 4 },
    { slug: "photo-studio", nameBn: "ফটো স্টুডিও", nameEn: "Photo Studio", icon: "Camera", sortOrder: 5 },
    { slug: "documents", nameBn: "ডকুমেন্ট সেবা", nameEn: "Document Services", icon: "FilePen", sortOrder: 6 },
    { slug: "printing", nameBn: "প্রিন্ট ও স্ক্যান", nameEn: "Printing & Scanning", icon: "Printer", sortOrder: 7 },
  ];

  for (const category of categories) {
    await prisma.serviceCategory.upsert({
      where: { slug: category.slug },
      update: category,
      create: category,
    });
  }
}

async function seedServices() {
  const categories = Object.fromEntries((await prisma.serviceCategory.findMany()).map((c) => [c.slug, c.id]));

  const services: (SeedService & { category: string })[] = [
    {
      category: "passport-nid", slug: "passport-application", kind: "APPLICATION", price: 700, icon: "IdCard", featured: true,
      nameBn: "ই-পাসপোর্ট আবেদন সহায়তা", nameEn: "e-Passport Application Assistance",
      summaryBn: "অনলাইন আবেদন ফরম, ফি প্রদান ও অ্যাপয়েন্টমেন্টে সম্পূর্ণ সহায়তা।",
      summaryEn: "Full help with the online form, fee payment and appointment.",
      descriptionBn: "বাংলাদেশ ই-পাসপোর্ট পোর্টালে আবেদন করতে সহায়তা করি — ফরম পূরণ, ছবি প্রস্তুত, ফি প্রদান ও অ্যাপয়েন্টমেন্ট স্লিপ। আবেদন সরকারি পোর্টালেই জমা হয়; অনুমোদনের নিশ্চয়তা আমরা দিই না।",
      descriptionEn: "We help with the Bangladesh e-Passport portal: form filling, photo preparation, fee payment and the appointment slip. The application is submitted on the official portal and we do not guarantee approval.",
      timeBn: "১ – ২ কর্মদিবস", timeEn: "1 – 2 working days",
      requirements: ["১৮ বছর পূর্ণ", "এনআইডি বা জন্ম নিবন্ধন সক্রিয়", "সরকারি ফি আলাদা"],
      documents: ["জাতীয় পরিচয়পত্র", "জন্ম নিবন্ধন সনদ", "পুরনো পাসপোর্ট (নবায়নে)", "পাসপোর্ট সাইজ ছবি"],
      fields: [
        f("fullName", "পূর্ণ নাম (ইংরেজিতে)", "Full name (English)"),
        f("fatherName", "পিতার নাম", "Father's name"),
        f("motherName", "মাতার নাম", "Mother's name"),
        f("dateOfBirth", "জন্ম তারিখ", "Date of birth", "date"),
        f("nid", "এনআইডি নম্বর", "NID number"),
        f("birthPlace", "জন্মস্থান", "Place of birth"),
        f("presentAddress", "বর্তমান ঠিকানা", "Present address", "textarea"),
        f("permanentAddress", "স্থায়ী ঠিকানা", "Permanent address", "textarea"),
        f("occupation", "পেশা", "Occupation"),
        f("contact", "যোগাযোগ নম্বর", "Contact number", "tel"),
      ],
    },
    {
      category: "passport-nid", slug: "passport-renewal", kind: "APPLICATION", price: 600, icon: "IdCard",
      nameBn: "পাসপোর্ট নবায়ন সহায়তা", nameEn: "Passport Renewal Assistance",
      summaryBn: "মেয়াদোত্তীর্ণ পাসপোর্ট নবায়নের আবেদনে সহায়তা।",
      summaryEn: "Assistance renewing expired passports.",
      descriptionBn: "পুরনো পাসপোর্টের তথ্য যাচাই করে নবায়ন আবেদন, ফি ও অ্যাপয়েন্টমেন্ট প্রস্তুত করতে সহায়তা করি।",
      descriptionEn: "We verify your old passport details and help prepare the renewal, fee and appointment.",
      timeBn: "১ – ২ কর্মদিবস", timeEn: "1 – 2 working days",
      requirements: ["পুরনো পাসপোর্ট", "এনআইডি সক্রিয়"],
      documents: ["পুরনো পাসপোর্ট", "এনআইডি", "ছবি"],
      fields: [
        f("fullName", "পূর্ণ নাম", "Full name"),
        f("passportNo", "পুরনো পাসপোর্ট নম্বর", "Old passport number"),
        f("nid", "এনআইডি নম্বর", "NID number"),
        f("expiryDate", "পুরনো পাসপোর্টের মেয়াদ", "Old passport expiry", "date"),
        f("contact", "যোগাযোগ নম্বর", "Contact number", "tel"),
      ],
    },
    {
      category: "passport-nid", slug: "nid-correction", kind: "APPLICATION", price: 500, icon: "IdCard", featured: true,
      nameBn: "এনআইডি সংশোধন সহায়তা", nameEn: "NID Correction Assistance",
      summaryBn: "নাম, জন্ম তারিখ বা ঠিকানা সংশোধনের আবেদনে সহায়তা।",
      summaryEn: "Help preparing name, date of birth or address corrections.",
      descriptionBn: "প্রয়োজনীয় কাগজপত্র যাচাই, আবেদন ফরম পূরণ ও সেবা কেন্দ্রে জমা দেওয়ার প্রক্রিয়ায় সহায়তা। সংশোধনের অনুমোদন সরকারি কর্তৃপক্ষের এখতিয়ারভুক্ত।",
      descriptionEn: "We check papers, fill the correction form and guide submission at the service centre. Approval rests with the government authority.",
      timeBn: "২ – ৫ কর্মদিবস", timeEn: "2 – 5 working days",
      requirements: ["সংশোধনের প্রমাণপত্র", "এনআইডি কপি"],
      documents: ["এনআইডি কপি", "জন্ম নিবন্ধন", "প্রমাণপত্র"],
      fields: [
        f("fullName", "পূর্ণ নাম", "Full name"),
        f("nid", "এনআইডি নম্বর", "NID number"),
        f("correctionType", "সংশোধনের ধরন", "Correction type", "select", true, ["Name", "Date of birth", "Address", "Other"]),
        f("details", "বিস্তারিত", "Details", "textarea"),
        f("contact", "যোগাযোগ নম্বর", "Contact number", "tel"),
      ],
    },
    {
      category: "passport-nid", slug: "nid-registration", kind: "APPLICATION", price: 400, icon: "IdCard",
      nameBn: "এনআইডি নিবন্ধন নির্দেশনা", nameEn: "NID Registration Guidance",
      summaryBn: "নতুন ভোটার এনআইডি নিবন্ধনে নির্দেশনা ও ফরম সহায়তা।",
      summaryEn: "Guidance and form help for new voter ID registration.",
      descriptionBn: "অনলাইন ভোটার নিবন্ধন ফরম পূরণ, কাগজপত্র প্রস্তুত ও যাচাইয়ে সহায়তা।",
      descriptionEn: "Help filling the online voter registration form and preparing papers.",
      timeBn: "১ – ৩ কর্মদিবস", timeEn: "1 – 3 working days",
      requirements: ["বয়স ১৮ বছর পূর্ণ", "বাংলাদেশি নাগরিকত্ব"],
      documents: ["জন্ম নিবন্ধন", "পিতামাতার এনআইডি", "ঠিকানার প্রমাণ"],
      fields: [
        f("fullName", "পূর্ণ নাম", "Full name"),
        f("dateOfBirth", "জন্ম তারিখ", "Date of birth", "date"),
        f("fatherName", "পিতার নাম", "Father's name"),
        f("motherName", "মাতার নাম", "Mother's name"),
        f("address", "ঠিকানা", "Address", "textarea"),
        f("contact", "যোগাযোগ নম্বর", "Contact number", "tel"),
      ],
    },
    {
      category: "passport-nid", slug: "birth-registration", kind: "APPLICATION", price: 450, icon: "Baby",
      nameBn: "জন্ম নিবন্ধন সহায়তা", nameEn: "Birth Registration Assistance",
      summaryBn: "নতুন জন্ম নিবন্ধন আবেদন ও জমা দেওয়ার সহায়তা।",
      summaryEn: "Form filling and submission help for birth registration.",
      descriptionBn: "জন্ম নিবন্ধন অনলাইন আবেদন প্রস্তুত, ফি প্রদান ও সনদ সংগ্রহের প্রক্রিয়ায় সহায়তা।",
      descriptionEn: "We prepare the online birth registration application, handle the fee and guide collection.",
      timeBn: "৩ – ৭ কর্মদিবস", timeEn: "3 – 7 working days",
      requirements: ["শিশুর জন্মের তথ্য", "পিতামাতার এনআইডি"],
      documents: ["পিতামাতার এনআইডি", "হাসপাতালের কাগজ", "টিকা কার্ড (ঐচ্ছিক)"],
      fields: [
        f("childName", "শিশুর নাম", "Child's name"),
        f("dateOfBirth", "জন্ম তারিখ", "Date of birth", "date"),
        f("gender", "লিঙ্গ", "Gender", "select", true, ["Male", "Female", "Other"]),
        f("fatherName", "পিতার নাম", "Father's name"),
        f("motherName", "মাতার নাম", "Mother's name"),
        f("address", "স্থায়ী ঠিকানা", "Permanent address", "textarea"),
        f("contact", "যোগাযোগ নম্বর", "Contact number", "tel"),
      ],
    },
    {
      category: "passport-nid", slug: "birth-certificate-correction", kind: "APPLICATION", price: 450, icon: "Baby",
      nameBn: "জন্ম সনদ সংশোধন সহায়তা", nameEn: "Birth Certificate Correction",
      summaryBn: "জন্ম সনদে নাম বা তথ্য সংশোধনের আবেদনে সহায়তা।",
      summaryEn: "Assistance correcting names or details on a birth certificate.",
      descriptionBn: "সংশোধনের প্রমাণপত্র যাচাই করে অনলাইন আবেদন প্রস্তুত করা হয়। অনুমোদন সংশ্লিষ্ট কর্তৃপক্ষের সিদ্ধান্ত।",
      descriptionEn: "We verify supporting papers and prepare the online request. Approval is decided by the authority.",
      timeBn: "৩ – ৭ কর্মদিবস", timeEn: "3 – 7 working days",
      requirements: ["বর্তমান জন্ম সনদ", "সংশোধনের প্রমাণ"],
      documents: ["জন্ম সনদ", "এনআইডি", "প্রমাণপত্র"],
      fields: [
        f("certificateNo", "জন্ম সনদ নম্বর", "Certificate number"),
        f("childName", "নিবন্ধিত নাম", "Registered name"),
        f("correctionDetails", "যা সংশোধন করতে চান", "What needs correcting", "textarea"),
        f("contact", "যোগাযোগ নম্বর", "Contact number", "tel"),
      ],
    },
    {
      category: "passport-nid", slug: "police-clearance", kind: "APPLICATION", price: 600, icon: "ShieldCheck",
      nameBn: "পুলিশ ক্লিয়ারেন্স সহায়তা", nameEn: "Police Clearance Assistance",
      summaryBn: "বিদেশ যাত্রার পুলিশ ক্লিয়ারেন্স আবেদনে সহায়তা।",
      summaryEn: "Help with police clearance applications for travel abroad.",
      descriptionBn: "অনলাইন আবেদন, ফি প্রদান ও বায়োমেট্রিক সময়সূচি সংক্রান্ত সহায়তা।",
      descriptionEn: "Help with the online application, fee and biometric scheduling.",
      timeBn: "৩ – ১০ কর্মদিবস", timeEn: "3 – 10 working days",
      requirements: ["পাসপোর্ট ও ভিসার তথ্য", "এনআইডি"],
      documents: ["পাসপোর্ট", "এনআইডি", "ভিসা/আমন্ত্রণপত্র"],
      fields: [
        f("fullName", "পূর্ণ নাম", "Full name"),
        f("passportNo", "পাসপোর্ট নম্বর", "Passport number"),
        f("nid", "এনআইডি নম্বর", "NID number"),
        f("purpose", "উদ্দেশ্য", "Purpose"),
        f("contact", "যোগাযোগ নম্বর", "Contact number", "tel"),
      ],
    },
    {
      category: "education", slug: "school-admission", kind: "APPLICATION", price: 350, icon: "GraduationCap", featured: true,
      nameBn: "স্কুল ভর্তি আবেদন", nameEn: "School Admission Application",
      summaryBn: "স্কুল ভর্তির অনলাইন আবেদন ফরম পূরণ ও জমা।",
      summaryEn: "Online school admission form filling and submission.",
      descriptionBn: "নির্ধারিত স্কুলের ভর্তি ফরম পূরণ, ছবি সংযোজন ও আবেদন ফি প্রদানে সহায়তা।",
      descriptionEn: "We fill the school's admission form, attach the photo and handle the fee.",
      timeBn: "১ কর্মদিবস", timeEn: "1 working day",
      requirements: ["শিক্ষার্থীর জন্ম সনদ", "অভিভাবকের মোবাইল নম্বর"],
      documents: ["জন্ম সনদ", "পূর্ববর্তী ফলাফল", "ছবি"],
      fields: [
        f("studentName", "শিক্ষার্থীর নাম", "Student name"),
        f("dateOfBirth", "জন্ম তারিখ", "Date of birth", "date"),
        f("guardianName", "অভিভাবকের নাম", "Guardian name"),
        f("class", "শ্রেণি", "Class"),
        f("schoolName", "স্কুলের নাম", "School name"),
        f("contact", "যোগাযোগ নম্বর", "Contact number", "tel"),
      ],
    },
    {
      category: "education", slug: "college-admission", kind: "APPLICATION", price: 400, icon: "GraduationCap",
      nameBn: "কলেজ ভর্তি আবেদন", nameEn: "College Admission Application",
      summaryBn: "একাদশ শ্রেণিতে ভর্তির অনলাইন আবেদনে সহায়তা।",
      summaryEn: "Assistance with online class XI admission.",
      descriptionBn: "কলেজ ভর্তি পোর্টালে আবেদন, পছন্দক্রম নির্ধারণ ও ফি প্রদানে সহায়তা।",
      descriptionEn: "Help applying on the college portal, setting preferences and paying the fee.",
      timeBn: "১ কর্মদিবস", timeEn: "1 working day",
      requirements: ["এসএসসি ফলাফল", "জন্ম সনদ"],
      documents: ["এসএসসি মার্কশিট", "জন্ম সনদ", "ছবি"],
      fields: [
        f("studentName", "শিক্ষার্থীর নাম", "Student name"),
        f("sscRoll", "এসএসসি রোল", "SSC roll"),
        f("sscYear", "এসএসসি সাল", "SSC year"),
        f("group", "গ্রুপ", "Group", "select", true, ["Science", "Humanities", "Business Studies"]),
        f("collegeName", "কলেজের নাম", "College name"),
        f("contact", "যোগাযোগ নম্বর", "Contact number", "tel"),
      ],
    },
    {
      category: "education", slug: "university-admission", kind: "APPLICATION", price: 500, icon: "Landmark",
      nameBn: "বিশ্ববিদ্যালয় ভর্তি আবেদন", nameEn: "University Admission Application",
      summaryBn: "বিশ্ববিদ্যালয় ভর্তি পরীক্ষার আবেদন ফরম পূরণে সহায়তা।",
      summaryEn: "Help filling university admission test applications.",
      descriptionBn: "আবেদন, ছবি আপলোড, পেমেন্ট ও অ্যাডমিট কার্ড ডাউনলোডে সহায়তা।",
      descriptionEn: "We help with the application, photo upload, payment and admit card download.",
      timeBn: "১ কর্মদিবস", timeEn: "1 working day",
      requirements: ["এইচএসসি ফলাফল", "এনআইডি/জন্ম সনদ"],
      documents: ["এইচএসসি মার্কশিট", "ছবি", "এনআইডি"],
      fields: [
        f("studentName", "শিক্ষার্থীর নাম", "Student name"),
        f("hscYear", "এইচএসসি সাল", "HSC year"),
        f("gpa", "জিপিএ", "GPA"),
        f("subject", "বিভাগ", "Group"),
        f("university", "বিশ্ববিদ্যালয়", "University"),
        f("contact", "যোগাযোগ নম্বর", "Contact number", "tel"),
      ],
    },
    {
      category: "job-career", slug: "job-application", kind: "APPLICATION", price: 300, icon: "Briefcase",
      nameBn: "চাকরির আবেদন ফরম পূরণ", nameEn: "Job Application Form Filling",
      summaryBn: "সরকারি ও বেসরকারি চাকরির আবেদন ফরম পূরণ ও জমা।",
      summaryEn: "Filling and submitting government and private job applications.",
      descriptionBn: "নিয়োগ বিজ্ঞপ্তি অনুযায়ী আবেদন ফরম পূরণ, কাগজপত্র সংযুক্তি ও ফি প্রদান।",
      descriptionEn: "We complete the application per the circular, attach documents and pay the fee.",
      timeBn: "১ কর্মদিবস", timeEn: "1 working day",
      requirements: ["নিয়োগ বিজ্ঞপ্তির তথ্য", "শিক্ষাগত কাগজ"],
      documents: ["সিভি", "শিক্ষাগত সনদ", "ছবি"],
      fields: [
        f("fullName", "পূর্ণ নাম", "Full name"),
        f("position", "পদের নাম", "Position"),
        f("organization", "প্রতিষ্ঠান", "Organisation"),
        f("education", "শিক্ষাগত যোগ্যতা", "Education", "textarea"),
        f("experience", "অভিজ্ঞতা", "Experience", "textarea", false),
        f("contact", "যোগাযোগ নম্বর", "Contact number", "tel"),
      ],
    },
    {
      category: "job-career", slug: "cv-creation", kind: "APPLICATION", price: 250, icon: "FileText", featured: true,
      nameBn: "সিভি / রেজুমে তৈরি", nameEn: "CV / Resume Creation",
      summaryBn: "পেশাদার ফরম্যাটে বাংলা বা ইংরেজি সিভি তৈরি।",
      summaryEn: "Professional Bangla or English CV writing.",
      descriptionBn: "আপনার তথ্য অনুযায়ী ATS-বান্ধব, পরিষ্কার সিভি তৈরি করে PDF ও Word কপি দেওয়া হয়।",
      descriptionEn: "We build a clean, ATS-friendly CV from your details and deliver PDF and Word copies.",
      timeBn: "১ – ২ কর্মদিবস", timeEn: "1 – 2 working days",
      requirements: ["শিক্ষাগত ও অভিজ্ঞতার তথ্য", "ছবি (ঐচ্ছিক)"],
      documents: ["পুরনো সিভি (ঐচ্ছিক)", "সনদপত্র"],
      fields: [
        f("fullName", "পূর্ণ নাম", "Full name"),
        f("targetRole", "লক্ষ্য পদ", "Target role"),
        f("education", "শিক্ষাগত যোগ্যতা", "Education", "textarea"),
        f("experience", "অভিজ্ঞতা", "Experience", "textarea", false),
        f("skills", "দক্ষতা", "Skills", "textarea"),
        f("contact", "যোগাযোগ নম্বর", "Contact number", "tel"),
      ],
    },
    {
      category: "job-career", slug: "scholarship-application", kind: "APPLICATION", price: 500, icon: "BookMarked",
      nameBn: "স্কলারশিপ আবেদন সহায়তা", nameEn: "Scholarship Application Help",
      summaryBn: "দেশি-বিদেশি স্কলারশিপ আবেদনে কাগজপত্র ও ফরম সহায়তা।",
      summaryEn: "Paperwork and form help for local and foreign scholarships.",
      descriptionBn: "শর্ত যাচাই, ফরম পূরণ ও প্রয়োজনীয় ডকুমেন্ট প্রস্তুতিতে সহায়তা।",
      descriptionEn: "We check eligibility, fill forms and help prepare the required documents.",
      timeBn: "৩ – ৫ কর্মদিবস", timeEn: "3 – 5 working days",
      requirements: ["একাডেমিক ট্রান্সক্রিপ্ট", "সুপারিশপত্র"],
      documents: ["ট্রান্সক্রিপ্ট", "সুপারিশপত্র", "পাসপোর্ট কপি"],
      fields: [
        f("fullName", "পূর্ণ নাম", "Full name"),
        f("institution", "প্রতিষ্ঠান", "Institution"),
        f("cgpa", "সিজিপিএ", "CGPA"),
        f("program", "প্রোগ্রাম", "Program"),
        f("country", "দেশ", "Country"),
        f("contact", "যোগাযোগ নম্বর", "Contact number", "tel"),
      ],
    },
    {
      category: "online-applications", slug: "government-form-filling", kind: "APPLICATION", price: 250, icon: "ClipboardList",
      nameBn: "সরকারি ফরম পূরণ", nameEn: "Government Form Filling",
      summaryBn: "যেকোনো সরকারি অনলাইন ফরম পূরণে সহায়তা।",
      summaryEn: "Help filling any government online form.",
      descriptionBn: "ফরমের ধরন জানিয়ে আবেদন করুন; ফরম পূরণ, আপলোড ও ফি প্রদানে সহায়তা করব।",
      descriptionEn: "Tell us which form you need; we help with filling, uploads and fee payment.",
      timeBn: "১ কর্মদিবস", timeEn: "1 working day",
      requirements: ["ফরমের লিংক বা নাম", "প্রয়োজনীয় তথ্য"],
      documents: ["প্রযোজ্য কাগজপত্র"],
      fields: [
        f("fullName", "পূর্ণ নাম", "Full name"),
        f("formName", "ফরমের নাম", "Form name"),
        f("details", "প্রয়োজনীয় তথ্য", "Details", "textarea"),
        f("contact", "যোগাযোগ নম্বর", "Contact number", "tel"),
      ],
    },
    {
      category: "photo-studio", slug: "passport-size-photo", kind: "PHOTO", price: 60, icon: "Camera", featured: true,
      nameBn: "পাসপোর্ট সাইজ ছবি", nameEn: "Passport Size Photo",
      summaryBn: "৫৫×৪৫ মিমি পাসপোর্ট সাইজ ছবি, রিটাচিংসহ।",
      summaryEn: "55×45 mm passport size photos with retouching.",
      descriptionBn: "সরকারি ও ভিসা আবেদনের জন্য গ্রহণযোগ্য ছবি। সাদা, নীল বা লাল ব্যাকগ্রাউন্ড।",
      descriptionEn: "Photos accepted for official and visa applications. White, blue or red background.",
      timeBn: "৩০ মিনিট", timeEn: "30 minutes",
      requirements: ["ছবি আপলোড করুন অথবা দোকানে আসুন"],
      fields: [
        f("size", "সাইজ", "Size", "select", true, ["55x45 mm", "50x50 mm", "35x45 mm"]),
        f("background", "ব্যাকগ্রাউন্ড", "Background", "select", true, ["White", "Blue", "Red"]),
        f("copies", "কপি সংখ্যা", "Number of copies"),
      ],
    },
    {
      category: "photo-studio", slug: "visa-size-photo", kind: "PHOTO", price: 80, icon: "Camera",
      nameBn: "ভিসা সাইজ ছবি", nameEn: "Visa Size Photo",
      summaryBn: "দেশভিত্তিক ভিসার শর্ত অনুযায়ী ছবি প্রস্তুত।",
      summaryEn: "Visa photos prepared to each country's requirements.",
      descriptionBn: "ভিসার নির্দিষ্ট সাইজ ও ব্যাকগ্রাউন্ড অনুযায়ী ছবি তৈরি ও প্রিন্ট।",
      descriptionEn: "Photos created and printed to the exact size and background your visa requires.",
      timeBn: "১ ঘণ্টা", timeEn: "1 hour",
      requirements: ["ভিসার ধরন জানান"],
      fields: [
        f("country", "দেশ", "Country"),
        f("background", "ব্যাকগ্রাউন্ড", "Background", "select", true, ["White", "Blue", "Red"]),
        f("copies", "কপি সংখ্যা", "Number of copies"),
      ],
    },
    {
      category: "photo-studio", slug: "photo-retouching", kind: "PHOTO", price: 150, icon: "Sparkles",
      nameBn: "ফটো রিটাচিং", nameEn: "Photo Retouching",
      summaryBn: "পুরনো বা নষ্ট ছবি পেশাদারভাবে রিটাচ ও রিস্টোর।",
      summaryEn: "Professional retouching and restoration for old photos.",
      descriptionBn: "স্ক্যান করা ছবি বা ডিজিটাল ফাইল রিটাচ, রঙ সংশোধন ও রিস্টোর করা হয়।",
      descriptionEn: "We retouch scanned or digital photos, correct colour and restore damage.",
      timeBn: "১ – ২ কর্মদিবস", timeEn: "1 – 2 working days",
      requirements: ["মূল ছবি আপলোড করুন"],
      fields: [
        f("workType", "কাজের ধরন", "Work type", "select", true, ["Retouch", "Restore old photo", "Background remove", "Colour correct"]),
        f("notes", "নির্দেশনা", "Instructions", "textarea", false),
      ],
    },
    {
      category: "photo-studio", slug: "document-scanning", kind: "PHOTO", price: 20, icon: "ScanLine",
      nameBn: "ডকুমেন্ট স্ক্যানিং", nameEn: "Document Scanning",
      summaryBn: "কাগজপত্র উচ্চ রেজোলিউশনে স্ক্যান ও PDF তৈরি।",
      summaryEn: "High resolution scanning and PDF creation.",
      descriptionBn: "একাধিক পৃষ্ঠা স্ক্যান করে একক PDF বা আলাদা ছবি হিসেবে দেওয়া হয়।",
      descriptionEn: "We scan multiple pages and deliver a single PDF or individual images.",
      timeBn: "৩০ মিনিট", timeEn: "30 minutes",
      requirements: ["মূল কাগজ আনুন"],
      fields: [
        f("pages", "পৃষ্ঠা সংখ্যা", "Pages"),
        f("output", "আউটপুট", "Output", "select", true, ["PDF", "JPG", "Both"]),
        f("resolution", "রেজোলিউশন", "Resolution", "select", false, ["200 DPI", "300 DPI", "600 DPI"]),
      ],
    },
    {
      category: "printing", slug: "printing-photocopy", kind: "PRINTING", price: 5, icon: "Printer", featured: true,
      nameBn: "প্রিন্ট ও ফটোকপি", nameEn: "Printing & Photocopy",
      summaryBn: "সাদা-কালো ও রঙিন প্রিন্ট, ফটোকপি ও ল্যামিনেশন।",
      summaryEn: "Black & white and colour printing, photocopy and lamination.",
      descriptionBn: "A4/A3 সাইজে প্রিন্ট, ফটোকপি, স্ক্যান ও ল্যামিনেশন। ফাইল আপলোড করলে দোকান থেকে সংগ্রহ করুন।",
      descriptionEn: "A4/A3 printing, photocopy, scanning and lamination. Upload a file and collect from the shop.",
      timeBn: "১৫ – ৩০ মিনিট", timeEn: "15 – 30 minutes",
      requirements: ["প্রিন্টযোগ্য ফাইল"],
      fields: [
        f("paperSize", "কাগজের সাইজ", "Paper size", "select", true, ["A4", "A3", "Legal"]),
        f("colorMode", "রঙ", "Colour", "select", true, ["Black & white", "Colour"]),
        f("sides", "সাইড", "Sides", "select", true, ["Single side", "Double side"]),
        f("lamination", "ল্যামিনেশন", "Lamination", "select", false, ["No", "Yes"]),
      ],
    },
    {
      category: "documents", slug: "bangla-typing", kind: "DOCUMENT", price: 100, icon: "PenLine", featured: true,
      nameBn: "বাংলা টাইপিং", nameEn: "Bangla Typing",
      summaryBn: "হাতে লেখা বা ছবি থেকে বাংলা টাইপিং।",
      summaryEn: "Bangla typing from handwriting or images.",
      descriptionBn: "হাতে লেখা ডকুমেন্ট বা ছবি দেখে নির্ভুল বাংলা টাইপিং করে Word/PDF দেওয়া হয়।",
      descriptionEn: "We type your handwritten or photographed document accurately and deliver Word/PDF.",
      timeBn: "১ কর্মদিবস", timeEn: "1 working day",
      requirements: ["মূল লেখা বা স্পষ্ট ছবি"],
      fields: [
        f("pages", "পৃষ্ঠা সংখ্যা", "Pages"),
        f("format", "ফরম্যাট", "Format", "select", true, ["Word", "PDF", "Both"]),
        f("font", "ফন্ট পছন্দ", "Font preference", "text", false),
      ],
    },
    {
      category: "documents", slug: "english-typing", kind: "DOCUMENT", price: 120, icon: "PenLine",
      nameBn: "ইংরেজি টাইপিং", nameEn: "English Typing",
      summaryBn: "ইংরেজি ডকুমেন্ট, চিঠি ও ফরম্যাটিং।",
      summaryEn: "English document typing, letters and formatting.",
      descriptionBn: "হাতে লেখা বা স্ক্যান করা ইংরেজি ডকুমেন্ট টাইপ ও ফরম্যাট করা হয়।",
      descriptionEn: "We type and format handwritten or scanned English documents.",
      timeBn: "১ কর্মদিবস", timeEn: "1 working day",
      requirements: ["মূল লেখা বা স্পষ্ট ছবি"],
      fields: [
        f("pages", "পৃষ্ঠা সংখ্যা", "Pages"),
        f("format", "ফরম্যাট", "Format", "select", true, ["Word", "PDF", "Both"]),
      ],
    },
    {
      category: "documents", slug: "cv-biodata-typing", kind: "DOCUMENT", price: 200, icon: "FileText",
      nameBn: "সিভি ও বায়োডাটা টাইপিং", nameEn: "CV & Biodata Typing",
      summaryBn: "বায়োডাটা ও সিভি পরিষ্কার ফরম্যাটে টাইপ।",
      summaryEn: "Cleanly typed biodata and CV documents.",
      descriptionBn: "বিয়ে, ভিসা বা চাকরির জন্য বায়োডাটা/সিভি টাইপ ও ডিজাইন।",
      descriptionEn: "Biodata or CV typed and designed for marriage, visa or job purposes.",
      timeBn: "১ কর্মদিবস", timeEn: "1 working day",
      requirements: ["তথ্য ও ছবি"],
      fields: [
        f("docType", "ডকুমেন্টের ধরন", "Document type", "select", true, ["CV", "Biodata", "Both"]),
        f("language", "ভাষা", "Language", "select", true, ["Bangla", "English"]),
      ],
    },
    {
      category: "documents", slug: "affidavit-typing", kind: "DOCUMENT", price: 350, icon: "FilePen",
      nameBn: "অ্যাফিডেভিট টাইপিং", nameEn: "Affidavit Typing",
      summaryBn: "নাম সংশোধন, অভিভাবকত্বসহ অ্যাফিডেভিট টাইপিং।",
      summaryEn: "Affidavit typing for name correction and guardianship.",
      descriptionBn: "আইনজীবীর খসড়া অনুযায়ী অ্যাফিডেভিট টাইপ ও ফরম্যাট করা হয়। এটি টাইপিং সহায়তা, আইনি পরামর্শ নয়।",
      descriptionEn: "We type and format affidavits from your lawyer's draft. This is typing assistance, not legal advice.",
      timeBn: "১ কর্মদিবস", timeEn: "1 working day",
      requirements: ["আইনজীবীর খসড়া বা তথ্য"],
      fields: [
        f("affidavitType", "ধরন", "Type", "select", true, ["Name correction", "Guardianship", "Address", "Other"]),
        f("pages", "পৃষ্ঠা সংখ্যা", "Pages"),
      ],
    },
    {
      category: "documents", slug: "pdf-editing", kind: "DOCUMENT", price: 150, icon: "FilePen",
      nameBn: "PDF এডিটিং ও কনভার্শন", nameEn: "PDF Editing & Conversion",
      summaryBn: "PDF এডিট, মার্জ, স্প্লিট, Word↔PDF রূপান্তর।",
      summaryEn: "PDF edit, merge, split and Word↔PDF conversion.",
      descriptionBn: "PDF সম্পাদনা, একাধিক ফাইল একত্র বা আলাদা করা এবং Word/PDF রূপান্তর।",
      descriptionEn: "Edit PDFs, merge or split files, and convert between Word and PDF.",
      timeBn: "২ – ৪ ঘণ্টা", timeEn: "2 – 4 hours",
      requirements: ["ফাইল আপলোড করুন"],
      fields: [
        f("task", "কাজ", "Task", "select", true, ["Edit", "Merge", "Split", "Word to PDF", "PDF to Word", "Compress"]),
        f("notes", "নির্দেশনা", "Instructions", "textarea", false),
      ],
    },
    {
      category: "documents", slug: "online-form-filling", kind: "DOCUMENT", price: 200, icon: "ClipboardList",
      nameBn: "অনলাইন ফরম পূরণ", nameEn: "Online Form Filling",
      summaryBn: "যেকোনো অনলাইন আবেদন বা ফরম পূরণে সহায়তা।",
      summaryEn: "Help filling any online application or form.",
      descriptionBn: "ফরমের লিংক ও তথ্য দিলে পূরণ করে জমা দেওয়ার প্রক্রিয়ায় সহায়তা করি।",
      descriptionEn: "Share the form link and details; we help fill and submit it.",
      timeBn: "১ কর্মদিবস", timeEn: "1 working day",
      requirements: ["ফরমের লিংক", "প্রয়োজনীয় তথ্য"],
      fields: [
        f("formName", "ফরমের নাম", "Form name"),
        f("details", "তথ্য", "Details", "textarea"),
      ],
    },
  ];

  for (const [index, service] of services.entries()) {
    const data = {
      categoryId: categories[service.category],
      nameBn: service.nameBn,
      nameEn: service.nameEn,
      summaryBn: service.summaryBn,
      summaryEn: service.summaryEn,
      descriptionBn: service.descriptionBn,
      descriptionEn: service.descriptionEn,
      kind: service.kind,
      price: service.price,
      processingTimeBn: service.timeBn,
      processingTimeEn: service.timeEn,
      icon: service.icon,
      featured: service.featured ?? false,
      sortOrder: index,
      requirements: (service.requirements ?? []) as Prisma.InputJsonValue,
      documents: (service.documents ?? []) as Prisma.InputJsonValue,
      formFields: (service.fields ?? []) as Prisma.InputJsonValue,
      requiresConsent: service.kind === "APPLICATION",
      active: true,
    };

    await prisma.service.upsert({
      where: { slug: service.slug },
      update: data,
      create: { slug: service.slug, ...data },
    });
  }
}

async function main() {
  await seedRoles();
  await seedUsers();
  await seedServiceCategories();
  await seedServices();
  await seedContent(prisma);
  console.log("Seed complete");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
