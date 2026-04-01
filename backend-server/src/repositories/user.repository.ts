import { prisma } from "../lib/prisma";

/**
 * 根据用户 ID 执行用户 upsert。
 * @param userId 用户 ID（当前值为浏览器指纹）。
 * @returns 已存在或新创建的用户记录。
 */
export async function upsertUserById(userId: string) {
  return prisma.appUser.upsert({
    where: { id: userId },
    update: {},
    create: { id: userId, browserFingerprintHash: userId },
  });
}

/**
 * 根据用户 ID 查询用户。
 * @param userId 用户 ID（当前值为浏览器指纹）。
 * @returns 用户记录；不存在时返回 null。
 */
export async function findUserById(userId: string) {
  return prisma.appUser.findUnique({
    where: { id: userId },
  });
}
