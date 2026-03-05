import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../users/entities/user.entity';
import { UserRole, Gender } from '../users/entities/user.entity';
import { Category } from '../categories/entities/category.entity';

export async function seedAdmin(dataSource: DataSource): Promise<void> {
  const userRepo = dataSource.getRepository(User);
  const existing = await userRepo.findOne({ where: { username: 'admin' } });
  if (existing) return;

  const hashed = await bcrypt.hash('1234', 10);
  await userRepo.save({
    username: 'admin',
    name: 'Administrator',
    password: hashed,
    email: 'admin@miniboard.local',
    gender: Gender.OTHER,
    role: UserRole.ADMIN,
  });
}

export async function seedCategories(dataSource: DataSource): Promise<void> {
  const catRepo = dataSource.getRepository(Category);
  const count = await catRepo.count();
  if (count > 0) return;

  await catRepo.save([
    { name: '자유게시판', slug: 'free' },
    { name: '공지사항', slug: 'notice' },
  ]);
}
