import { prisma } from "@/lib/db/prisma";
import { hashPassword } from "@/lib/auth/password";

async function main() {
  const login = "admin";
  const pass = "admin123";

  const exists = await prisma.adminUser.findUnique({ where: { login } });
  if (!exists) {
    await prisma.adminUser.create({
      data: { login, passwordHash: await hashPassword(pass) },
    });
    console.log("Admin created:", login, pass);
  } else {
    console.log("Admin already exists:", login);
  }

  const defaults: Record<string, string> = {
    work_start: "10:00",
    work_end: "23:00",
    package_fee: "0",
    delivery_fee: "0",
    lang_ru_enabled: "1",
    lang_uz_enabled: "1",
  };

  for (const [key, value] of Object.entries(defaults)) {
    await prisma.botSetting.upsert({
      where: { key },
      create: { key, value },
      update: { value },
    });
  }

  console.log("Settings seeded");
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });