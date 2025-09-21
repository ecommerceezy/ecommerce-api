export const middleware = {
  auth: async ({ jwt, set, cookie, store }) => {
    const token = cookie?.token?.value?.split(" ")[0] || null;
    // token not found
    if (!token) {
      set.status = 401;
      throw new Error("token not found!");
    }

    // verify token
    const user = await jwt.verify(token);
    if (!user) {
      set.status = 401;
      throw new Error("invalid token!");
    }

    store.user = user;
  },
  auth_admin: async ({ jwt, set, cookie, store }) => {
    const token = cookie?.token?.value?.split(" ")[0] || null;
    // token not found
    if (!token) {
      set.status = 401;
      throw new Error("token not found!");
    }

    // verify token
    const user = await jwt.verify(token);
    if (!user) {
      set.status = 401;
      throw new Error("invalid token!");
    }

    if (user.roleId < 2) {
      set.status = 401;
      throw new Error("invalid admin");
    }

    store.user = user;
  },
};
