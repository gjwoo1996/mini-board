import { Injectable, OnModuleInit } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { seedAdmin, seedCategories } from './database.seed';

@Injectable()
export class DatabaseSeeder implements OnModuleInit {
  constructor(private dataSource: DataSource) {}

  async onModuleInit() {
    await seedAdmin(this.dataSource);
    await seedCategories(this.dataSource);
  }
}
