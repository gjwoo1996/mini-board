import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from './entities/category.entity';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(Category)
    private categoryRepo: Repository<Category>,
  ) {}

  findAll() {
    return this.categoryRepo.find({ order: { name: 'ASC' } });
  }

  async findOne(id: number) {
    const cat = await this.categoryRepo.findOne({ where: { id } });
    if (!cat) throw new NotFoundException('Category not found');
    return cat;
  }

  async findBySlug(slug: string) {
    const cat = await this.categoryRepo.findOne({ where: { slug } });
    if (!cat) throw new NotFoundException('Category not found');
    return cat;
  }

  create(name: string, slug: string) {
    return this.categoryRepo.save({ name, slug: slug || this.slugify(name) });
  }

  async update(id: number, name?: string, slug?: string) {
    const cat = await this.findOne(id);
    const newName = name ?? cat.name;
    return this.categoryRepo.update(id, {
      name: newName,
      ...(slug !== undefined && { slug: slug || this.slugify(newName) }),
    });
  }

  async remove(id: number) {
    await this.findOne(id);
    await this.categoryRepo.delete(id);
  }

  private slugify(s: string) {
    return s
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^\w\u3131-\u318E\uAC00-\uD7A3-]+/g, '');
  }
}
