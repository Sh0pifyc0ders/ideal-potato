import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { getUserMeasurements, createMeasurement, deleteMeasurement } from "./db";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  measurements: router({
    list: publicProcedure.query(async ({ ctx }) => {
      if (!ctx.user) return [];
      return getUserMeasurements(ctx.user.id);
    }),
    create: publicProcedure
      .input(z.object({
        snaAngle: z.number().int().min(0).max(180),
        classification: z.enum(["retrognath", "normal", "prognath"]),
        thumbnail: z.string().optional(),
        imageMetadata: z.string().optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        if (!ctx.user) throw new Error("Unauthorized");
        return createMeasurement({
          userId: ctx.user.id,
          snaAngle: input.snaAngle,
          classification: input.classification,
          thumbnail: input.thumbnail,
          imageMetadata: input.imageMetadata,
          notes: input.notes,
        });
      }),
    delete: publicProcedure
      .input(z.object({ id: z.number().int() }))
      .mutation(async ({ ctx, input }) => {
        if (!ctx.user) throw new Error("Unauthorized");
        return deleteMeasurement(input.id, ctx.user.id);
      }),
  }),
});

export type AppRouter = typeof appRouter;
