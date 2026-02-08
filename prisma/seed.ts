import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const categoriesData = [
    {
      slug: 'general',
      name: '全体',
      description: 'カテゴリ未指定のスレッド',
    },
    {
      slug: 'zatsudan',
      name: '雑談',
      description: '気軽なおしゃべりや近況報告はこちら。',
    },
    {
      slug: 'study',
      name: '勉強',
      description: '学びの相談や小さな達成を共有しましょう。',
    },
    {
      slug: 'game',
      name: 'ゲーム',
      description: '遊んだ感想やおすすめをゆるく語る場所。',
    },
  ];

  for (const category of categoriesData) {
    await prisma.category.upsert({
      where: { slug: category.slug },
      update: { name: category.name, description: category.description },
      create: category,
    });
  }

  const generalCategory = await prisma.category.findUnique({
    where: { slug: 'general' },
    select: { id: true },
  });

  if (!generalCategory) {
    throw new Error('failed to load general category');
  }

  const existing = await prisma.thread.count();
  if (existing > 0) return;

  const now = new Date();
  const day = 24 * 60 * 60 * 1000;

  await prisma.thread.create({
    data: {
      categoryId: generalCategory.id,
      title: '最近ほっとしたこと、教えてください',
      body: 'ちょっとした出来事でもOKです。今日の小さな安心を共有しませんか？',
      authorName: 'ゆるねこ',
      createdAt: new Date(now.getTime() - day * 2),
      lastPostedAt: new Date(now.getTime() - day),
      posts: {
        create: [
          {
            body: '朝の空気がきれいで、深呼吸できました。',
            authorName: '匿名',
            createdAt: new Date(now.getTime() - day * 1.5),
          },
        ],
      },
    },
  });

  await prisma.thread.create({
    data: {
      categoryId: generalCategory.id,
      title: '集中が切れたときの立て直し方',
      body: '勉強が続かないとき、みなさんどうしていますか？',
      authorName: 'ことは',
      createdAt: new Date(now.getTime() - day),
      lastPostedAt: new Date(now.getTime() - day * 0.5),
      posts: {
        create: [
          {
            body: 'タイマーで25分だけやると気持ちが楽になります。',
            authorName: 'たけ',
            createdAt: new Date(now.getTime() - day * 0.8),
          },
          {
            body: '席を移動して気分転換しています。',
            authorName: '匿名',
            createdAt: new Date(now.getTime() - day * 0.6),
          },
        ],
      },
    },
  });

  await prisma.thread.create({
    data: {
      categoryId: generalCategory.id,
      title: '最近遊んだやさしいゲーム',
      body: '癒されるゲームを知りたいです。おすすめありますか？',
      authorName: 'うみ',
      createdAt: new Date(now.getTime() - day * 0.4),
      lastPostedAt: new Date(now.getTime() - day * 0.2),
      posts: {
        create: [
          {
            body: '短時間でも進められるものが好きです。',
            authorName: 'ゆめ',
            createdAt: new Date(now.getTime() - day * 0.3),
          },
        ],
      },
    },
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
