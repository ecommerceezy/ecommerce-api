import bcrypt from "bcryptjs";
import { PrismaClient } from "../src/generated/prisma";

const prisma = new PrismaClient();

export const guestController = {
  get_ctg: async ({ set }) => {
    try {
      const ctgs = await prisma.tb_category.findMany({
        take: 10,
        where: {
          status: "1",
        },
        select: {
          name: true,
          id: true,
        },
      });

      set.status = 200;
      return ctgs;
    } catch (error) {
      console.error(error);
      return (set.status = 500);
    }
  },
  get_products: async ({ set }) => {
    try {
      const products = await prisma.tb_product.findMany({
        take: 36,
        where: {
          pro_number: {
            gt: 0,
          },
        },
        select: {
          pro_id: true,
          imgs: {
            take: 1,
            select: {
              url: true,
            },
          },
          pro_name: true,
          categories: {
            select: {
              id: true,
              name: true,
            },
          },
          pro_price: true,
          pro_number: true,
          freight: true,
        },
      });

      set.status = 200;
      return products;
    } catch (error) {
      console.error(error);
      return (set.status = 500);
    }
  },
  product_cart: async ({ set, params }) => {
    try {
      const { productIds } = params;
      if (!productIds) return (set.status = 400);

      const ids = productIds.split(",").map((p) => Number(p));

      const products = await prisma.tb_product.findMany({
        where: {
          pro_id: {
            in: ids,
          },
        },
        select: {
          pro_id: true,
          pro_price: true,
          pro_number: true,
          pro_name: true,
          freight: true,
          categories: {
            select: {
              name: true,
            },
          },
          imgs: {
            take: 1,
            select: {
              url: true,
            },
          },
        },
      });

      set.status = 200;
      return products;
    } catch (error) {
      console.error(error);
      return (set.status = 500);
    }
  },
  product_by_id: async ({ set, params }) => {
    try {
      const { pro_id } = params;
      if (!pro_id) return (set.status = 400);

      const product = await prisma.tb_product.findUnique({
        where: {
          pro_id: Number(pro_id),
        },
        select: {
          pro_id: true,
          pro_name: true,
          imgs: {
            select: {
              url: true,
            },
          },
          categories: {
            select: {
              id: true,
              name: true,
            },
          },
          pro_number: true,
          pro_color: true,
          pro_details: true,
          pro_price: true,
          pro_size: true,
          freight: true,
        },
      });

      set.status = 200;
      return product;
    } catch (error) {
      console.error(error);
      return (set.status = 500);
    }
  },
  get_sameCtg_product: async ({ set, params }) => {
    try {
      const { ctg_id } = params;
      console.log("🚀 ~ ctg_id:", ctg_id);
      if (!ctg_id) return (set.status = 400);

      const product = await prisma.tb_product.findMany({
        where: {
          categories: {
            some: {
              id: {
                in: ctg_id?.split(",").map((c) => Number(c)),
              },
            },
          },
        },
        take: 6,
        select: {
          pro_id: true,
          pro_name: true,
          pro_price: true,
          imgs: {
            take: 1,
            select: {
              url: true,
            },
          },
          categories: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      set.status = 200;
      return product;
    } catch (error) {
      console.error(error);
      return (set.status = 500);
    }
  },
  get_other_product: async ({ set, params }) => {
    try {
      const { pro_id } = params;
      console.log("🚀 ~ pro_id:", pro_id);
      if (!pro_id) return (set.status = 400);

      const product = await prisma.tb_product.findMany({
        where: {
          pro_id: {
            notIn: pro_id?.split(",").map((c) => Number(c)),
          },
        },
        take: 6,
        select: {
          pro_id: true,
          pro_name: true,
          pro_price: true,
          imgs: {
            take: 1,
            select: {
              url: true,
            },
          },
          categories: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      set.status = 200;
      return product;
    } catch (error) {
      console.error(error);
      return (set.status = 500);
    }
  },
  get_all_product: async ({ set, query }) => {
    try {
      const { search, sort, page, minPrice, maxPrice, searchCtgs } = query;
      const take = 36;
      const skip = Number(take) * (page - 1);

      let filter = {};
      if (search) {
        filter = {
          OR: [
            {
              pro_name: {
                contains: search,
                mode: "insensitive",
              },
            },
            {
              pro_color: {
                contains: search,
                mode: "insensitive",
              },
            },
            {
              pro_size: {
                contains: search,
                mode: "insensitive",
              },
            },
            {
              pro_details: {
                contains: search,
                mode: "insensitive",
              },
            },
          ],
        };
      }
      let filterPrice = {};
      if (Number(maxPrice) > 0) {
        filterPrice = {
          pro_price: {
            lte: Number(maxPrice),
          },
        };
      }
      if (searchCtgs) {
        filter = {
          ...filter,
          categories: {
            some: {
              id: {
                in: searchCtgs.split(",").map((c) => Number(c)),
              },
            },
          },
        };
      }

      const [product, total] = await Promise.all([
        prisma.tb_product.findMany({
          take: Number(take),
          skip: Number(skip),
          where: {
            AND: [
              {
                pro_price: {
                  gte: Number(minPrice || 0),
                },
              },
              filterPrice,
            ],

            pro_number: {
              gt: 0,
            },
            ...filter,
          },
          select: {
            pro_id: true,
            pro_name: true,
            pro_price: true,
            pro_number: true,
            imgs: {
              take: 1,
              select: {
                url: true,
              },
            },
            pro_number: true,
            categories: {
              select: {
                id: true,
                name: true,
              },
            },
          },
          orderBy: {
            ...JSON.parse(sort),
          },
        }),
        prisma.tb_product.count({
          where: {
            AND: [
              {
                pro_price: {
                  gte: Number(minPrice || 0),
                },
              },
              filterPrice,
            ],

            pro_number: {
              gt: 0,
            },
            ...filter,
          },
        }),
      ]);

      set.status = 200;
      return {
        product,
        total,
        totalPage: Math.ceil(total / take) < 1 ? 1 : Math.ceil(total / take),
      };
    } catch (error) {
      console.error(error);
      return (set.status = 200);
    }
  },
};
