import { registerAs } from '@nestjs/config';

export default registerAs('database', () => ({
  type: 'mysql' as const,
  host: process.env.MYSQL_HOST || 'localhost',
  port: parseInt(process.env.MYSQL_PORT || '13306', 10),
  username: process.env.MYSQL_USER || 'user',
  password: process.env.MYSQL_PASSWORD || '1234',
  database: process.env.MYSQL_DATABASE || 'testDB',
  autoLoadEntities: true,
  synchronize: process.env.NODE_ENV !== 'production',
}));
