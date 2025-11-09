import { PrismaClient } from "@prisma/client";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
// If your Prisma file is located elsewhere, you can change the path
import { Polar } from "@polar-sh/sdk";
import { env } from "~/env";
import { checkout, polar, portal, webhooks } from "@polar-sh/better-auth";
import { db } from "~/server/db";

const polarClient = new Polar({
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  accessToken: env.POLAR_ACCESS_TOKEN,
  server: "sandbox",
});

const prisma = new PrismaClient();
export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql", // or "mysql", "postgresql", ...etc
  }),
  emailAndPassword: {
    enabled: true,
  },
  plugins: [
    polar({
      client: polarClient,
      createCustomerOnSignUp: true,
      use: [
        checkout({
          products: [
            {
               productId: "4963d262-6716-4ccc-9fd8-7871ba34f00c",
              slug: "small",
            },
            {
              productId: "70e5a2d8-a980-4688-9941-51b86df54ea8",
              slug: "medium",
            },
            {
              productId: "389b0319-9486-40e8-95a0-329712862ba3",
              slug: "large",
            },
          ],
          successUrl: "/dashboard",
          authenticatedUsersOnly: true,
        }),
        portal(),
        webhooks({
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          secret: env.POLAR_WEBHOOK_SECRET,
          onOrderPaid: async (order) => {
            const externalCustomerId = order.data.customer.externalId;

            if (!externalCustomerId) {
              console.error("No external customer ID found.");
              throw new Error("No external customer id found.");
            }

            const productId = order.data.productId;

            let creditsToAdd = 0;

            switch (productId) {
              case "4963d262-6716-4ccc-9fd8-7871ba34f00c":
                creditsToAdd = 50;
                break;
              case "70e5a2d8-a980-4688-9941-51b86df54ea8":
                creditsToAdd = 200;
                break;
              case "389b0319-9486-40e8-95a0-329712862ba3":
                creditsToAdd = 800;
                break;
            }

            await db.user.update({
              where: { id: externalCustomerId },
              data: {
                credits: {
                  increment: creditsToAdd,
                },
              },
            });
          },
        }),
      ],
    }),
  ],
});